import { Queue, Worker } from "bullmq"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { getAdapter } from "@/lib/adapters"
import type { SendMessageDTO } from "@/lib/adapters"
import { monitorSLAs } from "@/lib/sla-monitor"

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number.parseInt(new URL(env.REDIS_URL).port || "6379"),
}

export const messageQueue = new Queue("messages", { connection })
export const slaQueue = new Queue("sla-monitor", { connection })

interface SendMessageJob {
  channelId: string
  messageId: string
  message: SendMessageDTO
}

// Worker to process outbound messages
export const messageWorker = new Worker<SendMessageJob>(
  "messages",
  async (job) => {
    const { channelId, messageId, message } = job.data

    try {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { local: true },
      })

      if (!channel) {
        throw new Error("Channel not found")
      }

      const adapter = getAdapter(channel.type.toLowerCase())
      if (!adapter) {
        throw new Error("Adapter not found")
      }

      // Obtener credenciales desencriptadas
      let adapterCredentials: Record<string, any> = {}
      
      if (channel.type === "FACEBOOK" || channel.type === "INSTAGRAM") {
        const meta = channel.meta as any
        // Usar credenciales directamente de meta (no podemos usar getDecryptedChannelCredentials aquí
        // porque requiere un contexto de request y estamos en un worker)
        adapterCredentials = {
          pageId: meta?.pageId || meta?.credentials?.pageId,
          accessToken: meta?.accessToken || meta?.credentials?.pageAccessToken || meta?.credentials?.accessToken,
        }
      } else if (channel.type === "WHATSAPP") {
        const meta = channel.meta as any
        adapterCredentials = {
          phoneId: meta?.phoneId || meta?.credentials?.phoneNumberId,
          accessToken: meta?.accessToken || meta?.credentials?.accessToken,
          businessId: meta?.businessId || meta?.credentials?.businessAccountId,
        }
      } else if (channel.type === "TIKTOK") {
        const meta = channel.meta as any
        adapterCredentials = {
          accessToken: meta?.accessToken || meta?.credentials?.accessToken,
          appId: meta?.appId || meta?.credentials?.appId,
          appSecret: meta?.appSecret || meta?.credentials?.appSecret,
        }
      }

      console.log(`[Queue] Procesando mensaje ${messageId} para canal ${channelId} (${channel.type})`)

      // Para Instagram, verificar si el último mensaje entrante es muy reciente
      // Si es así, esperar un poco para asegurar que Instagram lo haya registrado
      if (channel.type === "INSTAGRAM") {
        const thread = await prisma.thread.findFirst({
          where: {
            channelId: channelId,
            externalId: message.threadExternalId
          },
          select: { id: true }
        })

        if (thread) {
          const lastInboundMessage = await prisma.message.findFirst({
            where: {
              threadId: thread.id,
              direction: "INBOUND",
              channelId: channelId
            },
            orderBy: { sentAt: "desc" },
            select: { sentAt: true }
          })

          if (lastInboundMessage) {
            const timeSinceLastMessage = Date.now() - lastInboundMessage.sentAt.getTime()
            const secondsSinceLastMessage = timeSinceLastMessage / 1000
            
            // Si el último mensaje entrante es muy reciente (menos de 30 segundos), esperar un poco más
            // Instagram puede necesitar más tiempo para registrar el mensaje en su sistema
            if (secondsSinceLastMessage < 30) {
              const waitTime = Math.ceil(30 - secondsSinceLastMessage) * 1000
              console.log(`[Queue] Instagram: Esperando ${(waitTime/1000).toFixed(1)}s antes de enviar`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
            }
          }
        }
      }

      const result = await adapter.sendMessage(channelId, message, adapterCredentials)

      if (result.success && result.data) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            externalId: result.data.externalId,
            deliveredAt: new Date(),
            failedReason: null,
          },
        })
        console.log(`[Queue] Mensaje ${messageId} enviado exitosamente`)
      } else {
        // Extraer información del error para logging
        const errorMessage = result.error?.message || "Error desconocido"
        const errorType = result.error?.type || "UNKNOWN"
        const isRetryable = result.error?.retryable || false
        
        console.error(`[Queue] Message failed - ${errorType}:`, {
          channelId,
          messageId,
          error: errorMessage,
          retryable: isRetryable,
          details: result.error?.details
        })

        await prisma.message.update({
          where: { id: messageId },
          data: {
            failedReason: errorMessage,
          },
        })

        // Si el error es retryable, podríamos reencolar el mensaje
        if (isRetryable) {
          console.log(`[Queue] Error retryable, considerando reencolar mensaje ${messageId}`)
          // TODO: Implementar lógica de retry con backoff
        }
      }
    } catch (error) {
      console.error("[Queue] Error processing message:", error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  },
)

messageWorker.on("completed", (job) => {
  console.log(`[Queue] Job ${job.id} completed`)
})

messageWorker.on("failed", (job, err) => {
  console.error(`[Queue] Job ${job?.id} failed:`, err)
})

// Worker para monitoreo de SLA
export const slaWorker = new Worker(
  "sla-monitor",
  async (job) => {
    try {
      console.log("[SLA Worker] Iniciando monitoreo de SLA...")
      await monitorSLAs()
      console.log("[SLA Worker] Monitoreo de SLA completado")
    } catch (error) {
      console.error("[SLA Worker] Error:", error)
      throw error
    }
  },
  {
    connection,
    concurrency: 1,
  },
)

slaWorker.on("completed", (job) => {
  console.log(`[SLA Worker] Job ${job.id} completed`)
})

slaWorker.on("failed", (job, err) => {
  console.error(`[SLA Worker] Job ${job?.id} failed:`, err)
})

// Función para programar monitoreo de SLA
export async function scheduleSLAMonitoring() {
  // Programar monitoreo cada 5 minutos
  await slaQueue.add(
    "monitor-sla",
    {},
    {
      repeat: { pattern: "*/5 * * * *" }, // Cada 5 minutos
      removeOnComplete: 10,
      removeOnFail: 5,
    }
  )
  
  console.log("[SLA Queue] Monitoreo de SLA programado cada 5 minutos")
}

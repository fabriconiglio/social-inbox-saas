import { Queue, Worker } from "bullmq"
import { env } from "@/lib/env"
import { prisma } from "@/lib/prisma"
import { getAdapter } from "@/lib/adapters"
import type { SendMessageDTO } from "@/lib/adapters"

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: Number.parseInt(new URL(env.REDIS_URL).port || "6379"),
}

export const messageQueue = new Queue("messages", { connection })

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
      })

      if (!channel) {
        throw new Error("Channel not found")
      }

      const adapter = getAdapter(channel.type.toLowerCase())
      if (!adapter) {
        throw new Error("Adapter not found")
      }

      // Obtener credenciales desde channel.meta
      const credentials = (channel.meta as Record<string, any>) || {}

      const result = await adapter.sendMessage(channelId, message, credentials)

      if (result.success && result.data) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            externalId: result.data.externalId,
            deliveredAt: new Date(),
          },
        })
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

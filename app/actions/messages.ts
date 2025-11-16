"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { emitNewMessage, emitMessageRead } from "@/lib/socket-events"
import { getAdapter } from "@/lib/adapters"
import { ChannelCredentialsService } from "@/lib/channel-credentials"
import { messageQueue } from "@/lib/queue"

const sendMessageSchema = z.object({
  threadId: z.string(),
  content: z.string().min(1),
  channelId: z.string(),
  tenantId: z.string(),
  messageType: z.enum(["text", "image", "video", "document", "audio"]).default("text"),
  attachments: z.array(z.object({
    type: z.string(),
    url: z.string(),
    filename: z.string().optional(),
    size: z.number().optional()
  })).optional()
})

export async function sendMessage(data: z.infer<typeof sendMessageSchema>) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { success: false, error: "No tienes acceso a este tenant" }
    }

    // Verificar que el thread existe y pertenece al tenant
    const thread = await prisma.thread.findFirst({
      where: {
        id: data.threadId,
        tenantId: data.tenantId
      },
      include: {
        channel: true,
        contact: true
      }
    })

    if (!thread) {
      return { success: false, error: "Thread no encontrado" }
    }

    // Crear el mensaje
    const message = await prisma.message.create({
      data: {
        threadId: data.threadId,
        body: data.content,
        channelId: data.channelId,
        direction: "OUTBOUND",
        authorId: user.id!,
        attachments: data.attachments || [],
        sentAt: new Date(),
        deliveredAt: new Date() // Simulamos que se entregó inmediatamente
      }
    })

    // Actualizar el thread con la última actividad
    await prisma.thread.update({
      where: { id: data.threadId },
      data: {
        lastMessageAt: new Date(),
      }
    })

    // Obtener información del canal y contacto
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
      select: { type: true, displayName: true }
    })

    const contact = thread.contactId ? await prisma.contact.findUnique({
      where: { id: thread.contactId },
      select: { name: true, handle: true }
    }) : null

    // Enviar mensaje a través del adapter del canal (de forma asíncrona usando cola)
    if (channel && channel.type !== "MOCK") {
      try {
        console.log(`[Send Message] Preparando mensaje para canal ${channel.type}:`, {
          threadId: thread.id,
          threadExternalId: thread.externalId,
          contactHandle: contact?.handle,
          channelType: channel.type,
          messageLength: data.content.length,
          lastMessageAt: thread.lastMessageAt
        })

        // Preparar el mensaje para el adapter
        const sendMessageDTO = {
          body: data.content,
          threadExternalId: thread.externalId,
          attachments: data.attachments?.map(att => ({
            type: att.type,
            url: att.url,
            mimeType: undefined,
          })) || [],
        }

        // Encolar el mensaje para procesamiento asíncrono
        // Esto evita timeouts y mejora la experiencia del usuario
        await messageQueue.add(
          "send-message",
          {
            channelId: data.channelId,
            messageId: message.id,
            message: sendMessageDTO,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          }
        )

        console.log(`[Send Message] Mensaje ${message.id} encolado para envío asíncrono`)
        
        // No esperar la respuesta, el worker procesará el mensaje en background
        // El mensaje se actualizará automáticamente cuando el worker lo procese
      } catch (error) {
        console.error("[Send Message] Error encolando mensaje:", error)
        // Si falla al encolar, marcar como error
        await prisma.message.update({
          where: { id: message.id },
          data: {
            failedReason: error instanceof Error ? error.message : "Error al encolar mensaje",
          },
        })
        return { success: false, error: error instanceof Error ? error.message : "Error al enviar mensaje" }
      }
    }

    // Emitir evento de nuevo mensaje (no bloquea si falla)
    try {
      emitNewMessage({
        threadId: data.threadId,
        messageId: message.id,
        content: message.body,
        sender: user.id!,
        senderName: user.name || user.email || 'Agente',
        timestamp: message.sentAt.toISOString(),
        channelType: channel?.type || 'unknown',
        channelId: data.channelId,
        tenantId: data.tenantId
      })
    } catch (socketError) {
      // No bloquear el envío si falla el socket
      console.warn("[Send Message] Error emitiendo evento socket (no bloqueante):", socketError)
    }

    revalidatePath(`/app/${data.tenantId}/inbox`)
    return { success: true, messageId: message.id }

  } catch (error) {
    console.error("[Send Message] Error:", error)
    return { success: false, error: "Error al enviar mensaje" }
  }
}

const markMessageReadSchema = z.object({
  threadId: z.string(),
  messageId: z.string(),
  tenantId: z.string()
})

export async function markMessageAsRead(data: z.infer<typeof markMessageReadSchema>) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { success: false, error: "No tienes acceso a este tenant" }
    }

    // Verificar que el mensaje existe
    const message = await prisma.message.findFirst({
      where: {
        id: data.messageId,
        thread: {
          id: data.threadId,
          tenantId: data.tenantId
        }
      }
    })

    if (!message) {
      return { success: false, error: "Mensaje no encontrado" }
    }

    // Actualizar el mensaje como leído
    await prisma.message.update({
      where: { id: data.messageId },
      data: {
        readAt: new Date(),
      }
    })

    // Emitir evento de mensaje leído
    emitMessageRead({
      threadId: data.threadId,
      messageId: data.messageId,
      readBy: user.id!,
      readByName: user.name || user.email || 'Agente',
      readAt: new Date().toISOString(),
      tenantId: data.tenantId
    })

    return { success: true }

  } catch (error) {
    console.error("[Mark Message Read] Error:", error)
    return { success: false, error: "Error al marcar mensaje como leído" }
  }
}

const sendTypingIndicatorSchema = z.object({
  threadId: z.string(),
  isTyping: z.boolean(),
  tenantId: z.string()
})

export async function sendTypingIndicator(data: z.infer<typeof sendTypingIndicatorSchema>) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { success: false, error: "No tienes acceso a este tenant" }
    }

    // Verificar que el thread existe
    const thread = await prisma.thread.findFirst({
      where: {
        id: data.threadId,
        tenantId: data.tenantId
      }
    })

    if (!thread) {
      return { success: false, error: "Thread no encontrado" }
    }

    // Emitir evento de indicador de escritura
    const { emitTyping } = await import("@/lib/socket-events")
    
    emitTyping({
      threadId: data.threadId,
      userId: user.id!,
      userName: user.name || user.email || 'Agente',
      isTyping: data.isTyping,
      tenantId: data.tenantId
    })

    return { success: true }

  } catch (error) {
    console.error("[Send Typing Indicator] Error:", error)
    return { success: false, error: "Error al enviar indicador de escritura" }
  }
}
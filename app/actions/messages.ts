"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { messageQueue } from "@/lib/queue"
import { revalidatePath } from "next/cache"

export async function sendMessage(formData: FormData) {
  try {
    const user = await requireAuth()
    const threadId = formData.get("threadId") as string
    const channelId = formData.get("channelId") as string
    const body = formData.get("body") as string
    const attachmentsData = formData.get("attachments") as string

    if (!threadId || !channelId || (!body && !attachmentsData)) {
      return { error: "Missing required fields" }
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: { channel: true },
    })

    if (!thread) {
      return { error: "Thread not found" }
    }

    const membership = await checkTenantAccess(user.id!, thread.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }

    // Procesar adjuntos
    let attachments = null
    if (attachmentsData) {
      try {
        const parsedAttachments = JSON.parse(attachmentsData)
        // Ahora guardamos la información completa del storage
        attachments = parsedAttachments.map((att: any) => ({
          name: att.name,
          size: att.size,
          type: att.type,
          url: att.storageFile?.url,
          storageId: att.storageFile?.id,
          publicId: att.storageFile?.publicId,
          key: att.storageFile?.key,
          uploadedAt: new Date()
        }))
      } catch (error) {
        console.error("Error parsing attachments:", error)
        return { error: "Invalid attachments data" }
      }
    }

    // Create message in database
    const message = await prisma.message.create({
      data: {
        threadId,
        channelId,
        direction: "OUTBOUND",
        authorId: user.id,
        body: body || "",
        attachments,
        sentAt: new Date(),
      },
    })

    // Queue message for sending
    await messageQueue.add("send-message", {
      channelId,
      messageId: message.id,
      message: {
        threadExternalId: thread.externalId,
        body: body || "",
        attachments: attachments,
      },
    })

    revalidatePath(`/app/${thread.tenantId}/inbox`)
    return { success: true, messageId: message.id }
  } catch (error) {
    console.error("[Send Message] Error:", error)
    return { error: "Failed to send message" }
  }
}

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

    if (!threadId || !channelId || !body) {
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

    // Create message in database
    const message = await prisma.message.create({
      data: {
        threadId,
        channelId,
        direction: "OUTBOUND",
        authorId: user.id,
        body,
        sentAt: new Date(),
      },
    })

    // Queue message for sending
    await messageQueue.add("send-message", {
      channelId,
      messageId: message.id,
      message: {
        threadExternalId: thread.externalId,
        body,
      },
    })

    revalidatePath(`/app/${thread.tenantId}/inbox`)
    return { success: true, messageId: message.id }
  } catch (error) {
    console.error("[Send Message] Error:", error)
    return { error: "Failed to send message" }
  }
}

"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

export async function updateThread(formData: FormData) {
  try {
    const user = await requireAuth()
    const threadId = formData.get("threadId") as string
    const assigneeId = formData.get("assigneeId") as string | undefined
    const status = formData.get("status") as string | undefined

    if (!threadId) {
      return { error: "Missing thread ID" }
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return { error: "Thread not found" }
    }

    const membership = await checkTenantAccess(user.id!, thread.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }

    const updateData: any = {}

    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null
    }

    if (status) {
      updateData.status = status
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: thread.tenantId,
        actorId: user.id,
        action: "thread.updated",
        entity: "Thread",
        entityId: threadId,
        diffJSON: updateData,
      },
    })

    revalidatePath(`/app/${thread.tenantId}/inbox`)
    return { success: true }
  } catch (error) {
    console.error("[Update Thread] Error:", error)
    return { error: "Failed to update thread" }
  }
}

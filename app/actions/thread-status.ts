"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { logAuditEvent } from "./audit-log"

// Actualizar estado del thread
export async function updateThreadStatus(
  tenantId: string,
  threadId: string,
  status: "OPEN" | "PENDING" | "CLOSED"
) {
  try {
    const user = await requireAuth()

    // Verificar que el usuario tiene acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Verificar que el thread existe y pertenece al tenant
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        tenantId,
      },
    })

    if (!thread) {
      return { error: "Thread no encontrado" }
    }

    // Guardar estado anterior para el audit log
    const oldStatus = thread.status

    // Actualizar estado del thread
    const updatedThread = await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        status,
      },
    })

    // Registrar en AuditLog
    await logAuditEvent(tenantId, {
      entity: "Thread",
      entityId: threadId,
      action: "thread.status_changed",
      diff: {
        status: {
          from: oldStatus,
          to: status,
        },
      },
    })

    // Revalidar cache
    revalidatePath(`/app/${tenantId}/inbox`)

    return { success: true, data: updatedThread }
  } catch (error) {
    console.error("[updateThreadStatus] Error:", error)
    return { error: "Error al actualizar estado del thread" }
  }
}


"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { logAuditEvent } from "./audit-log"

// Listar agentes disponibles del tenant
export async function listTenantAgents(tenantId: string) {
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

    // Obtener todos los miembros del tenant con rol AGENT, ADMIN o OWNER
    const agents = await prisma.membership.findMany({
      where: {
        tenantId,
        role: {
          in: ["AGENT", "ADMIN", "OWNER"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    })

    return {
      success: true,
      data: agents.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
      })),
    }
  } catch (error) {
    console.error("[listTenantAgents] Error:", error)
    return { error: "Error al obtener agentes" }
  }
}

// Asignar thread a un agente
export async function assignThread(tenantId: string, threadId: string, userId?: string) {
  try {
    const currentUser = await requireAuth()

    // Verificar que el usuario tiene acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: currentUser.id!,
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
      include: {
        contact: true,
        channel: true,
      },
    })

    if (!thread) {
      return { error: "Thread no encontrado" }
    }

    // Si no se especifica userId, auto-asignar al usuario actual
    const assigneeId = userId || currentUser.id!

    // Verificar que el usuario a asignar pertenece al tenant
    if (userId) {
      const assigneeMembership = await prisma.membership.findFirst({
        where: {
          userId: assigneeId,
          tenantId,
        },
      })

      if (!assigneeMembership) {
        return { error: "El usuario no pertenece a este tenant" }
      }
    }

    // Guardar asignación anterior para el audit log
    const oldAssigneeId = thread.assigneeId

    // Actualizar thread
    const updatedThread = await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Registrar en AuditLog
    await logAuditEvent(tenantId, {
      entity: "Thread",
      entityId: threadId,
      action: "thread.assigned",
      diff: {
        assigneeId: {
          from: oldAssigneeId,
          to: assigneeId,
        },
      },
    })

    // Crear notificación si se asigna a otro usuario (no a uno mismo)
    if (userId && userId !== currentUser.id!) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "thread_assigned",
          payloadJSON: {
            threadId: thread.id,
            threadContact: thread.contact?.name || thread.contact?.handle || "Desconocido",
            threadChannel: thread.channel.displayName,
            assignedBy: currentUser.name || currentUser.email,
            assignedById: currentUser.id,
          },
        },
      })
    }

    // Revalidar cache
    revalidatePath(`/app/${tenantId}/inbox`)

    return { success: true, data: updatedThread }
  } catch (error) {
    console.error("[assignThread] Error:", error)
    return { error: "Error al asignar thread" }
  }
}

// Desasignar thread
export async function unassignThread(tenantId: string, threadId: string) {
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

    // Guardar asignación anterior para el audit log
    const oldAssigneeId = thread.assigneeId

    // Desasignar thread
    await prisma.thread.update({
      where: {
        id: threadId,
      },
      data: {
        assigneeId: null,
      },
    })

    // Registrar en AuditLog
    await logAuditEvent(tenantId, {
      entity: "Thread",
      entityId: threadId,
      action: "thread.unassigned",
      diff: {
        assigneeId: {
          from: oldAssigneeId,
          to: null,
        },
      },
    })

    // Revalidar cache
    revalidatePath(`/app/${tenantId}/inbox`)

    return { success: true }
  } catch (error) {
    console.error("[unassignThread] Error:", error)
    return { error: "Error al desasignar thread" }
  }
}


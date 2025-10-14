"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

// Registrar evento en AuditLog
export async function logAuditEvent(
  tenantId: string,
  data: {
    entity: string
    entityId: string
    action: string
    diff?: any
  }
) {
  try {
    const user = await requireAuth()

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId: user.id!,
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        diffJSON: data.diff || {},
      },
    })

    return { success: true }
  } catch (error) {
    console.error("[logAuditEvent] Error:", error)
    return { error: "Error al registrar evento de auditoría" }
  }
}

// Obtener historial de auditoría para una entidad
export async function getAuditHistory(
  tenantId: string,
  entity: string,
  entityId: string,
  limit: number = 50
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

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entity,
        entityId,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return { success: true, data: logs }
  } catch (error) {
    console.error("[getAuditHistory] Error:", error)
    return { error: "Error al obtener historial de auditoría" }
  }
}

// Obtener historial de un thread
export async function getThreadAuditHistory(tenantId: string, threadId: string) {
  return getAuditHistory(tenantId, "Thread", threadId, 20)
}


"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { 
  detectSLAExpired, 
  getSLAExpiredStats, 
  getSLAExpiredForAgent,
  getSLAExpiredForLocal,
  getSLAExpiredForChannel,
  checkThreadSLAExpired,
  getThreadSLAOverdue,
  getSLAExpiredByTimeRange,
  getCriticalSLAExpired,
  type SLAExpired,
  type SLAExpiredStats
} from "@/lib/sla-expired-detector"

// Schemas de validación
const SLAExpiredQuerySchema = z.object({
  tenantId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  localId: z.string().uuid().optional(),
  channelType: z.enum(["WHATSAPP", "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER", "TELEGRAM"]).optional()
})

const ThreadSLAExpiredQuerySchema = z.object({
  tenantId: z.string().uuid(),
  threadId: z.string().uuid()
})

const TimeRangeQuerySchema = z.object({
  tenantId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
})

// Tipos
export type SLAExpiredQuery = z.infer<typeof SLAExpiredQuerySchema>
export type ThreadSLAExpiredQuery = z.infer<typeof ThreadSLAExpiredQuerySchema>
export type TimeRangeQuery = z.infer<typeof TimeRangeQuerySchema>

/**
 * Obtener SLAs vencidos para un tenant
 */
export async function getSLAExpired(data: SLAExpiredQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = SLAExpiredQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, agentId, localId, channelType } = validated.data

    let expired: SLAExpired[] = []

    if (agentId) {
      expired = await getSLAExpiredForAgent(tenantId, agentId)
    } else if (localId) {
      expired = await getSLAExpiredForLocal(tenantId, localId)
    } else if (channelType) {
      expired = await getSLAExpiredForChannel(tenantId, channelType)
    } else {
      expired = await detectSLAExpired(tenantId)
    }

    return { 
      success: true, 
      data: expired
    }

  } catch (error) {
    console.error("[Get SLA Expired] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener estadísticas de SLAs vencidos
 */
export async function getSLAExpiredStatistics(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const stats = await getSLAExpiredStats(tenantId)

    return { 
      success: true, 
      data: stats
    }

  } catch (error) {
    console.error("[Get SLA Expired Statistics] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Verificar SLA vencido para un thread específico
 */
export async function checkThreadSLAExpiredStatus(data: ThreadSLAExpiredQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = ThreadSLAExpiredQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, threadId } = validated.data

    const expired = await checkThreadSLAExpired(tenantId, threadId)

    return { 
      success: true, 
      data: expired
    }

  } catch (error) {
    console.error("[Check Thread SLA Expired Status] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener tiempo de retraso de SLA para un thread
 */
export async function getThreadSLAOverdueStatus(data: ThreadSLAExpiredQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = ThreadSLAExpiredQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, threadId } = validated.data

    const overdue = await getThreadSLAOverdue(tenantId, threadId)

    return { 
      success: true, 
      data: overdue
    }

  } catch (error) {
    console.error("[Get Thread SLA Overdue Status] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Crear notificaciones de SLA vencido
 */
export async function createSLAExpiredNotifications(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Obtener SLAs vencidos
    const expired = await detectSLAExpired(tenantId)
    
    // Crear notificaciones para cada SLA vencido
    const notifications = []
    
    for (const item of expired) {
      // Determinar destinatarios de la notificación
      const recipients = []
      
      // Agente asignado (si existe)
      if (item.assignedTo) {
        recipients.push(item.assignedTo)
      }
      
      // Administradores del tenant
      const admins = await prisma.membership.findMany({
        where: {
          tenantId,
          role: {
            in: ["OWNER", "ADMIN"]
          }
        },
        select: {
          userId: true
        }
      })
      
      recipients.push(...admins.map(admin => admin.userId))
      
      // Crear notificación para cada destinatario
      for (const recipientId of recipients) {
        const notification = await prisma.notification.create({
          data: {
            userId: recipientId,
            type: "sla_expired",
            payloadJSON: {
              threadId: item.threadId,
              threadSubject: item.threadSubject,
              contactName: item.contactName,
              contactHandle: item.contactHandle,
              channelType: item.channelType,
              localName: item.localName,
              slaId: item.slaId,
              slaName: item.slaName,
              responseTimeMinutes: item.responseTimeMinutes,
              resolutionTimeHours: item.resolutionTimeHours,
              timeOverdue: item.timeOverdue,
              timeElapsed: item.timeElapsed,
              severity: item.severity,
              percentageOverdue: item.percentageOverdue,
              assignedTo: item.assignedTo,
              assignedToName: item.assignedToName,
              createdAt: item.createdAt,
              lastMessageAt: item.lastMessageAt,
              expiredAt: item.expiredAt
            }
          }
        })
        
        notifications.push(notification)
      }
    }

    return { 
      success: true, 
      data: {
        notificationsCreated: notifications.length,
        expiredProcessed: expired.length,
        message: `${notifications.length} notificaciones de SLA vencido creadas`
      }
    }

  } catch (error) {
    console.error("[Create SLA Expired Notifications] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Marcar SLA vencido como visto
 */
export async function markSLAExpiredAsViewed(tenantId: string, threadId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Marcar notificaciones de SLA vencido para este thread como leídas
    await prisma.notification.updateMany({
      where: {
        userId: user.id!,
        type: "sla_expired",
        payloadJSON: {
          path: ["threadId"],
          equals: threadId
        }
      },
      data: {
        readAt: new Date()
      }
    })

    return { 
      success: true, 
      message: "SLA vencido marcado como visto"
    }

  } catch (error) {
    console.error("[Mark SLA Expired as Viewed] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener SLAs vencidos por rango de tiempo
 */
export async function getSLAExpiredByTimeRangeAction(data: TimeRangeQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = TimeRangeQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, startDate, endDate } = validated.data

    const expired = await getSLAExpiredByTimeRange(
      tenantId, 
      new Date(startDate), 
      new Date(endDate)
    )

    return { 
      success: true, 
      data: expired
    }

  } catch (error) {
    console.error("[Get SLA Expired by Time Range] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener SLAs vencidos críticos
 */
export async function getCriticalSLAExpiredAction(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const critical = await getCriticalSLAExpired(tenantId)

    return { 
      success: true, 
      data: critical
    }

  } catch (error) {
    console.error("[Get Critical SLA Expired] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener resumen de SLAs vencidos
 */
export async function getSLAExpiredSummary(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Obtener estadísticas
    const stats = await getSLAExpiredStats(tenantId)
    
    // Obtener SLAs vencidos críticos
    const critical = await getCriticalSLAExpired(tenantId)
    
    // Obtener SLAs vencidos del usuario actual
    const userExpired = await getSLAExpiredForAgent(tenantId, user.id!)
    
    return { 
      success: true, 
      data: {
        stats,
        criticalExpired: critical.length,
        userExpired: userExpired.length,
        summary: {
          total: stats.total,
          urgent: stats.bySeverity.urgent,
          critical: stats.bySeverity.critical,
          overdue: stats.bySeverity.overdue,
          averageOverdue: stats.averageOverdue,
          maxOverdue: stats.maxOverdue
        }
      }
    }

  } catch (error) {
    console.error("[Get SLA Expired Summary] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

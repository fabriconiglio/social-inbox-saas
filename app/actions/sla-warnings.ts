"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { 
  detectSLAWarnings, 
  getSLAWarningStats, 
  getSLAWarningsForAgent,
  getSLAWarningsForLocal,
  getSLAWarningsForChannel,
  checkThreadSLAWarning,
  getThreadSLATimeRemaining,
  type SLAWarning,
  type SLAWarningStats
} from "@/lib/sla-warning-detector"

// Schemas de validación
const SLAWarningQuerySchema = z.object({
  tenantId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  localId: z.string().uuid().optional(),
  channelType: z.enum(["WHATSAPP", "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER", "TELEGRAM"]).optional()
})

const ThreadSLAQuerySchema = z.object({
  tenantId: z.string().uuid(),
  threadId: z.string().uuid()
})

// Tipos
export type SLAWarningQuery = z.infer<typeof SLAWarningQuerySchema>
export type ThreadSLAQuery = z.infer<typeof ThreadSLAQuerySchema>

/**
 * Obtener advertencias de SLA para un tenant
 */
export async function getSLAWarnings(data: SLAWarningQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = SLAWarningQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, agentId, localId, channelType } = validated.data

    let warnings: SLAWarning[] = []

    if (agentId) {
      warnings = await getSLAWarningsForAgent(tenantId, agentId)
    } else if (localId) {
      warnings = await getSLAWarningsForLocal(tenantId, localId)
    } else if (channelType) {
      warnings = await getSLAWarningsForChannel(tenantId, channelType)
    } else {
      warnings = await detectSLAWarnings(tenantId)
    }

    return { 
      success: true, 
      data: warnings
    }

  } catch (error) {
    console.error("[Get SLA Warnings] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener estadísticas de advertencias de SLA
 */
export async function getSLAWarningStatistics(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const stats = await getSLAWarningStats(tenantId)

    return { 
      success: true, 
      data: stats
    }

  } catch (error) {
    console.error("[Get SLA Warning Statistics] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Verificar advertencia de SLA para un thread específico
 */
export async function checkThreadSLAWarningStatus(data: ThreadSLAQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = ThreadSLAQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, threadId } = validated.data

    const warning = await checkThreadSLAWarning(tenantId, threadId)

    return { 
      success: true, 
      data: warning
    }

  } catch (error) {
    console.error("[Check Thread SLA Warning Status] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener tiempo restante de SLA para un thread
 */
export async function getThreadSLATimeRemainingStatus(data: ThreadSLAQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = ThreadSLAQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, threadId } = validated.data

    const timeRemaining = await getThreadSLATimeRemaining(tenantId, threadId)

    return { 
      success: true, 
      data: timeRemaining
    }

  } catch (error) {
    console.error("[Get Thread SLA Time Remaining Status] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Crear notificaciones de advertencia de SLA
 */
export async function createSLAWarningNotifications(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Obtener advertencias de SLA
    const warnings = await detectSLAWarnings(tenantId)
    
    // Crear notificaciones para cada advertencia
    const notifications = []
    
    for (const warning of warnings) {
      // Determinar destinatarios de la notificación
      const recipients = []
      
      // Agente asignado (si existe)
      if (warning.assignedTo) {
        recipients.push(warning.assignedTo)
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
            type: "sla_warning",
            payloadJSON: {
              threadId: warning.threadId,
              threadSubject: warning.threadSubject,
              contactName: warning.contactName,
              contactHandle: warning.contactHandle,
              channelType: warning.channelType,
              localName: warning.localName,
              slaId: warning.slaId,
              slaName: warning.slaName,
              responseTimeMinutes: warning.responseTimeMinutes,
              resolutionTimeHours: warning.resolutionTimeHours,
              timeRemaining: warning.timeRemaining,
              timeElapsed: warning.timeElapsed,
              warningLevel: warning.warningLevel,
              percentageUsed: warning.percentageUsed,
              assignedTo: warning.assignedTo,
              assignedToName: warning.assignedToName,
              createdAt: warning.createdAt,
              lastMessageAt: warning.lastMessageAt
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
        warningsProcessed: warnings.length,
        message: `${notifications.length} notificaciones de advertencia de SLA creadas`
      }
    }

  } catch (error) {
    console.error("[Create SLA Warning Notifications] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Marcar advertencia de SLA como vista
 */
export async function markSLAWarningAsViewed(tenantId: string, threadId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Marcar notificaciones de SLA warning para este thread como leídas
    await prisma.notification.updateMany({
      where: {
        userId: user.id!,
        type: "sla_warning",
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
      message: "Advertencia de SLA marcada como vista"
    }

  } catch (error) {
    console.error("[Mark SLA Warning as Viewed] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener resumen de advertencias de SLA
 */
export async function getSLAWarningSummary(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Obtener estadísticas
    const stats = await getSLAWarningStats(tenantId)
    
    // Obtener advertencias críticas
    const criticalWarnings = await detectSLAWarnings(tenantId)
    const critical = criticalWarnings.filter(w => w.warningLevel === 'critical')
    
    // Obtener advertencias del usuario actual
    const userWarnings = await getSLAWarningsForAgent(tenantId, user.id!)
    
    return { 
      success: true, 
      data: {
        stats,
        criticalWarnings: critical.length,
        userWarnings: userWarnings.length,
        summary: {
          total: stats.total,
          critical: stats.byLevel.critical,
          high: stats.byLevel.high,
          medium: stats.byLevel.medium,
          low: stats.byLevel.low
        }
      }
    }

  } catch (error) {
    console.error("[Get SLA Warning Summary] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

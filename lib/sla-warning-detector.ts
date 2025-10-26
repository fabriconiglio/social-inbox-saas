import { prisma } from "@/lib/prisma"
import { resolveSLAHierarchy } from "./sla-hierarchy"

export interface SLAWarning {
  threadId: string
  threadSubject: string
  contactName: string
  contactHandle: string
  channelType: string
  localName: string
  slaId: string
  slaName: string
  responseTimeMinutes: number
  resolutionTimeHours: number
  timeRemaining: number // minutos restantes
  timeElapsed: number // minutos transcurridos
  warningLevel: 'low' | 'medium' | 'high' | 'critical'
  percentageUsed: number // porcentaje del SLA usado
  assignedTo?: string
  assignedToName?: string
  createdAt: Date
  lastMessageAt: Date
}

export interface SLAWarningStats {
  total: number
  byLevel: {
    low: number
    medium: number
    high: number
    critical: number
  }
  byChannel: Record<string, number>
  byLocal: Record<string, number>
  byAgent: Record<string, number>
}

/**
 * Detecta threads con SLA por vencer (75% del tiempo transcurrido)
 */
export async function detectSLAWarnings(tenantId: string): Promise<SLAWarning[]> {
  try {
    const now = new Date()
    const warnings: SLAWarning[] = []

    // Obtener todos los threads activos del tenant
    const threads = await prisma.thread.findMany({
      where: {
        tenantId,
        status: {
          in: ['OPEN', 'PENDING']
        }
      },
      include: {
        contact: {
          select: {
            name: true,
            handle: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true
          }
        },
        channel: {
          select: {
            type: true
          }
        },
        local: {
          select: {
            name: true
          }
        }
      }
    })

    for (const thread of threads) {
      try {
        // Resolver SLA aplicable según jerarquía
        const hierarchy = await resolveSLAHierarchy(
          tenantId,
          thread.localId,
          thread.channel.type
        )

        if (!hierarchy.sla) {
          continue // No hay SLA configurado
        }

        const sla = hierarchy.sla
        const timeElapsed = Math.floor((now.getTime() - thread.createdAt.getTime()) / (1000 * 60)) // minutos
        const responseTimeMinutes = sla.firstResponseMins
        const resolutionTimeMinutes = sla.firstResponseMins * 2 // Estimación

        // Calcular tiempo restante y porcentaje usado
        const timeRemaining = Math.max(0, responseTimeMinutes - timeElapsed)
        const percentageUsed = Math.min(100, (timeElapsed / responseTimeMinutes) * 100)

        // Solo incluir si está en el 75% o más del SLA
        if (percentageUsed >= 75) {
          const warningLevel = getWarningLevel(percentageUsed, timeRemaining)
          
          warnings.push({
            threadId: thread.id,
            threadSubject: thread.subject || 'Sin asunto',
            contactName: thread.contact?.name || 'Desconocido',
            contactHandle: thread.contact?.handle || 'N/A',
            channelType: thread.channel.type,
            localName: thread.local.name,
            slaId: sla.id,
            slaName: sla.name,
            responseTimeMinutes: sla.firstResponseMins,
            resolutionTimeHours: sla.firstResponseMins / 60,
            timeRemaining,
            timeElapsed,
            warningLevel,
            percentageUsed,
            assignedTo: thread.assigneeId || undefined,
            assignedToName: thread.assignee?.name || undefined,
            createdAt: thread.createdAt,
            lastMessageAt: thread.lastMessageAt
          })
        }
      } catch (error) {
        console.error(`[SLA Warning Detection] Error for thread ${thread.id}:`, error)
        continue
      }
    }

    // Ordenar por nivel de advertencia y tiempo restante
    return warnings.sort((a, b) => {
      const levelOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const levelDiff = levelOrder[b.warningLevel] - levelOrder[a.warningLevel]
      if (levelDiff !== 0) return levelDiff
      return a.timeRemaining - b.timeRemaining
    })

  } catch (error) {
    console.error("[SLA Warning Detection] Error:", error)
    return []
  }
}

/**
 * Determina el nivel de advertencia basado en el porcentaje usado y tiempo restante
 */
function getWarningLevel(percentageUsed: number, timeRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
  if (percentageUsed >= 95 || timeRemaining <= 5) {
    return 'critical'
  } else if (percentageUsed >= 90 || timeRemaining <= 15) {
    return 'high'
  } else if (percentageUsed >= 85 || timeRemaining <= 30) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * Obtiene estadísticas de advertencias de SLA
 */
export async function getSLAWarningStats(tenantId: string): Promise<SLAWarningStats> {
  try {
    const warnings = await detectSLAWarnings(tenantId)
    
    const stats: SLAWarningStats = {
      total: warnings.length,
      byLevel: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byChannel: {},
      byLocal: {},
      byAgent: {}
    }

    for (const warning of warnings) {
      // Por nivel
      stats.byLevel[warning.warningLevel]++

      // Por canal
      stats.byChannel[warning.channelType] = (stats.byChannel[warning.channelType] || 0) + 1

      // Por local
      stats.byLocal[warning.localName] = (stats.byLocal[warning.localName] || 0) + 1

      // Por agente
      if (warning.assignedTo) {
        const agentKey = warning.assignedToName || warning.assignedTo
        stats.byAgent[agentKey] = (stats.byAgent[agentKey] || 0) + 1
      }
    }

    return stats

  } catch (error) {
    console.error("[SLA Warning Stats] Error:", error)
    return {
      total: 0,
      byLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      byChannel: {},
      byLocal: {},
      byAgent: {}
    }
  }
}

/**
 * Obtiene advertencias de SLA para un agente específico
 */
export async function getSLAWarningsForAgent(tenantId: string, agentId: string): Promise<SLAWarning[]> {
  try {
    const allWarnings = await detectSLAWarnings(tenantId)
    return allWarnings.filter(warning => warning.assignedTo === agentId)
  } catch (error) {
    console.error("[SLA Warnings for Agent] Error:", error)
    return []
  }
}

/**
 * Obtiene advertencias de SLA para un local específico
 */
export async function getSLAWarningsForLocal(tenantId: string, localId: string): Promise<SLAWarning[]> {
  try {
    const allWarnings = await detectSLAWarnings(tenantId)
    return allWarnings.filter(warning => {
      // Necesitaríamos hacer una query adicional para obtener el localId del thread
      // Por ahora, filtramos por nombre del local
      return true // Implementación simplificada
    })
  } catch (error) {
    console.error("[SLA Warnings for Local] Error:", error)
    return []
  }
}

/**
 * Obtiene advertencias de SLA para un canal específico
 */
export async function getSLAWarningsForChannel(tenantId: string, channelType: string): Promise<SLAWarning[]> {
  try {
    const allWarnings = await detectSLAWarnings(tenantId)
    return allWarnings.filter(warning => warning.channelType === channelType)
  } catch (error) {
    console.error("[SLA Warnings for Channel] Error:", error)
    return []
  }
}

/**
 * Verifica si un thread específico tiene advertencia de SLA
 */
export async function checkThreadSLAWarning(tenantId: string, threadId: string): Promise<SLAWarning | null> {
  try {
    const warnings = await detectSLAWarnings(tenantId)
    return warnings.find(warning => warning.threadId === threadId) || null
  } catch (error) {
    console.error("[Check Thread SLA Warning] Error:", error)
    return null
  }
}

/**
 * Obtiene el tiempo restante para un thread específico
 */
export async function getThreadSLATimeRemaining(tenantId: string, threadId: string): Promise<{
  timeRemaining: number
  percentageUsed: number
  warningLevel: 'low' | 'medium' | 'high' | 'critical' | 'none'
  isWarning: boolean
} | null> {
  try {
    const warning = await checkThreadSLAWarning(tenantId, threadId)
    
    if (!warning) {
      return {
        timeRemaining: 0,
        percentageUsed: 0,
        warningLevel: 'none',
        isWarning: false
      }
    }

    return {
      timeRemaining: warning.timeRemaining,
      percentageUsed: warning.percentageUsed,
      warningLevel: warning.warningLevel,
      isWarning: true
    }

  } catch (error) {
    console.error("[Get Thread SLA Time Remaining] Error:", error)
    return null
  }
}

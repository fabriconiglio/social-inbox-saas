"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { 
  resolveSLAHierarchy, 
  getSLAHierarchy, 
  validateSLAApplicability,
  type SLAHierarchyResult 
} from "@/lib/sla-hierarchy"

// Schemas de validación
const SLAHierarchyQuerySchema = z.object({
  tenantId: z.string().uuid(),
  localId: z.string().uuid().optional(),
  channelType: z.enum(["WHATSAPP", "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER", "TELEGRAM"]).optional()
})

const SLAValidationSchema = z.object({
  slaId: z.string().uuid(),
  tenantId: z.string().uuid(),
  localId: z.string().uuid().optional(),
  channelType: z.enum(["WHATSAPP", "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER", "TELEGRAM"]).optional()
})

// Tipos
export type SLAHierarchyQuery = z.infer<typeof SLAHierarchyQuerySchema>
export type SLAValidation = z.infer<typeof SLAValidationSchema>

/**
 * Obtener jerarquía de SLAs para un contexto específico
 */
export async function getSLAHierarchyForContext(data: SLAHierarchyQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = SLAHierarchyQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, localId, channelType } = validated.data

    // Obtener jerarquía completa
    const hierarchyData = await getSLAHierarchy(tenantId, localId, channelType)

    return { 
      success: true, 
      data: hierarchyData
    }

  } catch (error) {
    console.error("[Get SLA Hierarchy] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Resolver SLA aplicable según jerarquía
 */
export async function resolveApplicableSLA(data: SLAHierarchyQuery) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = SLAHierarchyQuerySchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { tenantId, localId, channelType } = validated.data

    // Resolver SLA aplicable
    const hierarchy = await resolveSLAHierarchy(tenantId, localId, channelType)

    return { 
      success: true, 
      data: hierarchy
    }

  } catch (error) {
    console.error("[Resolve Applicable SLA] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Validar si un SLA es aplicable en un contexto específico
 */
export async function validateSLAForContext(data: SLAValidation) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Validar datos
    const validated = SLAValidationSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { slaId, tenantId, localId, channelType } = validated.data

    // Validar aplicabilidad
    const validation = await validateSLAApplicability(slaId, tenantId, localId, channelType)

    return { 
      success: true, 
      data: validation
    }

  } catch (error) {
    console.error("[Validate SLA for Context] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener estadísticas de jerarquía de SLAs
 */
export async function getSLAHierarchyStats(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Estadísticas de configuración por nivel
    const [localStats, channelStats, tenantStats] = await Promise.all([
      // SLAs por local
      prisma.localSLAConfig.groupBy({
        by: ['localId'],
        where: { tenantId },
        _count: { id: true }
      }),
      
      // SLAs por canal
      prisma.channelSLAConfig.groupBy({
        by: ['channelType'],
        where: { tenantId },
        _count: { id: true }
      }),
      
      // SLAs del tenant
      prisma.sLA.count({
        where: { 
          tenantId
        }
      })
    ])

    // Contar totales
    const totalLocals = await prisma.local.count({ where: { tenantId } })
    const totalChannels = 6 // WHATSAPP, INSTAGRAM, TIKTOK, FACEBOOK, TWITTER, TELEGRAM
    
    const stats = {
      local: {
        configured: localStats.length,
        total: totalLocals,
        coverage: totalLocals > 0 ? Math.round((localStats.length / totalLocals) * 100) : 0
      },
      channel: {
        configured: channelStats.length,
        total: totalChannels,
        coverage: Math.round((channelStats.length / totalChannels) * 100)
      },
      tenant: {
        configured: tenantStats,
        total: tenantStats,
        coverage: tenantStats > 0 ? 100 : 0
      }
    }

    // Calcular nivel de optimización
    const optimizationScore = 
      (stats.local.configured * 3) + 
      (stats.channel.configured * 2) + 
      (stats.tenant.configured * 1)
    
    const maxScore = (totalLocals * 3) + (totalChannels * 2) + 1
    const optimizationLevel = Math.round((optimizationScore / maxScore) * 100)

    return { 
      success: true, 
      data: {
        stats,
        optimization: {
          score: optimizationScore,
          maxScore,
          level: optimizationLevel,
          grade: optimizationLevel >= 80 ? 'A' : 
                 optimizationLevel >= 60 ? 'B' : 
                 optimizationLevel >= 40 ? 'C' : 'D'
        }
      }
    }

  } catch (error) {
    console.error("[Get SLA Hierarchy Stats] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener recomendaciones de optimización
 */
export async function getSLAOptimizationRecommendations(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const recommendations: string[] = []
    
    // Verificar configuración por nivel
    const [localCount, channelCount, tenantCount] = await Promise.all([
      prisma.localSLAConfig.count({ where: { tenantId } }),
      prisma.channelSLAConfig.count({ where: { tenantId } }),
      prisma.sLA.count({ where: { tenantId } })
    ])

    const totalLocals = await prisma.local.count({ where: { tenantId } })
    const totalChannels = 6

    // Recomendaciones por nivel
    if (tenantCount === 0) {
      recommendations.push("Configura un SLA por defecto para el tenant")
    }

    if (channelCount < totalChannels) {
      recommendations.push(`Configura SLAs específicos para canales (${totalChannels - channelCount} faltantes)`)
    }

    if (localCount < totalLocals) {
      recommendations.push(`Configura SLAs específicos para locales (${totalLocals - localCount} faltantes)`)
    }

    // Recomendaciones de optimización
    if (localCount === 0 && channelCount === 0 && tenantCount > 0) {
      recommendations.push("Considera configurar SLAs específicos para mejorar la experiencia")
    }

    if (localCount > 0 && channelCount === 0) {
      recommendations.push("Configura SLAs por canal para una mejor granularidad")
    }

    if (localCount > 0 && channelCount > 0 && tenantCount === 0) {
      recommendations.push("Configura un SLA por defecto como fallback")
    }

    // Recomendaciones de mejores prácticas
    recommendations.push("Revisa regularmente la efectividad de tus SLAs")
    recommendations.push("Considera horarios específicos por zona horaria")
    recommendations.push("Configura reglas de escalación apropiadas")

    return { 
      success: true, 
      data: {
        recommendations,
        summary: {
          localCount,
          channelCount,
          tenantCount,
          totalLocals,
          totalChannels
        }
      }
    }

  } catch (error) {
    console.error("[Get SLA Optimization Recommendations] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Simular resolución de SLA para diferentes contextos
 */
export async function simulateSLAResolution(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    // Obtener locales y canales disponibles
    const [locals, channels] = await Promise.all([
      prisma.local.findMany({
        where: { tenantId },
        select: { id: true, name: true, timezone: true }
      }),
      ["WHATSAPP", "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER", "TELEGRAM"]
    ])

    // Simular resolución para diferentes contextos
    const simulations = []

    // Contexto general (solo tenant)
    const tenantSLA = await resolveSLAHierarchy(tenantId)
    simulations.push({
      context: "General del Tenant",
      description: "Sin local ni canal específico",
      hierarchy: tenantSLA
    })

    // Contexto por canal
    for (const channelType of channels) {
      const channelSLA = await resolveSLAHierarchy(tenantId, undefined, channelType as any)
      simulations.push({
        context: `Canal ${channelType}`,
        description: `SLA para canal ${channelType}`,
        hierarchy: channelSLA
      })
    }

    // Contexto por local
    for (const local of locals.slice(0, 3)) { // Limitar a 3 locales para no sobrecargar
      const localSLA = await resolveSLAHierarchy(tenantId, local.id)
      simulations.push({
        context: `Local ${local.name}`,
        description: `SLA para local ${local.name} (${local.timezone})`,
        hierarchy: localSLA
      })
    }

    // Contexto específico (local + canal)
    if (locals.length > 0 && channels.length > 0) {
      const specificSLA = await resolveSLAHierarchy(tenantId, locals[0].id, channels[0] as any)
      simulations.push({
        context: `Local ${locals[0].name} + Canal ${channels[0]}`,
        description: `SLA específico para local y canal`,
        hierarchy: specificSLA
      })
    }

    return { 
      success: true, 
      data: {
        simulations,
        summary: {
          totalContexts: simulations.length,
          uniqueSLAs: new Set(simulations.map(s => s.hierarchy.slaId)).size,
          sources: {
            local: simulations.filter(s => s.hierarchy.source === 'local').length,
            channel: simulations.filter(s => s.hierarchy.source === 'channel').length,
            tenant: simulations.filter(s => s.hierarchy.source === 'tenant').length,
            none: simulations.filter(s => s.hierarchy.source === 'none').length
          }
        }
      }
    }

  } catch (error) {
    console.error("[Simulate SLA Resolution] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

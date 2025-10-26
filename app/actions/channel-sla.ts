"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"

// Schemas de validación
const ChannelSLAAssignmentSchema = z.object({
  channelType: z.enum(["WHATSAPP", "INSTAGRAM", "TIKTOK", "FACEBOOK", "TWITTER", "TELEGRAM"]),
  slaId: z.string().uuid().nullable(),
  tenantId: z.string().uuid()
})

const BulkChannelSLASchema = z.object({
  assignments: z.array(ChannelSLAAssignmentSchema),
  tenantId: z.string().uuid()
})

// Tipos
export type ChannelSLAAssignment = z.infer<typeof ChannelSLAAssignmentSchema>
export type BulkChannelSLA = z.infer<typeof BulkChannelSLASchema>

/**
 * Asignar SLA a un canal específico
 */
export async function assignChannelSLA(data: ChannelSLAAssignment) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validar datos
    const validated = ChannelSLAAssignmentSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { channelType, slaId, tenantId } = validated.data

    // Si se asigna un SLA, verificar que existe y pertenece al tenant
    if (slaId) {
      const sla = await prisma.sLA.findUnique({
        where: { id: slaId },
        include: { tenant: true }
      })

      if (!sla) {
        return { success: false, error: "SLA not found" }
      }

      if (sla.tenantId !== tenantId) {
        return { success: false, error: "SLA does not belong to this tenant" }
      }
    }

    // Buscar o crear configuración de canal
    let channelConfig = await prisma.channelSLAConfig.findFirst({
      where: {
        tenantId,
        channelType
      }
    })

    if (channelConfig) {
      // Actualizar configuración existente
      channelConfig = await prisma.channelSLAConfig.update({
        where: { id: channelConfig.id },
        data: {
          slaId,
          updatedAt: new Date()
        }
      })
    } else {
      // Crear nueva configuración
      channelConfig = await prisma.channelSLAConfig.create({
        data: {
          tenantId,
          channelType,
          slaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return { 
      success: true, 
      data: channelConfig,
      message: slaId 
        ? `SLA asignado exitosamente a ${channelType}` 
        : `SLA removido de ${channelType}`
    }

  } catch (error) {
    console.error("[Channel SLA Assignment] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener configuración de SLAs por canal para un tenant
 */
export async function getChannelSLAs(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const channelConfigs = await prisma.channelSLAConfig.findMany({
      where: { tenantId },
      include: {
        sla: {
          select: {
            id: true,
            name: true,
            description: true,
            responseTimeMinutes: true,
            resolutionTimeHours: true,
            priority: true,
            isActive: true
          }
        }
      }
    })

    // Convertir a formato más fácil de usar
    const channelSLAs: Record<string, string | null> = {}
    channelConfigs.forEach((config: any) => {
      channelSLAs[config.channelType] = config.slaId
    })

    return { 
      success: true, 
      data: {
        channelSLAs,
        configs: channelConfigs
      }
    }

  } catch (error) {
    console.error("[Get Channel SLAs] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Asignación masiva de SLAs a múltiples canales
 */
export async function bulkAssignChannelSLAs(data: BulkChannelSLA) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validar datos
    const validated = BulkChannelSLASchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { assignments, tenantId } = validated.data

    // Verificar que todos los SLAs existen y pertenecen al tenant
    const slaIds = assignments.filter(a => a.slaId).map(a => a.slaId!)
    if (slaIds.length > 0) {
      const slas = await prisma.sLA.findMany({
        where: {
          id: { in: slaIds },
          tenantId
        }
      })

      if (slas.length !== slaIds.length) {
        return { success: false, error: "Some SLAs not found or don't belong to this tenant" }
      }
    }

    // Procesar asignaciones en transacción
    const results = await prisma.$transaction(async (tx) => {
      const results = []
      
      for (const assignment of assignments) {
        const { channelType, slaId } = assignment

        // Buscar configuración existente
        let channelConfig = await tx.channelSLAConfig.findFirst({
          where: { tenantId, channelType }
        })

        if (channelConfig) {
          // Actualizar
          channelConfig = await tx.channelSLAConfig.update({
            where: { id: channelConfig.id },
            data: {
              slaId,
              updatedAt: new Date()
            }
          })
        } else {
          // Crear nueva
          channelConfig = await tx.channelSLAConfig.create({
            data: {
              tenantId,
              channelType,
              slaId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }

        results.push(channelConfig)
      }

      return results
    })

    return { 
      success: true, 
      data: results,
      message: `${results.length} configuraciones de canal actualizadas`
    }

  } catch (error) {
    console.error("[Bulk Channel SLA Assignment] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Remover SLA de un canal
 */
export async function removeChannelSLA(tenantId: string, channelType: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    const channelConfig = await prisma.channelSLAConfig.findFirst({
      where: { tenantId, channelType }
    })

    if (!channelConfig) {
      return { success: false, error: "Channel configuration not found" }
    }

    await prisma.channelSLAConfig.delete({
      where: { id: channelConfig.id }
    })

    return { 
      success: true, 
      message: `SLA removido de ${channelType}`
    }

  } catch (error) {
    console.error("[Remove Channel SLA] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener SLA para un canal específico
 */
export async function getChannelSLA(tenantId: string, channelType: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const channelConfig = await prisma.channelSLAConfig.findFirst({
      where: { tenantId, channelType },
      include: {
        sla: {
          select: {
            id: true,
            name: true,
            description: true,
            responseTimeMinutes: true,
            resolutionTimeHours: true,
            priority: true,
            isActive: true,
            businessHours: true,
            escalationRules: true
          }
        }
      }
    })

    if (!channelConfig) {
      return { success: true, data: null }
    }

    return { 
      success: true, 
      data: channelConfig
    }

  } catch (error) {
    console.error("[Get Channel SLA] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener estadísticas de SLAs por canal
 */
export async function getChannelSLAStats(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const stats = await prisma.channelSLAConfig.groupBy({
      by: ['channelType'],
      where: { tenantId },
      _count: {
        id: true
      }
    })

    const totalChannels = 6 // WHATSAPP, INSTAGRAM, TIKTOK, FACEBOOK, TWITTER, TELEGRAM
    const configuredChannels = stats.length
    const coverage = Math.round((configuredChannels / totalChannels) * 100)

    return { 
      success: true, 
      data: {
        totalChannels,
        configuredChannels,
        coverage,
        stats
      }
    }

  } catch (error) {
    console.error("[Get Channel SLA Stats] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

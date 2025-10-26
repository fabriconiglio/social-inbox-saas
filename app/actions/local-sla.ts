"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"

// Schemas de validación
const LocalSLAAssignmentSchema = z.object({
  localId: z.string().uuid(),
  slaId: z.string().uuid().nullable(),
  tenantId: z.string().uuid()
})

const BulkLocalSLASchema = z.object({
  assignments: z.array(LocalSLAAssignmentSchema),
  tenantId: z.string().uuid()
})

// Tipos
export type LocalSLAAssignment = z.infer<typeof LocalSLAAssignmentSchema>
export type BulkLocalSLA = z.infer<typeof BulkLocalSLASchema>

/**
 * Asignar SLA a un local específico
 */
export async function assignLocalSLA(data: LocalSLAAssignment) {
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
    const validated = LocalSLAAssignmentSchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { localId, slaId, tenantId } = validated.data

    // Verificar que el local pertenece al tenant
    const local = await prisma.local.findUnique({
      where: { id: localId },
      include: { tenant: true }
    })

    if (!local) {
      return { success: false, error: "Local not found" }
    }

    if (local.tenantId !== tenantId) {
      return { success: false, error: "Local does not belong to this tenant" }
    }

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

    // Buscar o crear configuración de local
    let localConfig = await prisma.localSLAConfig.findFirst({
      where: {
        tenantId,
        localId
      }
    })

    if (localConfig) {
      // Actualizar configuración existente
      localConfig = await prisma.localSLAConfig.update({
        where: { id: localConfig.id },
        data: {
          slaId,
          updatedAt: new Date()
        }
      })
    } else {
      // Crear nueva configuración
      localConfig = await prisma.localSLAConfig.create({
        data: {
          tenantId,
          localId,
          slaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return { 
      success: true, 
      data: localConfig,
      message: slaId 
        ? `SLA asignado exitosamente al local ${local.name}` 
        : `SLA removido del local ${local.name}`
    }

  } catch (error) {
    console.error("[Local SLA Assignment] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener configuración de SLAs por local para un tenant
 */
export async function getLocalSLAs(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const localConfigs = await prisma.localSLAConfig.findMany({
      where: { tenantId },
      include: {
        local: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true
          }
        },
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
    const localSLAs: Record<string, string | null> = {}
    localConfigs.forEach((config: any) => {
      localSLAs[config.localId] = config.slaId
    })

    return { 
      success: true, 
      data: {
        localSLAs,
        configs: localConfigs
      }
    }

  } catch (error) {
    console.error("[Get Local SLAs] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Asignación masiva de SLAs a múltiples locales
 */
export async function bulkAssignLocalSLAs(data: BulkLocalSLA) {
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
    const validated = BulkLocalSLASchema.safeParse(data)
    if (!validated.success) {
      return { success: false, error: "Invalid data", details: validated.error.message }
    }

    const { assignments, tenantId } = validated.data

    // Verificar que todos los locales pertenecen al tenant
    const localIds = assignments.map(a => a.localId)
    const locals = await prisma.local.findMany({
      where: {
        id: { in: localIds },
        tenantId
      }
    })

    if (locals.length !== localIds.length) {
      return { success: false, error: "Some locals not found or don't belong to this tenant" }
    }

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
        const { localId, slaId } = assignment

        // Buscar configuración existente
        let localConfig = await tx.localSLAConfig.findFirst({
          where: { tenantId, localId }
        })

        if (localConfig) {
          // Actualizar
          localConfig = await tx.localSLAConfig.update({
            where: { id: localConfig.id },
            data: {
              slaId,
              updatedAt: new Date()
            }
          })
        } else {
          // Crear nueva
          localConfig = await tx.localSLAConfig.create({
            data: {
              tenantId,
              localId,
              slaId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }

        results.push(localConfig)
      }

      return results
    })

    return { 
      success: true, 
      data: results,
      message: `${results.length} configuraciones de local actualizadas`
    }

  } catch (error) {
    console.error("[Bulk Local SLA Assignment] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Remover SLA de un local
 */
export async function removeLocalSLA(tenantId: string, localId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "Insufficient permissions" }
    }

    const localConfig = await prisma.localSLAConfig.findFirst({
      where: { tenantId, localId }
    })

    if (!localConfig) {
      return { success: false, error: "Local configuration not found" }
    }

    await prisma.localSLAConfig.delete({
      where: { id: localConfig.id }
    })

    return { 
      success: true, 
      message: `SLA removido del local`
    }

  } catch (error) {
    console.error("[Remove Local SLA] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener SLA para un local específico
 */
export async function getLocalSLA(tenantId: string, localId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const localConfig = await prisma.localSLAConfig.findFirst({
      where: { tenantId, localId },
      include: {
        local: {
          select: {
            id: true,
            name: true,
            address: true,
            timezone: true
          }
        },
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

    if (!localConfig) {
      return { success: true, data: null }
    }

    return { 
      success: true, 
      data: localConfig
    }

  } catch (error) {
    console.error("[Get Local SLA] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

/**
 * Obtener estadísticas de SLAs por local
 */
export async function getLocalSLAStats(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)
    
    if (!membership) {
      return { success: false, error: "Unauthorized" }
    }

    const stats = await prisma.localSLAConfig.groupBy({
      by: ['localId'],
      where: { tenantId },
      _count: {
        id: true
      }
    })

    const totalLocals = await prisma.local.count({
      where: { tenantId }
    })
    
    const configuredLocals = stats.length
    const coverage = totalLocals > 0 ? Math.round((configuredLocals / totalLocals) * 100) : 0

    return { 
      success: true, 
      data: {
        totalLocals,
        configuredLocals,
        coverage,
        stats
      }
    }

  } catch (error) {
    console.error("[Get Local SLA Stats] Error:", error)
    return { success: false, error: "Operation failed" }
  }
}

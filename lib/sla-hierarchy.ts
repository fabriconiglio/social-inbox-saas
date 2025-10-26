import { prisma } from "@/lib/prisma"

export interface SLAHierarchyResult {
  slaId: string | null
  source: 'local' | 'channel' | 'tenant' | 'none'
  sla?: {
    id: string
    name: string
    firstResponseMins: number
    businessHoursJSON: any
  }
  localSLA?: {
    id: string
    localId: string
    localName: string
  }
  channelSLA?: {
    id: string
    channelType: string
  }
  tenantSLA?: {
    id: string
    tenantId: string
  }
}

/**
 * Resuelve el SLA aplicable según la jerarquía: Local > Canal > Tenant
 */
export async function resolveSLAHierarchy(
  tenantId: string,
  localId?: string,
  channelType?: string
): Promise<SLAHierarchyResult> {
  try {
    // 1. Buscar SLA específico del local (máxima prioridad)
    if (localId) {
      const localSLA = await prisma.localSLAConfig.findFirst({
        where: { tenantId, localId },
        include: {
          sla: {
            select: {
              id: true,
              name: true,
              responseTimeMinutes: true,
              resolutionTimeHours: true
            }
          },
          local: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (localSLA && localSLA.sla) {
        return {
          slaId: localSLA.sla.id,
          source: 'local',
          sla: localSLA.sla,
          localSLA: {
            id: localSLA.id,
            localId: localSLA.localId,
            localName: localSLA.local.name
          }
        }
      }
    }

    // 2. Buscar SLA específico del canal (segunda prioridad)
    if (channelType) {
      const channelSLA = await prisma.channelSLAConfig.findFirst({
        where: { tenantId, channelType },
        include: {
          sla: {
            select: {
              id: true,
              name: true,
              responseTimeMinutes: true,
              resolutionTimeHours: true
            }
          }
        }
      })

      if (channelSLA && channelSLA.sla) {
        return {
          slaId: channelSLA.sla.id,
          source: 'channel',
          sla: channelSLA.sla,
          channelSLA: {
            id: channelSLA.id,
            channelType: channelSLA.channelType
          }
        }
      }
    }

    // 3. Buscar SLA por defecto del tenant (prioridad más baja)
    const tenantSLA = await prisma.sLA.findFirst({
      where: { 
        tenantId
      },
      orderBy: [
        { createdAt: 'asc' }  // Más antiguo primero
      ],
      select: {
        id: true,
              name: true,
              firstResponseMins: true,
        businessHoursJSON: true
      }
    })

    if (tenantSLA) {
      return {
        slaId: tenantSLA.id,
        source: 'tenant',
        sla: tenantSLA,
        tenantSLA: {
          id: tenantSLA.id,
          tenantId
        }
      }
    }

    // 4. No se encontró ningún SLA
    return {
      slaId: null,
      source: 'none'
    }

  } catch (error) {
    console.error("[SLA Hierarchy Resolution] Error:", error)
    return {
      slaId: null,
      source: 'none'
    }
  }
}

/**
 * Obtiene la jerarquía completa de SLAs para un contexto específico
 */
export async function getSLAHierarchy(
  tenantId: string,
  localId?: string,
  channelType?: string
): Promise<{
  hierarchy: SLAHierarchyResult
  availableSLAs: {
    local?: SLAHierarchyResult
    channel?: SLAHierarchyResult
    tenant?: SLAHierarchyResult
  }
  recommendations: string[]
}> {
  try {
    // Obtener SLA aplicable según jerarquía
    const hierarchy = await resolveSLAHierarchy(tenantId, localId, channelType)

    // Obtener todos los SLAs disponibles en cada nivel
    const availableSLAs: any = {}

    // SLA del local
    if (localId) {
      const localSLA = await prisma.localSLAConfig.findFirst({
        where: { tenantId, localId },
        include: {
          sla: {
            select: {
              id: true,
              name: true,
              responseTimeMinutes: true,
              resolutionTimeHours: true
            }
          },
          local: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (localSLA) {
        availableSLAs.local = {
          slaId: localSLA.slaId,
          source: 'local',
          sla: localSLA.sla,
          localSLA: {
            id: localSLA.id,
            localId: localSLA.localId,
            localName: localSLA.local.name
          }
        }
      }
    }

    // SLA del canal
    if (channelType) {
      const channelSLA = await prisma.channelSLAConfig.findFirst({
        where: { tenantId, channelType },
        include: {
          sla: {
            select: {
              id: true,
              name: true,
              responseTimeMinutes: true,
              resolutionTimeHours: true
            }
          }
        }
      })

      if (channelSLA) {
        availableSLAs.channel = {
          slaId: channelSLA.slaId,
          source: 'channel',
          sla: channelSLA.sla,
          channelSLA: {
            id: channelSLA.id,
            channelType: channelSLA.channelType
          }
        }
      }
    }

    // SLA del tenant
    const tenantSLA = await prisma.sLA.findFirst({
      where: { 
        tenantId
      },
      orderBy: [
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
              name: true,
              firstResponseMins: true,
        businessHoursJSON: true
      }
    })

    if (tenantSLA) {
      availableSLAs.tenant = {
        slaId: tenantSLA.id,
        source: 'tenant',
        sla: tenantSLA,
        tenantSLA: {
          id: tenantSLA.id,
          tenantId
        }
      }
    }

    // Generar recomendaciones
    const recommendations: string[] = []
    
    if (hierarchy.source === 'none') {
      recommendations.push("No hay SLA configurado - considera configurar un SLA por defecto")
    } else if (hierarchy.source === 'tenant') {
      recommendations.push("Usando SLA general del tenant - considera configurar SLAs específicos")
    } else if (hierarchy.source === 'channel') {
      recommendations.push("Usando SLA del canal - considera configurar SLA específico para este local")
    } else if (hierarchy.source === 'local') {
      recommendations.push("Usando SLA específico del local - configuración óptima")
    }

    if (availableSLAs.local && hierarchy.source !== 'local') {
      recommendations.push("Este local tiene un SLA específico que no se está usando")
    }

    if (availableSLAs.channel && hierarchy.source === 'tenant') {
      recommendations.push("Este canal tiene un SLA específico que no se está usando")
    }

    return {
      hierarchy,
      availableSLAs,
      recommendations
    }

  } catch (error) {
    console.error("[Get SLA Hierarchy] Error:", error)
    return {
      hierarchy: { slaId: null, source: 'none' },
      availableSLAs: {},
      recommendations: ["Error al obtener jerarquía de SLAs"]
    }
  }
}

/**
 * Valida si un SLA es aplicable en un contexto específico
 */
export async function validateSLAApplicability(
  slaId: string,
  tenantId: string,
  localId?: string,
  channelType?: string
): Promise<{
  isApplicable: boolean
  reason?: string
  hierarchy: SLAHierarchyResult
}> {
  try {
    const hierarchy = await resolveSLAHierarchy(tenantId, localId, channelType)
    
    if (hierarchy.slaId === slaId) {
      return {
        isApplicable: true,
        hierarchy
      }
    }

    // Verificar si el SLA existe y está activo
    const sla = await prisma.sLA.findUnique({
      where: { id: slaId },
      select: {
        id: true,
        name: true,
        tenantId: true
      }
    })

    if (!sla) {
      return {
        isApplicable: false,
        reason: "SLA no encontrado",
        hierarchy
      }
    }

    if (sla.tenantId !== tenantId) {
      return {
        isApplicable: false,
        reason: "SLA no pertenece a este tenant",
        hierarchy
      }
    }


    // El SLA existe pero no es el aplicable según la jerarquía
    return {
      isApplicable: false,
      reason: `SLA no aplicable - se está usando ${hierarchy.source} SLA`,
      hierarchy
    }

  } catch (error) {
    console.error("[Validate SLA Applicability] Error:", error)
    return {
      isApplicable: false,
      reason: "Error al validar aplicabilidad",
      hierarchy: { slaId: null, source: 'none' }
    }
  }
}

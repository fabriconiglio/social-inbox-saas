"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { z } from "zod"

// Schema para validar parámetros de búsqueda
const searchSchema = z.object({
  query: z.string().min(1).max(100),
  tenantId: z.string().uuid(),
  filters: z.object({
    localId: z.string().uuid().optional(),
    channel: z.string().optional(),
    status: z.enum(["open", "pending", "closed"]).optional(),
    assignee: z.string().optional(),
  }).optional()
})

export interface SearchFilters {
  localId?: string
  channel?: string
  status?: string
  assignee?: string
}

/**
 * Buscar threads con texto y filtros básicos
 */
export async function searchThreads(
  query: string,
  tenantId: string,
  filters?: SearchFilters,
  userId?: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    // Validar autenticación
    const user = await requireAuth()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    // Validar acceso al tenant
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { success: false, error: "No autorizado para este tenant" }
    }

    // Validar parámetros
    const validated = searchSchema.safeParse({
      query,
      tenantId,
      filters
    })

    if (!validated.success) {
      return { success: false, error: "Parámetros inválidos" }
    }

    const { query: searchQuery, filters: searchFilters } = validated.data

    // Construir filtros de Prisma
    const whereClause: any = {
      local: {
        tenantId: tenantId
      }
    }

    // Filtro por local
    if (searchFilters?.localId) {
      whereClause.localId = searchFilters.localId
    }

    // Filtro por canal
    if (searchFilters?.channel) {
      whereClause.channel = {
        type: searchFilters.channel
      }
    }

    // Filtro por estado
    if (searchFilters?.status) {
      whereClause.status = searchFilters.status
    }

    // Filtro por asignado
    if (searchFilters?.assignee) {
      if (searchFilters.assignee === "me") {
        whereClause.assigneeId = user.id
      } else if (searchFilters.assignee === "unassigned") {
        whereClause.assigneeId = null
      } else {
        whereClause.assigneeId = searchFilters.assignee
      }
    }

    // Buscar threads con texto
    const threads = await prisma.thread.findMany({
      where: {
        ...whereClause,
        OR: [
          // Buscar en nombre del contacto
          {
            contact: {
              name: {
                contains: searchQuery,
                mode: "insensitive"
              }
            }
          },
          // Buscar en handle del contacto
          {
            contact: {
              handle: {
                contains: searchQuery,
                mode: "insensitive"
              }
            }
          },
          // Buscar en mensajes
          {
            messages: {
              some: {
                body: {
                  contains: searchQuery,
                  mode: "insensitive"
                }
              }
            }
          },
          // Buscar en external ID del thread
          {
            externalId: {
              contains: searchQuery,
              mode: "insensitive"
            }
          }
        ]
      },
      include: {
        channel: {
          select: {
            id: true,
            type: true,
            name: true
          }
        },
        local: {
          select: {
            id: true,
            name: true,
            tenantId: true
          }
        },
        contact: {
          select: {
            id: true,
            name: true,
            handle: true,
            platform: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          select: {
            id: true,
            body: true,
            sentAt: true,
            direction: true
          },
          orderBy: {
            sentAt: "desc"
          },
          take: 5 // Solo los últimos 5 mensajes para performance
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 50 // Limitar resultados para performance
    })

    return { success: true, data: threads }

  } catch (error) {
    console.error("[Search] Error buscando threads:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

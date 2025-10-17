"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
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
    dateRange: z.string().optional(),
  }).optional()
})

export interface SearchFilters {
  localId?: string
  channel?: string
  status?: string
  assignee?: string
  dateRange?: string
}

export interface SearchResult {
  id: string
  externalId: string
  status: string
  createdAt: Date
  updatedAt: Date
  channel: {
    id: string
    type: string
    name: string
  }
  local: {
    id: string
    name: string
    tenantId: string
  }
  contact: {
    id: string
    name: string | null
    handle: string
    platform: string
  } | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  messages: Array<{
    id: string
    body: string
    sentAt: Date
    direction: string
  }>
  // Campos calculados para destacar resultados
  relevanceScore: number
  matchedFields: string[]
}

/**
 * Buscar threads con filtros y texto
 */
export async function searchThreads(
  query: string,
  tenantId: string,
  filters?: SearchFilters,
  userId?: string
): Promise<{ success: boolean; data?: SearchResult[]; error?: string }> {
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

    // Filtro por rango de fechas
    if (searchFilters?.dateRange) {
      const now = new Date()
      let startDate: Date

      switch (searchFilters.dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "yesterday":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          whereClause.createdAt = {
            gte: startDate,
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
          break
        case "thisWeek":
          const dayOfWeek = now.getDay()
          startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
          whereClause.createdAt = { gte: startDate }
          break
        case "lastWeek":
          const lastWeekStart = new Date(now.getTime() - (dayOfWeek + 7) * 24 * 60 * 60 * 1000)
          const lastWeekEnd = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
          whereClause.createdAt = {
            gte: lastWeekStart,
            lt: lastWeekEnd
          }
          break
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          whereClause.createdAt = { gte: startDate }
          break
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 1)
          whereClause.createdAt = {
            gte: startDate,
            lt: endDate
          }
          break
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

    // Calcular relevancia y campos coincidentes
    const results: SearchResult[] = threads.map(thread => {
      const matchedFields: string[] = []
      let relevanceScore = 0

      // Buscar coincidencias en nombre del contacto
      if (thread.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchedFields.push("contact.name")
        relevanceScore += 10
      }

      // Buscar coincidencias en handle del contacto
      if (thread.contact?.handle?.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchedFields.push("contact.handle")
        relevanceScore += 8
      }

      // Buscar coincidencias en mensajes
      const matchingMessages = thread.messages.filter(msg => 
        msg.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (matchingMessages.length > 0) {
        matchedFields.push("messages")
        relevanceScore += matchingMessages.length * 2
      }

      // Buscar coincidencias en external ID
      if (thread.externalId.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchedFields.push("externalId")
        relevanceScore += 5
      }

      // Bonus por threads recientes
      const daysSinceUpdate = (Date.now() - thread.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceUpdate < 1) relevanceScore += 3
      else if (daysSinceUpdate < 7) relevanceScore += 2
      else if (daysSinceUpdate < 30) relevanceScore += 1

      return {
        id: thread.id,
        externalId: thread.externalId,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        channel: thread.channel,
        local: thread.local,
        contact: thread.contact,
        assignee: thread.assignee,
        messages: thread.messages,
        relevanceScore,
        matchedFields
      }
    })

    // Ordenar por relevancia
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return { success: true, data: results }

  } catch (error) {
    console.error("[Search] Error buscando threads:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/**
 * Buscar contactos
 */
export async function searchContacts(
  query: string,
  tenantId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await requireAuth()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { success: false, error: "No autorizado para este tenant" }
    }

    const contacts = await prisma.contact.findMany({
      where: {
        local: {
          tenantId: tenantId
        },
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            handle: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            phone: {
              contains: query
            }
          },
          {
            email: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      },
      include: {
        local: {
          select: {
            name: true
          }
        },
        threads: {
          select: {
            id: true,
            status: true,
            updatedAt: true
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 3
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 20
    })

    return { success: true, data: contacts }

  } catch (error) {
    console.error("[Search] Error buscando contactos:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

/**
 * Obtener sugerencias de búsqueda
 */
export async function getSearchSuggestions(
  query: string,
  tenantId: string
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const user = await requireAuth()
    if (!user) {
      return { success: false, error: "No autenticado" }
    }

    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { success: false, error: "No autorizado para este tenant" }
    }

    if (query.length < 2) {
      return { success: true, data: [] }
    }

    // Obtener nombres de contactos que coincidan
    const contacts = await prisma.contact.findMany({
      where: {
        local: {
          tenantId: tenantId
        },
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            handle: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      },
      select: {
        name: true,
        handle: true
      },
      take: 5
    })

    const suggestions = contacts
      .map(contact => [contact.name, contact.handle])
      .flat()
      .filter(Boolean)
      .filter(suggestion => 
        suggestion!.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)

    return { success: true, data: suggestions as string[] }

  } catch (error) {
    console.error("[Search] Error obteniendo sugerencias:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

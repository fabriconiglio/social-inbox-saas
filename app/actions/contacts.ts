"use server"

import { requireAuth } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema para validar datos de contacto
const createContactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  handle: z.string().min(1, "El handle es requerido").max(100),
  platform: z.enum(["instagram", "facebook", "whatsapp", "tiktok"]),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
})

const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().min(1),
})

// Listar contactos con filtros
export async function listContacts(
  tenantId: string,
  options: {
    search?: string
    platform?: string
    limit?: number
    offset?: number
  } = {}
) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    const { search, platform, limit = 50, offset = 0 } = options

    // Construir filtros
    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { handle: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (platform) {
      where.platform = platform
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          threads: {
            select: {
              id: true,
              status: true,
              lastMessageAt: true,
            },
            orderBy: { lastMessageAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              threads: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ])

    return {
      success: true,
      data: {
        contacts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    }
  } catch (error) {
    console.error("[List Contacts] Error:", error)
    return { error: "Error al cargar contactos" }
  }
}

// Obtener un contacto específico
export async function getContact(contactId: string, tenantId: string) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
      include: {
        threads: {
          select: {
            id: true,
            status: true,
            lastMessageAt: true,
            createdAt: true,
            channel: {
              select: {
                displayName: true,
                type: true,
              },
            },
            assignee: {
              select: {
                name: true,
                email: true,
              },
            },
            messages: {
              select: {
                id: true,
                direction: true,
                body: true,
                sentAt: true,
                authorId: true,
              },
              orderBy: { sentAt: "desc" },
              take: 1,
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
          orderBy: { lastMessageAt: "desc" },
        },
        _count: {
          select: {
            threads: true,
          },
        },
      },
    })

    if (!contact) {
      return { error: "Contacto no encontrado" }
    }

    return { success: true, data: contact }
  } catch (error) {
    console.error("[Get Contact] Error:", error)
    return { error: "Error al cargar el contacto" }
  }
}

// Crear nuevo contacto
export async function createContact(tenantId: string, data: z.infer<typeof createContactSchema>) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden crear contactos
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para crear contactos" }
    }

    // Validar datos
    const validated = createContactSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Datos inválidos", details: validated.error.errors }
    }

    // Verificar que no exista un contacto con el mismo handle en la plataforma
    const existingContact = await prisma.contact.findFirst({
      where: {
        tenantId,
        platform: validated.data.platform,
        handle: validated.data.handle,
      },
    })

    if (existingContact) {
      return { error: "Ya existe un contacto con este handle en esta plataforma" }
    }

    const contact = await prisma.contact.create({
      data: {
        ...validated.data,
        tenantId,
      },
    })

    revalidatePath(`/app/${tenantId}/contacts`)
    
    return { success: true, data: contact }
  } catch (error) {
    console.error("[Create Contact] Error:", error)
    return { error: "Error al crear el contacto" }
  }
}

// Actualizar contacto
export async function updateContact(tenantId: string, data: z.infer<typeof updateContactSchema>) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden actualizar contactos
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para actualizar contactos" }
    }

    // Validar datos
    const validated = updateContactSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Datos inválidos", details: validated.error.errors }
    }

    // Verificar que el contacto existe y pertenece al tenant
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: validated.data.id,
        tenantId,
      },
    })

    if (!existingContact) {
      return { error: "Contacto no encontrado" }
    }

    // Si se está cambiando platform o handle, verificar que no exista otro contacto
    if (validated.data.platform || validated.data.handle) {
      const platform = validated.data.platform || existingContact.platform
      const handle = validated.data.handle || existingContact.handle

      const duplicateContact = await prisma.contact.findFirst({
        where: {
          tenantId,
          platform,
          handle,
          id: { not: validated.data.id },
        },
      })

      if (duplicateContact) {
        return { error: "Ya existe un contacto con este handle en esta plataforma" }
      }
    }

    const contact = await prisma.contact.update({
      where: { id: validated.data.id },
      data: {
        ...validated.data,
        id: undefined, // Remover id del data
      },
    })

    revalidatePath(`/app/${tenantId}/contacts`)
    revalidatePath(`/app/${tenantId}/contacts/${validated.data.id}`)
    
    return { success: true, data: contact }
  } catch (error) {
    console.error("[Update Contact] Error:", error)
    return { error: "Error al actualizar el contacto" }
  }
}

// Versión simplificada para actualizar contacto (solo requiere contactId y data)
export async function updateContactSimple(contactId: string, data: {
  name?: string
  handle?: string
  platform?: "instagram" | "facebook" | "whatsapp" | "tiktok"
  phone?: string
  email?: string
  notes?: string
}) {
  try {
    const user = await requireAuth()
    
    // Primero obtener el contacto para verificar permisos
    const existingContact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { tenantId: true }
    })

    if (!existingContact) {
      return { error: "Contacto no encontrado" }
    }

    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId: existingContact.tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden actualizar contactos
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para actualizar contactos" }
    }

    // Validar datos básicos
    if (data.name && data.name.trim().length === 0) {
      return { error: "El nombre no puede estar vacío" }
    }

    if (data.handle && data.handle.trim().length === 0) {
      return { error: "El handle no puede estar vacío" }
    }

    if (data.email && data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { error: "El email no es válido" }
    }

    // Si se está cambiando platform o handle, verificar que no exista otro contacto
    if (data.platform || data.handle) {
      const platform = data.platform || (await prisma.contact.findUnique({ where: { id: contactId } }))?.platform
      const handle = data.handle || (await prisma.contact.findUnique({ where: { id: contactId } }))?.handle

      if (platform && handle) {
        const duplicateContact = await prisma.contact.findFirst({
          where: {
            tenantId: existingContact.tenantId,
            platform,
            handle,
            id: { not: contactId },
          },
        })

        if (duplicateContact) {
          return { error: "Ya existe un contacto con este handle en esta plataforma" }
        }
      }
    }

    // Actualizar el contacto
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.handle && { handle: data.handle.trim() }),
        ...(data.platform && { platform: data.platform }),
        ...(data.phone !== undefined && { phone: data.phone.trim() || null }),
        ...(data.email !== undefined && { email: data.email.trim() || null }),
        ...(data.notes !== undefined && { notes: data.notes.trim() || null }),
      },
    })

    // Revalidar cache
    revalidatePath(`/app/${existingContact.tenantId}/contacts`)
    revalidatePath(`/app/${existingContact.tenantId}/contacts/${contactId}`)
    
    return { success: true, data: contact }
  } catch (error) {
    console.error("[Update Contact Simple] Error:", error)
    return { error: "Error al actualizar el contacto" }
  }
}

// Alias para compatibilidad - función principal para actualizar contactos
export const updateContactById = updateContactSimple

// Obtener threads de un contacto específico
export async function getContactThreads(contactId: string) {
  try {
    const user = await requireAuth()
    
    // Primero obtener el contacto para verificar permisos
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { 
        id: true,
        tenantId: true,
        name: true,
        handle: true,
        platform: true
      }
    })

    if (!contact) {
      return { error: "Contacto no encontrado" }
    }

    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId: contact.tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Obtener threads del contacto con información completa
    const threads = await prisma.thread.findMany({
      where: {
        contactId: contactId,
        tenantId: contact.tenantId,
      },
      include: {
        channel: {
          select: {
            id: true,
            displayName: true,
            type: true,
            status: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        messages: {
          select: {
            id: true,
            direction: true,
            body: true,
            sentAt: true,
            deliveredAt: true,
            authorId: true,
          },
          orderBy: {
            sentAt: 'desc',
          },
          take: 1, // Solo el último mensaje para preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    })

    // Formatear respuesta con información del contacto
    const result = {
      contact: {
        id: contact.id,
        name: contact.name,
        handle: contact.handle,
        platform: contact.platform,
      },
      threads: threads.map(thread => ({
        id: thread.id,
        externalId: thread.externalId,
        subject: thread.subject,
        status: thread.status,
        assigneeId: thread.assigneeId,
        assignee: thread.assignee,
        channel: thread.channel,
        lastMessageAt: thread.lastMessageAt,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        lastMessage: thread.messages[0] || null,
        messageCount: thread._count.messages,
      })),
      totalThreads: threads.length,
      openThreads: threads.filter(t => t.status === "OPEN").length,
      pendingThreads: threads.filter(t => t.status === "PENDING").length,
      closedThreads: threads.filter(t => t.status === "CLOSED").length,
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("[Get Contact Threads] Error:", error)
    return { error: "Error al obtener threads del contacto" }
  }
}

// Búsqueda avanzada de contactos
export async function searchContacts(query: {
  tenantId: string
  search?: string
  platform?: string
  hasThreads?: boolean
  threadStatus?: "OPEN" | "PENDING" | "CLOSED"
  assignedTo?: string
  hasEmail?: boolean
  hasPhone?: boolean
  createdAfter?: Date
  createdBefore?: Date
  lastActivityAfter?: Date
  lastActivityBefore?: Date
  limit?: number
  offset?: number
  sortBy?: "name" | "handle" | "createdAt" | "lastActivity"
  sortOrder?: "asc" | "desc"
}) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId: query.tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    const {
      search,
      platform,
      hasThreads,
      threadStatus,
      assignedTo,
      hasEmail,
      hasPhone,
      createdAfter,
      createdBefore,
      lastActivityAfter,
      lastActivityBefore,
      limit = 50,
      offset = 0,
      sortBy = "lastActivity",
      sortOrder = "desc"
    } = query

    // Construir filtros base
    const where: any = { tenantId: query.tenantId }

    // Búsqueda de texto
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { handle: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filtro por plataforma
    if (platform) {
      where.platform = platform
    }

    // Filtro por email
    if (hasEmail !== undefined) {
      if (hasEmail) {
        where.email = { not: null }
      } else {
        where.email = null
      }
    }

    // Filtro por teléfono
    if (hasPhone !== undefined) {
      if (hasPhone) {
        where.phone = { not: null }
      } else {
        where.phone = null
      }
    }

    // Filtros de fecha
    if (createdAfter || createdBefore) {
      where.createdAt = {}
      if (createdAfter) where.createdAt.gte = createdAfter
      if (createdBefore) where.createdAt.lte = createdBefore
    }

    // Filtros relacionados con threads
    if (hasThreads !== undefined || threadStatus || assignedTo || lastActivityAfter || lastActivityBefore) {
      where.threads = {}
      
      if (hasThreads !== undefined) {
        if (hasThreads) {
          where.threads.some = {}
        } else {
          where.threads.none = {}
        }
      }

      if (threadStatus) {
        if (hasThreads === false) {
          // Si no queremos threads, no aplicamos filtro de status
        } else {
          where.threads.some = { ...where.threads.some, status: threadStatus }
        }
      }

      if (assignedTo) {
        if (hasThreads === false) {
          // Si no queremos threads, no aplicamos filtro de asignado
        } else {
          where.threads.some = { ...where.threads.some, assigneeId: assignedTo }
        }
      }

      if (lastActivityAfter || lastActivityBefore) {
        if (hasThreads === false) {
          // Si no queremos threads, no aplicamos filtro de actividad
        } else {
          where.threads.some = { 
            ...where.threads.some, 
            lastMessageAt: {
              ...(lastActivityAfter && { gte: lastActivityAfter }),
              ...(lastActivityBefore && { lte: lastActivityBefore })
            }
          }
        }
      }
    }

    // Construir ordenamiento
    let orderBy: any = {}
    switch (sortBy) {
      case "name":
        orderBy = { name: sortOrder }
        break
      case "handle":
        orderBy = { handle: sortOrder }
        break
      case "createdAt":
        orderBy = { createdAt: sortOrder }
        break
      case "lastActivity":
        orderBy = { 
          threads: {
            _count: "desc"
          }
        }
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    // Ejecutar búsqueda
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          threads: {
            select: {
              id: true,
              status: true,
              lastMessageAt: true,
              assigneeId: true,
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              channel: {
                select: {
                  id: true,
                  displayName: true,
                  type: true,
                },
              },
            },
            orderBy: {
              lastMessageAt: "desc",
            },
          },
          _count: {
            select: {
              threads: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where }),
    ])

    // Procesar resultados
    const processedContacts = contacts.map(contact => {
      const openThreads = contact.threads.filter(t => t.status === "OPEN").length
      const pendingThreads = contact.threads.filter(t => t.status === "PENDING").length
      const closedThreads = contact.threads.filter(t => t.status === "CLOSED").length
      
      const lastActivity = contact.threads.length > 0 
        ? contact.threads[0].lastMessageAt 
        : contact.createdAt

      return {
        id: contact.id,
        name: contact.name,
        handle: contact.handle,
        platform: contact.platform,
        phone: contact.phone,
        email: contact.email,
        notes: contact.notes,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
        lastActivity,
        threads: contact.threads,
        stats: {
          totalThreads: contact._count.threads,
          openThreads,
          pendingThreads,
          closedThreads,
        },
      }
    })

    // Estadísticas de la búsqueda
    const stats = {
      total: total,
      returned: processedContacts.length,
      hasMore: offset + processedContacts.length < total,
      platforms: await prisma.contact.groupBy({
        by: ["platform"],
        where: { tenantId: query.tenantId },
        _count: { platform: true },
      }),
    }

    return { 
      success: true, 
      data: {
        contacts: processedContacts,
        stats,
        pagination: {
          limit,
          offset,
          total,
          hasMore: stats.hasMore,
        },
      }
    }
  } catch (error) {
    console.error("[Search Contacts] Error:", error)
    return { error: "Error al buscar contactos" }
  }
}

// Eliminar contacto
export async function deleteContact(contactId: string, tenantId: string) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden eliminar contactos
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para eliminar contactos" }
    }

    // Verificar que el contacto existe y pertenece al tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
      },
    })

    if (!contact) {
      return { error: "Contacto no encontrado" }
    }

    // Si tiene conversaciones, no permitir eliminar
    if (contact._count.threads > 0) {
      return { error: "No se puede eliminar un contacto que tiene conversaciones" }
    }

    await prisma.contact.delete({
      where: { id: contactId },
    })

    revalidatePath(`/app/${tenantId}/contacts`)
    
    return { success: true }
  } catch (error) {
    console.error("[Delete Contact] Error:", error)
    return { error: "Error al eliminar el contacto" }
  }
}

// Obtener estadísticas de contactos
export async function getContactStats(tenantId: string) {
  try {
    const user = await requireAuth()
    
    // Verificar acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    const [totalContacts, contactsByPlatform, contactsWithThreads] = await Promise.all([
      prisma.contact.count({
        where: { tenantId },
      }),
      prisma.contact.groupBy({
        by: ["platform"],
        where: { tenantId },
        _count: true,
      }),
      prisma.contact.count({
        where: {
          tenantId,
          threads: {
            some: {},
          },
        },
      }),
    ])

    return {
      success: true,
      data: {
        totalContacts,
        contactsByPlatform: contactsByPlatform.map(item => ({
          platform: item.platform,
          count: item._count,
        })),
        contactsWithThreads,
        contactsWithoutThreads: totalContacts - contactsWithThreads,
      },
    }
  } catch (error) {
    console.error("[Get Contact Stats] Error:", error)
    return { error: "Error al cargar estadísticas" }
  }
}

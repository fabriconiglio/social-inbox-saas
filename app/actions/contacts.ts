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

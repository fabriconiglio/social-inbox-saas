"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function updateThread(formData: FormData) {
  try {
    const user = await requireAuth()
    const threadId = formData.get("threadId") as string
    const assigneeId = formData.get("assigneeId") as string | undefined
    const status = formData.get("status") as string | undefined

    if (!threadId) {
      return { error: "Missing thread ID" }
    }

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return { error: "Thread not found" }
    }

    const membership = await checkTenantAccess(user.id!, thread.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }

    const updateData: any = {}

    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null
    }

    if (status) {
      updateData.status = status
    }

    await prisma.thread.update({
      where: { id: threadId },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: thread.tenantId,
        actorId: user.id,
        action: "thread.updated",
        entity: "Thread",
        entityId: threadId,
        diffJSON: updateData,
      },
    })

    revalidatePath(`/app/${thread.tenantId}/inbox`)
    return { success: true }
  } catch (error) {
    console.error("[Update Thread] Error:", error)
    return { error: "Failed to update thread" }
  }
}

// Schema para crear thread manualmente
const createThreadSchema = z.object({
  tenantId: z.string(),
  contactId: z.string(),
  channelId: z.string(),
  subject: z.string().optional(),
  assigneeId: z.string().optional(),
})

// Crear thread manualmente
export async function createThread(data: z.infer<typeof createThreadSchema>) {
  try {
    const user = await requireAuth()
    
    // Validar datos
    const validated = createThreadSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Datos inválidos" }
    }

    // Verificar acceso al tenant
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Verificar que el contacto existe y pertenece al tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: data.contactId,
        tenantId: data.tenantId,
      },
    })

    if (!contact) {
      return { error: "Contacto no encontrado" }
    }

    // Verificar que el canal existe y pertenece al tenant
    const channel = await prisma.channel.findFirst({
      where: {
        id: data.channelId,
        local: {
          tenantId: data.tenantId,
        },
      },
      include: {
        local: true,
      },
    })

    if (!channel) {
      return { error: "Canal no encontrado" }
    }

    // Verificar que el asignado pertenece al tenant (si se especifica)
    if (data.assigneeId) {
      const assigneeMembership = await prisma.membership.findFirst({
        where: {
          userId: data.assigneeId,
          tenantId: data.tenantId,
        },
      })

      if (!assigneeMembership) {
        return { error: "El usuario asignado no pertenece a este tenant" }
      }
    }

    // Generar externalId único para el thread manual
    const externalId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Crear el thread
    const thread = await prisma.thread.create({
      data: {
        tenantId: data.tenantId,
        localId: channel.localId,
        channelId: data.channelId,
        externalId,
        subject: data.subject,
        assigneeId: data.assigneeId,
        status: "OPEN",
        contactId: data.contactId,
        lastMessageAt: new Date(),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            handle: true,
            platform: true,
          },
        },
        channel: {
          select: {
            id: true,
            displayName: true,
            type: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        actorId: user.id,
        action: "thread.created",
        entity: "Thread",
        entityId: thread.id,
        diffJSON: {
          contactId: data.contactId,
          channelId: data.channelId,
          assigneeId: data.assigneeId,
          subject: data.subject,
        },
      },
    })

    // Crear notificación si se asigna a otro usuario
    if (data.assigneeId && data.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          type: "thread_assigned",
          payloadJSON: {
            threadId: thread.id,
            threadContact: contact.name || contact.handle,
            threadChannel: channel.displayName,
            assignedBy: user.name || user.email,
            assignedById: user.id,
          },
        },
      })
    }

    // Revalidar cache
    revalidatePath(`/app/${data.tenantId}/inbox`)
    revalidatePath(`/app/${data.tenantId}/contacts`)

    return { success: true, data: thread }
  } catch (error) {
    console.error("[createThread] Error:", error)
    return { error: "Error al crear conversación" }
  }
}

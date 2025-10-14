"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

// Schema de validación para crear/editar respuesta rápida
const cannedResponseSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "El título es muy largo"),
  content: z.string().min(1, "El contenido es requerido").max(5000, "El contenido es muy largo"),
  variablesJSON: z.record(z.string()).optional(),
})

// Listar todas las respuestas rápidas del tenant
export async function listCannedResponses(tenantId: string) {
  try {
    const user = await requireAuth()
    
    // Verificar que el usuario tiene acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    const responses = await prisma.cannedResponse.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        variablesJSON: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: responses }
  } catch (error) {
    console.error("[listCannedResponses] Error:", error)
    return { error: "Error al obtener respuestas rápidas" }
  }
}

// Crear nueva respuesta rápida
export async function createCannedResponse(
  tenantId: string,
  data: {
    title: string
    content: string
    variablesJSON?: Record<string, string>
  }
) {
  try {
    const user = await requireAuth()
    
    // Verificar que el usuario tiene acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden crear respuestas rápidas
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para crear respuestas rápidas" }
    }

    // Validar datos
    const validated = cannedResponseSchema.safeParse(data)
    if (!validated.success) {
      return { error: validated.error.errors[0].message }
    }

    // Crear respuesta rápida
    const response = await prisma.cannedResponse.create({
      data: {
        tenantId,
        title: validated.data.title,
        content: validated.data.content,
        variablesJSON: validated.data.variablesJSON || {},
      },
    })

    // Revalidar cache
    revalidatePath(`/app/${tenantId}/settings/quick-replies`)

    return { success: true, data: response }
  } catch (error) {
    console.error("[createCannedResponse] Error:", error)
    return { error: "Error al crear respuesta rápida" }
  }
}

// Actualizar respuesta rápida
export async function updateCannedResponse(
  tenantId: string,
  responseId: string,
  data: {
    title: string
    content: string
    variablesJSON?: Record<string, string>
  }
) {
  try {
    const user = await requireAuth()
    
    // Verificar que el usuario tiene acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden editar respuestas rápidas
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para editar respuestas rápidas" }
    }

    // Verificar que la respuesta existe y pertenece al tenant
    const existing = await prisma.cannedResponse.findFirst({
      where: {
        id: responseId,
        tenantId,
      },
    })

    if (!existing) {
      return { error: "Respuesta rápida no encontrada" }
    }

    // Validar datos
    const validated = cannedResponseSchema.safeParse(data)
    if (!validated.success) {
      return { error: validated.error.errors[0].message }
    }

    // Actualizar respuesta rápida
    const response = await prisma.cannedResponse.update({
      where: {
        id: responseId,
      },
      data: {
        title: validated.data.title,
        content: validated.data.content,
        variablesJSON: validated.data.variablesJSON || {},
      },
    })

    // Revalidar cache
    revalidatePath(`/app/${tenantId}/settings/quick-replies`)

    return { success: true, data: response }
  } catch (error) {
    console.error("[updateCannedResponse] Error:", error)
    return { error: "Error al actualizar respuesta rápida" }
  }
}

// Eliminar respuesta rápida
export async function deleteCannedResponse(tenantId: string, responseId: string) {
  try {
    const user = await requireAuth()
    
    // Verificar que el usuario tiene acceso al tenant
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id!,
        tenantId,
      },
    })

    if (!membership) {
      return { error: "No tienes acceso a este tenant" }
    }

    // Solo ADMIN y OWNER pueden eliminar respuestas rápidas
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      return { error: "No tienes permisos para eliminar respuestas rápidas" }
    }

    // Verificar que la respuesta existe y pertenece al tenant
    const existing = await prisma.cannedResponse.findFirst({
      where: {
        id: responseId,
        tenantId,
      },
    })

    if (!existing) {
      return { error: "Respuesta rápida no encontrada" }
    }

    // Eliminar respuesta rápida
    await prisma.cannedResponse.delete({
      where: {
        id: responseId,
      },
    })

    // Revalidar cache
    revalidatePath(`/app/${tenantId}/settings/quick-replies`)

    return { success: true }
  } catch (error) {
    console.error("[deleteCannedResponse] Error:", error)
    return { error: "Error al eliminar respuesta rápida" }
  }
}


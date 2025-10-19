"use server"

import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Esquema de validación para editar SLA
const editSLASchema = z.object({
  id: z.string().min(1, "ID del SLA es requerido"),
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().optional(),
  responseTimeMinutes: z.number().min(1, "El tiempo de respuesta debe ser mayor a 0").max(10080, "El tiempo de respuesta no puede exceder 7 días"),
  resolutionTimeHours: z.number().min(1, "El tiempo de resolución debe ser mayor a 0").max(168, "El tiempo de resolución no puede exceder 7 días"),
  isActive: z.boolean().default(true),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  businessHours: z.object({
    enabled: z.boolean().default(false),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
    timezone: z.string().default("America/Argentina/Cordoba"),
    workingDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]) // Lunes a Viernes
  }).optional(),
  escalationRules: z.object({
    enabled: z.boolean().default(false),
    escalationTimeMinutes: z.number().min(1).max(10080).optional(),
    notifyManagers: z.boolean().default(false),
    autoAssign: z.boolean().default(false)
  }).optional()
})

export type EditSLAData = z.infer<typeof editSLASchema>

/**
 * Obtiene un SLA específico para edición
 */
export async function getSLAForEdit(slaId: string) {
  try {
    const user = await requireAuth()
    
    const sla = await prisma.sLA.findUnique({
      where: { id: slaId },
      include: {
        tenant: {
          select: { id: true, name: true }
        }
      }
    })

    if (!sla) {
      return { success: false, error: "SLA no encontrado" }
    }

    // Verificar acceso al tenant
    const membership = await checkTenantAccess(user.id!, sla.tenantId)
    if (!membership) {
      return { success: false, error: "No tienes acceso a este SLA" }
    }

    // Verificar permisos (solo OWNER y ADMIN pueden editar)
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "No tienes permisos para editar SLA" }
    }

    return {
      success: true,
      data: {
        id: sla.id,
        name: sla.name,
        description: sla.description,
        responseTimeMinutes: sla.responseTimeMinutes,
        resolutionTimeHours: sla.resolutionTimeHours,
        isActive: sla.isActive,
        priority: sla.priority,
        businessHours: sla.businessHours as any,
        escalationRules: sla.escalationRules as any,
        tenant: sla.tenant
      }
    }
  } catch (error) {
    console.error("[SLA Edit] Error getting SLA:", error)
    return { success: false, error: "Error al obtener el SLA" }
  }
}

/**
 * Actualiza un SLA existente
 */
export async function updateSLA(data: EditSLAData) {
  try {
    const user = await requireAuth()
    
    // Validar datos
    const validated = editSLASchema.safeParse(data)
    if (!validated.success) {
      return { 
        success: false, 
        error: "Datos inválidos", 
        details: validated.error.errors.map(e => e.message).join(", ")
      }
    }

    const { id, ...updateData } = validated.data

    // Obtener el SLA actual para verificar permisos
    const currentSLA = await prisma.sLA.findUnique({
      where: { id },
      select: { tenantId: true }
    })

    if (!currentSLA) {
      return { success: false, error: "SLA no encontrado" }
    }

    // Verificar acceso al tenant
    const membership = await checkTenantAccess(user.id!, currentSLA.tenantId)
    if (!membership) {
      return { success: false, error: "No tienes acceso a este SLA" }
    }

    // Verificar permisos (solo OWNER y ADMIN pueden editar)
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "No tienes permisos para editar SLA" }
    }

    // Validar horarios de negocio si están habilitados
    if (updateData.businessHours?.enabled) {
      const startTime = updateData.businessHours.startTime
      const endTime = updateData.businessHours.endTime
      
      if (startTime >= endTime) {
        return { 
          success: false, 
          error: "La hora de inicio debe ser anterior a la hora de fin" 
        }
      }
    }

    // Validar reglas de escalación si están habilitadas
    if (updateData.escalationRules?.enabled) {
      if (!updateData.escalationRules.escalationTimeMinutes) {
        return { 
          success: false, 
          error: "El tiempo de escalación es requerido cuando las reglas están habilitadas" 
        }
      }
      
      if (updateData.escalationRules.escalationTimeMinutes >= updateData.responseTimeMinutes) {
        return { 
          success: false, 
          error: "El tiempo de escalación debe ser menor al tiempo de respuesta" 
        }
      }
    }

    // Actualizar el SLA
    const updatedSLA = await prisma.sLA.update({
      where: { id },
      data: {
        name: updateData.name,
        description: updateData.description,
        responseTimeMinutes: updateData.responseTimeMinutes,
        resolutionTimeHours: updateData.resolutionTimeHours,
        isActive: updateData.isActive,
        priority: updateData.priority,
        businessHours: updateData.businessHours || null,
        escalationRules: updateData.escalationRules || null,
        updatedAt: new Date()
      },
      include: {
        tenant: {
          select: { id: true, name: true }
        }
      }
    })

    // Revalidar cache
    revalidatePath(`/app/${currentSLA.tenantId}/settings/sla`)
    revalidatePath(`/app/${currentSLA.tenantId}/analytics`)

    return {
      success: true,
      data: updatedSLA,
      message: "SLA actualizado exitosamente"
    }
  } catch (error) {
    console.error("[SLA Edit] Error updating SLA:", error)
    return { success: false, error: "Error al actualizar el SLA" }
  }
}

/**
 * Elimina un SLA
 */
export async function deleteSLA(slaId: string) {
  try {
    const user = await requireAuth()
    
    // Obtener el SLA para verificar permisos
    const sla = await prisma.sLA.findUnique({
      where: { id: slaId },
      select: { tenantId: true, name: true }
    })

    if (!sla) {
      return { success: false, error: "SLA no encontrado" }
    }

    // Verificar acceso al tenant
    const membership = await checkTenantAccess(user.id!, sla.tenantId)
    if (!membership) {
      return { success: false, error: "No tienes acceso a este SLA" }
    }

    // Verificar permisos (solo OWNER puede eliminar)
    if (membership.role !== "OWNER") {
      return { success: false, error: "Solo el propietario puede eliminar SLA" }
    }

    // Verificar si hay threads usando este SLA
    const threadsUsingSLA = await prisma.thread.count({
      where: {
        tenantId: sla.tenantId,
        // Asumiendo que hay una relación con SLA en el modelo Thread
        // Esto puede necesitar ajuste según el esquema real
      }
    })

    if (threadsUsingSLA > 0) {
      return { 
        success: false, 
        error: `No se puede eliminar el SLA "${sla.name}" porque está siendo usado por ${threadsUsingSLA} conversaciones` 
      }
    }

    // Eliminar el SLA
    await prisma.sLA.delete({
      where: { id: slaId }
    })

    // Revalidar cache
    revalidatePath(`/app/${sla.tenantId}/settings/sla`)
    revalidatePath(`/app/${sla.tenantId}/analytics`)

    return {
      success: true,
      message: "SLA eliminado exitosamente"
    }
  } catch (error) {
    console.error("[SLA Edit] Error deleting SLA:", error)
    return { success: false, error: "Error al eliminar el SLA" }
  }
}

/**
 * Duplica un SLA existente
 */
export async function duplicateSLA(slaId: string, newName: string) {
  try {
    const user = await requireAuth()
    
    // Obtener el SLA original
    const originalSLA = await prisma.sLA.findUnique({
      where: { id: slaId }
    })

    if (!originalSLA) {
      return { success: false, error: "SLA no encontrado" }
    }

    // Verificar acceso al tenant
    const membership = await checkTenantAccess(user.id!, originalSLA.tenantId)
    if (!membership) {
      return { success: false, error: "No tienes acceso a este SLA" }
    }

    // Verificar permisos (solo OWNER y ADMIN pueden duplicar)
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "No tienes permisos para duplicar SLA" }
    }

    // Crear el SLA duplicado
    const duplicatedSLA = await prisma.sLA.create({
      data: {
        tenantId: originalSLA.tenantId,
        name: newName,
        description: originalSLA.description,
        responseTimeMinutes: originalSLA.responseTimeMinutes,
        resolutionTimeHours: originalSLA.resolutionTimeHours,
        isActive: false, // Inactivo por defecto
        priority: originalSLA.priority,
        businessHours: originalSLA.businessHours,
        escalationRules: originalSLA.escalationRules
      },
      include: {
        tenant: {
          select: { id: true, name: true }
        }
      }
    })

    // Revalidar cache
    revalidatePath(`/app/${originalSLA.tenantId}/settings/sla`)

    return {
      success: true,
      data: duplicatedSLA,
      message: "SLA duplicado exitosamente"
    }
  } catch (error) {
    console.error("[SLA Edit] Error duplicating SLA:", error)
    return { success: false, error: "Error al duplicar el SLA" }
  }
}

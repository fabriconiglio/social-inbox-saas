"use server"

import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createMetaAPIService, MetaCredentialsManager } from "@/lib/meta-api"

// Schemas de validación
const SaveCredentialsSchema = z.object({
  tenantId: z.string().min(1),
  accessToken: z.string().min(1, "El access token es requerido"),
  phoneNumberId: z.string().min(1, "El ID del número de teléfono es requerido"),
  businessAccountId: z.string().optional()
})

const TestCredentialsSchema = z.object({
  accessToken: z.string().min(1),
  phoneNumberId: z.string().min(1),
  businessAccountId: z.string().optional()
})

// Server Actions
export async function saveMetaCredentials(data: z.infer<typeof SaveCredentialsSchema>) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    const validated = SaveCredentialsSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data", details: validated.error.errors }
    }
    
    // TODO: Implementar guardado real de credenciales encriptadas
    // Por ahora simulamos el guardado
    console.log("[Save Meta Credentials] Saving credentials for tenant:", data.tenantId)
    
    // Simular validación de credenciales
    const testResult = await testMetaCredentials({
      accessToken: data.accessToken,
      phoneNumberId: data.phoneNumberId,
      businessAccountId: data.businessAccountId
    })
    
    if (!testResult.success) {
      return { error: "Las credenciales no son válidas. Verifica los datos e intenta nuevamente." }
    }
    
    revalidatePath(`/app/${data.tenantId}/settings/templates`)
    
    return { success: true, message: "Credenciales guardadas exitosamente" }
    
  } catch (error) {
    console.error("[Save Meta Credentials] Error:", error)
    return { error: "Failed to save credentials" }
  }
}

export async function testMetaCredentials(data: z.infer<typeof TestCredentialsSchema>) {
  try {
    const validated = TestCredentialsSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data", details: validated.error.errors }
    }
    
    // Crear servicio de Meta API
    const metaService = createMetaAPIService({
      accessToken: data.accessToken,
      phoneNumberId: data.phoneNumberId,
      businessAccountId: data.businessAccountId
    })
    
    // Probar conexión
    const isConnected = await metaService.testConnection()
    
    if (!isConnected) {
      return { error: "No se pudo conectar con Meta API. Verifica las credenciales." }
    }
    
    // Obtener información del número de teléfono
    const phoneInfo = await metaService.getPhoneNumberInfo()
    
    return { 
      success: true, 
      data: {
        connected: true,
        phoneNumberInfo: phoneInfo
      }
    }
    
  } catch (error) {
    console.error("[Test Meta Credentials] Error:", error)
    return { error: "Failed to test credentials" }
  }
}

export async function getMetaCredentials(tenantId: string) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    // TODO: Implementar obtención real de credenciales
    // Por ahora retornamos null para indicar que no hay credenciales configuradas
    return { 
      success: true, 
      data: {
        hasCredentials: false,
        credentials: null
      }
    }
    
  } catch (error) {
    console.error("[Get Meta Credentials] Error:", error)
    return { error: "Failed to fetch credentials" }
  }
}

export async function deleteMetaCredentials(tenantId: string) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    // TODO: Implementar eliminación real de credenciales
    console.log("[Delete Meta Credentials] Deleting credentials for tenant:", tenantId)
    
    revalidatePath(`/app/${tenantId}/settings/templates`)
    
    return { success: true, message: "Credenciales eliminadas exitosamente" }
    
  } catch (error) {
    console.error("[Delete Meta Credentials] Error:", error)
    return { error: "Failed to delete credentials" }
  }
}

export async function getSyncStatus(tenantId: string, channelType: string) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    // Obtener estadísticas de plantillas
    const stats = await prisma.template.groupBy({
      by: ['approvedTag'],
      where: { 
        tenantId,
        channelType 
      },
      _count: { id: true }
    })
    
    const totalTemplates = await prisma.template.count({
      where: { 
        tenantId,
        channelType 
      }
    })
    
    const lastSync = await prisma.template.findFirst({
      where: { 
        tenantId,
        channelType 
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })
    
    const approvedCount = stats.find(s => s.approvedTag === "APPROVED")?._count.id || 0
    const pendingCount = stats.find(s => s.approvedTag === "PENDING")?._count.id || 0
    const rejectedCount = stats.find(s => s.approvedTag === "REJECTED")?._count.id || 0
    
    return {
      success: true,
      data: {
        lastSync: lastSync?.updatedAt,
        totalTemplates,
        approvedTemplates: approvedCount,
        pendingTemplates: pendingCount,
        rejectedTemplates: rejectedCount,
        needsSync: totalTemplates === 0 // Necesita sincronización si no hay plantillas
      }
    }
    
  } catch (error) {
    console.error("[Get Sync Status] Error:", error)
    return { error: "Failed to fetch sync status" }
  }
}









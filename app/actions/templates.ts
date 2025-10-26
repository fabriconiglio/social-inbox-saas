"use server"

import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { createMetaAPIService, MetaCredentialsManager } from "@/lib/meta-api"
import { createAuditLogger, AUDIT_ACTIONS, AuditDiff } from "@/lib/audit-log-utils"

// Schemas de validación
const CreateTemplateSchema = z.object({
  tenantId: z.string().min(1),
  channelType: z.enum(["whatsapp", "instagram", "facebook", "tiktok", "twitter", "telegram"]),
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  contentJSON: z.record(z.any()),
  approvedTag: z.string().optional()
})

const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  id: z.string().min(1)
})

const DeleteTemplateSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1)
})

const SyncTemplatesSchema = z.object({
  tenantId: z.string().min(1),
  channelType: z.enum(["whatsapp", "instagram", "facebook", "tiktok", "twitter", "telegram"])
})

// Server Actions
export async function createTemplate(data: z.infer<typeof CreateTemplateSchema>) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    const validated = CreateTemplateSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data", details: validated.error.errors }
    }
    
    const template = await prisma.template.create({
      data: validated.data,
      include: {
        tenant: {
          select: { name: true }
        }
      }
    })
    
    // Registrar en audit log
    const auditLogger = createAuditLogger(data.tenantId)
    await auditLogger.logTemplateAction(
      template.id,
      AUDIT_ACTIONS.TEMPLATE.CREATED,
      {
        name: template.name,
        channelType: template.channelType,
        approvedTag: template.approvedTag,
        hasContent: !!template.contentJSON
      }
    )
    
    revalidatePath(`/app/${data.tenantId}/settings/templates`)
    
    return { success: true, data: template }
    
  } catch (error) {
    console.error("[Create Template] Error:", error)
    return { error: "Failed to create template" }
  }
}

export async function updateTemplate(data: z.infer<typeof UpdateTemplateSchema>) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, data.tenantId!)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    const validated = UpdateTemplateSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data", details: validated.error.errors }
    }
    
    // Verificar que la plantilla existe y pertenece al tenant
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: data.id,
        tenantId: data.tenantId
      }
    })
    
    if (!existingTemplate) {
      return { error: "Template not found" }
    }
    
    const { id, ...updateData } = validated.data
    
    // Crear diff antes de la actualización
    const diff = AuditDiff.createFieldDiff(existingTemplate, { ...existingTemplate, ...updateData }, Object.keys(updateData))
    
    const template = await prisma.template.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: { name: true }
        }
      }
    })
    
    // Registrar en audit log
    const auditLogger = createAuditLogger(data.tenantId!)
    await auditLogger.logTemplateAction(
      template.id,
      AUDIT_ACTIONS.TEMPLATE.UPDATED,
      diff
    )
    
    revalidatePath(`/app/${data.tenantId}/settings/templates`)
    
    return { success: true, data: template }
    
  } catch (error) {
    console.error("[Update Template] Error:", error)
    return { error: "Failed to update template" }
  }
}

export async function deleteTemplate(data: z.infer<typeof DeleteTemplateSchema>) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    const validated = DeleteTemplateSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data", details: validated.error.errors }
    }
    
    // Verificar que la plantilla existe y pertenece al tenant
    const existingTemplate = await prisma.template.findFirst({
      where: {
        id: data.id,
        tenantId: data.tenantId
      }
    })
    
    if (!existingTemplate) {
      return { error: "Template not found" }
    }
    
    await prisma.template.delete({
      where: { id: data.id }
    })
    
    revalidatePath(`/app/${data.tenantId}/settings/templates`)
    
    return { success: true }
    
  } catch (error) {
    console.error("[Delete Template] Error:", error)
    return { error: "Failed to delete template" }
  }
}

export async function getTemplates(tenantId: string, channelType?: string) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    const whereClause: any = { tenantId }
    if (channelType) {
      whereClause.channelType = channelType
    }
    
    const templates = await prisma.template.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return { success: true, data: templates }
    
  } catch (error) {
    console.error("[Get Templates] Error:", error)
    return { error: "Failed to fetch templates" }
  }
}

export async function getTemplate(id: string, tenantId: string) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    const template = await prisma.template.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        tenant: {
          select: { name: true }
        }
      }
    })
    
    if (!template) {
      return { error: "Template not found" }
    }
    
    return { success: true, data: template }
    
  } catch (error) {
    console.error("[Get Template] Error:", error)
    return { error: "Failed to fetch template" }
  }
}

export async function syncTemplatesFromMeta(data: z.infer<typeof SyncTemplatesSchema>) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, data.tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { error: "Insufficient permissions" }
    }
    
    const validated = SyncTemplatesSchema.safeParse(data)
    if (!validated.success) {
      return { error: "Invalid data", details: validated.error.errors }
    }
    
    // Obtener credenciales de Meta para el tenant
    const credentials = await MetaCredentialsManager.getCredentialsForTenant(data.tenantId)
    
    if (!credentials) {
      return { 
        error: "No hay credenciales de Meta configuradas para este tenant. Contacta al administrador." 
      }
    }
    
    // Validar credenciales
    const isValid = await MetaCredentialsManager.validateCredentials(credentials)
    if (!isValid) {
      return { 
        error: "Las credenciales de Meta no son válidas. Verifica la configuración." 
      }
    }
    
    // Crear servicio de Meta API
    const metaService = createMetaAPIService(credentials)
    
    // Sincronizar plantillas aprobadas
    const syncResult = await metaService.syncApprovedTemplates(data.channelType)
    
    // Crear plantillas en la base de datos
    const createdTemplates = []
    
    for (const templateData of syncResult.templates) {
      // Verificar si la plantilla ya existe
      const existingTemplate = await prisma.template.findFirst({
        where: {
          tenantId: data.tenantId,
          channelType: data.channelType,
          name: templateData.name
        }
      })
      
      if (existingTemplate) {
        // Actualizar plantilla existente
        const updatedTemplate = await prisma.template.update({
          where: { id: existingTemplate.id },
          data: {
            contentJSON: templateData.contentJSON,
            approvedTag: templateData.approvedTag,
            updatedAt: new Date()
          }
        })
        createdTemplates.push(updatedTemplate)
      } else {
        // Crear nueva plantilla
        const newTemplate = await prisma.template.create({
          data: {
            tenantId: data.tenantId,
            channelType: data.channelType,
            name: templateData.name,
            contentJSON: templateData.contentJSON,
            approvedTag: templateData.approvedTag
          }
        })
        createdTemplates.push(newTemplate)
      }
    }
    
    revalidatePath(`/app/${data.tenantId}/settings/templates`)
    
    return { 
      success: true, 
      data: { 
        synced: createdTemplates.length,
        templates: createdTemplates
      }
    }
    
  } catch (error) {
    console.error("[Sync Templates] Error:", error)
    return { error: "Failed to sync templates" }
  }
}

export async function getTemplateStats(tenantId: string) {
  try {
    const user = await requireAuth()
    
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return { error: "Unauthorized" }
    }
    
    const stats = await prisma.template.groupBy({
      by: ['channelType'],
      where: { tenantId },
      _count: { id: true }
    })
    
    const totalTemplates = await prisma.template.count({
      where: { tenantId }
    })
    
    const approvedTemplates = await prisma.template.count({
      where: { 
        tenantId,
        approvedTag: "APPROVED"
      }
    })
    
    return { 
      success: true, 
      data: {
        total: totalTemplates,
        approved: approvedTemplates,
        pending: totalTemplates - approvedTemplates,
        byChannel: stats.reduce((acc, stat) => {
          acc[stat.channelType] = stat._count.id
          return acc
        }, {} as Record<string, number>)
      }
    }
    
  } catch (error) {
    console.error("[Get Template Stats] Error:", error)
    return { error: "Failed to fetch template stats" }
  }
}

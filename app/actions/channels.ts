"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { getAdapter } from "@/lib/adapters"
import { ChannelCredentialsService } from "@/lib/channel-credentials"
import { ChannelCredentials } from "@/lib/types/channel-credentials"
import { createAuditLogger, AUDIT_ACTIONS, AuditDiff } from "@/lib/audit-log-utils"

export async function getChannels(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)

    if (!membership) {
      return { error: "Unauthorized" }
    }

    const channels = await prisma.channel.findMany({
      where: {
        local: {
          tenantId,
        },
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        status: true,
        meta: true,
        createdAt: true,
        local: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { channels }
  } catch (error) {
    console.error("[Get Channels] Error:", error)
    return { error: "Failed to fetch channels" }
  }
}

export async function toggleChannelStatus(channelId: string, tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        local: true,
      },
    })

    if (!channel || channel.local.tenantId !== tenantId) {
      return { error: "Channel not found" }
    }

    const newStatus = channel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"

    await prisma.channel.update({
      where: { id: channelId },
      data: { status: newStatus },
    })

    revalidatePath(`/app/${tenantId}/channels`)
    return { success: true, status: newStatus }
  } catch (error) {
    console.error("[Toggle Channel] Error:", error)
    return { error: "Failed to toggle channel status" }
  }
}

export async function deleteChannel(channelId: string, tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        local: true,
      },
    })

    if (!channel || channel.local.tenantId !== tenantId) {
      return { error: "Channel not found" }
    }

    await prisma.channel.delete({
      where: { id: channelId },
    })

    revalidatePath(`/app/${tenantId}/channels`)
    return { success: true }
  } catch (error) {
    console.error("[Delete Channel] Error:", error)
    return { error: "Failed to delete channel" }
  }
}

export async function connectChannel(data: {
  tenantId: string
  localId: string
  type: string
  displayName: string
  config: Record<string, any>
}) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // Verificar que el local pertenece al tenant
    const local = await prisma.local.findUnique({
      where: { id: data.localId },
    })

    if (!local || local.tenantId !== data.tenantId) {
      return { error: "Local not found" }
    }

    // Validar tipo de canal
    const validTypes = ["INSTAGRAM", "FACEBOOK", "WHATSAPP", "TIKTOK", "MOCK"]
    if (!validTypes.includes(data.type)) {
      return { error: "Invalid channel type" }
    }

    // Crear el canal primero
    const channel = await prisma.channel.create({
      data: {
        localId: data.localId,
        type: data.type as any,
        displayName: data.displayName,
        status: "ACTIVE",
        meta: data.type === "MOCK" ? {} : data.config, // Para MOCK no guardar config
      },
    })

    // Si no es MOCK, encriptar y guardar credenciales
    if (data.type !== "MOCK" && Object.keys(data.config).length > 0) {
      try {
        const { createChannelCredentials } = await import("@/lib/types/channel-credentials")
        const { saveEncryptedChannelCredentials } = await import("@/lib/encrypted-credentials")
        
        // Crear credenciales estructuradas
        const credentials = createChannelCredentials(data.type as any, data.config)
        
        // Guardar credenciales encriptadas
        const saveResult = await saveEncryptedChannelCredentials({
          channelId: channel.id,
          tenantId: data.tenantId,
          credentials,
          fieldsToEncrypt: ['pageAccessToken', 'accessToken', 'refreshToken', 'mockToken']
        })

        if (!saveResult.success) {
          console.warn(`[Connect Channel] Error guardando credenciales encriptadas: ${saveResult.error}`)
          // No fallar la conexión por esto, solo loggear el warning
        }
      } catch (error) {
        console.warn("[Connect Channel] Error procesando credenciales:", error)
        // No fallar la conexión por esto
      }
    }

    // Registrar en audit log
    const auditLogger = createAuditLogger(data.tenantId)
    await auditLogger.logChannelAction(
      channel.id,
      AUDIT_ACTIONS.CHANNEL.CREATED,
      {
        channelType: data.type,
        localId: data.localId,
        displayName: data.displayName,
        status: "ACTIVE",
        hasCredentials: data.type !== "MOCK" && Object.keys(data.config).length > 0
      }
    )

    revalidatePath(`/app/${data.tenantId}/channels`)
    return { success: true, channelId: channel.id }
  } catch (error) {
    console.error("[Connect Channel] Error:", error)
    return { error: "Failed to connect channel" }
  }
}

export async function getLocals(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)

    if (!membership) {
      return { error: "Unauthorized" }
    }

    const locals = await prisma.local.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return { locals }
  } catch (error) {
    console.error("[Get Locals] Error:", error)
    return { error: "Failed to fetch locals" }
  }
}

export async function updateChannel(data: {
  channelId: string
  tenantId: string
  displayName: string
  config: Record<string, any>
}) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // Verificar que el canal pertenece al tenant
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
      include: {
        local: true,
      },
    })

    if (!channel || channel.local.tenantId !== data.tenantId) {
      return { error: "Channel not found" }
    }

    // Actualizar el canal
    await prisma.channel.update({
      where: { id: data.channelId },
      data: {
        displayName: data.displayName,
        meta: data.config,
      },
    })

    revalidatePath(`/app/${data.tenantId}/channels`)
    return { success: true }
  } catch (error) {
    console.error("[Update Channel] Error:", error)
    return { error: "Failed to update channel" }
  }
}

// Validar credenciales de un canal en tiempo real (versión mejorada)
export async function validateChannelCredentials(data: {
  tenantId: string
  type: string
  config: Record<string, any>
  enhanced?: boolean // Para usar validación mejorada
}) {
  try {
    // Si se solicita validación mejorada, usar el nuevo sistema
    if (data.enhanced) {
      const { validateChannelCredentialsEnhanced } = await import("@/lib/credential-validation")
      
      return await validateChannelCredentialsEnhanced(
        {
          tenantId: data.tenantId,
          type: data.type,
          config: data.config
        },
        {
          validatePermissions: true,
          testConnectivity: true,
          autoEncrypt: false,
          autoSave: false
        }
      )
    }

    // Validación básica (comportamiento original)
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // Validar tipo de canal
    const validTypes = ["INSTAGRAM", "FACEBOOK", "WHATSAPP", "TIKTOK", "MOCK"]
    if (!validTypes.includes(data.type)) {
      return { error: "Invalid channel type" }
    }

    // Obtener el adapter correspondiente
    const adapter = getAdapter(data.type as any)
    
    if (!adapter) {
      return { 
        success: false,
        error: "Tipo de canal no soportado" 
      }
    }
    
    // Validar las credenciales usando el adapter
    const result = await adapter.validateCredentials(data.config)

    if (!result.valid) {
      return { 
        success: false, 
        error: result.error || "Credenciales inválidas" 
      }
    }

    return { 
      success: true, 
      valid: true,
      details: result.details 
    }
  } catch (error) {
    console.error("[Validate Credentials] Error:", error)
    return { 
      success: false,
      error: "Error al validar credenciales" 
    }
  }
}

// Guardar credenciales de acceso en channel.meta
export async function saveCredentials(data: {
  channelId: string
  tenantId: string
  credentials: Partial<ChannelCredentials>
}) {
  try {
    const result = await ChannelCredentialsService.saveChannelCredentials(data)
    
    if (result.success) {
      // Registrar en audit log
      const auditLogger = createAuditLogger(data.tenantId)
      await auditLogger.logChannelAction(
        data.channelId,
        AUDIT_ACTIONS.CHANNEL.CREDENTIALS_UPDATED,
        {
          hasCredentials: !!data.credentials,
          credentialFields: Object.keys(data.credentials)
        }
      )
      
      revalidatePath(`/app/${data.tenantId}/channels`)
    }
    
    return result
  } catch (error) {
    console.error("[Save Credentials Action] Error:", error)
    return { error: "Error al guardar credenciales" }
  }
}

// Obtener credenciales de acceso desde channel.meta
export async function getCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    return await ChannelCredentialsService.getChannelCredentials(data.channelId)
  } catch (error) {
    console.error("[Get Credentials Action] Error:", error)
    return { error: "Error al obtener credenciales" }
  }
}

// Validar credenciales almacenadas en channel.meta
export async function validateStoredChannelCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    const result = await ChannelCredentialsService.validateStoredCredentials(data)
    
    if (result.success) {
      // Registrar en audit log
      const auditLogger = createAuditLogger(data.tenantId)
      await auditLogger.logChannelAction(
        data.channelId,
        AUDIT_ACTIONS.CHANNEL.CREDENTIALS_VALIDATED,
        {
          valid: result.valid,
          hasCredentials: result.valid
        }
      )
      
      revalidatePath(`/app/${data.tenantId}/channels`)
    }
    
    return result
  } catch (error) {
    console.error("[Validate Stored Credentials Action] Error:", error)
    return { error: "Error al validar credenciales almacenadas" }
  }
}

// Obtener canales con credenciales expiradas
export async function getChannelsWithExpiredCredentials(tenantId: string) {
  try {
    return await ChannelCredentialsService.getExpiredCredentials(tenantId)
  } catch (error) {
    console.error("[Get Expired Credentials Action] Error:", error)
    return { error: "Error al obtener credenciales expiradas" }
  }
}

// Validar credenciales con sistema mejorado
export async function validateChannelCredentialsEnhanced(data: {
  tenantId: string
  type: string
  config: Record<string, any>
  autoEncrypt?: boolean
  autoSave?: boolean
  channelId?: string
}) {
  try {
    const { validateChannelCredentialsEnhanced } = await import("@/lib/credential-validation")
    
    const result = await validateChannelCredentialsEnhanced(
      {
        tenantId: data.tenantId,
        type: data.type,
        config: data.config,
        channelId: data.channelId
      },
      {
        validatePermissions: true,
        testConnectivity: true,
        autoEncrypt: data.autoEncrypt || false,
        autoSave: data.autoSave || false,
        fieldsToEncrypt: ['pageAccessToken', 'accessToken', 'refreshToken', 'mockToken']
      }
    )

    if (result.success && data.channelId) {
      revalidatePath(`/app/${data.tenantId}/channels`)
    }

    return result
  } catch (error) {
    console.error("[Enhanced Validation] Error:", error)
    return {
      success: false,
      valid: false,
      error: "Error en validación mejorada"
    }
  }
}

// Validar credenciales existentes de un canal
export async function validateExistingChannelCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    const { validateExistingChannelCredentials } = await import("@/lib/credential-validation")
    
    const result = await validateExistingChannelCredentials(data)
    
    if (result.success) {
      revalidatePath(`/app/${data.tenantId}/channels`)
    }
    
    return result
  } catch (error) {
    console.error("[Validate Existing Credentials] Error:", error)
    return {
      success: false,
      valid: false,
      error: "Error validando credenciales existentes"
    }
  }
}


/**
 * Utilidades para manejo de credenciales de canales
 * Funciones para guardar, obtener y validar tokens de acceso en channel.meta
 */

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { 
  ChannelCredentials, 
  ChannelMeta, 
  createChannelCredentials,
  areCredentialsExpired,
  getAccessToken,
  updateCredentialsStatus,
  isMetaCredentials,
  isWhatsAppCredentials,
  isTikTokCredentials,
  isMockCredentials
} from "@/lib/types/channel-credentials"
import { getAdapter } from "@/lib/adapters"
import { z } from "zod"
import { decryptChannelCredentials } from "./encrypted-credentials"

// Schemas de validación para cada tipo de canal
const metaCredentialsSchema = z.object({
  pageAccessToken: z.string().min(1, "Page Access Token es requerido"),
  pageId: z.string().min(1, "Page ID es requerido"),
  appId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
  refreshToken: z.string().optional(),
})

const whatsappCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Access Token es requerido"),
  phoneNumberId: z.string().min(1, "Phone Number ID es requerido"),
  businessAccountId: z.string().min(1, "Business Account ID es requerido"),
  webhookVerifyToken: z.string().optional(),
  expiresAt: z.string().optional(),
})

const tiktokCredentialsSchema = z.object({
  accessToken: z.string().min(1, "Access Token es requerido"),
  refreshToken: z.string().optional(),
  scope: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
})

const mockCredentialsSchema = z.object({
  mockToken: z.string().min(1, "Mock Token es requerido"),
  mockConfig: z.record(z.any()).optional(),
})

/**
 * Guarda credenciales de acceso en channel.meta
 */
export async function saveChannelCredentials(data: {
  channelId: string
  tenantId: string
  credentials: Partial<ChannelCredentials>
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Verificar que el canal existe y pertenece al tenant
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
      include: { local: true }
    })

    if (!channel || channel.local.tenantId !== data.tenantId) {
      return { error: "Canal no encontrado" }
    }

    // 3. Validar credenciales según el tipo de canal
    let validatedCredentials: ChannelCredentials
    let validationError: string | null = null

    try {
      switch (channel.type) {
        case 'INSTAGRAM':
        case 'FACEBOOK':
          const metaValidation = metaCredentialsSchema.safeParse(data.credentials)
          if (!metaValidation.success) {
            validationError = metaValidation.error.errors.map(e => e.message).join(', ')
            break
          }
          validatedCredentials = createChannelCredentials(channel.type, metaValidation.data)
          break

        case 'WHATSAPP':
          const whatsappValidation = whatsappCredentialsSchema.safeParse(data.credentials)
          if (!whatsappValidation.success) {
            validationError = whatsappValidation.error.errors.map(e => e.message).join(', ')
            break
          }
          validatedCredentials = createChannelCredentials(channel.type, whatsappValidation.data)
          break

        case 'TIKTOK':
          const tiktokValidation = tiktokCredentialsSchema.safeParse(data.credentials)
          if (!tiktokValidation.success) {
            validationError = tiktokValidation.error.errors.map(e => e.message).join(', ')
            break
          }
          validatedCredentials = createChannelCredentials(channel.type, tiktokValidation.data)
          break

        case 'MOCK':
          const mockValidation = mockCredentialsSchema.safeParse(data.credentials)
          if (!mockValidation.success) {
            validationError = mockValidation.error.errors.map(e => e.message).join(', ')
            break
          }
          validatedCredentials = createChannelCredentials(channel.type, mockValidation.data)
          break

        default:
          return { error: "Tipo de canal no soportado" }
      }

      if (validationError) {
        return { error: `Credenciales inválidas: ${validationError}` }
      }

    } catch (error) {
      console.error("[Save Credentials] Validation error:", error)
      return { error: "Error al validar credenciales" }
    }

    // 4. Validar credenciales con el adapter correspondiente
    const adapter = getAdapter(channel.type)
    if (adapter && adapter.validateCredentials) {
      const validationResult = await adapter.validateCredentials(validatedCredentials)
      
      if (!validationResult.valid) {
        return { 
          error: validationResult.error || "Credenciales inválidas según el adapter",
          details: validationResult.details
        }
      }

      // Actualizar credenciales con detalles adicionales del adapter
      if (validationResult.details) {
        validatedCredentials = {
          ...validatedCredentials,
          ...validationResult.details
        }
      }
    }

    // 5. Crear el objeto meta completo
    const currentMeta = (channel.meta as ChannelMeta) || { type: channel.type, credentials: {} as ChannelCredentials }
    const updatedMeta: ChannelMeta = {
      ...currentMeta,
      type: channel.type,
      credentials: validatedCredentials,
      config: {
        ...currentMeta.config,
        // Preservar configuración existente
      }
    }

    // 6. Guardar en la base de datos
    await prisma.channel.update({
      where: { id: data.channelId },
      data: {
        meta: updatedMeta,
        status: 'ACTIVE', // Marcar como activo si las credenciales son válidas
        updatedAt: new Date()
      }
    })

    console.log(`[Save Credentials] Credenciales guardadas para canal ${channel.type} (${data.channelId})`)

    return { 
      success: true, 
      credentials: validatedCredentials,
      expiresAt: validatedCredentials.expiresAt
    }

  } catch (error) {
    console.error("[Save Credentials] Error:", error)
    return { error: "Error al guardar credenciales" }
  }
}

/**
 * Obtiene credenciales de acceso desde channel.meta
 */
export async function getChannelCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { error: "Unauthorized" }
    }

    // 2. Obtener el canal con sus credenciales
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
      include: { local: true },
      select: {
        id: true,
        type: true,
        displayName: true,
        status: true,
        meta: true,
        local: {
          select: {
            tenantId: true,
            name: true
          }
        }
      }
    })

    if (!channel || channel.local.tenantId !== data.tenantId) {
      return { error: "Canal no encontrado" }
    }

    // 3. Extraer credenciales del meta
    const meta = channel.meta as ChannelMeta | null
    if (!meta || !meta.credentials) {
      return { error: "No hay credenciales configuradas para este canal" }
    }

    const credentials = meta.credentials

    // 4. Desencriptar credenciales si están encriptadas
    const decryptionResult = await decryptChannelCredentials(credentials)
    
    if (!decryptionResult.success) {
      return { 
        error: decryptionResult.error || "Error desencriptando credenciales" 
      }
    }

    const decryptedCredentials = decryptionResult.credentials!

    // 5. Verificar si las credenciales están expiradas
    const isExpired = areCredentialsExpired(decryptedCredentials)
    if (isExpired && decryptedCredentials.status !== 'expired') {
      // Actualizar estado a expirado
      const updatedCredentials = updateCredentialsStatus(decryptedCredentials, 'expired')
      
      await prisma.channel.update({
        where: { id: data.channelId },
        data: {
          meta: {
            ...meta,
            credentials: updatedCredentials
          },
          status: 'ERROR'
        }
      })

      return { 
        error: "Las credenciales han expirado",
        credentials: updatedCredentials,
        expired: true
      }
    }

    // 6. Obtener el token de acceso
    const accessToken = getAccessToken(decryptedCredentials)
    if (!accessToken) {
      return { error: "No se pudo extraer el token de acceso de las credenciales" }
    }

    return {
      success: true,
      credentials: decryptedCredentials,
      accessToken,
      type: channel.type,
      status: decryptedCredentials.status,
      expiresAt: decryptedCredentials.expiresAt,
      isEncrypted: decryptionResult.credentials !== credentials
    }

  } catch (error) {
    console.error("[Get Credentials] Error:", error)
    return { error: "Error al obtener credenciales" }
  }
}

/**
 * Valida credenciales existentes en channel.meta
 */
export async function validateStoredCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    // 1. Obtener credenciales
    const credentialsResult = await getChannelCredentials(data)
    if (credentialsResult.error) {
      return credentialsResult
    }

    const { credentials, type } = credentialsResult

    // 2. Validar con el adapter correspondiente
    const adapter = getAdapter(type)
    if (!adapter || !adapter.validateCredentials) {
      return { error: "Adapter no disponible para validación" }
    }

    const validationResult = await adapter.validateCredentials(credentials)

    // 3. Actualizar estado según el resultado
    let newStatus: 'active' | 'expired' | 'invalid' = 'active'
    if (!validationResult.valid) {
      newStatus = 'invalid'
    } else if (areCredentialsExpired(credentials)) {
      newStatus = 'expired'
    }

    // 4. Actualizar en BD si el estado cambió
    if (newStatus !== credentials.status) {
      const updatedCredentials = updateCredentialsStatus(credentials, newStatus)
      
      await prisma.channel.update({
        where: { id: data.channelId },
        data: {
          meta: {
            type: type as any,
            credentials: updatedCredentials
          },
          status: newStatus === 'active' ? 'ACTIVE' : 'ERROR'
        }
      })

      credentials.status = newStatus
    }

    return {
      success: true,
      valid: validationResult.valid,
      status: newStatus,
      credentials,
      details: validationResult.details,
      error: validationResult.error
    }

  } catch (error) {
    console.error("[Validate Stored Credentials] Error:", error)
    return { error: "Error al validar credenciales almacenadas" }
  }
}

/**
 * Obtiene todos los canales con credenciales expiradas
 */
export async function getExpiredCredentials(tenantId: string) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // Obtener todos los canales del tenant
    const channels = await prisma.channel.findMany({
      where: {
        local: { tenantId },
        status: { not: 'INACTIVE' },
        meta: { not: null }
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        status: true,
        meta: true,
        local: {
          select: { name: true }
        }
      }
    })

    // Filtrar canales con credenciales expiradas
    const expiredChannels = channels.filter(channel => {
      const meta = channel.meta as ChannelMeta
      if (!meta?.credentials) return false
      
      return areCredentialsExpired(meta.credentials)
    })

    return {
      success: true,
      expiredChannels: expiredChannels.map(channel => ({
        id: channel.id,
        type: channel.type,
        displayName: channel.displayName,
        localName: channel.local.name,
        expiresAt: (channel.meta as ChannelMeta).credentials.expiresAt
      }))
    }

  } catch (error) {
    console.error("[Get Expired Credentials] Error:", error)
    return { error: "Error al obtener credenciales expiradas" }
  }
}

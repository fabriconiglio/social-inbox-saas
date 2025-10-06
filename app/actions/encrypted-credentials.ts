"use server"

/**
 * Server Actions para manejo de credenciales encriptadas
 */

import { revalidatePath } from "next/cache"
import { 
  saveEncryptedChannelCredentials,
  getDecryptedChannelCredentials,
  migrateCredentialsToEncrypted,
  rotateEncryptionKey
} from "@/lib/encrypted-credentials"
import type { ChannelCredentials } from "@/lib/types/channel-credentials"

/**
 * Guarda credenciales encriptadas para un canal
 */
export async function saveCredentials(data: {
  channelId: string
  tenantId: string
  credentials: ChannelCredentials
  fieldsToEncrypt?: string[]
}) {
  try {
    const result = await saveEncryptedChannelCredentials(data)
    
    if (result.error) {
      return { error: result.error }
    }
    
    // Revalidar la página de canales
    revalidatePath(`/app/${data.tenantId}/channels`)
    
    return { 
      success: true, 
      credentials: result.credentials,
      encryptedFields: result.encryptedFields
    }
    
  } catch (error) {
    console.error("[Save Credentials] Error:", error)
    return { error: "Error al guardar credenciales encriptadas" }
  }
}

/**
 * Obtiene credenciales desencriptadas de un canal
 */
export async function getCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    const result = await getDecryptedChannelCredentials(data)
    
    if (result.error) {
      return { error: result.error }
    }
    
    return {
      success: true,
      credentials: result.credentials,
      accessToken: result.accessToken,
      type: result.type,
      status: result.status,
      expiresAt: result.expiresAt,
      isEncrypted: result.isEncrypted
    }
    
  } catch (error) {
    console.error("[Get Credentials] Error:", error)
    return { error: "Error al obtener credenciales desencriptadas" }
  }
}

/**
 * Migra credenciales existentes a formato encriptado
 */
export async function encryptExistingCredentials(data: {
  channelId: string
  tenantId: string
  fieldsToEncrypt?: string[]
}) {
  try {
    const result = await migrateCredentialsToEncrypted(data)
    
    if (result.error) {
      return { error: result.error }
    }
    
    // Revalidar la página de canales
    revalidatePath(`/app/${data.tenantId}/channels`)
    
    return {
      success: true,
      message: result.message,
      encryptedFields: result.encryptedFields
    }
    
  } catch (error) {
    console.error("[Encrypt Existing Credentials] Error:", error)
    return { error: "Error migrando credenciales a formato encriptado" }
  }
}

/**
 * Migra todas las credenciales de un tenant a formato encriptado
 */
export async function encryptAllTenantCredentials(data: {
  tenantId: string
  fieldsToEncrypt?: string[]
}) {
  try {
    // Obtener todos los canales del tenant
    const { prisma } = await import("@/lib/prisma")
    const { requireAuth, checkTenantAccess } = await import("@/lib/auth-utils")
    
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    const channels = await prisma.channel.findMany({
      where: {
        local: { tenantId: data.tenantId },
        meta: { not: null } as any
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        meta: true
      }
    })

    let migratedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Migrar cada canal
    for (const channel of channels) {
      try {
        const result = await migrateCredentialsToEncrypted({
          channelId: channel.id,
          tenantId: data.tenantId,
          fieldsToEncrypt: data.fieldsToEncrypt
        })

        if (result.error) {
          errorCount++
          errors.push(`${channel.displayName}: ${result.error}`)
        } else {
          migratedCount++
        }
      } catch (error) {
        errorCount++
        errors.push(`${channel.displayName}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    // Revalidar la página de canales
    revalidatePath(`/app/${data.tenantId}/channels`)

    return {
      success: true,
      migratedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Migración completada: ${migratedCount} exitosos, ${errorCount} errores`
    }

  } catch (error) {
    console.error("[Encrypt All Tenant Credentials] Error:", error)
    return { error: "Error migrando credenciales del tenant" }
  }
}

/**
 * Desencripta credenciales existentes (para migración de vuelta)
 */
export async function decryptExistingCredentials(data: {
  channelId: string
  tenantId: string
}) {
  try {
    // Obtener credenciales desencriptadas
    const result = await getDecryptedChannelCredentials(data)
    
    if (result.error) {
      return { error: result.error }
    }

    // Guardar como credenciales no encriptadas
    const { prisma } = await import("@/lib/prisma")
    
    await prisma.channel.update({
      where: { id: data.channelId },
      data: {
        meta: {
          type: result.type,
          credentials: result.credentials,
          config: {
            encryptionEnabled: false,
            decryptedAt: new Date().toISOString()
          }
        } as any,
        updatedAt: new Date()
      }
    })

    // Revalidar la página de canales
    revalidatePath(`/app/${data.tenantId}/channels`)

    return {
      success: true,
      message: "Credenciales desencriptadas exitosamente",
      credentials: result.credentials
    }

  } catch (error) {
    console.error("[Decrypt Existing Credentials] Error:", error)
    return { error: "Error desencriptando credenciales" }
  }
}

/**
 * Rota la clave de encriptación para todas las credenciales de un tenant
 */
export async function rotateTenantEncryptionKey(data: {
  tenantId: string
  oldMasterKey?: string
  newMasterKey?: string
}) {
  try {
    const result = await rotateEncryptionKey(data)
    
    if (result.error) {
      return { error: result.error }
    }
    
    // Revalidar la página de canales
    revalidatePath(`/app/${data.tenantId}/channels`)
    
    return {
      success: true,
      migratedCount: result.migratedCount,
      errorCount: result.errorCount,
      errors: result.errors,
      message: `Rotación completada: ${result.migratedCount} exitosos, ${result.errorCount} errores`
    }
    
  } catch (error) {
    console.error("[Rotate Tenant Encryption Key] Error:", error)
    return { error: "Error rotando clave de encriptación" }
  }
}

/**
 * Obtiene estadísticas de encriptación para un tenant
 */
export async function getEncryptionStats(data: {
  tenantId: string
}) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const { requireAuth, checkTenantAccess } = await import("@/lib/auth-utils")
    
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { error: "Unauthorized" }
    }

    const channels = await prisma.channel.findMany({
      where: {
        local: { tenantId: data.tenantId },
        meta: { not: null } as any
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        meta: true
      }
    })

    let totalChannels = channels.length
    let encryptedChannels = 0
    let expiredCredentials = 0
    let channelsWithTokens = 0

    for (const channel of channels) {
      const meta = channel.meta as any
      if (meta?.credentials) {
        channelsWithTokens++
        
        // Verificar si está encriptado
        if (meta.credentials.encryptedCredentials) {
          encryptedChannels++
        }
        
        // Verificar si las credenciales están expiradas
        const credentials = meta.credentials
        if (credentials.expiresAt) {
          const expirationDate = new Date(credentials.expiresAt)
          const now = new Date()
          if (now >= expirationDate) {
            expiredCredentials++
          }
        }
      }
    }

    return {
      success: true,
      stats: {
        totalChannels,
        encryptedChannels,
        unencryptedChannels: totalChannels - encryptedChannels,
        channelsWithTokens,
        expiredCredentials,
        encryptionRate: totalChannels > 0 ? (encryptedChannels / totalChannels * 100).toFixed(1) : 0
      }
    }

  } catch (error) {
    console.error("[Get Encryption Stats] Error:", error)
    return { error: "Error obteniendo estadísticas de encriptación" }
  }
}
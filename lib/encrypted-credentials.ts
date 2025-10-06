/**
 * Sistema de credenciales encriptadas
 * Maneja el encriptado/desencriptado de credenciales sensibles en channel.meta
 */

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
} from "./types/channel-credentials"
import { 
  encryptObject, 
  decryptObject, 
  isEncrypted,
  EncryptionResult,
  DecryptionResult,
  EncryptedData,
  rotateMasterKey
} from "./encryption"
import { prisma } from "./prisma"
import { requireAuth, checkTenantAccess } from "./auth-utils"

/**
 * Credenciales encriptadas con metadatos
 */
export interface EncryptedChannelCredentials {
  /** Datos encriptados */
  encryptedData: EncryptedData
  /** Timestamp de cuando se encriptaron */
  encryptedAt: string
  /** Versión del formato de encriptación */
  encryptionVersion: string
  /** Campos que están encriptados (para debugging) */
  encryptedFields: string[]
}

/**
 * Resultado de operaciones con credenciales encriptadas
 */
export interface EncryptedCredentialsResult {
  success: boolean
  credentials?: ChannelCredentials
  encryptedCredentials?: EncryptedChannelCredentials
  error?: string
}

/**
 * Encripta credenciales sensibles de un canal
 */
export async function encryptChannelCredentials(
  credentials: ChannelCredentials,
  fieldsToEncrypt: string[] = ['pageAccessToken', 'accessToken', 'refreshToken', 'mockToken']
): Promise<EncryptedCredentialsResult> {
  try {
    // Separar campos sensibles de no sensibles
    const sensitiveData: Record<string, any> = {}
    const nonSensitiveData: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(credentials)) {
      if (fieldsToEncrypt.includes(key) && value !== undefined && value !== null) {
        sensitiveData[key] = value
      } else {
        nonSensitiveData[key] = value
      }
    }
    
    // Encriptar datos sensibles
    const encryptionResult = encryptObject(sensitiveData)
    
    if (!encryptionResult.success || !encryptionResult.data) {
      return {
        success: false,
        error: encryptionResult.error || "Error encriptando credenciales"
      }
    }
    
    // Crear estructura de credenciales encriptadas
    const encryptedCredentials: EncryptedChannelCredentials = {
      encryptedData: encryptionResult.data,
      encryptedAt: new Date().toISOString(),
      encryptionVersion: "1.0",
      encryptedFields: fieldsToEncrypt.filter(field => sensitiveData[field] !== undefined)
    }
    
    // Combinar datos no sensibles con estructura de encriptación
    const hybridCredentials = {
      ...nonSensitiveData,
      encryptedCredentials,
      encryptedFields: encryptedCredentials.encryptedFields
    } as any
    
    console.log(`[Encrypted Credentials] Credenciales encriptadas para ${encryptedCredentials.encryptedFields.length} campos`)
    
    return {
      success: true,
      credentials: hybridCredentials,
      encryptedCredentials
    }
    
  } catch (error) {
    console.error("[Encrypted Credentials] Error encriptando credenciales:", error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido en encriptación"
    }
  }
}

/**
 * Desencripta credenciales de un canal
 */
export async function decryptChannelCredentials(
  credentials: ChannelCredentials | any
): Promise<EncryptedCredentialsResult> {
  try {
    // Si no tiene campos encriptados, retornar tal como están
    if (!isHybridCredentials(credentials)) {
      return {
        success: true,
        credentials: credentials
      }
    }
    
    // Si no tiene credenciales encriptadas, retornar tal como están
    if (!credentials.encryptedCredentials) {
      return {
        success: true,
        credentials: credentials
      }
    }
    
    // Desencriptar datos sensibles
    const decryptionResult = decryptObject(credentials.encryptedCredentials.encryptedData)
    
    if (!decryptionResult.success || !decryptionResult.parsedData) {
      return {
        success: false,
        error: decryptionResult.error || "Error desencriptando credenciales"
      }
    }
    
    // Combinar datos desencriptados con datos no sensibles
    const decryptedCredentials: ChannelCredentials = {
      ...credentials,
      ...decryptionResult.parsedData
    } as ChannelCredentials
    
    // Limpiar campos de encriptación
    delete (decryptedCredentials as any).encryptedCredentials
    delete (decryptedCredentials as any).encryptedFields
    
    console.log(`[Encrypted Credentials] Credenciales desencriptadas exitosamente`)
    
    return {
      success: true,
      credentials: decryptedCredentials
    }
    
  } catch (error) {
    console.error("[Encrypted Credentials] Error desencriptando credenciales:", error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido en desencriptación"
    }
  }
}

/**
 * Guarda credenciales encriptadas en channel.meta
 */
export async function saveEncryptedChannelCredentials(data: {
  channelId: string
  tenantId: string
  credentials: ChannelCredentials
  fieldsToEncrypt?: string[]
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

    // 3. Encriptar credenciales
    const encryptionResult = await encryptChannelCredentials(
      data.credentials,
      data.fieldsToEncrypt
    )

    if (!encryptionResult.success) {
      return { error: encryptionResult.error || "Error encriptando credenciales" }
    }

    // 4. Crear el objeto meta completo
    const currentMeta = (channel.meta as any) || { type: channel.type, credentials: {} }
    const updatedMeta = {
      ...currentMeta,
      type: channel.type,
      credentials: encryptionResult.credentials,
      config: {
        ...currentMeta.config,
        encryptionEnabled: true,
        encryptedAt: new Date().toISOString()
      }
    }

    // 5. Guardar en la base de datos
    await prisma.channel.update({
      where: { id: data.channelId },
      data: {
        meta: updatedMeta as any,
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    })

    console.log(`[Encrypted Credentials] Credenciales encriptadas guardadas para canal ${channel.type} (${data.channelId})`)

    return { 
      success: true, 
      credentials: encryptionResult.credentials,
      encryptedFields: (encryptionResult.credentials as any).encryptedFields
    }

  } catch (error) {
    console.error("[Encrypted Credentials] Error:", error)
    return { error: "Error al guardar credenciales encriptadas" }
  }
}

/**
 * Obtiene credenciales desencriptadas desde channel.meta
 */
export async function getDecryptedChannelCredentials(data: {
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
      include: { local: true }
    })

    if (!channel || channel.local.tenantId !== data.tenantId) {
      return { error: "Canal no encontrado" }
    }

    // 3. Extraer credenciales del meta
    const meta = channel.meta as any
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
      isEncrypted: isHybridCredentials(credentials)
    }

  } catch (error) {
    console.error("[Encrypted Credentials] Error:", error)
    return { error: "Error al obtener credenciales desencriptadas" }
  }
}

/**
 * Migra credenciales existentes a formato encriptado
 */
export async function migrateCredentialsToEncrypted(data: {
  channelId: string
  tenantId: string
  fieldsToEncrypt?: string[]
}) {
  try {
    // 1. Obtener credenciales actuales
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
      include: { local: true }
    })

    if (!channel || channel.local.tenantId !== data.tenantId) {
      return { error: "Canal no encontrado" }
    }

    const meta = channel.meta as any
    if (!meta || !meta.credentials) {
      return { error: "No hay credenciales para migrar" }
    }

    // 2. Verificar si ya están encriptadas
    if (isHybridCredentials(meta.credentials)) {
      return { error: "Las credenciales ya están encriptadas" }
    }

    // 3. Encriptar credenciales
    const encryptionResult = await encryptChannelCredentials(
      meta.credentials,
      data.fieldsToEncrypt
    )

    if (!encryptionResult.success) {
      return { error: encryptionResult.error || "Error encriptando credenciales" }
    }

    // 4. Actualizar canal con credenciales encriptadas
    const updatedMeta = {
      ...meta,
      credentials: encryptionResult.credentials,
      config: {
        ...meta.config,
        encryptionEnabled: true,
        migratedAt: new Date().toISOString()
      }
    }

    await prisma.channel.update({
      where: { id: data.channelId },
      data: {
        meta: updatedMeta as any,
        updatedAt: new Date()
      }
    })

    console.log(`[Encrypted Credentials] Migración completada para canal ${data.channelId}`)

    return {
      success: true,
      message: "Credenciales migradas a formato encriptado",
      encryptedFields: (encryptionResult.credentials as any).encryptedFields
    }

  } catch (error) {
    console.error("[Encrypted Credentials] Error en migración:", error)
    return { error: "Error migrando credenciales a formato encriptado" }
  }
}

/**
 * Helper para verificar si las credenciales son híbridas (encriptadas)
 */
function isHybridCredentials(credentials: any): boolean {
  return !!(credentials && credentials.encryptedCredentials)
}

/**
 * Rotar clave de encriptación para todas las credenciales de un tenant
 */
export async function rotateEncryptionKey(data: {
  tenantId: string
  oldMasterKey?: string
  newMasterKey?: string
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Obtener todos los canales del tenant con credenciales encriptadas
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

    // 3. Rotar clave para cada canal
    for (const channel of channels) {
      try {
        const meta = channel.meta as any
        if (!meta?.credentials || !isHybridCredentials(meta.credentials)) {
          continue // Saltar canales sin credenciales encriptadas
        }

        const encryptedData = meta.credentials.encryptedCredentials.encryptedData

        // Rotar clave
        const rotationResult = rotateMasterKey(
          encryptedData,
          data.oldMasterKey || process.env.ENCRYPTION_MASTER_KEY!,
          data.newMasterKey || process.env.ENCRYPTION_MASTER_KEY!
        )

        if (rotationResult.success && rotationResult.data) {
          // Actualizar canal con nueva clave
          const updatedCredentials = {
            ...meta.credentials,
            encryptedCredentials: {
              ...meta.credentials.encryptedCredentials,
              encryptedData: rotationResult.data,
              encryptedAt: new Date().toISOString()
            }
          }

          await prisma.channel.update({
            where: { id: channel.id },
            data: {
              meta: {
                ...meta,
                credentials: updatedCredentials
              } as any
            }
          })

          migratedCount++
        } else {
          errorCount++
          errors.push(`Canal ${channel.displayName}: ${rotationResult.error}`)
        }

      } catch (error) {
        errorCount++
        errors.push(`Canal ${channel.displayName}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    console.log(`[Encrypted Credentials] Rotación completada: ${migratedCount} exitosos, ${errorCount} errores`)

    return {
      success: true,
      migratedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    }

  } catch (error) {
    console.error("[Encrypted Credentials] Error en rotación:", error)
    return { error: "Error rotando clave de encriptación" }
  }
}
/**
 * Sistema mejorado de validación de credenciales
 * Integra validación antes de guardar con encriptación automática
 */

import { getAdapter } from "./adapters"
import { 
  encryptChannelCredentials,
  saveEncryptedChannelCredentials,
  getDecryptedChannelCredentials
} from "./encrypted-credentials"
import { 
  createChannelCredentials,
  ChannelCredentials,
  ChannelMeta,
  areCredentialsExpired,
  getAccessToken
} from "./types/channel-credentials"
import { prisma } from "./prisma"
import { requireAuth, checkTenantAccess } from "./auth-utils"
import type { ValidationResult } from "./adapters/types"

/**
 * Resultado de validación mejorada
 */
export interface EnhancedValidationResult {
  success: boolean
  valid: boolean
  error?: string
  details?: Record<string, any>
  credentials?: ChannelCredentials
  warnings?: string[]
  recommendations?: string[]
}

/**
 * Configuración de validación
 */
export interface ValidationConfig {
  /** Si debe encriptar automáticamente las credenciales válidas */
  autoEncrypt?: boolean
  /** Si debe guardar automáticamente las credenciales válidas */
  autoSave?: boolean
  /** Si debe validar permisos específicos */
  validatePermissions?: boolean
  /** Si debe verificar conectividad con la API */
  testConnectivity?: boolean
  /** Campos específicos a encriptar */
  fieldsToEncrypt?: string[]
}

/**
 * Valida credenciales de un canal con validación mejorada
 */
export async function validateChannelCredentialsEnhanced(
  data: {
    tenantId: string
    type: string
    config: Record<string, any>
    channelId?: string // Para validación de credenciales existentes
  },
  options: ValidationConfig = {}
): Promise<EnhancedValidationResult> {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return {
        success: false,
        valid: false,
        error: "Unauthorized"
      }
    }

    // 2. Validar tipo de canal
    const validTypes = ["INSTAGRAM", "FACEBOOK", "WHATSAPP", "TIKTOK", "MOCK"]
    if (!validTypes.includes(data.type)) {
      return {
        success: false,
        valid: false,
        error: "Tipo de canal no válido"
      }
    }

    // 3. Validar configuración básica
    const basicValidation = validateBasicConfig(data.type, data.config)
    if (!basicValidation.valid) {
      return {
        success: false,
        valid: false,
        error: basicValidation.error
      }
    }

    // 4. Obtener adapter y validar credenciales
    const adapter = getAdapter(data.type as any)
    if (!adapter) {
      return {
        success: false,
        valid: false,
        error: "Adapter no encontrado para este tipo de canal"
      }
    }

    // 5. Validación con el adapter
    const adapterResult = await adapter.validateCredentials(data.config)
    
    if (!adapterResult.valid) {
      return {
        success: false,
        valid: false,
        error: adapterResult.error || "Credenciales inválidas"
      }
    }

    // 6. Crear objeto de credenciales
    const credentials = createChannelCredentials(data.type as any, data.config)
    
    // 7. Validaciones adicionales
    const warnings: string[] = []
    const recommendations: string[] = []

    // Verificar expiración
    if (credentials.expiresAt) {
      const isExpired = areCredentialsExpired(credentials)
      if (isExpired) {
        warnings.push("Las credenciales están expiradas")
      } else {
        const expirationDate = new Date(credentials.expiresAt)
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 7) {
          warnings.push(`Las credenciales expiran en ${daysUntilExpiry} días`)
          recommendations.push("Considera configurar refresh automático de tokens")
        }
      }
    }

    // Verificar token de acceso
    const accessToken = getAccessToken(credentials)
    if (!accessToken) {
      return {
        success: false,
        valid: false,
        error: "No se pudo extraer el token de acceso de las credenciales"
      }
    }

    // 8. Validación de permisos (si está habilitada)
    if (options.validatePermissions && data.type !== "MOCK") {
      const permissionsResult = await validateChannelPermissions(adapter, data.config)
      if (!permissionsResult.valid) {
        warnings.push(`Permisos limitados: ${permissionsResult.error}`)
      }
    }

    // 9. Test de conectividad (si está habilitado)
    if (options.testConnectivity && data.type !== "MOCK") {
      const connectivityResult = await testChannelConnectivity(adapter, data.config)
      if (!connectivityResult.valid) {
        warnings.push(`Problemas de conectividad: ${connectivityResult.error}`)
      }
    }

    // 10. Auto-guardar si está habilitado
    if (options.autoSave && data.channelId) {
      try {
        const saveResult = await saveEncryptedChannelCredentials({
          channelId: data.channelId,
          tenantId: data.tenantId,
          credentials,
          fieldsToEncrypt: options.fieldsToEncrypt
        })

        if (!saveResult.success) {
          warnings.push(`Error al guardar: ${saveResult.error}`)
        }
      } catch (error) {
        warnings.push(`Error al guardar credenciales: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    }

    // 11. Generar recomendaciones basadas en el tipo de canal
    const channelRecommendations = generateChannelRecommendations(data.type, credentials)
    recommendations.push(...channelRecommendations)

    return {
      success: true,
      valid: true,
      details: {
        ...adapterResult.details,
        type: data.type,
        hasExpiration: !!credentials.expiresAt,
        expiresAt: credentials.expiresAt,
        tokenLength: accessToken.length,
        encrypted: options.autoEncrypt || false
      },
      credentials,
      warnings: warnings.length > 0 ? warnings : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    }

  } catch (error) {
    console.error("[Enhanced Validation] Error:", error)
    
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : "Error desconocido en validación"
    }
  }
}

/**
 * Valida configuración básica antes de usar el adapter
 */
function validateBasicConfig(type: string, config: Record<string, any>): ValidationResult {
  const requiredFields = getRequiredFieldsForType(type)
  
  for (const field of requiredFields) {
    if (!config[field] || config[field].trim() === '') {
      return {
        valid: false,
        error: `Campo requerido faltante: ${field}`
      }
    }
  }

  // Validaciones específicas por tipo
  switch (type) {
    case "INSTAGRAM":
    case "FACEBOOK":
      if (!isValidFacebookPageId(config.pageId)) {
        return {
          valid: false,
          error: "Page ID de Facebook no válido"
        }
      }
      break
    
    case "WHATSAPP":
      if (!isValidWhatsAppPhoneId(config.phoneId)) {
        return {
          valid: false,
          error: "Phone ID de WhatsApp no válido"
        }
      }
      break
    
    case "TIKTOK":
      if (!isValidTikTokAppId(config.appId)) {
        return {
          valid: false,
          error: "App ID de TikTok no válido"
        }
      }
      break
  }

  return {
    valid: true,
    details: {
      validatedFields: requiredFields,
      type
    }
  }
}

/**
 * Obtiene campos requeridos por tipo de canal
 */
function getRequiredFieldsForType(type: string): string[] {
  switch (type) {
    case "INSTAGRAM":
    case "FACEBOOK":
      return ["pageId", "accessToken"]
    case "WHATSAPP":
      return ["phoneId", "accessToken", "businessId"]
    case "TIKTOK":
      return ["appId", "appSecret", "accessToken"]
    case "MOCK":
      return []
    default:
      return []
  }
}

/**
 * Valida permisos específicos del canal
 */
async function validateChannelPermissions(
  adapter: any,
  config: Record<string, any>
): Promise<ValidationResult> {
  try {
    // Para Meta (Instagram/Facebook), verificar permisos específicos
    if (adapter.type === "instagram" || adapter.type === "facebook") {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return {
          valid: false,
          error: "No se pudieron verificar los permisos"
        }
      }

      const data = await response.json()
      const permissions = data.data || []
      const permissionNames = permissions.map((p: any) => p.permission)

      // Verificar permisos mínimos requeridos
      const requiredPermissions = ["pages_messaging", "pages_read_engagement"]
      const missingPermissions = requiredPermissions.filter(p => !permissionNames.includes(p))

      if (missingPermissions.length > 0) {
        return {
          valid: false,
          error: `Permisos faltantes: ${missingPermissions.join(", ")}`
        }
      }

      return {
        valid: true,
        details: {
          permissions: permissionNames,
          hasRequiredPermissions: true
        }
      }
    }

    // Para otros tipos de canal, validación básica
    return {
      valid: true,
      details: {
        message: "Validación de permisos no implementada para este tipo de canal"
      }
    }

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Error verificando permisos"
    }
  }
}

/**
 * Testa conectividad con la API del canal
 */
async function testChannelConnectivity(
  adapter: any,
  config: Record<string, any>
): Promise<ValidationResult> {
  try {
    // Para Meta, hacer una llamada simple a la API
    if (adapter.type === "instagram" || adapter.type === "facebook") {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      )

      return {
        valid: response.ok,
        error: response.ok ? undefined : `Error de conectividad: ${response.status}`,
        details: {
          statusCode: response.status,
          connected: response.ok
        }
      }
    }

    // Para WhatsApp
    if (adapter.type === "whatsapp") {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.phoneId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
          },
        }
      )

      return {
        valid: response.ok,
        error: response.ok ? undefined : `Error de conectividad: ${response.status}`,
        details: {
          statusCode: response.status,
          connected: response.ok
        }
      }
    }

    // Para otros tipos, asumir conectividad
    return {
      valid: true,
      details: {
        message: "Test de conectividad no implementado para este tipo de canal"
      }
    }

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Error de conectividad"
    }
  }
}

/**
 * Genera recomendaciones específicas por tipo de canal
 */
function generateChannelRecommendations(
  type: string,
  credentials: ChannelCredentials
): string[] {
  const recommendations: string[] = []

  switch (type) {
    case "INSTAGRAM":
    case "FACEBOOK":
      recommendations.push("Configura webhooks para recibir mensajes en tiempo real")
      recommendations.push("Verifica que la página tenga permisos de mensajería")
      if (!credentials.expiresAt) {
        recommendations.push("Considera usar tokens de larga duración")
      }
      break

    case "WHATSAPP":
      recommendations.push("Configura el webhook de WhatsApp Business API")
      recommendations.push("Verifica que el número esté verificado")
      recommendations.push("Configura plantillas de mensajes si es necesario")
      break

    case "TIKTOK":
      recommendations.push("Verifica los scopes de la aplicación de TikTok")
      recommendations.push("Configura los webhooks de TikTok for Business")
      break

    case "MOCK":
      recommendations.push("Este es un canal de prueba, no usar en producción")
      break
  }

  return recommendations
}

/**
 * Funciones de validación de formato
 */
function isValidFacebookPageId(pageId: string): boolean {
  return /^\d{15,16}$/.test(pageId)
}

function isValidWhatsAppPhoneId(phoneId: string): boolean {
  return /^\d{15,16}$/.test(phoneId)
}

function isValidTikTokAppId(appId: string): boolean {
  return /^\d+$/.test(appId)
}

/**
 * Valida credenciales existentes de un canal
 */
export async function validateExistingChannelCredentials(data: {
  channelId: string
  tenantId: string
}): Promise<EnhancedValidationResult> {
  try {
    // 1. Obtener credenciales desencriptadas
    const credentialsResult = await getDecryptedChannelCredentials(data)
    
    if (!credentialsResult.success || !credentialsResult.credentials) {
      return {
        success: false,
        valid: false,
        error: credentialsResult.error || "No se pudieron obtener las credenciales"
      }
    }

    // 2. Obtener información del canal
    const channel = await prisma.channel.findUnique({
      where: { id: data.channelId },
      select: { type: true, displayName: true }
    })

    if (!channel) {
      return {
        success: false,
        valid: false,
        error: "Canal no encontrado"
      }
    }

    // 3. Validar credenciales con el sistema mejorado
    const config = extractConfigFromCredentials(credentialsResult.credentials, channel.type)
    
    return await validateChannelCredentialsEnhanced(
      {
        tenantId: data.tenantId,
        type: channel.type,
        config,
        channelId: data.channelId
      },
      {
        validatePermissions: true,
        testConnectivity: true,
        autoSave: false // No auto-guardar en validación de existentes
      }
    )

  } catch (error) {
    console.error("[Validate Existing Credentials] Error:", error)
    
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : "Error validando credenciales existentes"
    }
  }
}

/**
 * Extrae configuración de las credenciales para validación
 */
function extractConfigFromCredentials(credentials: ChannelCredentials, type: string): Record<string, any> {
  switch (type) {
    case "INSTAGRAM":
    case "FACEBOOK":
      return {
        pageId: (credentials as any).pageId,
        accessToken: (credentials as any).pageAccessToken
      }
    case "WHATSAPP":
      return {
        phoneId: (credentials as any).phoneNumberId,
        accessToken: (credentials as any).accessToken,
        businessId: (credentials as any).businessAccountId
      }
    case "TIKTOK":
      return {
        appId: (credentials as any).appId,
        appSecret: (credentials as any).appSecret,
        accessToken: (credentials as any).accessToken
      }
    case "MOCK":
      return {}
    default:
      return {}
  }
}

/**
 * Tipos para credenciales de canales
 * Define la estructura de datos para almacenar tokens y configuraciones en channel.meta
 */

// Credenciales base para todos los canales
export interface BaseChannelCredentials {
  /** Timestamp de cuando se guardaron las credenciales */
  savedAt: string
  /** Versión del formato de credenciales */
  version: string
  /** Estado de las credenciales */
  status: 'active' | 'expired' | 'invalid'
}

// Credenciales específicas para Instagram/Facebook (Meta)
export interface MetaCredentials extends BaseChannelCredentials {
  /** Page Access Token para Instagram/Facebook */
  pageAccessToken: string
  /** ID de la página de Facebook */
  pageId: string
  /** ID de la aplicación de Facebook */
  appId?: string
  /** Permisos otorgados */
  permissions?: string[]
  /** Timestamp de expiración del token */
  expiresAt?: string
  /** Token de refresh si está disponible */
  refreshToken?: string
}

// Credenciales específicas para WhatsApp Cloud API
export interface WhatsAppCredentials extends BaseChannelCredentials {
  /** Access Token de WhatsApp Business API */
  accessToken: string
  /** Phone Number ID */
  phoneNumberId: string
  /** Business Account ID */
  businessAccountId: string
  /** Webhook Verify Token */
  webhookVerifyToken?: string
  /** Timestamp de expiración del token */
  expiresAt?: string
}

// Credenciales específicas para TikTok
export interface TikTokCredentials extends BaseChannelCredentials {
  /** Access Token de TikTok */
  accessToken: string
  /** Refresh Token de TikTok */
  refreshToken?: string
  /** Scope del token */
  scope?: string[]
  /** Timestamp de expiración del token */
  expiresAt?: string
}

// Credenciales para Mock (desarrollo/testing)
export interface MockCredentials extends BaseChannelCredentials {
  /** Token simulado para testing */
  mockToken: string
  /** Configuración adicional para el mock */
  mockConfig?: Record<string, any>
  /** Timestamp de expiración del token (opcional para mock) */
  expiresAt?: string
}

// Union type para todas las credenciales
export type ChannelCredentials = 
  | MetaCredentials 
  | WhatsAppCredentials 
  | TikTokCredentials 
  | MockCredentials

// Tipos para identificar el tipo de credenciales
export interface ChannelMeta {
  /** Tipo de canal */
  type: 'INSTAGRAM' | 'FACEBOOK' | 'WHATSAPP' | 'TIKTOK' | 'MOCK'
  /** Credenciales específicas del canal */
  credentials: ChannelCredentials
  /** Configuración adicional del canal */
  config?: {
    /** Webhook URL configurado */
    webhookUrl?: string
    /** Configuración de notificaciones */
    notifications?: {
      enabled: boolean
      types: string[]
    }
    /** Configuración específica del canal */
    [key: string]: any
  }
}

// Helper functions para validar tipos de credenciales
export function isMetaCredentials(credentials: ChannelCredentials): credentials is MetaCredentials {
  return 'pageAccessToken' in credentials && 'pageId' in credentials
}

export function isWhatsAppCredentials(credentials: ChannelCredentials): credentials is WhatsAppCredentials {
  return 'accessToken' in credentials && 'phoneNumberId' in credentials && 'businessAccountId' in credentials
}

export function isTikTokCredentials(credentials: ChannelCredentials): credentials is TikTokCredentials {
  return 'accessToken' in credentials && !('phoneNumberId' in credentials) && !('pageId' in credentials)
}

export function isMockCredentials(credentials: ChannelCredentials): credentials is MockCredentials {
  return 'mockToken' in credentials
}

// Helper para crear credenciales con valores por defecto
export function createChannelCredentials(
  type: ChannelMeta['type'],
  credentialsData: any
): ChannelCredentials {
  const baseCredentials: BaseChannelCredentials = {
    savedAt: new Date().toISOString(),
    version: '1.0',
    status: 'active',
    ...credentialsData
  }

  switch (type) {
    case 'INSTAGRAM':
    case 'FACEBOOK':
      return {
        ...baseCredentials,
        pageAccessToken: credentialsData.pageAccessToken || credentialsData.accessToken || '',
        pageId: credentialsData.pageId || '',
        appId: credentialsData.appId,
        permissions: credentialsData.permissions,
        expiresAt: credentialsData.expiresAt,
        refreshToken: credentialsData.refreshToken,
      } as MetaCredentials

    case 'WHATSAPP':
      return {
        ...baseCredentials,
        accessToken: credentialsData.accessToken || '',
        phoneNumberId: credentialsData.phoneNumberId || '',
        businessAccountId: credentialsData.businessAccountId || '',
        webhookVerifyToken: credentialsData.webhookVerifyToken,
        expiresAt: credentialsData.expiresAt,
      } as WhatsAppCredentials

    case 'TIKTOK':
      return {
        ...baseCredentials,
        accessToken: credentialsData.accessToken || '',
        refreshToken: credentialsData.refreshToken,
        scope: credentialsData.scope,
        expiresAt: credentialsData.expiresAt,
      } as TikTokCredentials

    case 'MOCK':
      return {
        ...baseCredentials,
        mockToken: credentialsData.mockToken || 'mock-token-' + Date.now(),
        mockConfig: credentialsData.mockConfig,
      } as MockCredentials

    default:
      throw new Error(`Tipo de canal no soportado: ${type}`)
  }
}

// Helper para validar si las credenciales están expiradas
export function areCredentialsExpired(credentials: ChannelCredentials): boolean {
  if (!credentials.expiresAt) {
    return false // Si no hay fecha de expiración, asumimos que no expiran
  }
  
  const expirationDate = new Date(credentials.expiresAt)
  const now = new Date()
  
  return now >= expirationDate
}

// Helper para obtener el token de acceso según el tipo de canal
export function getAccessToken(credentials: ChannelCredentials): string | null {
  if (isMetaCredentials(credentials)) {
    return credentials.pageAccessToken
  }
  
  if (isWhatsAppCredentials(credentials) || isTikTokCredentials(credentials)) {
    return credentials.accessToken
  }
  
  if (isMockCredentials(credentials)) {
    return credentials.mockToken
  }
  
  return null
}

// Helper para actualizar el estado de las credenciales
export function updateCredentialsStatus(
  credentials: ChannelCredentials,
  status: 'active' | 'expired' | 'invalid'
): ChannelCredentials {
  return {
    ...credentials,
    status,
    savedAt: new Date().toISOString()
  }
}

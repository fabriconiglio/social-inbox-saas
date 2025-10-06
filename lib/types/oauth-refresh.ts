/**
 * Tipos para manejo de refresh de tokens OAuth
 * Define la estructura para el refresh automático de tokens de acceso
 */

import { ChannelCredentials } from "./channel-credentials"

// Resultado de un refresh de token
export interface RefreshResult {
  /** Si el refresh fue exitoso */
  success: boolean
  /** Nuevo token de acceso (si fue exitoso) */
  accessToken?: string
  /** Nuevo refresh token (si fue proporcionado) */
  refreshToken?: string
  /** Nueva fecha de expiración */
  expiresAt?: string
  /** Mensaje de error si falló */
  error?: string
  /** Detalles adicionales del refresh */
  details?: Record<string, any>
}

// Configuración para refresh automático
export interface RefreshConfig {
  /** Intervalo en minutos para verificar tokens próximos a expirar */
  checkIntervalMinutes: number
  /** Tiempo en minutos antes de la expiración para hacer refresh */
  refreshBeforeExpirationMinutes: number
  /** Número máximo de intentos de refresh */
  maxRetryAttempts: number
  /** Delay entre reintentos en minutos */
  retryDelayMinutes: number
  /** Si está habilitado el refresh automático */
  enabled: boolean
}

// Información de un token próximo a expirar
export interface TokenExpirationInfo {
  /** ID del canal */
  channelId: string
  /** Tipo de canal */
  channelType: string
  /** Nombre del canal */
  displayName: string
  /** Nombre del local */
  localName: string
  /** Fecha de expiración */
  expiresAt: string
  /** Tiempo restante en minutos */
  minutesUntilExpiration: number
  /** Si el token tiene refresh token */
  hasRefreshToken: boolean
  /** Si ya se intentó refresh */
  refreshAttempted?: boolean
  /** Último error de refresh */
  lastRefreshError?: string
}

// Estados de refresh
export type RefreshStatus = 
  | 'pending'      // Esperando refresh
  | 'in_progress'  // Refresh en progreso
  | 'success'      // Refresh exitoso
  | 'failed'       // Refresh falló
  | 'skipped'      // Refresh omitido (sin refresh token)

// Job de refresh para la cola
export interface RefreshJob {
  /** ID único del job */
  id: string
  /** ID del canal */
  channelId: string
  /** ID del tenant */
  tenantId: string
  /** Estado del job */
  status: RefreshStatus
  /** Fecha de creación */
  createdAt: string
  /** Fecha de último intento */
  lastAttemptAt?: string
  /** Número de intentos */
  attemptCount: number
  /** Error del último intento */
  lastError?: string
  /** Datos del canal al momento de crear el job */
  channelData: {
    type: string
    displayName: string
    localName: string
    credentials: ChannelCredentials
  }
}

// Configuración específica por plataforma
export interface PlatformRefreshConfig {
  /** Meta (Instagram/Facebook) */
  meta: {
    /** URL base para refresh */
    refreshUrl: string
    /** Campos requeridos para refresh */
    requiredFields: string[]
    /** Mapeo de campos de respuesta */
    responseMapping: {
      accessToken: string
      refreshToken?: string
      expiresAt: string
    }
  }
  
  /** TikTok */
  tiktok: {
    /** URL base para refresh */
    refreshUrl: string
    /** Campos requeridos para refresh */
    requiredFields: string[]
    /** Mapeo de campos de respuesta */
    responseMapping: {
      accessToken: string
      refreshToken?: string
      expiresAt: string
    }
  }
  
  /** WhatsApp Cloud API */
  whatsapp: {
    /** URL base para refresh */
    refreshUrl: string
    /** Campos requeridos para refresh */
    requiredFields: string[]
    /** Mapeo de campos de respuesta */
    responseMapping: {
      accessToken: string
      refreshToken?: string
      expiresAt: string
    }
  }
}

// Helper para verificar si un token necesita refresh
export function needsRefresh(
  credentials: ChannelCredentials,
  refreshBeforeMinutes: number = 30
): boolean {
  if (!credentials.expiresAt) {
    return false // No expira
  }
  
  const expirationDate = new Date(credentials.expiresAt)
  const now = new Date()
  const refreshTime = new Date(now.getTime() + refreshBeforeMinutes * 60 * 1000)
  
  return expirationDate <= refreshTime
}

// Helper para calcular minutos hasta expiración
export function getMinutesUntilExpiration(credentials: ChannelCredentials): number | null {
  if (!credentials.expiresAt) {
    return null // No expira
  }
  
  const expirationDate = new Date(credentials.expiresAt)
  const now = new Date()
  const diffMs = expirationDate.getTime() - now.getTime()
  
  return Math.max(0, Math.floor(diffMs / (1000 * 60)))
}

// Helper para verificar si tiene refresh token
export function hasRefreshToken(credentials: ChannelCredentials): boolean {
  return !!(credentials as any).refreshToken
}

// Helper para crear job de refresh
export function createRefreshJob(
  channelId: string,
  tenantId: string,
  channelData: RefreshJob['channelData']
): RefreshJob {
  return {
    id: `refresh_${channelId}_${Date.now()}`,
    channelId,
    tenantId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    channelData
  }
}

// Configuración por defecto
export const DEFAULT_REFRESH_CONFIG: RefreshConfig = {
  checkIntervalMinutes: 60, // Verificar cada hora
  refreshBeforeExpirationMinutes: 30, // Refresh 30 min antes de expirar
  maxRetryAttempts: 3,
  retryDelayMinutes: 15,
  enabled: true
}

// Configuración específica por plataforma
export const PLATFORM_CONFIG: PlatformRefreshConfig = {
  meta: {
    refreshUrl: 'https://graph.facebook.com/oauth/access_token',
    requiredFields: ['client_id', 'client_secret', 'refresh_token', 'grant_type'],
    responseMapping: {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      expiresAt: 'expires_in' // Meta devuelve segundos, necesitamos convertir
    }
  },
  
  tiktok: {
    refreshUrl: 'https://open-api.tiktok.com/oauth/refresh_token/',
    requiredFields: ['client_key', 'client_secret', 'refresh_token', 'grant_type'],
    responseMapping: {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      expiresAt: 'expires_in'
    }
  },
  
  whatsapp: {
    refreshUrl: 'https://graph.facebook.com/oauth/access_token',
    requiredFields: ['client_id', 'client_secret', 'refresh_token', 'grant_type'],
    responseMapping: {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      expiresAt: 'expires_in'
    }
  }
}

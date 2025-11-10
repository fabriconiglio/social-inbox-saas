/**
 * Lógica de refresh de tokens OAuth
 * Implementa el refresh automático de tokens para cada plataforma
 */

import { 
  RefreshResult, 
  RefreshConfig, 
  TokenExpirationInfo,
  RefreshJob,
  needsRefresh,
  getMinutesUntilExpiration,
  hasRefreshToken,
  createRefreshJob,
  DEFAULT_REFRESH_CONFIG,
  PLATFORM_CONFIG
} from "./types/oauth-refresh"
import { 
  ChannelCredentials, 
  MetaCredentials, 
  WhatsAppCredentials, 
  TikTokCredentials,
  isMetaCredentials,
  isWhatsAppCredentials,
  isTikTokCredentials
} from "./types/channel-credentials"
import { prisma } from "./prisma"
import { Prisma } from "@prisma/client"
import { getDecryptedChannelCredentials } from "./encrypted-credentials"
import { env } from "./env"

/**
 * Refresh token para Meta (Instagram/Facebook)
 */
async function refreshMetaToken(credentials: MetaCredentials): Promise<RefreshResult> {
  try {
    if (!credentials.refreshToken) {
      return {
        success: false,
        error: "No hay refresh token disponible para Meta"
      }
    }

    const config = PLATFORM_CONFIG.meta
    
    // Parámetros para el refresh
    const params = new URLSearchParams({
      client_id: env.META_APP_ID || '',
      client_secret: env.META_APP_SECRET || '',
      refresh_token: credentials.refreshToken,
      grant_type: 'fb_exchange_token'
    })

    console.log(`[OAuth Refresh] Refrescando token Meta para página ${credentials.pageId}`)

    const response = await fetch(`${config.refreshUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[OAuth Refresh] Error Meta API: ${response.status} - ${errorData}`)
      
      return {
        success: false,
        error: `Error de API Meta: ${response.status} - ${errorData}`
      }
    }

    const data = await response.json()
    
    if (data.error) {
      console.error(`[OAuth Refresh] Error Meta: ${JSON.stringify(data.error)}`)
      
      return {
        success: false,
        error: `Error de Meta: ${data.error.message || 'Error desconocido'}`
      }
    }

    // Calcular fecha de expiración
    const expiresIn = data.expires_in || 5184000 // Default 60 días
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    console.log(`[OAuth Refresh] Token Meta refrescado exitosamente`)

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || credentials.refreshToken,
      expiresAt,
      details: {
        expiresIn,
        tokenType: data.token_type
      }
    }

  } catch (error) {
    console.error(`[OAuth Refresh] Error refrescando token Meta:`, error)
    
    return {
      success: false,
      error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Refresh token para TikTok
 */
async function refreshTikTokToken(credentials: TikTokCredentials): Promise<RefreshResult> {
  try {
    if (!credentials.refreshToken) {
      return {
        success: false,
        error: "No hay refresh token disponible para TikTok"
      }
    }

    const config = PLATFORM_CONFIG.tiktok
    
    // Parámetros para el refresh
    const params = new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY || env.TIKTOK_APP_ID || '',
      client_secret: env.TIKTOK_CLIENT_SECRET || env.TIKTOK_APP_SECRET || '',
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token'
    })

    console.log(`[OAuth Refresh] Refrescando token TikTok`)

    const response = await fetch(config.refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[OAuth Refresh] Error TikTok API: ${response.status} - ${errorData}`)
      
      return {
        success: false,
        error: `Error de API TikTok: ${response.status} - ${errorData}`
      }
    }

    const data = await response.json()
    
    if (data.error) {
      console.error(`[OAuth Refresh] Error TikTok: ${JSON.stringify(data.error)}`)
      
      return {
        success: false,
        error: `Error de TikTok: ${data.error.message || 'Error desconocido'}`
      }
    }

    // Calcular fecha de expiración
    const expiresIn = data.expires_in || 86400 // Default 24 horas
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    console.log(`[OAuth Refresh] Token TikTok refrescado exitosamente`)

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || credentials.refreshToken,
      expiresAt,
      details: {
        expiresIn,
        scope: data.scope
      }
    }

  } catch (error) {
    console.error(`[OAuth Refresh] Error refrescando token TikTok:`, error)
    
    return {
      success: false,
      error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Refresh token para WhatsApp (usar Meta API)
 */
async function refreshWhatsAppToken(credentials: WhatsAppCredentials): Promise<RefreshResult> {
  try {
    // WhatsApp usa la misma API que Meta para refresh
    const metaCredentials: MetaCredentials = {
      pageAccessToken: credentials.accessToken,
      pageId: credentials.phoneNumberId, // Usar phoneNumberId como pageId
      expiresAt: credentials.expiresAt,
      refreshToken: (credentials as any).refreshToken,
      savedAt: credentials.savedAt,
      version: credentials.version,
      status: credentials.status
    }

    const result = await refreshMetaToken(metaCredentials)
    
    if (result.success) {
      console.log(`[OAuth Refresh] Token WhatsApp refrescado exitosamente`)
    }

    return result

  } catch (error) {
    console.error(`[OAuth Refresh] Error refrescando token WhatsApp:`, error)
    
    return {
      success: false,
      error: `Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Refresh token genérico basado en el tipo de credenciales
 */
export async function refreshToken(credentials: ChannelCredentials): Promise<RefreshResult> {
  try {
    console.log(`[OAuth Refresh] Iniciando refresh para tipo: ${credentials.constructor.name}`)

    if (isMetaCredentials(credentials)) {
      return await refreshMetaToken(credentials)
    }
    
    if (isTikTokCredentials(credentials)) {
      return await refreshTikTokToken(credentials)
    }
    
    if (isWhatsAppCredentials(credentials)) {
      return await refreshWhatsAppToken(credentials)
    }

    return {
      success: false,
      error: "Tipo de credenciales no soportado para refresh"
    }

  } catch (error) {
    console.error(`[OAuth Refresh] Error general en refresh:`, error)
    
    return {
      success: false,
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Obtiene canales con tokens próximos a expirar
 */
export async function getChannelsNeedingRefresh(
  tenantId: string,
  refreshBeforeMinutes: number = 30
): Promise<TokenExpirationInfo[]> {
  try {
    // Obtener todos los canales activos del tenant
    const channels = await prisma.channel.findMany({
      where: {
        local: { tenantId },
        status: { not: 'INACTIVE' },
        meta: { not: Prisma.JsonNull }
      },
      select: {
        id: true,
        type: true,
        displayName: true,
        meta: true,
        local: {
          select: { name: true }
        }
      }
    })

    const channelsNeedingRefresh: TokenExpirationInfo[] = []

    for (const channel of channels) {
      const meta = channel.meta as any
      if (!meta?.credentials) continue

      const credentials = meta.credentials as ChannelCredentials
      
      // Verificar si necesita refresh
      if (needsRefresh(credentials, refreshBeforeMinutes)) {
        const minutesUntilExpiration = getMinutesUntilExpiration(credentials)
        
        if (minutesUntilExpiration !== null) {
          channelsNeedingRefresh.push({
            channelId: channel.id,
            channelType: channel.type,
            displayName: channel.displayName,
            localName: channel.local.name,
            expiresAt: credentials.expiresAt || '',
            minutesUntilExpiration,
            hasRefreshToken: hasRefreshToken(credentials)
          })
        }
      }
    }

    // Ordenar por tiempo hasta expiración (más urgentes primero)
    channelsNeedingRefresh.sort((a, b) => a.minutesUntilExpiration - b.minutesUntilExpiration)

    console.log(`[OAuth Refresh] Encontrados ${channelsNeedingRefresh.length} canales necesitando refresh`)

    return channelsNeedingRefresh

  } catch (error) {
    console.error(`[OAuth Refresh] Error obteniendo canales para refresh:`, error)
    return []
  }
}

/**
 * Procesa refresh de un canal específico
 */
export async function processChannelRefresh(
  channelId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string; newExpiresAt?: string }> {
  try {
    // 1. Obtener credenciales desencriptadas del canal
    const credentialsResult = await getDecryptedChannelCredentials({ channelId, tenantId })
    
    if (credentialsResult.error) {
      return { success: false, error: credentialsResult.error }
    }

    const { credentials } = credentialsResult

    if (!credentials) {
      return { 
        success: false, 
        error: "No se pudieron obtener las credenciales del canal" 
      }
    }

    // 2. Verificar si tiene refresh token
    if (!hasRefreshToken(credentials)) {
      return { 
        success: false, 
        error: "El canal no tiene refresh token configurado" 
      }
    }

    // 3. Intentar refresh
    const refreshResult = await refreshToken(credentials)

    if (!refreshResult.success) {
      return { 
        success: false, 
        error: refreshResult.error || "Error desconocido en refresh" 
      }
    }

    // 4. Actualizar credenciales en la base de datos
    const updatedCredentials: ChannelCredentials = {
      ...credentials,
      ...(refreshResult.accessToken && { 
        ...(isMetaCredentials(credentials) && { pageAccessToken: refreshResult.accessToken }),
        ...(isWhatsAppCredentials(credentials) && { accessToken: refreshResult.accessToken }),
        ...(isTikTokCredentials(credentials) && { accessToken: refreshResult.accessToken })
      }),
      ...(refreshResult.refreshToken && { refreshToken: refreshResult.refreshToken }),
      ...(refreshResult.expiresAt && { expiresAt: refreshResult.expiresAt }),
      savedAt: new Date().toISOString(),
      status: 'active' as const
    } as ChannelCredentials

    await prisma.channel.update({
      where: { id: channelId },
      data: {
        meta: {
          type: credentialsResult.type,
          credentials: updatedCredentials
        } as any,
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    })

    console.log(`[OAuth Refresh] Canal ${channelId} refrescado exitosamente`)

    return { 
      success: true, 
      newExpiresAt: refreshResult.expiresAt 
    }

  } catch (error) {
    console.error(`[OAuth Refresh] Error procesando refresh del canal ${channelId}:`, error)
    
    return { 
      success: false, 
      error: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` 
    }
  }
}

/**
 * Procesa refresh de múltiples canales
 */
export async function processBatchRefresh(
  tenantId: string,
  channelIds?: string[]
): Promise<{ 
  success: boolean
  processed: number
  succeeded: number
  failed: number
  errors: Array<{ channelId: string; error: string }>
}> {
  try {
    let channelsToProcess: string[]

    if (channelIds) {
      channelsToProcess = channelIds
    } else {
      // Obtener todos los canales que necesitan refresh
      const channelsNeedingRefresh = await getChannelsNeedingRefresh(tenantId)
      channelsToProcess = channelsNeedingRefresh
        .filter(channel => channel.hasRefreshToken)
        .map(channel => channel.channelId)
    }

    console.log(`[OAuth Refresh] Procesando refresh para ${channelsToProcess.length} canales`)

    const results = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ channelId: string; error: string }>
    }

    // Procesar cada canal
    for (const channelId of channelsToProcess) {
      results.processed++
      
      const result = await processChannelRefresh(channelId, tenantId)
      
      if (result.success) {
        results.succeeded++
        console.log(`[OAuth Refresh] ✅ Canal ${channelId} refrescado exitosamente`)
      } else {
        results.failed++
        results.errors.push({ channelId, error: result.error || 'Error desconocido' })
        console.error(`[OAuth Refresh] ❌ Canal ${channelId} falló: ${result.error}`)
      }

      // Pequeño delay entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`[OAuth Refresh] Batch completado: ${results.succeeded}/${results.processed} exitosos`)

    return results

  } catch (error) {
    console.error(`[OAuth Refresh] Error en batch refresh:`, error)
    
    return {
      success: false,
      processed: 0,
      succeeded: 0,
      failed: 1,
      errors: [{ channelId: 'batch', error: error instanceof Error ? error.message : 'Error desconocido' }]
    }
  }
}

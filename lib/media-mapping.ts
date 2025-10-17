import type { Attachment } from "@/lib/adapters/types"

/**
 * Servicio para mapear IDs de media a URLs accesibles
 * Las plataformas externas a menudo devuelven IDs en lugar de URLs directas
 */
export class MediaMappingService {
  
  /**
   * Mapear attachment con ID a URL accesible según la plataforma
   */
  static async mapAttachmentUrl(
    attachment: Attachment,
    platform: string,
    credentials: Record<string, any>
  ): Promise<Attachment> {
    try {
      // Si ya tiene URL directa, no hacer nada
      if (attachment.url && attachment.url.startsWith('http')) {
        return attachment
      }

      // Mapear según la plataforma
      switch (platform.toLowerCase()) {
        case 'whatsapp':
          return await this.mapWhatsAppMedia(attachment, credentials)
        
        case 'instagram':
        case 'facebook':
          return await this.mapMetaMedia(attachment, credentials)
        
        case 'tiktok':
          return await this.mapTikTokMedia(attachment, credentials)
        
        default:
          console.warn(`[MediaMapping] Plataforma no soportada: ${platform}`)
          return attachment
      }
    } catch (error) {
      console.error(`[MediaMapping] Error mapeando URL para ${platform}:`, error)
      return attachment // Retornar original en caso de error
    }
  }

  /**
   * Mapear múltiples attachments
   */
  static async mapAttachments(
    attachments: Attachment[],
    platform: string,
    credentials: Record<string, any>
  ): Promise<Attachment[]> {
    const mappedAttachments = await Promise.all(
      attachments.map(attachment => 
        this.mapAttachmentUrl(attachment, platform, credentials)
      )
    )
    return mappedAttachments
  }

  /**
   * Mapear media de WhatsApp (IDs a URLs)
   */
  private static async mapWhatsAppMedia(
    attachment: Attachment,
    credentials: Record<string, any>
  ): Promise<Attachment> {
    try {
      const { accessToken } = credentials
      
      if (!accessToken || !attachment.url) {
        return attachment
      }

      // WhatsApp devuelve IDs de media, necesitamos obtener la URL
      const mediaId = attachment.url
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`[MediaMapping] Error obteniendo URL de WhatsApp media: ${response.status}`)
        return attachment
      }

      const data = await response.json()
      
      return {
        ...attachment,
        url: data.url || attachment.url,
        mimeType: data.mime_type || attachment.mimeType,
        filename: data.filename || attachment.filename,
      }
    } catch (error) {
      console.error('[MediaMapping] Error mapeando WhatsApp media:', error)
      return attachment
    }
  }

  /**
   * Mapear media de Meta (Instagram/Facebook)
   */
  private static async mapMetaMedia(
    attachment: Attachment,
    credentials: Record<string, any>
  ): Promise<Attachment> {
    try {
      const { accessToken } = credentials
      
      if (!accessToken || !attachment.url) {
        return attachment
      }

      // Meta puede devolver IDs de media o URLs directas
      // Si es un ID, necesitamos obtener la URL
      const mediaId = attachment.url
      
      // Verificar si ya es una URL
      if (mediaId.startsWith('http')) {
        return attachment
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${mediaId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`[MediaMapping] Error obteniendo URL de Meta media: ${response.status}`)
        return attachment
      }

      const data = await response.json()
      
      return {
        ...attachment,
        url: data.url || attachment.url,
        mimeType: data.mime_type || attachment.mimeType,
        filename: data.filename || attachment.filename,
      }
    } catch (error) {
      console.error('[MediaMapping] Error mapeando Meta media:', error)
      return attachment
    }
  }

  /**
   * Mapear media de TikTok
   */
  private static async mapTikTokMedia(
    attachment: Attachment,
    credentials: Record<string, any>
  ): Promise<Attachment> {
    try {
      const { accessToken } = credentials
      
      if (!accessToken || !attachment.url) {
        return attachment
      }

      // TikTok Business API - estructura por definir
      // Por ahora, asumir que las URLs son directas
      // En el futuro, implementar llamada a TikTok API
      
      console.log('[MediaMapping] TikTok media mapping - implementación pendiente')
      return attachment
    } catch (error) {
      console.error('[MediaMapping] Error mapeando TikTok media:', error)
      return attachment
    }
  }

  /**
   * Validar que una URL de media sea accesible
   */
  static async validateMediaUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 10000 // 10 segundos timeout
      })
      return response.ok
    } catch (error) {
      console.warn(`[MediaMapping] URL no accesible: ${url}`, error)
      return false
    }
  }

  /**
   * Obtener información de un archivo de media
   */
  static async getMediaInfo(url: string): Promise<{
    size?: number
    mimeType?: string
    lastModified?: Date
  }> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      
      if (!response.ok) {
        return {}
      }

      return {
        size: response.headers.get('content-length') ? 
          parseInt(response.headers.get('content-length')!) : undefined,
        mimeType: response.headers.get('content-type') || undefined,
        lastModified: response.headers.get('last-modified') ? 
          new Date(response.headers.get('last-modified')!) : undefined,
      }
    } catch (error) {
      console.warn(`[MediaMapping] Error obteniendo info de media: ${url}`, error)
      return {}
    }
  }

  /**
   * Cache de URLs mapeadas para evitar llamadas repetidas
   */
  private static urlCache = new Map<string, { url: string; timestamp: number }>()
  private static CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  static getCachedUrl(mediaId: string): string | null {
    const cached = this.urlCache.get(mediaId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.url
    }
    return null
  }

  static setCachedUrl(mediaId: string, url: string): void {
    this.urlCache.set(mediaId, {
      url,
      timestamp: Date.now()
    })
  }

  /**
   * Limpiar cache expirado
   */
  static cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.urlCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.urlCache.delete(key)
      }
    }
  }
}

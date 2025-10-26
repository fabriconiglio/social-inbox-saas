import { prisma } from "@/lib/prisma"

/**
 * Helper para obtener credenciales de canales desde la base de datos
 * Centraliza la lógica de consulta de credenciales para todos los adapters
 */
export class ChannelCredentialsService {
  
  /**
   * Obtener credenciales de un canal específico
   */
  static async getChannelCredentials(channelId: string): Promise<Record<string, any> | null> {
    try {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: {
          id: true,
          type: true,
          meta: true,
          isActive: true,
          local: {
            select: {
              tenantId: true,
              name: true,
            }
          }
        }
      })

      if (!channel) {
        console.warn(`[ChannelCredentials] Canal no encontrado: ${channelId}`)
        return null
      }

      if (!channel.isActive) {
        console.warn(`[ChannelCredentials] Canal inactivo: ${channelId}`)
        return null
      }

      if (!channel.meta) {
        console.warn(`[ChannelCredentials] Canal sin credenciales: ${channelId}`)
        return null
      }

      console.log(`[ChannelCredentials] Credenciales obtenidas para canal ${channelId} (${channel.type})`)
      return channel.meta as Record<string, any>

    } catch (error) {
      console.error(`[ChannelCredentials] Error obteniendo credenciales del canal ${channelId}:`, error)
      return null
    }
  }

  /**
   * Obtener credenciales con validación adicional
   */
  static async getValidChannelCredentials(channelId: string, requiredFields: string[]): Promise<Record<string, any> | null> {
    const credentials = await this.getChannelCredentials(channelId)
    
    if (!credentials) {
      return null
    }

    // Validar que existan los campos requeridos
    const missingFields = requiredFields.filter(field => !credentials[field])
    
    if (missingFields.length > 0) {
      console.error(`[ChannelCredentials] Faltan campos requeridos en canal ${channelId}:`, missingFields)
      return null
    }

    return credentials
  }

  /**
   * Obtener credenciales específicas para WhatsApp
   */
  static async getWhatsAppCredentials(channelId: string): Promise<{ phoneId: string; accessToken: string; businessId?: string } | null> {
    return await this.getValidChannelCredentials(channelId, ['phoneId', 'accessToken']) as any
  }

  /**
   * Obtener credenciales específicas para Instagram/Facebook
   */
  static async getMetaCredentials(channelId: string): Promise<{ pageId: string; accessToken: string } | null> {
    return await this.getValidChannelCredentials(channelId, ['pageId', 'accessToken']) as any
  }

  /**
   * Obtener credenciales específicas para TikTok
   */
  static async getTikTokCredentials(channelId: string): Promise<{ accessToken: string; appId?: string; appSecret?: string } | null> {
    return await this.getValidChannelCredentials(channelId, ['accessToken']) as any
  }

  /**
   * Verificar si un canal tiene credenciales válidas
   */
  static async hasValidCredentials(channelId: string): Promise<boolean> {
    const credentials = await this.getChannelCredentials(channelId)
    return credentials !== null
  }

  /**
   * Obtener información del canal junto con credenciales
   */
  static async getChannelWithCredentials(channelId: string): Promise<{
    id: string
    type: string
    isActive: boolean
    tenantId: string
    localName: string
    credentials: Record<string, any> | null
  } | null> {
    try {
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: {
          id: true,
          type: true,
          meta: true,
          isActive: true,
          local: {
            select: {
              tenantId: true,
              name: true,
            }
          }
        }
      })

      if (!channel) {
        return null
      }

      return {
        id: channel.id,
        type: channel.type,
        isActive: channel.isActive,
        tenantId: channel.local.tenantId,
        localName: channel.local.name,
        credentials: channel.meta as Record<string, any> || null
      }

    } catch (error) {
      console.error(`[ChannelCredentials] Error obteniendo canal con credenciales ${channelId}:`, error)
      return null
    }
  }

  /**
   * Cache de credenciales para evitar consultas repetidas
   */
  private static credentialsCache = new Map<string, { credentials: Record<string, any>; timestamp: number }>()
  private static CACHE_TTL = 2 * 60 * 1000 // 2 minutos

  /**
   * Obtener credenciales con cache
   */
  static async getCachedChannelCredentials(channelId: string): Promise<Record<string, any> | null> {
    // Verificar cache
    const cached = this.credentialsCache.get(channelId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.credentials
    }

    // Obtener desde BD
    const credentials = await this.getChannelCredentials(channelId)
    
    // Actualizar cache
    if (credentials) {
      this.credentialsCache.set(channelId, {
        credentials,
        timestamp: Date.now()
      })
    }

    return credentials
  }

  /**
   * Invalidar cache de un canal específico
   */
  static invalidateChannelCache(channelId: string): void {
    this.credentialsCache.delete(channelId)
  }

  /**
   * Limpiar cache expirado
   */
  static cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.credentialsCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.credentialsCache.delete(key)
      }
    }
  }

  /**
   * Limpiar todo el cache
   */
  static clearCache(): void {
    this.credentialsCache.clear()
  }

  /**
   * Guardar credenciales de un canal
   */
  static async saveChannelCredentials(data: {
    channelId: string
    tenantId: string
    credentials: Record<string, any>
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await prisma.channel.update({
        where: { id: data.channelId },
        data: {
          meta: data.credentials,
          updatedAt: new Date()
        }
      })

      // Invalidar cache
      this.invalidateChannelCache(data.channelId)

      console.log(`[ChannelCredentials] Credenciales guardadas para canal ${data.channelId}`)
      return { success: true }

    } catch (error) {
      console.error(`[ChannelCredentials] Error guardando credenciales del canal ${data.channelId}:`, error)
      return { success: false, error: "Error al guardar credenciales" }
    }
  }

  /**
   * Validar credenciales almacenadas
   */
  static async validateStoredCredentials(data: {
    channelId: string
    tenantId: string
  }): Promise<{ success: boolean; error?: string; valid?: boolean }> {
    try {
      const credentials = await this.getChannelCredentials(data.channelId)
      
      if (!credentials) {
        return { success: false, error: "No se encontraron credenciales" }
      }

      // Aquí podrías agregar validación específica según el tipo de canal
      // Por ahora, solo verificamos que existan
      const hasRequiredFields = Object.keys(credentials).length > 0
      
      return { 
        success: true, 
        valid: hasRequiredFields 
      }

    } catch (error) {
      console.error(`[ChannelCredentials] Error validando credenciales del canal ${data.channelId}:`, error)
      return { success: false, error: "Error al validar credenciales" }
    }
  }

  /**
   * Obtener canales con credenciales expiradas
   */
  static async getExpiredCredentials(tenantId: string): Promise<{
    success: boolean
    data?: any[]
    error?: string
  }> {
    try {
      const channels = await prisma.channel.findMany({
        where: {
          local: {
            tenantId: tenantId
          },
          isActive: true
        },
        select: {
          id: true,
          type: true,
          meta: true,
          updatedAt: true,
          local: {
            select: {
              name: true
            }
          }
        }
      })

      // Filtrar canales con credenciales que podrían estar expiradas
      // Esto es una implementación básica - podrías agregar lógica más sofisticada
      const expiredChannels = channels.filter(channel => {
        if (!channel.meta) return true
        
        // Verificar si las credenciales son muy antiguas (más de 30 días)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        return channel.updatedAt < thirtyDaysAgo
      })

      return {
        success: true,
        data: expiredChannels.map(channel => ({
          id: channel.id,
          type: channel.type,
          name: channel.local.name,
          lastUpdated: channel.updatedAt,
          hasCredentials: !!channel.meta
        }))
      }

    } catch (error) {
      console.error(`[ChannelCredentials] Error obteniendo credenciales expiradas para tenant ${tenantId}:`, error)
      return { success: false, error: "Error al obtener credenciales expiradas" }
    }
  }
}
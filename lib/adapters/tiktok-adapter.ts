import type { 
  ChannelAdapter, 
  MessageDTO, 
  SendMessageDTO, 
  ThreadDTO, 
  Attachment,
  ValidationResult,
  AdapterResult
} from "./types"
import { verifyTikTokWebhook } from "@/lib/webhook-verification"
import { MediaMappingService } from "@/lib/media-mapping"
import { ChannelCredentialsService } from "@/lib/channel-credentials"

export class TikTokAdapter implements ChannelAdapter {
  type = "tiktok"

  /**
   * Obtener credenciales del canal desde la base de datos
   */
  private async getChannelCredentials(channelId: string): Promise<Record<string, any> | null> {
    return await ChannelCredentialsService.getTikTokCredentials(channelId)
  }

  async subscribeWebhooks(channelId: string, webhookUrl: string): Promise<AdapterResult<void>> {
    console.log(`[TikTok] Webhook subscription for channel ${channelId}: ${webhookUrl}`)
    return { success: true }
  }

  async ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null> {
    try {
      // TikTok webhook structure (placeholder - actual structure may vary)
      const message = payload.message
      if (!message) return null

      const attachments: Attachment[] = []

      // Manejar adjuntos si existen
      if (message.media) {
        const media = message.media
        if (media.type === "image") {
          attachments.push({
            type: "image",
            url: media.url,
            mimeType: media.mime_type,
          })
        } else if (media.type === "video") {
          attachments.push({
            type: "video",
            url: media.url,
            mimeType: media.mime_type,
          })
        } else if (media.type === "audio") {
          attachments.push({
            type: "audio",
            url: media.url,
            mimeType: media.mime_type,
          })
        } else if (media.type === "file") {
          attachments.push({
            type: "file",
            url: media.url,
            mimeType: media.mime_type,
            filename: media.filename,
          })
        }
      }

      // Mapear URLs de media si hay adjuntos
      let mappedAttachments: Attachment[] | undefined
      if (attachments.length > 0) {
        const credentials = await this.getChannelCredentials(channelId)
        
        if (credentials) {
          mappedAttachments = await MediaMappingService.mapAttachments(
            attachments,
            'tiktok',
            credentials
          )
        } else {
          console.warn("[TikTok] No se pudieron obtener credenciales para mapear URLs de media")
          mappedAttachments = attachments
        }
      }

      return {
        externalId: message.message_id || `tiktok_${Date.now()}`,
        body: message.text || "",
        attachments: mappedAttachments,
        sentAt: new Date(message.timestamp || Date.now()),
        senderHandle: message.sender_id || "unknown",
        senderName: message.sender_name,
        threadExternalId: message.conversation_id || message.sender_id,
      }
    } catch (error) {
      console.error("[TikTok] Error ingesting webhook:", error)
      return null
    }
  }

  async sendMessage(
    channelId: string,
    message: SendMessageDTO,
    credentials: Record<string, any>,
  ): Promise<AdapterResult<{ externalId: string }>> {
    try {
      const { accessToken } = credentials

      // Validar que existan las credenciales necesarias
      if (!accessToken) {
        return { 
          success: false, 
          error: {
            type: "VALIDATION" as any,
            message: "Credenciales faltantes: accessToken es requerido",
            retryable: false
          }
        }
      }

      // Preparar el payload del mensaje
      let messagePayload: any = {
        recipient: { user_id: message.threadExternalId },
        message: {
          text: message.body,
        },
        access_token: accessToken,
      }

      // Si hay adjuntos, agregar información del adjunto
      if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0]
        
        // TikTok Business API soporta diferentes tipos de media
        if (attachment.type === "image") {
          messagePayload.message.media = {
            type: "image",
            url: attachment.url,
          }
        } else if (attachment.type === "video") {
          messagePayload.message.media = {
            type: "video", 
            url: attachment.url,
          }
        } else if (attachment.type === "audio") {
          messagePayload.message.media = {
            type: "audio",
            url: attachment.url,
          }
        } else if (attachment.type === "file") {
          messagePayload.message.media = {
            type: "file",
            url: attachment.url,
            filename: attachment.filename,
          }
        }
      }

      // TODO: Implementar llamada real a TikTok Business API
      // Por ahora, simular respuesta exitosa
      console.log("[TikTok] Sending message with payload:", messagePayload)
      
      // Simular ID de mensaje
      const mockMessageId = `tiktok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return { 
        success: true, 
        data: { externalId: mockMessageId }
      }
    } catch (error) {
      console.error("[TikTok] Error sending message:", error)
      return { 
        success: false, 
        error: {
          type: "UNKNOWN" as any,
          message: `Error enviando mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          retryable: true
        }
      }
    }
  }

  async listThreads(channelId: string, credentials: Record<string, any>): Promise<AdapterResult<ThreadDTO[]>> {
    return { success: true, data: [] }
  }

  verifyWebhook(payload: string, signature: string, webhookSecret?: string): boolean {
    try {
      if (!webhookSecret) {
        console.warn("[TikTok] No webhook secret provided, skipping verification")
        return true // En desarrollo, permitir sin verificación
      }

      const isValid = verifyTikTokWebhook(payload, signature, webhookSecret)
      
      if (!isValid) {
        console.error("[TikTok] Webhook verification failed", {
          hasSignature: !!signature,
          payloadLength: payload.length,
          hasSecret: !!webhookSecret
        })
      }

      return isValid
    } catch (error) {
      console.error("[TikTok] Error verifying webhook:", error)
      return false
    }
  }

  // Validar credenciales de TikTok for Business
  async validateCredentials(config: Record<string, any>): Promise<ValidationResult> {
    try {
      const { appId, appSecret, accessToken } = config

      // Validar que existan los campos requeridos
      if (!appId || !appSecret || !accessToken) {
        return {
          valid: false,
          error: "Faltan campos requeridos: App ID, App Secret y Access Token son obligatorios",
        }
      }

      // Por ahora, solo validamos que los campos existan
      // En producción, se haría una llamada a la API de TikTok para validar
      // Ejemplo: https://business-api.tiktok.com/open_api/v1.3/oauth2/user/info/
      
      // Placeholder para validación futura con la API real de TikTok
      return {
        valid: true,
        details: {
          appId,
          message: "Validación básica completada. Validación con API de TikTok pendiente de implementación.",
        },
      }
    } catch (error) {
      console.error("[TikTok] Error validando credenciales:", error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Error de conexión al validar credenciales",
      }
    }
  }
}

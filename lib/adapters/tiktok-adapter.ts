import type { 
  ChannelAdapter, 
  MessageDTO, 
  SendMessageDTO, 
  ThreadDTO, 
  ValidationResult,
  AdapterResult
} from "./types"
import { verifyTikTokWebhook } from "@/lib/webhook-verification"

export class TikTokAdapter implements ChannelAdapter {
  type = "tiktok"

  async subscribeWebhooks(channelId: string, webhookUrl: string): Promise<AdapterResult<void>> {
    console.log(`[TikTok] Webhook subscription for channel ${channelId}: ${webhookUrl}`)
    return { success: true }
  }

  async ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null> {
    try {
      // TikTok webhook structure (placeholder - actual structure may vary)
      const message = payload.message
      if (!message) return null

      return {
        externalId: message.message_id || `tiktok_${Date.now()}`,
        body: message.text || "",
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
    // TikTok API implementation would go here
    console.log("[TikTok] Sending message:", message)
    console.log("[TikTok] Credentials:", credentials)
    return { 
      success: false, 
      error: {
        type: "UNKNOWN" as any,
        message: "TikTok API not implemented",
        retryable: false
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

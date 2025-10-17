import type { 
  ChannelAdapter, 
  MessageDTO, 
  SendMessageDTO, 
  ThreadDTO, 
  Attachment, 
  ValidationResult,
  AdapterResult
} from "./types"
import { ErrorType } from "./types"
import { 
  createAdapterError, 
  analyzeApiError, 
  analyzeMetaError, 
  logAdapterError 
} from "./error-handler"
import { verifyMetaWebhook } from "@/lib/webhook-verification"
import { MediaMappingService } from "@/lib/media-mapping"
import { ChannelCredentialsService } from "@/lib/channel-credentials"

export class WhatsAppCloudAdapter implements ChannelAdapter {
  type = "whatsapp"

  /**
   * Obtener credenciales del canal desde la base de datos
   */
  private async getChannelCredentials(channelId: string): Promise<Record<string, any> | null> {
    return await ChannelCredentialsService.getWhatsAppCredentials(channelId)
  }

  async subscribeWebhooks(channelId: string, webhookUrl: string): Promise<AdapterResult<void>> {
    try {
      console.log(`[WhatsApp] Webhook subscription for channel ${channelId}: ${webhookUrl}`)
      return { success: true }
    } catch (error) {
      const adapterError = analyzeApiError(error, "WhatsApp", "subscribeWebhooks")
      logAdapterError("WhatsApp", "subscribeWebhooks", adapterError, channelId)
      return { success: false, error: adapterError }
    }
  }

  async ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null> {
    try {
      if (payload.object !== "whatsapp_business_account") return null

      const entry = payload.entry?.[0]
      if (!entry) return null

      const change = entry.changes?.[0]
      if (!change || change.field !== "messages") return null

      const message = change.value?.messages?.[0]
      if (!message) return null

      const attachments: Attachment[] = []

      // Handle different message types
      let body = ""
      if (message.type === "text") {
        body = message.text?.body || ""
      } else if (message.type === "image") {
        const attachment: Attachment = {
          type: "image",
          url: message.image?.id || "",
          mimeType: message.image?.mime_type,
        }
        attachments.push(attachment)
        body = message.image?.caption || ""
      } else if (message.type === "video") {
        const attachment: Attachment = {
          type: "video",
          url: message.video?.id || "",
          mimeType: message.video?.mime_type,
        }
        attachments.push(attachment)
        body = message.video?.caption || ""
      } else if (message.type === "document") {
        const attachment: Attachment = {
          type: "file",
          url: message.document?.id || "",
          mimeType: message.document?.mime_type,
          filename: message.document?.filename,
        }
        attachments.push(attachment)
        body = message.document?.caption || ""
      }

      // Mapear URLs de media si hay adjuntos
      let mappedAttachments: Attachment[] | undefined
      if (attachments.length > 0) {
        // Obtener credenciales del canal para mapear URLs
        // En un escenario real, esto vendría de la base de datos
        const credentials = await this.getChannelCredentials(channelId)
        
        if (credentials) {
          mappedAttachments = await MediaMappingService.mapAttachments(
            attachments,
            'whatsapp',
            credentials
          )
        } else {
          console.warn("[WhatsApp] No se pudieron obtener credenciales para mapear URLs de media")
          mappedAttachments = attachments
        }
      }

      return {
        externalId: message.id,
        body,
        attachments: mappedAttachments,
        sentAt: new Date(Number.parseInt(message.timestamp) * 1000),
        senderHandle: message.from,
        threadExternalId: message.from,
      }
    } catch (error) {
      console.error("[WhatsApp] Error ingesting webhook:", error)
      return null
    }
  }

  async sendMessage(
    channelId: string,
    message: SendMessageDTO,
    credentials: Record<string, any>,
  ): Promise<AdapterResult<{ externalId: string }>> {
    try {
      const { phoneId, accessToken } = credentials

      // Validar que existan las credenciales necesarias
      if (!phoneId || !accessToken) {
        const error = createAdapterError(
          ErrorType.VALIDATION,
          "Credenciales faltantes: phoneId y accessToken son requeridos",
          { details: { channelId, hasPhoneId: !!phoneId, hasAccessToken: !!accessToken } }
        )
        logAdapterError("WhatsApp", "sendMessage", error, channelId)
        return { success: false, error }
      }

      // Validar longitud del mensaje
      if (message.body.length > 4096) {
        const error = createAdapterError(
          ErrorType.MESSAGE_TOO_LONG,
          "El mensaje excede el límite de 4096 caracteres de WhatsApp",
          { details: { channelId, messageLength: message.body.length } }
        )
        logAdapterError("WhatsApp", "sendMessage", error, channelId)
        return { success: false, error }
      }

      // Preparar el payload del mensaje
      let messagePayload: any = {
        messaging_product: "whatsapp",
        to: message.threadExternalId,
      }

      // Si hay adjuntos, enviar el primer adjunto como mensaje principal
      if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0]
        
        // Determinar el tipo de mensaje basado en el adjunto
        if (attachment.type === "image") {
          messagePayload.type = "image"
          messagePayload.image = {
            link: attachment.url,
          }
          if (message.body) {
            messagePayload.image.caption = message.body
          }
        } else if (attachment.type === "video") {
          messagePayload.type = "video"
          messagePayload.video = {
            link: attachment.url,
          }
          if (message.body) {
            messagePayload.video.caption = message.body
          }
        } else if (attachment.type === "audio") {
          messagePayload.type = "audio"
          messagePayload.audio = {
            link: attachment.url,
          }
        } else if (attachment.type === "file") {
          messagePayload.type = "document"
          messagePayload.document = {
            link: attachment.url,
          }
          if (attachment.filename) {
            messagePayload.document.filename = attachment.filename
          }
          if (message.body) {
            messagePayload.document.caption = message.body
          }
        }
      } else {
        // Mensaje de texto simple
        messagePayload.type = "text"
        messagePayload.text = {
          body: message.body,
        }
      }

      // Enviar mensaje usando WhatsApp Cloud API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(messagePayload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const adapterError = analyzeMetaError(errorData, "WhatsApp", "sendMessage")
        logAdapterError("WhatsApp", "sendMessage", adapterError, channelId, {
          statusCode: response.status,
          threadExternalId: message.threadExternalId,
          messageLength: message.body.length
        })
        return { success: false, error: adapterError }
      }

      const data = await response.json()
      
      if (!data.messages?.[0]?.id) {
        const error = createAdapterError(
          ErrorType.API,
          "WhatsApp no devolvió un ID de mensaje válido",
          { 
            originalError: data,
            details: { channelId, response: data }
          }
        )
        logAdapterError("WhatsApp", "sendMessage", error, channelId)
        return { success: false, error }
      }

      return { 
        success: true, 
        data: { externalId: data.messages[0].id }
      }
    } catch (error) {
      const adapterError = analyzeApiError(error, "WhatsApp", "sendMessage")
      logAdapterError("WhatsApp", "sendMessage", adapterError, channelId, {
        threadExternalId: message.threadExternalId,
        messageLength: message.body.length
      })
      return { success: false, error: adapterError }
    }
  }

  async listThreads(channelId: string, credentials: Record<string, any>): Promise<AdapterResult<ThreadDTO[]>> {
    // WhatsApp Cloud API no tiene un endpoint directo para listar conversaciones
    // Las conversaciones se obtienen a través de los webhooks de mensajes entrantes
    console.log("[WhatsApp] listThreads not supported - conversations come from webhooks")
    return { success: true, data: [] }
  }

  verifyWebhook(payload: string, signature: string, webhookSecret?: string): boolean {
    try {
      if (!webhookSecret) {
        console.warn("[WhatsApp] No webhook secret provided, skipping verification")
        return true // En desarrollo, permitir sin verificación
      }

      const isValid = verifyMetaWebhook(payload, signature, webhookSecret)
      
      if (!isValid) {
        console.error("[WhatsApp] Webhook verification failed", {
          hasSignature: !!signature,
          payloadLength: payload.length,
          hasSecret: !!webhookSecret
        })
      }

      return isValid
    } catch (error) {
      console.error("[WhatsApp] Error verifying webhook:", error)
      return false
    }
  }

  // Validar credenciales de WhatsApp Cloud API
  async validateCredentials(config: Record<string, any>): Promise<ValidationResult> {
    try {
      const { phoneId, accessToken, businessId } = config

      // Validar que existan los campos requeridos
      if (!phoneId || !accessToken) {
        return {
          valid: false,
          error: "Faltan campos requeridos: Phone ID y Access Token son obligatorios",
        }
      }

      // Intentar hacer una llamada a la API para validar las credenciales
      // Usamos el endpoint de obtener información del número de teléfono
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}?fields=id,display_phone_number,verified_name`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || `Error ${response.status}: ${response.statusText}`
        
        return {
          valid: false,
          error: `Credenciales inválidas: ${errorMessage}`,
        }
      }

      const data = await response.json()

      // Validar que el Business Account ID coincida si se proporcionó
      if (businessId) {
        // Verificar que el business account sea accesible
        const businessResponse = await fetch(
          `https://graph.facebook.com/v18.0/${businessId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!businessResponse.ok) {
          return {
            valid: false,
            error: "Business Account ID inválido o no accesible con este token",
          }
        }
      }

      return {
        valid: true,
        details: {
          phoneNumber: data.display_phone_number,
          verifiedName: data.verified_name,
        },
      }
    } catch (error) {
      console.error("[WhatsApp] Error validando credenciales:", error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Error de conexión al validar credenciales",
      }
    }
  }
}

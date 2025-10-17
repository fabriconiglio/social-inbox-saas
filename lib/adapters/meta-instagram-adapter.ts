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

export class MetaInstagramAdapter implements ChannelAdapter {
  type = "instagram"

  /**
   * Obtener credenciales del canal desde la base de datos
   */
  private async getChannelCredentials(channelId: string): Promise<Record<string, any> | null> {
    return await ChannelCredentialsService.getMetaCredentials(channelId)
  }

  async subscribeWebhooks(channelId: string, webhookUrl: string): Promise<AdapterResult<void>> {
    try {
      // In production, this would call Meta Graph API to subscribe to webhooks
      // For now, this is a stub - webhooks are configured in Meta App Dashboard
      console.log(`[Instagram] Webhook subscription for channel ${channelId}: ${webhookUrl}`)
      return { success: true }
    } catch (error) {
      const adapterError = analyzeApiError(error, "Instagram", "subscribeWebhooks")
      logAdapterError("Instagram", "subscribeWebhooks", adapterError, channelId)
      return { success: false, error: adapterError }
    }
  }

  async ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null> {
    try {
      // Meta webhook structure for Instagram messages
      if (payload.object !== "instagram") return null

      const entry = payload.entry?.[0]
      if (!entry) return null

      const messaging = entry.messaging?.[0]
      if (!messaging) return null

      const message = messaging.message
      if (!message) return null

      const attachments: Attachment[] = []

      // Handle attachments
      if (message.attachments) {
        for (const att of message.attachments) {
          const attachment: Attachment = {
            type: att.type || "file",
            url: att.payload?.url || "",
            mimeType: att.payload?.mime_type,
          }
          attachments.push(attachment)
        }
      }

      // Mapear URLs de media si hay adjuntos
      let mappedAttachments: Attachment[] | undefined
      if (attachments.length > 0) {
        const credentials = await this.getChannelCredentials(channelId)
        
        if (credentials) {
          mappedAttachments = await MediaMappingService.mapAttachments(
            attachments,
            'instagram',
            credentials
          )
        } else {
          console.warn("[Instagram] No se pudieron obtener credenciales para mapear URLs de media")
          mappedAttachments = attachments
        }
      }

      return {
        externalId: message.mid,
        body: message.text || "",
        attachments: mappedAttachments,
        sentAt: new Date(messaging.timestamp),
        senderHandle: messaging.sender.id,
        threadExternalId: messaging.sender.id, // Instagram uses sender ID as thread ID
      }
    } catch (error) {
      console.error("[Instagram] Error ingesting webhook:", error)
      return null
    }
  }

  async sendMessage(
    channelId: string,
    message: SendMessageDTO,
    credentials: Record<string, any>,
  ): Promise<AdapterResult<{ externalId: string }>> {
    try {
      const { pageId, accessToken } = credentials

      // Validar que existan las credenciales necesarias
      if (!pageId || !accessToken) {
        const error = createAdapterError(
          ErrorType.VALIDATION,
          "Credenciales faltantes: pageId y accessToken son requeridos",
          { details: { channelId, hasPageId: !!pageId, hasAccessToken: !!accessToken } }
        )
        logAdapterError("Instagram", "sendMessage", error, channelId)
        return { success: false, error }
      }

      // Validar longitud del mensaje
      if (message.body.length > 2000) {
        const error = createAdapterError(
          ErrorType.MESSAGE_TOO_LONG,
          "El mensaje excede el límite de 2000 caracteres de Instagram",
          { details: { channelId, messageLength: message.body.length } }
        )
        logAdapterError("Instagram", "sendMessage", error, channelId)
        return { success: false, error }
      }

      // Preparar el mensaje
      let messagePayload: any = {
        recipient: { id: message.threadExternalId },
        access_token: accessToken,
      }

      // Si hay adjuntos, enviar el primer adjunto como mensaje principal
      if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0]
        
        // Instagram Messenger API soporta diferentes tipos de adjuntos
        if (attachment.type === "image") {
          messagePayload.message = {
            attachment: {
              type: "image",
              payload: {
                url: attachment.url,
              },
            },
          }
          if (message.body) {
            messagePayload.message.text = message.body
          }
        } else if (attachment.type === "video") {
          messagePayload.message = {
            attachment: {
              type: "video",
              payload: {
                url: attachment.url,
              },
            },
          }
          if (message.body) {
            messagePayload.message.text = message.body
          }
        } else if (attachment.type === "audio") {
          messagePayload.message = {
            attachment: {
              type: "audio",
              payload: {
                url: attachment.url,
              },
            },
          }
        } else if (attachment.type === "file") {
          messagePayload.message = {
            attachment: {
              type: "file",
              payload: {
                url: attachment.url,
              },
            },
          }
          if (message.body) {
            messagePayload.message.text = message.body
          }
        }
      } else {
        // Mensaje de texto simple
        messagePayload.message = {
          text: message.body,
        }
      }

      // Enviar mensaje usando Instagram Messenger API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const adapterError = analyzeMetaError(errorData, "Instagram", "sendMessage")
        logAdapterError("Instagram", "sendMessage", adapterError, channelId, {
          statusCode: response.status,
          threadExternalId: message.threadExternalId,
          messageLength: message.body.length
        })
        return { success: false, error: adapterError }
      }

      const data = await response.json()
      
      if (!data.message_id) {
        const error = createAdapterError(
          ErrorType.API,
          "Instagram no devolvió un ID de mensaje válido",
          { 
            originalError: data,
            details: { channelId, response: data }
          }
        )
        logAdapterError("Instagram", "sendMessage", error, channelId)
        return { success: false, error }
      }

      return { 
        success: true, 
        data: { externalId: data.message_id }
      }
    } catch (error) {
      const adapterError = analyzeApiError(error, "Instagram", "sendMessage")
      logAdapterError("Instagram", "sendMessage", adapterError, channelId, {
        threadExternalId: message.threadExternalId,
        messageLength: message.body.length
      })
      return { success: false, error: adapterError }
    }
  }

  async listThreads(channelId: string, credentials: Record<string, any>): Promise<AdapterResult<ThreadDTO[]>> {
    try {
      const { pageId, accessToken } = credentials

      if (!pageId || !accessToken) {
        const error = createAdapterError(
          ErrorType.VALIDATION,
          "Credenciales faltantes para listar conversaciones de Instagram",
          { details: { channelId, hasPageId: !!pageId, hasAccessToken: !!accessToken } }
        )
        logAdapterError("Instagram", "listThreads", error, channelId)
        return { success: false, error, data: [] }
      }

      // Obtener conversaciones de Instagram usando Graph API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/conversations?platform=instagram&access_token=${accessToken}`,
        {
          method: "GET",
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const adapterError = analyzeMetaError(errorData, "Instagram", "listThreads")
        logAdapterError("Instagram", "listThreads", adapterError, channelId, {
          statusCode: response.status
        })
        return { success: false, error: adapterError, data: [] }
      }

      const data = await response.json()
      const threads: ThreadDTO[] = []

      for (const conversation of data.data || []) {
        try {
          // Obtener detalles de cada conversación
          const participantId = conversation.participants?.data?.[0]?.id
          if (!participantId) continue

          threads.push({
            externalId: conversation.id,
            participantHandle: participantId,
            participantName: conversation.participants?.data?.[0]?.name,
            lastMessageAt: new Date(conversation.updated_time || Date.now()),
          })
        } catch (conversationError) {
          console.warn("[Instagram] Error procesando conversación:", conversationError)
          // Continuar con las demás conversaciones
        }
      }

      return { success: true, data: threads }
    } catch (error) {
      const adapterError = analyzeApiError(error, "Instagram", "listThreads")
      logAdapterError("Instagram", "listThreads", adapterError, channelId)
      return { success: false, error: adapterError, data: [] }
    }
  }

  verifyWebhook(payload: string, signature: string, webhookSecret?: string): boolean {
    try {
      if (!webhookSecret) {
        console.warn("[Instagram] No webhook secret provided, skipping verification")
        return true // En desarrollo, permitir sin verificación
      }

      const isValid = verifyMetaWebhook(payload, signature, webhookSecret)
      
      if (!isValid) {
        console.error("[Instagram] Webhook verification failed", {
          hasSignature: !!signature,
          payloadLength: payload.length,
          hasSecret: !!webhookSecret
        })
      }

      return isValid
    } catch (error) {
      console.error("[Instagram] Error verifying webhook:", error)
      return false
    }
  }

  // Validar credenciales de Instagram
  async validateCredentials(config: Record<string, any>): Promise<ValidationResult> {
    try {
      const { pageId, accessToken } = config

      // Validar que existan los campos requeridos
      if (!pageId || !accessToken) {
        const error = createAdapterError(
          ErrorType.VALIDATION,
          "Faltan campos requeridos: Page ID y Access Token son obligatorios",
          { details: { hasPageId: !!pageId, hasAccessToken: !!accessToken } }
        )
        logAdapterError("Instagram", "validateCredentials", error)
        return {
          valid: false,
          error: error.message,
        }
      }

      // Verificar que el Page ID sea válido y tenga permisos de Instagram
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,instagram_business_account`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const adapterError = analyzeMetaError(errorData, "Instagram", "validateCredentials")
        logAdapterError("Instagram", "validateCredentials", adapterError, undefined, {
          statusCode: response.status,
          pageId
        })
        
        return {
          valid: false,
          error: adapterError.message,
        }
      }

      const data = await response.json()

      // Verificar que la página tenga una cuenta de Instagram Business conectada
      if (!data.instagram_business_account) {
        const error = createAdapterError(
          ErrorType.VALIDATION,
          "Esta página de Facebook no tiene una cuenta de Instagram Business conectada",
          { details: { pageId, pageName: data.name } }
        )
        logAdapterError("Instagram", "validateCredentials", error)
        return {
          valid: false,
          error: error.message,
        }
      }

      // Verificar permisos del token
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/permissions`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        const requiredPermissions = ['pages_messaging', 'instagram_manage_messages', 'pages_manage_metadata']
        const grantedPermissions = permissionsData.data
          ?.filter((p: any) => p.status === 'granted')
          ?.map((p: any) => p.permission) || []

        const missingPermissions = requiredPermissions.filter(p => !grantedPermissions.includes(p))
        
        if (missingPermissions.length > 0) {
          const error = createAdapterError(
            ErrorType.PERMISSION_DENIED,
            `Faltan permisos: ${missingPermissions.join(', ')}`,
            { details: { missingPermissions, grantedPermissions } }
          )
          logAdapterError("Instagram", "validateCredentials", error)
          return {
            valid: false,
            error: error.message,
          }
        }
      }

      return {
        valid: true,
        details: {
          pageName: data.name,
          pageId: data.id,
          instagramAccountId: data.instagram_business_account.id,
        },
      }
    } catch (error) {
      const adapterError = analyzeApiError(error, "Instagram", "validateCredentials")
      logAdapterError("Instagram", "validateCredentials", adapterError)
      return {
        valid: false,
        error: adapterError.message,
      }
    }
  }
}




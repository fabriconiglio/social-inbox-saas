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
import axios from "axios"

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
      console.log("[Instagram] Processing webhook payload:", JSON.stringify(payload, null, 2))
      
      // Meta webhook structure for Instagram messages
      if (payload.object !== "instagram") {
        console.log(`[Instagram] Payload object is '${payload.object}', expected 'instagram'`)
        return null
      }

      const entry = payload.entry?.[0]
      if (!entry) {
        console.log("[Instagram] No entry found in payload")
        return null
      }

      console.log("[Instagram] Entry found:", JSON.stringify(entry, null, 2))

      const messaging = entry.messaging?.[0]
      if (!messaging) {
        console.log("[Instagram] No messaging found in entry")
        return null
      }

      console.log("[Instagram] Messaging object keys:", Object.keys(messaging))
      console.log("[Instagram] Full messaging object:", JSON.stringify(messaging, null, 2))

      // Instagram puede enviar diferentes tipos de eventos:
      // - message: mensaje nuevo
      // - message_edit: edición de mensaje
      // - message_reaction: reacción a mensaje
      // - read: marcado como leído
      // Por ahora solo procesamos mensajes nuevos
      const message = messaging.message
      if (!message) {
        // Verificar qué tipo de evento es
        if (messaging.message_edit) {
          console.log("[Instagram] Received message_edit event (not processing)")
          return null
        }
        if (messaging.message_reaction) {
          console.log("[Instagram] Received message_reaction event (not processing)")
          return null
        }
        if (messaging.read) {
          console.log("[Instagram] Received read event (not processing)")
          return null
        }
        if (messaging.delivery) {
          console.log("[Instagram] Received delivery event (not processing)")
          return null
        }
        console.log("[Instagram] No message found in messaging and no recognized event type")
        console.log("[Instagram] Available keys in messaging:", Object.keys(messaging))
        return null
      }

      console.log("[Instagram] Message found:", JSON.stringify(message, null, 2))

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

      console.log("[Instagram] Enviando mensaje:", {
        channelId,
        pageId,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        threadExternalId: message.threadExternalId,
        messageLength: message.body.length
      })

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

      console.log("[Instagram] Payload a enviar:", JSON.stringify(messagePayload, null, 2))

      // Enviar mensaje usando Instagram Messenger API con axios
      try {
        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/messages`,
          messagePayload,
          {
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "MessageHub/1.0",
            },
            timeout: 30000, // 30 segundos timeout
            validateStatus: (status) => status < 500, // No lanzar error para códigos 4xx
          }
        )

        if (response.status >= 400) {
          const errorData = response.data || {}
          console.error("[Instagram] Error de API:", {
            status: response.status,
            error: errorData,
            pageId,
            threadExternalId: message.threadExternalId
          })
          
          const adapterError = analyzeMetaError(errorData, "Instagram", "sendMessage")
          logAdapterError("Instagram", "sendMessage", adapterError, channelId, {
            statusCode: response.status,
            threadExternalId: message.threadExternalId,
            messageLength: message.body.length,
            errorData
          })
          return { success: false, error: adapterError }
        }

        const data = response.data

        console.log("[Instagram] Respuesta completa de API:", JSON.stringify(data, null, 2))
        console.log("[Instagram] Status code:", response.status)
        console.log("[Instagram] Headers:", JSON.stringify(response.headers, null, 2))

        // Instagram puede devolver el message_id en diferentes formatos
        // Intentar diferentes campos posibles
        const messageId = data.message_id || data.id || data.mid || data.messageId

        if (!messageId) {
          // Si no hay message_id pero la respuesta fue exitosa (200), puede ser un problema de formato
          // o que Instagram aceptó el mensaje pero no devolvió el ID
          console.warn("[Instagram] Respuesta exitosa pero sin message_id:", {
            responseData: data,
            status: response.status,
            hasMessageId: !!data.message_id,
            hasId: !!data.id,
            hasMid: !!data.mid,
            allKeys: Object.keys(data)
          })

          // Si la respuesta es exitosa pero no tiene message_id, aún así puede ser válida
          // Instagram a veces acepta mensajes pero no devuelve el ID inmediatamente
          if (response.status === 200 && (data.success === true || data.result === "success")) {
            console.log("[Instagram] Mensaje aceptado por Instagram (sin message_id en respuesta)")
            // Generar un ID temporal o usar el timestamp
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
            return {
              success: true,
              data: { externalId: tempId }
            }
          }

          const error = createAdapterError(
            ErrorType.API,
            `Instagram no devolvió un ID de mensaje válido. Respuesta: ${JSON.stringify(data)}`,
            { 
              originalError: data,
              details: { 
                channelId, 
                response: data,
                status: response.status,
                responseKeys: Object.keys(data)
              }
            }
          )
          logAdapterError("Instagram", "sendMessage", error, channelId)
          return { success: false, error }
        }

        console.log(`[Instagram] Mensaje enviado exitosamente con ID: ${messageId}`)
        return {
          success: true,
          data: { externalId: messageId }
        }
      } catch (axiosError: any) {
        // Manejar errores de axios
        if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
          const timeoutError = createAdapterError(
            ErrorType.NETWORK,
            "Timeout: La API de Instagram tardó demasiado en responder",
            { details: { channelId, timeout: 30000 } }
          )
          logAdapterError("Instagram", "sendMessage", timeoutError, channelId)
          return { success: false, error: timeoutError }
        }

        if (axiosError.response) {
          // Error de respuesta HTTP
          const errorData = axiosError.response.data || {}
          console.error("[Instagram] Error de respuesta HTTP:", {
            status: axiosError.response.status,
            error: errorData,
            pageId,
            threadExternalId: message.threadExternalId
          })
          
          const adapterError = analyzeMetaError(errorData, "Instagram", "sendMessage")
          logAdapterError("Instagram", "sendMessage", adapterError, channelId, {
            statusCode: axiosError.response.status,
            threadExternalId: message.threadExternalId,
            messageLength: message.body.length,
            errorData
          })
          return { success: false, error: adapterError }
        }

        // Error de red u otro error
        throw axiosError // Re-throw para que lo maneje el catch exterior
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

      // Detectar si está usando Instagram Business Account ID en lugar de Facebook Page ID
      // Los Instagram Business Account IDs suelen empezar con 17 o 18 y tener 17-18 dígitos
      // Los Facebook Page IDs suelen tener menos dígitos o un formato diferente
      const isLikelyInstagramAccountId = pageId.length >= 17 && (pageId.startsWith('17') || pageId.startsWith('18'))
      
      if (isLikelyInstagramAccountId) {
        // Intentar obtener el Page ID desde el Instagram Business Account
        try {
          const instagramResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=id,name&access_token=${accessToken}`,
            {
              method: "GET",
            }
          )
          
          if (instagramResponse.ok) {
            // Si funciona, es un Instagram Business Account ID
            // Necesitamos encontrar el Facebook Page ID asociado
            const instagramData = await instagramResponse.json()
            
            // Intentar obtener la página de Facebook asociada
            // Esto requiere permisos adicionales, pero podemos intentar
            const error = createAdapterError(
              ErrorType.VALIDATION,
              `El ID proporcionado (${pageId}) es un Instagram Business Account ID, no un Facebook Page ID. Para Instagram necesitas el ID de la página de Facebook vinculada a tu cuenta de Instagram Business. Puedes encontrarlo en: Configuración de la app → Instagram → Configuración de la API → donde aparece tu cuenta de Instagram, busca el "Page ID" asociado.`,
              { details: { providedId: pageId, instagramAccountId: instagramData.id } }
            )
            logAdapterError("Instagram", "validateCredentials", error)
            return {
              valid: false,
              error: error.message,
            }
          }
        } catch (e) {
          // Continuar con la validación normal
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
          pageId,
          errorData
        })
        
        // Mensaje más descriptivo para errores comunes
        let errorMessage = adapterError.message
        if (errorData.error?.code === 190) {
          errorMessage = "Token de acceso inválido. Por favor, genera un nuevo token desde el panel de Meta (Instagram → Generar token) o verifica que el token tenga permisos de Instagram."
        } else if (errorData.error?.code === 100 && errorData.error?.message?.includes("page")) {
          errorMessage = `Page ID inválido o no encontrado. Verifica que el Page ID (${pageId}) sea correcto y pertenezca a tu cuenta.`
        }
        
        return {
          valid: false,
          error: errorMessage,
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




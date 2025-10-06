import type { 
  ChannelAdapter, 
  MessageDTO, 
  SendMessageDTO, 
  ThreadDTO, 
  ValidationResult,
  AdapterResult
} from "./types"

export class MockAdapter implements ChannelAdapter {
  type = "mock"

  async subscribeWebhooks(channelId: string, webhookUrl: string): Promise<AdapterResult<void>> {
    console.log(`[Mock] Webhook subscription for channel ${channelId}: ${webhookUrl}`)
    return { success: true }
  }

  async ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null> {
    try {
      // Accept any payload structure for demo purposes
      return {
        externalId: payload.messageId || `mock_${Date.now()}`,
        body: payload.text || payload.body || "Mock message",
        sentAt: new Date(payload.timestamp || Date.now()),
        senderHandle: payload.sender || "mock_user",
        senderName: payload.senderName || "Mock User",
        threadExternalId: payload.threadId || payload.sender || "mock_thread",
        attachments: payload.attachments,
      }
    } catch (error) {
      console.error("[Mock] Error ingesting webhook:", error)
      return null
    }
  }

  async sendMessage(
    channelId: string,
    message: SendMessageDTO,
    credentials: Record<string, any>,
  ): Promise<AdapterResult<{ externalId: string }>> {
    // Simulate successful send
    console.log("[Mock] Sending message:", message)
    console.log("[Mock] Credentials:", credentials)
    return {
      success: true,
      data: { externalId: `mock_sent_${Date.now()}` },
    }
  }

  async listThreads(channelId: string, credentials: Record<string, any>): Promise<AdapterResult<ThreadDTO[]>> {
    // Return mock threads for demo
    return {
      success: true,
      data: [
        {
          externalId: "mock_thread_1",
          participantHandle: "user_123",
          participantName: "Demo User",
          lastMessageAt: new Date(),
        },
      ]
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    return true
  }

  // Validar credenciales del canal de prueba (siempre válido)
  async validateCredentials(config: Record<string, any>): Promise<ValidationResult> {
    // El canal Mock siempre es válido ya que es para desarrollo
    return {
      valid: true,
      details: {
        message: "Canal de prueba - No requiere credenciales",
      },
    }
  }
}

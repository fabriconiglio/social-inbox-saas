export interface MessageDTO {
  externalId: string
  body: string
  attachments?: Attachment[]
  sentAt: Date
  senderHandle: string
  senderName?: string
  threadExternalId: string
}

export interface Attachment {
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType?: string
  filename?: string
}

export interface SendMessageDTO {
  threadExternalId: string
  body: string
  attachments?: Attachment[]
}

export interface ThreadDTO {
  externalId: string
  participantHandle: string
  participantName?: string
  lastMessageAt: Date
}

export interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, any>
}

// Tipos de errores más específicos
export enum ErrorType {
  VALIDATION = "VALIDATION",
  NETWORK = "NETWORK", 
  API = "API",
  AUTHENTICATION = "AUTHENTICATION",
  RATE_LIMIT = "RATE_LIMIT",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  THREAD_NOT_FOUND = "THREAD_NOT_FOUND",
  MESSAGE_TOO_LONG = "MESSAGE_TOO_LONG",
  UNKNOWN = "UNKNOWN"
}

export interface AdapterError {
  type: ErrorType
  message: string
  originalError?: any
  retryable: boolean
  statusCode?: number
  details?: Record<string, any>
}

export interface AdapterResult<T = any> {
  success: boolean
  data?: T
  error?: AdapterError
}

export interface ChannelAdapter {
  type: string
  subscribeWebhooks(channelId: string, webhookUrl: string): Promise<AdapterResult<void>>
  ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null>
  sendMessage(
    channelId: string,
    message: SendMessageDTO,
    credentials: Record<string, any>, // Credenciales desde channel.meta
  ): Promise<AdapterResult<{ externalId: string }>>
  listThreads(channelId: string, credentials: Record<string, any>): Promise<AdapterResult<ThreadDTO[]>>
  verifyWebhook(payload: any, signature: string, webhookSecret?: string): boolean
  validateCredentials(config: Record<string, any>): Promise<ValidationResult>
}

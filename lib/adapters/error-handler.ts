import { ErrorType, AdapterError } from "./types"

/**
 * Crea un error de adapter con contexto específico
 */
export function createAdapterError(
  type: ErrorType,
  message: string,
  options: {
    originalError?: any
    retryable?: boolean
    statusCode?: number
    details?: Record<string, any>
  } = {}
): AdapterError {
  return {
    type,
    message,
    originalError: options.originalError,
    retryable: options.retryable ?? false,
    statusCode: options.statusCode,
    details: options.details,
  }
}

/**
 * Analiza errores de APIs externas y los categoriza
 */
export function analyzeApiError(
  error: any,
  platform: string,
  context: string = ""
): AdapterError {
  // Error de red/fetch
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return createAdapterError(
      ErrorType.NETWORK,
      `Error de conexión con ${platform}: ${error.message}`,
      {
        originalError: error,
        retryable: true,
        details: { context, platform }
      }
    )
  }

  // Error con status code
  if (error.statusCode || error.status) {
    const statusCode = error.statusCode || error.status
    return analyzeHttpError(statusCode, error, platform, context)
  }

  // Error genérico
  return createAdapterError(
    ErrorType.UNKNOWN,
    `Error desconocido en ${platform}: ${error.message || "Error sin mensaje"}`,
    {
      originalError: error,
      retryable: false,
      details: { context, platform }
    }
  )
}

/**
 * Analiza errores HTTP específicos
 */
function analyzeHttpError(
  statusCode: number,
  error: any,
  platform: string,
  context: string
): AdapterError {
  switch (statusCode) {
    case 400:
      return createAdapterError(
        ErrorType.VALIDATION,
        `Solicitud inválida a ${platform}: ${error.message || "Datos incorrectos"}`,
        {
          originalError: error,
          statusCode,
          details: { context, platform }
        }
      )

    case 401:
      return createAdapterError(
        ErrorType.AUTHENTICATION,
        `Token de acceso inválido para ${platform}`,
        {
          originalError: error,
          statusCode,
          retryable: false,
          details: { context, platform }
        }
      )

    case 403:
      return createAdapterError(
        ErrorType.PERMISSION_DENIED,
        `Sin permisos para acceder a ${platform}`,
        {
          originalError: error,
          statusCode,
          retryable: false,
          details: { context, platform }
        }
      )

    case 429:
      return createAdapterError(
        ErrorType.RATE_LIMIT,
        `Límite de velocidad excedido en ${platform}`,
        {
          originalError: error,
          statusCode,
          retryable: true,
          details: { context, platform }
        }
      )

    case 500:
    case 502:
    case 503:
    case 504:
      return createAdapterError(
        ErrorType.API,
        `Error del servidor de ${platform}`,
        {
          originalError: error,
          statusCode,
          retryable: true,
          details: { context, platform }
        }
      )

    default:
      return createAdapterError(
        ErrorType.API,
        `Error HTTP ${statusCode} de ${platform}: ${error.message || "Error del servidor"}`,
        {
          originalError: error,
          statusCode,
          retryable: statusCode >= 500,
          details: { context, platform }
        }
      )
  }
}

/**
 * Analiza errores específicos de Meta (Facebook/Instagram/WhatsApp)
 */
export function analyzeMetaError(
  errorData: any,
  platform: string,
  context: string = ""
): AdapterError {
  const errorCode = errorData.error?.code
  const errorMessage = errorData.error?.message || "Error desconocido"

  // Errores específicos de Meta
  switch (errorCode) {
    case 190: // Invalid OAuth access token
    case 463: // Access token has expired
      return createAdapterError(
        ErrorType.AUTHENTICATION,
        `Token de acceso expirado o inválido para ${platform}`,
        {
          originalError: errorData,
          retryable: false,
          details: { context, platform, errorCode }
        }
      )

    case 368: // The action attempted has been deemed abusive or has been blocked due to previous abuse
      return createAdapterError(
        ErrorType.RATE_LIMIT,
        `Acción bloqueada por abuso en ${platform}`,
        {
          originalError: errorData,
          retryable: true,
          details: { context, platform, errorCode }
        }
      )

    case 100: // Invalid parameter
      return createAdapterError(
        ErrorType.VALIDATION,
        `Parámetro inválido en ${platform}: ${errorMessage}`,
        {
          originalError: errorData,
          retryable: false,
          details: { context, platform, errorCode }
        }
      )

    case 4: // Application request limit reached
      return createAdapterError(
        ErrorType.QUOTA_EXCEEDED,
        `Límite de solicitudes alcanzado en ${platform}`,
        {
          originalError: errorData,
          retryable: true,
          details: { context, platform, errorCode }
        }
      )

    case 10: // Message sent outside allowed time window (Instagram 24-hour window)
      return createAdapterError(
        ErrorType.PERMISSION_DENIED,
        `No se puede enviar el mensaje: Instagram solo permite enviar mensajes a usuarios que han enviado un mensaje en las últimas 24 horas. El usuario debe enviar un mensaje nuevo para que puedas responder.`,
        {
          originalError: errorData,
          retryable: false,
          details: { 
            context, 
            platform, 
            errorCode,
            userMessage: "Este mensaje no se puede enviar porque han pasado más de 24 horas desde el último mensaje del usuario. Esperá a que el usuario envíe un mensaje nuevo para poder responder."
          }
        }
      )

    default:
      return createAdapterError(
        ErrorType.API,
        `Error de ${platform}: ${errorMessage}`,
        {
          originalError: errorData,
          retryable: errorCode >= 500,
          details: { context, platform, errorCode }
        }
      )
  }
}

/**
 * Log de errores estructurado
 */
export function logAdapterError(
  adapter: string,
  method: string,
  error: AdapterError,
  channelId?: string,
  additionalContext?: Record<string, any>
) {
  const logContext = {
    adapter,
    method,
    channelId,
    errorType: error.type,
    retryable: error.retryable,
    statusCode: error.statusCode,
    ...additionalContext,
    ...error.details,
  }

  if (error.type === ErrorType.NETWORK || error.type === ErrorType.API) {
    console.warn(`[${adapter}] ${method} - ${error.type}:`, {
      message: error.message,
      ...logContext,
    })
  } else {
    console.error(`[${adapter}] ${method} - ${error.type}:`, {
      message: error.message,
      originalError: error.originalError,
      ...logContext,
    })
  }
}



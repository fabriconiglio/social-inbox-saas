import crypto from "crypto"

/**
 * Verifica la firma HMAC de un webhook de Meta (Facebook/Instagram/WhatsApp)
 * Meta usa SHA256 para firmar sus webhooks
 */
export function verifyMetaWebhook(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  try {
    if (!signature || !appSecret) {
      console.warn("[Webhook Verification] Missing signature or app secret")
      return false
    }

    // Meta envía la firma como "sha256=<hash>"
    const expectedSignature = signature.replace("sha256=", "")
    
    // Crear HMAC con SHA256
    const hmac = crypto.createHmac("sha256", appSecret)
    hmac.update(payload, "utf8")
    const calculatedSignature = hmac.digest("hex")

    // Comparar firmas usando timingSafeEqual para evitar timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, "hex")
    const calculatedBuffer = Buffer.from(calculatedSignature, "hex")

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer)
  } catch (error) {
    console.error("[Webhook Verification] Error verifying Meta webhook:", error)
    return false
  }
}

/**
 * Verifica la firma HMAC de un webhook de TikTok
 * TikTok usa SHA256 para firmar sus webhooks
 */
export function verifyTikTokWebhook(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  try {
    if (!signature || !appSecret) {
      console.warn("[Webhook Verification] Missing TikTok signature or app secret")
      return false
    }

    // TikTok envía la firma como "sha256=<hash>"
    const expectedSignature = signature.replace("sha256=", "")
    
    // Crear HMAC con SHA256
    const hmac = crypto.createHmac("sha256", appSecret)
    hmac.update(payload, "utf8")
    const calculatedSignature = hmac.digest("hex")

    // Comparar firmas usando timingSafeEqual
    const expectedBuffer = Buffer.from(expectedSignature, "hex")
    const calculatedBuffer = Buffer.from(calculatedSignature, "hex")

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer)
  } catch (error) {
    console.error("[Webhook Verification] Error verifying TikTok webhook:", error)
    return false
  }
}

/**
 * Verifica la firma HMAC de un webhook genérico
 * Para otras plataformas que usen SHA256
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: "sha1" | "sha256" = "sha256"
): boolean {
  try {
    if (!signature || !secret) {
      console.warn("[Webhook Verification] Missing signature or secret")
      return false
    }

    // Remover prefijo del algoritmo si existe
    const cleanSignature = signature.replace(/^(sha1|sha256)=/, "")
    
    // Crear HMAC
    const hmac = crypto.createHmac(algorithm, secret)
    hmac.update(payload, "utf8")
    const calculatedSignature = hmac.digest("hex")

    // Comparar firmas usando timingSafeEqual
    const expectedBuffer = Buffer.from(cleanSignature, "hex")
    const calculatedBuffer = Buffer.from(calculatedSignature, "hex")

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer)
  } catch (error) {
    console.error(`[Webhook Verification] Error verifying ${algorithm} webhook:`, error)
    return false
  }
}

/**
 * Extrae la firma del header X-Hub-Signature-256 o X-Hub-Signature
 */
export function extractSignatureFromHeaders(headers: Headers): string | null {
  // Meta usa X-Hub-Signature-256
  const signature256 = headers.get("x-hub-signature-256")
  if (signature256) {
    return signature256
  }

  // Algunas plataformas usan X-Hub-Signature (SHA1)
  const signature = headers.get("x-hub-signature")
  if (signature) {
    return signature
  }

  // TikTok y otras plataformas pueden usar diferentes headers
  const tikTokSignature = headers.get("x-tiktok-signature")
  if (tikTokSignature) {
    return tikTokSignature
  }

  return null
}

/**
 * Obtiene el payload como string para verificación
 */
export async function getPayloadAsString(request: Request): Promise<string> {
  try {
    // Clonar el request para evitar consumir el body
    const clonedRequest = request.clone()
    return await clonedRequest.text()
  } catch (error) {
    console.error("[Webhook Verification] Error getting payload as string:", error)
    throw new Error("Failed to read request payload")
  }
}

/**
 * Log de verificación de webhook para debugging
 */
export function logWebhookVerification(
  platform: string,
  verified: boolean,
  signature?: string,
  payloadLength?: number
) {
  const status = verified ? "✅ VERIFIED" : "❌ FAILED"
  console.log(`[${platform} Webhook] ${status}`, {
    platform,
    verified,
    hasSignature: !!signature,
    payloadLength,
    timestamp: new Date().toISOString()
  })

  if (!verified) {
    console.warn(`[${platform} Webhook] Verification failed - possible security issue`)
  }
}

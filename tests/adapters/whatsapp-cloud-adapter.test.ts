/**
 * Tests para WhatsAppCloudAdapter
 * Incluye tests unitarios y de integración
 */

import { WhatsAppCloudAdapter } from "@/lib/adapters/whatsapp-cloud-adapter"
import type { SendMessageDTO } from "@/lib/adapters/types"
import { ErrorType } from "@/lib/adapters/types"

describe("WhatsAppCloudAdapter", () => {
  let adapter: WhatsAppCloudAdapter

  beforeEach(() => {
    adapter = new WhatsAppCloudAdapter()
  })

  describe("Validación de Credenciales", () => {
    it("debe fallar si faltan credenciales", async () => {
      const result = await adapter.validateCredentials({})
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain("campos requeridos")
    })

    it("debe fallar si falta phoneId", async () => {
      const result = await adapter.validateCredentials({
        accessToken: "test-token"
      })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Phone ID")
    })

    it("debe fallar si falta accessToken", async () => {
      const result = await adapter.validateCredentials({
        phoneId: "123456789"
      })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain("Access Token")
    })

    // Test de integración - requiere credenciales reales
    it.skip("debe validar credenciales reales de WhatsApp", async () => {
      const result = await adapter.validateCredentials({
        phoneId: process.env.TEST_WHATSAPP_PHONE_ID,
        accessToken: process.env.TEST_WHATSAPP_ACCESS_TOKEN
      })
      
      expect(result.valid).toBe(true)
      expect(result.details?.phoneNumber).toBeDefined()
      expect(result.details?.verifiedName).toBeDefined()
    })
  })

  describe("sendMessage", () => {
    it("debe fallar si faltan credenciales", async () => {
      const message: SendMessageDTO = {
        threadExternalId: "+1234567890",
        body: "Test message"
      }

      const result = await adapter.sendMessage("channel-123", message, {})
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.VALIDATION)
      expect(result.error?.message).toContain("Credenciales faltantes")
    })

    it("debe fallar si el mensaje excede 4096 caracteres", async () => {
      const longMessage = "a".repeat(4097)
      const message: SendMessageDTO = {
        threadExternalId: "+1234567890",
        body: longMessage
      }

      const credentials = {
        phoneId: "123456789",
        accessToken: "test-token"
      }

      const result = await adapter.sendMessage("channel-123", message, credentials)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.MESSAGE_TOO_LONG)
      expect(result.error?.message).toContain("4096 caracteres")
    })

    it("debe aceptar mensajes de longitud válida", async () => {
      const message: SendMessageDTO = {
        threadExternalId: "+1234567890",
        body: "Este es un mensaje de prueba de longitud válida para WhatsApp"
      }

      const credentials = {
        phoneId: "123456789",
        accessToken: "invalid-token"
      }

      const result = await adapter.sendMessage("channel-123", message, credentials)
      
      // Esperamos que falle por token inválido, no por validación
      expect(result.success).toBe(false)
      expect(result.error?.type).not.toBe(ErrorType.MESSAGE_TOO_LONG)
      expect(result.error?.type).not.toBe(ErrorType.VALIDATION)
    })

    // Test de integración - requiere credenciales reales
    it.skip("debe enviar un mensaje real a WhatsApp", async () => {
      const message: SendMessageDTO = {
        threadExternalId: process.env.TEST_WHATSAPP_PHONE_NUMBER!,
        body: "🤖 Mensaje de prueba automático - Test Suite"
      }

      const credentials = {
        phoneId: process.env.TEST_WHATSAPP_PHONE_ID!,
        accessToken: process.env.TEST_WHATSAPP_ACCESS_TOKEN!
      }

      const result = await adapter.sendMessage("channel-test", message, credentials)
      
      expect(result.success).toBe(true)
      expect(result.data?.externalId).toBeDefined()
    })
  })

  describe("listThreads", () => {
    it("debe retornar array vacío (WhatsApp no soporta listar threads)", async () => {
      const result = await adapter.listThreads("channel-123", {
        phoneId: "123456789",
        accessToken: "test-token"
      })
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe("verifyWebhook", () => {
    it("debe verificar firma HMAC correcta", () => {
      const payload = JSON.stringify({ test: "data" })
      const secret = "test-secret-key"
      
      // Generar firma correcta
      const crypto = require("crypto")
      const hmac = crypto.createHmac("sha256", secret)
      hmac.update(payload)
      const signature = "sha256=" + hmac.digest("hex")
      
      // Mock del env
      process.env.WHATSAPP_WEBHOOK_SECRET = secret
      
      const isValid = adapter.verifyWebhook(payload, signature)
      
      expect(isValid).toBe(true)
    })

    it("debe rechazar firma HMAC incorrecta", () => {
      const payload = JSON.stringify({ test: "data" })
      const signature = "sha256=invalid-signature"
      
      process.env.WHATSAPP_WEBHOOK_SECRET = "test-secret-key"
      
      const isValid = adapter.verifyWebhook(payload, signature)
      
      expect(isValid).toBe(false)
    })
  })

  describe("ingestWebhook", () => {
    it("debe procesar webhook de WhatsApp válido", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [{
          id: "business-123",
          changes: [{
            value: {
              messaging_product: "whatsapp",
              messages: [{
                from: "+1234567890",
                id: "wamid.123456",
                timestamp: "1234567890",
                type: "text",
                text: {
                  body: "Hola desde WhatsApp"
                }
              }]
            }
          }]
        }]
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeDefined()
      expect(result?.externalId).toBe("wamid.123456")
      expect(result?.body).toBe("Hola desde WhatsApp")
      expect(result?.senderHandle).toBe("+1234567890")
    })

    it("debe retornar null si el objeto no es whatsapp_business_account", async () => {
      const payload = {
        object: "instagram",
        entry: []
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeNull()
    })

    it("debe retornar null si no hay mensajes", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: []
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeNull()
    })

    it("debe manejar mensajes con attachments", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [{
          id: "business-123",
          changes: [{
            value: {
              messaging_product: "whatsapp",
              messages: [{
                from: "+1234567890",
                id: "wamid.123456",
                timestamp: "1234567890",
                type: "image",
                image: {
                  id: "img-123",
                  mime_type: "image/jpeg"
                }
              }]
            }
          }]
        }]
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeDefined()
      expect(result?.attachments).toBeDefined()
      expect(result?.attachments?.length).toBeGreaterThan(0)
    })
  })
})



/**
 * Tests para MetaInstagramAdapter
 * Incluye tests unitarios y de integración
 */

import { MetaInstagramAdapter } from "@/lib/adapters/meta-instagram-adapter"
import type { SendMessageDTO } from "@/lib/adapters/types"
import { ErrorType } from "@/lib/adapters/types"

describe("MetaInstagramAdapter", () => {
  let adapter: MetaInstagramAdapter

  beforeEach(() => {
    adapter = new MetaInstagramAdapter()
  })

  describe("Validación de Credenciales", () => {
    it("debe fallar si faltan credenciales", async () => {
      const result = await adapter.validateCredentials({})
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain("campos requeridos")
    })

    it("debe fallar si falta pageId", async () => {
      const result = await adapter.validateCredentials({
        accessToken: "test-token"
      })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain("campos requeridos")
    })

    it("debe fallar si falta accessToken", async () => {
      const result = await adapter.validateCredentials({
        pageId: "123456789"
      })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain("campos requeridos")
    })

    // Test de integración - requiere credenciales reales
    it.skip("debe validar credenciales reales de Instagram", async () => {
      const result = await adapter.validateCredentials({
        pageId: process.env.TEST_INSTAGRAM_PAGE_ID,
        accessToken: process.env.TEST_INSTAGRAM_ACCESS_TOKEN
      })
      
      expect(result.valid).toBe(true)
      expect(result.details?.pageName).toBeDefined()
      expect(result.details?.instagramAccountId).toBeDefined()
    })
  })

  describe("sendMessage", () => {
    it("debe fallar si faltan credenciales", async () => {
      const message: SendMessageDTO = {
        threadExternalId: "thread-123",
        body: "Test message"
      }

      const result = await adapter.sendMessage("channel-123", message, {})
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.VALIDATION)
      expect(result.error?.message).toContain("Credenciales faltantes")
    })

    it("debe fallar si el mensaje es muy largo", async () => {
      const longMessage = "a".repeat(2001)
      const message: SendMessageDTO = {
        threadExternalId: "thread-123",
        body: longMessage
      }

      const credentials = {
        pageId: "123456789",
        accessToken: "test-token"
      }

      const result = await adapter.sendMessage("channel-123", message, credentials)
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.MESSAGE_TOO_LONG)
      expect(result.error?.message).toContain("2000 caracteres")
    })

    it("debe aceptar mensajes de longitud válida", async () => {
      const message: SendMessageDTO = {
        threadExternalId: "thread-123",
        body: "Este es un mensaje de prueba de longitud válida"
      }

      const credentials = {
        pageId: "123456789",
        accessToken: "invalid-token" // Token inválido para test
      }

      const result = await adapter.sendMessage("channel-123", message, credentials)
      
      // Esperamos que falle por token inválido, no por validación
      expect(result.success).toBe(false)
      expect(result.error?.type).not.toBe(ErrorType.MESSAGE_TOO_LONG)
      expect(result.error?.type).not.toBe(ErrorType.VALIDATION)
    })

    // Test de integración - requiere credenciales reales
    it.skip("debe enviar un mensaje real a Instagram", async () => {
      const message: SendMessageDTO = {
        threadExternalId: process.env.TEST_INSTAGRAM_THREAD_ID!,
        body: "🤖 Mensaje de prueba automático - Test Suite"
      }

      const credentials = {
        pageId: process.env.TEST_INSTAGRAM_PAGE_ID!,
        accessToken: process.env.TEST_INSTAGRAM_ACCESS_TOKEN!
      }

      const result = await adapter.sendMessage("channel-test", message, credentials)
      
      expect(result.success).toBe(true)
      expect(result.data?.externalId).toBeDefined()
    })
  })

  describe("listThreads", () => {
    it("debe fallar si faltan credenciales", async () => {
      const result = await adapter.listThreads("channel-123", {})
      
      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.VALIDATION)
      expect(result.data).toEqual([])
    })

    // Test de integración - requiere credenciales reales
    it.skip("debe listar threads reales de Instagram", async () => {
      const credentials = {
        pageId: process.env.TEST_INSTAGRAM_PAGE_ID!,
        accessToken: process.env.TEST_INSTAGRAM_ACCESS_TOKEN!
      }

      const result = await adapter.listThreads("channel-test", credentials)
      
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      
      if (result.data && result.data.length > 0) {
        const thread = result.data[0]
        expect(thread.externalId).toBeDefined()
        expect(thread.participantHandle).toBeDefined()
        expect(thread.lastMessageAt).toBeInstanceOf(Date)
      }
    })
  })

  describe("verifyWebhook", () => {
    it("debe verificar firma HMAC correcta", () => {
      // Este test requiere un secret configurado
      const payload = JSON.stringify({ test: "data" })
      const secret = "test-secret-key"
      
      // Generar firma correcta
      const crypto = require("crypto")
      const hmac = crypto.createHmac("sha256", secret)
      hmac.update(payload)
      const signature = "sha256=" + hmac.digest("hex")
      
      // Mock del env
      process.env.META_WEBHOOK_SECRET = secret
      
      const isValid = adapter.verifyWebhook(payload, signature)
      
      expect(isValid).toBe(true)
    })

    it("debe rechazar firma HMAC incorrecta", () => {
      const payload = JSON.stringify({ test: "data" })
      const signature = "sha256=invalid-signature"
      
      process.env.META_WEBHOOK_SECRET = "test-secret-key"
      
      const isValid = adapter.verifyWebhook(payload, signature)
      
      expect(isValid).toBe(false)
    })

    it("debe permitir webhooks sin secret en desarrollo", () => {
      delete process.env.META_WEBHOOK_SECRET
      delete process.env.WEBHOOK_SECRET
      
      const payload = JSON.stringify({ test: "data" })
      const signature = "any-signature"
      
      const isValid = adapter.verifyWebhook(payload, signature)
      
      expect(isValid).toBe(true)
    })
  })

  describe("ingestWebhook", () => {
    it("debe procesar webhook de Instagram válido", async () => {
      const payload = {
        object: "instagram",
        entry: [{
          id: "page-123",
          messaging: [{
            sender: { id: "user-456" },
            recipient: { id: "page-123" },
            timestamp: Date.now(),
            message: {
              mid: "msg-789",
              text: "Hola desde Instagram"
            }
          }]
        }]
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeDefined()
      expect(result?.externalId).toBe("msg-789")
      expect(result?.body).toBe("Hola desde Instagram")
      expect(result?.senderHandle).toBe("user-456")
    })

    it("debe retornar null si el objeto no es instagram", async () => {
      const payload = {
        object: "facebook",
        entry: []
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeNull()
    })

    it("debe retornar null si no hay mensajes", async () => {
      const payload = {
        object: "instagram",
        entry: []
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeNull()
    })
  })
})



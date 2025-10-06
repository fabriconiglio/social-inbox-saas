/**
 * Tests para MockAdapter
 * Este adapter es el más simple y sirve como referencia
 */

import { MockAdapter } from "@/lib/adapters/mock-adapter"
import type { SendMessageDTO } from "@/lib/adapters/types"

describe("MockAdapter", () => {
  let adapter: MockAdapter

  beforeEach(() => {
    adapter = new MockAdapter()
  })

  describe("subscribeWebhooks", () => {
    it("debe suscribirse a webhooks exitosamente", async () => {
      const result = await adapter.subscribeWebhooks("channel-123", "https://example.com/webhook")
      
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe("sendMessage", () => {
    it("debe enviar un mensaje exitosamente", async () => {
      const message: SendMessageDTO = {
        threadExternalId: "thread-123",
        body: "Hola, este es un mensaje de prueba",
      }

      const result = await adapter.sendMessage("channel-123", message, {})
      
      expect(result.success).toBe(true)
      expect(result.data?.externalId).toBeDefined()
      expect(result.data?.externalId).toContain("mock_sent_")
      expect(result.error).toBeUndefined()
    })

    it("debe generar IDs únicos para cada mensaje", async () => {
      const message: SendMessageDTO = {
        threadExternalId: "thread-123",
        body: "Mensaje 1",
      }

      const result1 = await adapter.sendMessage("channel-123", message, {})
      
      // Pequeña pausa para asegurar timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result2 = await adapter.sendMessage("channel-123", message, {})
      
      expect(result1.data?.externalId).not.toBe(result2.data?.externalId)
    })
  })

  describe("listThreads", () => {
    it("debe listar threads de prueba", async () => {
      const result = await adapter.listThreads("channel-123", {})
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data!.length).toBeGreaterThan(0)
      
      const thread = result.data![0]
      expect(thread.externalId).toBe("mock_thread_1")
      expect(thread.participantHandle).toBe("user_123")
      expect(thread.participantName).toBe("Demo User")
      expect(thread.lastMessageAt).toBeInstanceOf(Date)
    })
  })

  describe("verifyWebhook", () => {
    it("debe verificar webhooks (siempre true para mock)", () => {
      const payload = JSON.stringify({ test: "data" })
      const signature = "mock-signature"
      
      const isValid = adapter.verifyWebhook(payload, signature)
      
      expect(isValid).toBe(true)
    })
  })

  describe("validateCredentials", () => {
    it("debe validar credenciales exitosamente (mock no requiere credenciales)", async () => {
      const result = await adapter.validateCredentials({})
      
      expect(result.valid).toBe(true)
      expect(result.details?.message).toContain("Canal de prueba")
    })
  })

  describe("ingestWebhook", () => {
    it("debe procesar un webhook válido", async () => {
      const payload = {
        message: {
          id: "msg-123",
          text: "Hola desde webhook",
          from: {
            id: "user-456",
            name: "Usuario Test"
          },
          timestamp: Date.now()
        }
      }

      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeDefined()
      expect(result?.externalId).toBe("msg-123")
      expect(result?.body).toBe("Hola desde webhook")
      expect(result?.senderHandle).toBe("user-456")
      expect(result?.senderName).toBe("Usuario Test")
    })

    it("debe retornar null si no hay mensaje", async () => {
      const payload = {}
      
      const result = await adapter.ingestWebhook(payload, "channel-123")
      
      expect(result).toBeNull()
    })
  })
})

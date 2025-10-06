/**
 * Tests para el sistema de manejo de errores
 */

import {
  createAdapterError,
  analyzeApiError,
  analyzeMetaError,
  analyzeHttpError,
  logAdapterError
} from "@/lib/adapters/error-handler"
import { ErrorType } from "@/lib/adapters/types"

describe("Error Handler", () => {
  describe("createAdapterError", () => {
    it("debe crear un error básico", () => {
      const error = createAdapterError(
        ErrorType.VALIDATION,
        "Error de validación"
      )

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.message).toBe("Error de validación")
      expect(error.retryable).toBe(false)
    })

    it("debe crear un error con opciones", () => {
      const error = createAdapterError(
        ErrorType.NETWORK,
        "Error de red",
        {
          retryable: true,
          statusCode: 503,
          details: { endpoint: "/api/test" }
        }
      )

      expect(error.type).toBe(ErrorType.NETWORK)
      expect(error.retryable).toBe(true)
      expect(error.statusCode).toBe(503)
      expect(error.details?.endpoint).toBe("/api/test")
    })
  })

  describe("analyzeApiError", () => {
    it("debe detectar errores de red", () => {
      const networkError = new TypeError("fetch failed")
      const error = analyzeApiError(networkError, "TestPlatform", "testMethod")

      expect(error.type).toBe(ErrorType.NETWORK)
      expect(error.retryable).toBe(true)
      expect(error.message).toContain("TestPlatform")
    })

    it("debe analizar errores con status code", () => {
      const apiError = {
        statusCode: 401,
        message: "Unauthorized"
      }
      const error = analyzeApiError(apiError, "TestPlatform", "testMethod")

      expect(error.type).toBe(ErrorType.AUTHENTICATION)
      expect(error.statusCode).toBe(401)
      expect(error.retryable).toBe(false)
    })

    it("debe manejar errores desconocidos", () => {
      const unknownError = new Error("Unknown error")
      const error = analyzeApiError(unknownError, "TestPlatform", "testMethod")

      expect(error.type).toBe(ErrorType.UNKNOWN)
      expect(error.retryable).toBe(false)
    })
  })

  describe("analyzeMetaError", () => {
    it("debe detectar token expirado (código 190)", () => {
      const errorData = {
        error: {
          code: 190,
          message: "Invalid OAuth access token"
        }
      }
      const error = analyzeMetaError(errorData, "Facebook", "sendMessage")

      expect(error.type).toBe(ErrorType.AUTHENTICATION)
      expect(error.retryable).toBe(false)
      expect(error.message).toContain("Token de acceso expirado")
    })

    it("debe detectar rate limit (código 368)", () => {
      const errorData = {
        error: {
          code: 368,
          message: "Temporarily blocked for policies violations"
        }
      }
      const error = analyzeMetaError(errorData, "Instagram", "sendMessage")

      expect(error.type).toBe(ErrorType.RATE_LIMIT)
      expect(error.retryable).toBe(true)
    })

    it("debe detectar parámetro inválido (código 100)", () => {
      const errorData = {
        error: {
          code: 100,
          message: "Invalid parameter"
        }
      }
      const error = analyzeMetaError(errorData, "WhatsApp", "sendMessage")

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.retryable).toBe(false)
    })

    it("debe detectar quota excedida (código 4)", () => {
      const errorData = {
        error: {
          code: 4,
          message: "Application request limit reached"
        }
      }
      const error = analyzeMetaError(errorData, "Facebook", "listThreads")

      expect(error.type).toBe(ErrorType.QUOTA_EXCEEDED)
      expect(error.retryable).toBe(true)
    })

    it("debe manejar errores sin código", () => {
      const errorData = {
        error: {
          message: "Unknown error"
        }
      }
      const error = analyzeMetaError(errorData, "Instagram", "sendMessage")

      expect(error.type).toBe(ErrorType.API)
      expect(error.message).toContain("Unknown error")
    })
  })

  describe("logAdapterError", () => {
    let consoleErrorSpy: jest.SpyInstance
    let consoleWarnSpy: jest.SpyInstance

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation()
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it("debe loggear errores de red como warning", () => {
      const error = createAdapterError(ErrorType.NETWORK, "Network error", { retryable: true })
      
      logAdapterError("TestAdapter", "testMethod", error, "channel-123")

      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it("debe loggear errores críticos como error", () => {
      const error = createAdapterError(ErrorType.AUTHENTICATION, "Auth error")
      
      logAdapterError("TestAdapter", "testMethod", error, "channel-123")

      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it("debe incluir contexto adicional en el log", () => {
      const error = createAdapterError(ErrorType.VALIDATION, "Validation error")
      
      logAdapterError("TestAdapter", "testMethod", error, "channel-123", {
        userId: "user-456",
        action: "sendMessage"
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("TestAdapter"),
        expect.objectContaining({
          message: "Validation error",
          adapter: "TestAdapter",
          method: "testMethod",
          channelId: "channel-123",
          userId: "user-456",
          action: "sendMessage"
        })
      )
    })
  })
})

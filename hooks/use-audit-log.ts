"use client"

import { useState, useCallback } from "react"
import { createAuditLogger, AuditData, AUDIT_ACTIONS } from "@/lib/audit-log-utils"

interface UseAuditLogOptions {
  tenantId: string
  entity: string
  entityId: string
}

interface UseAuditLogReturn {
  logAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logChannelAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logThreadAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logTemplateAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logContactAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logSLAAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logCannedResponseAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logUserAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logTenantAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  logLocalAction: (action: string, diff?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  error: string | null
}

export function useAuditLog({ tenantId, entity, entityId }: UseAuditLogOptions): UseAuditLogReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const auditLogger = createAuditLogger(tenantId)

  const logAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.log({
        entity: entity as any,
        entityId,
        action: action as any,
        diff
      })
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entity, entityId])

  const logChannelAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logChannelAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de canal"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logThreadAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logThreadAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de thread"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logTemplateAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logTemplateAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de plantilla"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logContactAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logContactAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de contacto"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logSLAAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logSLAAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de SLA"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logCannedResponseAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logCannedResponseAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de respuesta rápida"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logUserAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logUserAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de usuario"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logTenantAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logTenantAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de tenant"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  const logLocalAction = useCallback(async (action: string, diff?: Record<string, any>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await auditLogger.logLocalAction(entityId, action as any, diff)
      
      return result
    } catch (err) {
      const errorMessage = "Error al registrar auditoría de local"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [auditLogger, entityId])

  return {
    logAction,
    logChannelAction,
    logThreadAction,
    logTemplateAction,
    logContactAction,
    logSLAAction,
    logCannedResponseAction,
    logUserAction,
    logTenantAction,
    logLocalAction,
    isLoading,
    error
  }
}

/**
 * Hook especializado para canales
 */
export function useChannelAuditLog(tenantId: string, channelId: string) {
  return useAuditLog({ tenantId, entity: "Channel", entityId: channelId })
}

/**
 * Hook especializado para threads
 */
export function useThreadAuditLog(tenantId: string, threadId: string) {
  return useAuditLog({ tenantId, entity: "Thread", entityId: threadId })
}

/**
 * Hook especializado para plantillas
 */
export function useTemplateAuditLog(tenantId: string, templateId: string) {
  return useAuditLog({ tenantId, entity: "Template", entityId: templateId })
}

/**
 * Hook especializado para contactos
 */
export function useContactAuditLog(tenantId: string, contactId: string) {
  return useAuditLog({ tenantId, entity: "Contact", entityId: contactId })
}

/**
 * Hook especializado para SLA
 */
export function useSLAAuditLog(tenantId: string, slaId: string) {
  return useAuditLog({ tenantId, entity: "SLA", entityId: slaId })
}

/**
 * Hook especializado para respuestas rápidas
 */
export function useCannedResponseAuditLog(tenantId: string, responseId: string) {
  return useAuditLog({ tenantId, entity: "CannedResponse", entityId: responseId })
}

/**
 * Hook especializado para usuarios
 */
export function useUserAuditLog(tenantId: string, userId: string) {
  return useAuditLog({ tenantId, entity: "User", entityId: userId })
}

/**
 * Hook especializado para tenants
 */
export function useTenantAuditLog(tenantId: string) {
  return useAuditLog({ tenantId, entity: "Tenant", entityId: tenantId })
}

/**
 * Hook especializado para locales
 */
export function useLocalAuditLog(tenantId: string, localId: string) {
  return useAuditLog({ tenantId, entity: "Local", entityId: localId })
}

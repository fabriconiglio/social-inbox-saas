/**
 * Utilidades para Audit Log
 * Centraliza el registro de acciones importantes en el sistema
 */

import { logAuditEvent } from "@/app/actions/audit-log"

// Tipos de entidades que se pueden auditar
export type AuditEntity = 
  | "Channel" 
  | "Thread" 
  | "Contact" 
  | "Template" 
  | "SLA" 
  | "CannedResponse"
  | "User"
  | "Tenant"
  | "Local"

// Tipos de acciones comunes
export type AuditAction = 
  // Channel actions
  | "channel.created"
  | "channel.updated"
  | "channel.deleted"
  | "channel.connected"
  | "channel.disconnected"
  | "channel.credentials.updated"
  | "channel.credentials.validated"
  | "channel.credentials.expired"
  
  // Thread actions
  | "thread.created"
  | "thread.updated"
  | "thread.assigned"
  | "thread.unassigned"
  | "thread.status.changed"
  | "thread.priority.changed"
  | "thread.sla.updated"
  | "thread.sla.breached"
  | "thread.sla.warning"
  
  // Contact actions
  | "contact.created"
  | "contact.updated"
  | "contact.merged"
  | "contact.deleted"
  | "contact.blocked"
  | "contact.unblocked"
  
  // Template actions
  | "template.created"
  | "template.updated"
  | "template.deleted"
  | "template.approved"
  | "template.rejected"
  | "template.synced"
  | "template.used"
  
  // SLA actions
  | "sla.created"
  | "sla.updated"
  | "sla.deleted"
  | "sla.activated"
  | "sla.deactivated"
  
  // Canned Response actions
  | "canned_response.created"
  | "canned_response.updated"
  | "canned_response.deleted"
  | "canned_response.used"
  
  // User actions
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.invited"
  | "user.role.changed"
  | "user.activated"
  | "user.deactivated"
  
  // Tenant actions
  | "tenant.created"
  | "tenant.updated"
  | "tenant.deleted"
  | "tenant.settings.updated"
  
  // Local actions
  | "local.created"
  | "local.updated"
  | "local.deleted"

// Interfaz para datos de auditoría
export interface AuditData {
  entity: AuditEntity
  entityId: string
  action: AuditAction
  diff?: Record<string, any>
  metadata?: Record<string, any>
}

// Clase principal para manejar audit logs
export class AuditLogger {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  /**
   * Registrar una acción de auditoría
   */
  async log(data: AuditData): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await logAuditEvent(this.tenantId, {
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        diff: data.diff
      })

      if (result.success) {
        console.log(`[AuditLog] ${data.action} on ${data.entity}:${data.entityId}`)
      }

      return result
    } catch (error) {
      console.error(`[AuditLogger] Error logging ${data.action}:`, error)
      return { success: false, error: "Error al registrar auditoría" }
    }
  }

  // Métodos específicos para cada entidad

  /**
   * Registrar acciones de canal
   */
  async logChannelAction(
    channelId: string, 
    action: Extract<AuditAction, `channel.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "Channel",
      entityId: channelId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de thread
   */
  async logThreadAction(
    threadId: string, 
    action: Extract<AuditAction, `thread.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "Thread",
      entityId: threadId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de contacto
   */
  async logContactAction(
    contactId: string, 
    action: Extract<AuditAction, `contact.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "Contact",
      entityId: contactId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de plantilla
   */
  async logTemplateAction(
    templateId: string, 
    action: Extract<AuditAction, `template.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "Template",
      entityId: templateId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de SLA
   */
  async logSLAAction(
    slaId: string, 
    action: Extract<AuditAction, `sla.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "SLA",
      entityId: slaId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de respuesta rápida
   */
  async logCannedResponseAction(
    responseId: string, 
    action: Extract<AuditAction, `canned_response.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "CannedResponse",
      entityId: responseId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de usuario
   */
  async logUserAction(
    userId: string, 
    action: Extract<AuditAction, `user.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "User",
      entityId: userId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de tenant
   */
  async logTenantAction(
    tenantId: string, 
    action: Extract<AuditAction, `tenant.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "Tenant",
      entityId: tenantId,
      action,
      diff
    })
  }

  /**
   * Registrar acciones de local
   */
  async logLocalAction(
    localId: string, 
    action: Extract<AuditAction, `local.${string}`>, 
    diff?: Record<string, any>
  ) {
    return this.log({
      entity: "Local",
      entityId: localId,
      action,
      diff
    })
  }
}

// Funciones de conveniencia para casos comunes

/**
 * Crear un logger de auditoría para un tenant
 */
export function createAuditLogger(tenantId: string): AuditLogger {
  return new AuditLogger(tenantId)
}

/**
 * Registrar una acción de auditoría directamente
 */
export async function logAuditAction(
  tenantId: string, 
  data: AuditData
): Promise<{ success: boolean; error?: string }> {
  const logger = createAuditLogger(tenantId)
  return logger.log(data)
}

/**
 * Registrar múltiples acciones de auditoría
 */
export async function logAuditActions(
  tenantId: string, 
  actions: AuditData[]
): Promise<{ success: boolean; error?: string; results?: Array<{ success: boolean; error?: string }> }> {
  const logger = createAuditLogger(tenantId)
  const results = []

  for (const action of actions) {
    const result = await logger.log(action)
    results.push(result)
  }

  const hasErrors = results.some(r => !r.success)
  return {
    success: !hasErrors,
    error: hasErrors ? "Algunas acciones no se pudieron registrar" : undefined,
    results
  }
}

/**
 * Utilidades para crear diffs de cambios
 */
export class AuditDiff {
  /**
   * Crear diff entre dos objetos
   */
  static createDiff(oldData: Record<string, any>, newData: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {}
    
    // Encontrar cambios
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        diff[key] = {
          old: oldData[key],
          new: newData[key]
        }
      }
    }
    
    // Encontrar campos eliminados
    for (const key in oldData) {
      if (!(key in newData)) {
        diff[key] = {
          old: oldData[key],
          new: null
        }
      }
    }
    
    return diff
  }

  /**
   * Crear diff para campos específicos
   */
  static createFieldDiff(
    oldData: Record<string, any>, 
    newData: Record<string, any>, 
    fields: string[]
  ): Record<string, any> {
    const diff: Record<string, any> = {}
    
    for (const field of fields) {
      if (oldData[field] !== newData[field]) {
        diff[field] = {
          old: oldData[field],
          new: newData[field]
        }
      }
    }
    
    return diff
  }

  /**
   * Crear diff para arrays
   */
  static createArrayDiff(
    oldArray: any[], 
    newArray: any[], 
    keyField: string = 'id'
  ): Record<string, any> {
    const diff: Record<string, any> = {
      added: [],
      removed: [],
      modified: []
    }
    
    const oldMap = new Map(oldArray.map(item => [item[keyField], item]))
    const newMap = new Map(newArray.map(item => [item[keyField], item]))
    
    // Encontrar elementos agregados
    for (const [key, item] of newMap) {
      if (!oldMap.has(key)) {
        diff.added.push(item)
      }
    }
    
    // Encontrar elementos eliminados
    for (const [key, item] of oldMap) {
      if (!newMap.has(key)) {
        diff.removed.push(item)
      }
    }
    
    // Encontrar elementos modificados
    for (const [key, newItem] of newMap) {
      const oldItem = oldMap.get(key)
      if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
        diff.modified.push({
          key,
          old: oldItem,
          new: newItem
        })
      }
    }
    
    return diff
  }
}

/**
 * Constantes para acciones comunes
 */
export const AUDIT_ACTIONS = {
  CHANNEL: {
    CREATED: "channel.created" as const,
    UPDATED: "channel.updated" as const,
    DELETED: "channel.deleted" as const,
    CONNECTED: "channel.connected" as const,
    DISCONNECTED: "channel.disconnected" as const,
    CREDENTIALS_UPDATED: "channel.credentials.updated" as const,
    CREDENTIALS_VALIDATED: "channel.credentials.validated" as const,
    CREDENTIALS_EXPIRED: "channel.credentials.expired" as const,
  },
  THREAD: {
    CREATED: "thread.created" as const,
    UPDATED: "thread.updated" as const,
    ASSIGNED: "thread.assigned" as const,
    UNASSIGNED: "thread.unassigned" as const,
    STATUS_CHANGED: "thread.status.changed" as const,
    PRIORITY_CHANGED: "thread.priority.changed" as const,
    SLA_UPDATED: "thread.sla.updated" as const,
    SLA_BREACHED: "thread.sla.breached" as const,
    SLA_WARNING: "thread.sla.warning" as const,
  },
  TEMPLATE: {
    CREATED: "template.created" as const,
    UPDATED: "template.updated" as const,
    DELETED: "template.deleted" as const,
    APPROVED: "template.approved" as const,
    REJECTED: "template.rejected" as const,
    SYNCED: "template.synced" as const,
    USED: "template.used" as const,
  },
  CONTACT: {
    CREATED: "contact.created" as const,
    UPDATED: "contact.updated" as const,
    MERGED: "contact.merged" as const,
    DELETED: "contact.deleted" as const,
    BLOCKED: "contact.blocked" as const,
    UNBLOCKED: "contact.unblocked" as const,
  },
  SLA: {
    CREATED: "sla.created" as const,
    UPDATED: "sla.updated" as const,
    DELETED: "sla.deleted" as const,
    ACTIVATED: "sla.activated" as const,
    DEACTIVATED: "sla.deactivated" as const,
  },
  CANNED_RESPONSE: {
    CREATED: "canned_response.created" as const,
    UPDATED: "canned_response.updated" as const,
    DELETED: "canned_response.deleted" as const,
    USED: "canned_response.used" as const,
  },
  USER: {
    CREATED: "user.created" as const,
    UPDATED: "user.updated" as const,
    DELETED: "user.deleted" as const,
    INVITED: "user.invited" as const,
    ROLE_CHANGED: "user.role.changed" as const,
    ACTIVATED: "user.activated" as const,
    DEACTIVATED: "user.deactivated" as const,
  },
  TENANT: {
    CREATED: "tenant.created" as const,
    UPDATED: "tenant.updated" as const,
    DELETED: "tenant.deleted" as const,
    SETTINGS_UPDATED: "tenant.settings.updated" as const,
  },
  LOCAL: {
    CREATED: "local.created" as const,
    UPDATED: "local.updated" as const,
    DELETED: "local.deleted" as const,
  }
} as const

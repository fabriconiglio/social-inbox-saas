"use server"

import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { 
  processChannelRefresh,
  getChannelsNeedingRefresh,
  processBatchRefresh
} from "@/lib/oauth-refresh"
import {
  scheduleChannelRefresh,
  scheduleBatchRefresh,
  scheduleRecurringRefresh,
  cancelRecurringRefresh,
  getRefreshJobsStatus,
  cleanupOldJobs
} from "@/lib/oauth-refresh-queue"

/**
 * Refrescar token de un canal específico
 */
export async function refreshChannelToken(data: {
  channelId: string
  tenantId: string
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Procesar refresh del canal
    const result = await processChannelRefresh(data.channelId, data.tenantId)

    if (result.success) {
      revalidatePath(`/app/${data.tenantId}/channels`)
      console.log(`[OAuth Refresh Action] Token del canal ${data.channelId} refrescado exitosamente`)
    }

    return result

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al refrescar token del canal" }
  }
}

/**
 * Refrescar tokens de múltiples canales
 */
export async function refreshMultipleChannelTokens(data: {
  tenantId: string
  channelIds?: string[]
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Procesar refresh en batch
    const result = await processBatchRefresh(data.tenantId, data.channelIds)

    if (result.success) {
      revalidatePath(`/app/${data.tenantId}/channels`)
      console.log(`[OAuth Refresh Action] Batch refresh completado: ${result.succeeded}/${result.processed} exitosos`)
    }

    return result

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { 
      success: false,
      processed: 0,
      succeeded: 0,
      failed: 1,
      errors: [{ channelId: 'batch', error: "Error al procesar refresh en batch" }]
    }
  }
}

/**
 * Obtener canales que necesitan refresh
 */
export async function getChannelsNeedingTokenRefresh(data: {
  tenantId: string
  refreshBeforeMinutes?: number
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { error: "Unauthorized" }
    }

    // 2. Obtener canales que necesitan refresh
    const channels = await getChannelsNeedingRefresh(
      data.tenantId, 
      data.refreshBeforeMinutes || 30
    )

    return { 
      success: true, 
      channels,
      count: channels.length 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al obtener canales que necesitan refresh" }
  }
}

/**
 * Programar refresh automático para un canal
 */
export async function scheduleChannelTokenRefresh(data: {
  channelId: string
  tenantId: string
  delayMinutes?: number
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Programar refresh
    const jobId = await scheduleChannelRefresh(
      data.channelId, 
      data.tenantId, 
      (data.delayMinutes || 0) * 60 * 1000 // Convertir a milisegundos
    )

    return { 
      success: true, 
      jobId,
      message: "Refresh programado exitosamente" 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al programar refresh del canal" }
  }
}

/**
 * Programar refresh automático para todos los canales de un tenant
 */
export async function scheduleBatchTokenRefresh(data: {
  tenantId: string
  refreshBeforeMinutes?: number
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Programar refresh en batch
    const result = await scheduleBatchRefresh(
      data.tenantId, 
      data.refreshBeforeMinutes || 30
    )

    return { 
      success: true, 
      ...result,
      message: `Refresh programado para ${result.scheduled} canales` 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al programar refresh en batch" }
  }
}

/**
 * Programar refresh recurrente para un tenant
 */
export async function scheduleRecurringTokenRefresh(data: {
  tenantId: string
  intervalMinutes?: number
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Programar refresh recurrente
    const jobId = await scheduleRecurringRefresh(
      data.tenantId, 
      data.intervalMinutes || 60
    )

    return { 
      success: true, 
      jobId,
      message: `Refresh recurrente programado cada ${data.intervalMinutes || 60} minutos` 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al programar refresh recurrente" }
  }
}

/**
 * Cancelar refresh recurrente para un tenant
 */
export async function cancelRecurringTokenRefresh(data: {
  tenantId: string
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Unauthorized" }
    }

    // 2. Cancelar refresh recurrente
    const cancelled = await cancelRecurringRefresh(data.tenantId)

    return { 
      success: true, 
      cancelled,
      message: cancelled ? "Refresh recurrente cancelado" : "No había refresh recurrente activo" 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al cancelar refresh recurrente" }
  }
}

/**
 * Obtener estado de jobs de refresh
 */
export async function getTokenRefreshJobsStatus(data: {
  tenantId?: string
}) {
  try {
    // 1. Autenticación (solo para usuarios autenticados)
    const user = await requireAuth()
    
    // 2. Si se especifica tenantId, verificar acceso
    if (data.tenantId) {
      const membership = await checkTenantAccess(user.id!, data.tenantId)
      if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return { error: "Unauthorized" }
      }
    }

    // 3. Obtener estado de jobs
    const status = await getRefreshJobsStatus(data.tenantId)

    return { 
      success: true, 
      ...status 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al obtener estado de jobs de refresh" }
  }
}

/**
 * Limpiar jobs antiguos de refresh
 */
export async function cleanupOldRefreshJobs() {
  try {
    // 1. Autenticación (solo admins pueden limpiar)
    const user = await requireAuth()
    
    // Nota: En un sistema completo, aquí verificarías si el usuario es super admin
    // Por ahora, cualquier usuario autenticado puede limpiar

    // 2. Limpiar jobs antiguos
    const result = await cleanupOldJobs()

    return { 
      success: true, 
      ...result,
      message: `${result.removed} jobs antiguos removidos` 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al limpiar jobs antiguos" }
  }
}

/**
 * Obtener estadísticas de refresh para un tenant
 */
export async function getRefreshStatistics(data: {
  tenantId: string
}) {
  try {
    // 1. Autenticación y autorización
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { error: "Unauthorized" }
    }

    // 2. Obtener canales que necesitan refresh
    const channelsNeedingRefresh = await getChannelsNeedingRefresh(data.tenantId, 30)
    
    // 3. Obtener estado de jobs
    const jobsStatus = await getRefreshJobsStatus(data.tenantId)

    // 4. Calcular estadísticas
    const stats = {
      totalChannels: channelsNeedingRefresh.length,
      channelsNeedingRefresh: channelsNeedingRefresh.length,
      channelsWithRefreshToken: channelsNeedingRefresh.filter(c => c.hasRefreshToken).length,
      channelsWithoutRefreshToken: channelsNeedingRefresh.filter(c => !c.hasRefreshToken).length,
      urgentChannels: channelsNeedingRefresh.filter(c => c.minutesUntilExpiration < 60).length,
      jobsWaiting: jobsStatus.waiting,
      jobsActive: jobsStatus.active,
      jobsCompleted: jobsStatus.completed,
      jobsFailed: jobsStatus.failed,
      lastRefreshAttempts: jobsStatus.jobs
        .filter(job => job.lastAttemptAt)
        .sort((a, b) => new Date(b.lastAttemptAt!).getTime() - new Date(a.lastAttemptAt!).getTime())
        .slice(0, 5) // Últimos 5 intentos
    }

    return { 
      success: true, 
      statistics: stats 
    }

  } catch (error) {
    console.error("[OAuth Refresh Action] Error:", error)
    return { error: "Error al obtener estadísticas de refresh" }
  }
}

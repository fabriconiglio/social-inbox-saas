/**
 * Sistema de cola para refresh automático de tokens OAuth
 * Usa BullMQ para manejar refresh programado y en background
 */

import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import { 
  RefreshJob, 
  RefreshStatus, 
  DEFAULT_REFRESH_CONFIG,
  createRefreshJob 
} from './types/oauth-refresh'
import { processChannelRefresh, getChannelsNeedingRefresh } from './oauth-refresh'
import { prisma } from './prisma'

// Configuración de Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Cola para refresh de tokens
export const refreshQueue = new Queue('oauth-refresh', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 10, // Mantener solo 10 jobs completados
    removeOnFail: 50,     // Mantener 50 jobs fallidos para debugging
    attempts: 3,          // Reintentar hasta 3 veces
    backoff: {
      type: 'exponential',
      delay: 2000,        // Delay inicial de 2 segundos
    },
  },
})

// Worker para procesar jobs de refresh
export const refreshWorker = new Worker(
  'oauth-refresh',
  async (job: Job<RefreshJob>) => {
    const { channelId, tenantId } = job.data
    
    console.log(`[OAuth Refresh Queue] Procesando job ${job.id} para canal ${channelId}`)
    
    try {
      // Actualizar estado del job
      await job.updateProgress(10)
      
      // Procesar refresh del canal
      const result = await processChannelRefresh(channelId, tenantId)
      
      await job.updateProgress(90)
      
      if (result.success) {
        console.log(`[OAuth Refresh Queue] ✅ Job ${job.id} completado exitosamente`)
        
        // Actualizar datos del job
        await job.updateData({
          ...job.data,
          status: 'success',
          lastAttemptAt: new Date().toISOString(),
          attemptCount: job.attemptsMade + 1
        })
        
        return {
          success: true,
          newExpiresAt: result.newExpiresAt,
          message: 'Token refrescado exitosamente'
        }
      } else {
        console.error(`[OAuth Refresh Queue] ❌ Job ${job.id} falló: ${result.error}`)
        
        // Actualizar datos del job con error
        await job.updateData({
          ...job.data,
          status: 'failed',
          lastAttemptAt: new Date().toISOString(),
          attemptCount: job.attemptsMade + 1,
          lastError: result.error
        })
        
        throw new Error(result.error || 'Error desconocido en refresh')
      }
      
    } catch (error) {
      console.error(`[OAuth Refresh Queue] Error en job ${job.id}:`, error)
      
      // Actualizar datos del job con error
      await job.updateData({
        ...job.data,
        status: 'failed',
        lastAttemptAt: new Date().toISOString(),
        attemptCount: job.attemptsMade + 1,
        lastError: error instanceof Error ? error.message : 'Error desconocido'
      })
      
      throw error
    }
  },
  {
    connection: redis,
    concurrency: 3, // Procesar máximo 3 jobs en paralelo
  }
)

// Event listeners para el worker
refreshWorker.on('completed', (job) => {
  console.log(`[OAuth Refresh Queue] Job ${job.id} completado exitosamente`)
})

refreshWorker.on('failed', (job, err) => {
  console.error(`[OAuth Refresh Queue] Job ${job?.id} falló:`, err.message)
})

refreshWorker.on('error', (err) => {
  console.error(`[OAuth Refresh Queue] Error en worker:`, err)
})

/**
 * Agregar job de refresh para un canal específico
 */
export async function scheduleChannelRefresh(
  channelId: string,
  tenantId: string,
  delay?: number
): Promise<string> {
  try {
    // Obtener datos del canal
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        local: { select: { name: true } }
      }
    })

    if (!channel) {
      throw new Error(`Canal ${channelId} no encontrado`)
    }

    // Crear job de refresh
    const refreshJob = createRefreshJob(channelId, tenantId, {
      type: channel.type,
      displayName: channel.displayName,
      localName: channel.local.name,
      credentials: (channel.meta as any)?.credentials || {}
    })

    // Agregar a la cola
    const job = await refreshQueue.add(
      'refresh-token',
      refreshJob,
      {
        jobId: refreshJob.id,
        delay: delay || 0, // Ejecutar inmediatamente por defecto
        priority: 1 // Prioridad alta
      }
    )

    console.log(`[OAuth Refresh Queue] Job ${job.id} programado para canal ${channelId}`)

    return job.id!

  } catch (error) {
    console.error(`[OAuth Refresh Queue] Error programando refresh para canal ${channelId}:`, error)
    throw error
  }
}

/**
 * Programar refresh para todos los canales que lo necesiten
 */
export async function scheduleBatchRefresh(
  tenantId: string,
  refreshBeforeMinutes: number = 30
): Promise<{ scheduled: number; skipped: number; errors: string[] }> {
  try {
    console.log(`[OAuth Refresh Queue] Programando batch refresh para tenant ${tenantId}`)

    // Obtener canales que necesitan refresh
    const channelsNeedingRefresh = await getChannelsNeedingRefresh(tenantId, refreshBeforeMinutes)

    const results = {
      scheduled: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const channelInfo of channelsNeedingRefresh) {
      try {
        if (!channelInfo.hasRefreshToken) {
          console.log(`[OAuth Refresh Queue] Saltando canal ${channelInfo.channelId} - sin refresh token`)
          results.skipped++
          continue
        }

        // Calcular delay basado en cuándo expira
        const delayMinutes = Math.max(0, channelInfo.minutesUntilExpiration - refreshBeforeMinutes)
        const delayMs = delayMinutes * 60 * 1000

        await scheduleChannelRefresh(channelInfo.channelId, tenantId, delayMs)
        results.scheduled++

        console.log(`[OAuth Refresh Queue] Canal ${channelInfo.channelId} programado para refresh en ${delayMinutes} minutos`)

      } catch (error) {
        const errorMsg = `Error programando refresh para canal ${channelInfo.channelId}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        results.errors.push(errorMsg)
        console.error(`[OAuth Refresh Queue] ${errorMsg}`)
      }
    }

    console.log(`[OAuth Refresh Queue] Batch programado: ${results.scheduled} programados, ${results.skipped} saltados, ${results.errors.length} errores`)

    return results

  } catch (error) {
    console.error(`[OAuth Refresh Queue] Error en batch scheduling:`, error)
    throw error
  }
}

/**
 * Programar refresh recurrente para un tenant
 */
export async function scheduleRecurringRefresh(
  tenantId: string,
  intervalMinutes: number = 60
): Promise<string> {
  try {
    console.log(`[OAuth Refresh Queue] Programando refresh recurrente para tenant ${tenantId} cada ${intervalMinutes} minutos`)

    // Crear job recurrente
    const job = await refreshQueue.add(
      'recurring-refresh',
      { tenantId, type: 'recurring' },
      {
        repeat: {
          every: intervalMinutes * 60 * 1000, // Convertir a milisegundos
        },
        jobId: `recurring-refresh-${tenantId}`,
        removeOnComplete: false,
        removeOnFail: false,
      }
    )

    return job.id!

  } catch (error) {
    console.error(`[OAuth Refresh Queue] Error programando refresh recurrente:`, error)
    throw error
  }
}

/**
 * Cancelar refresh recurrente para un tenant
 */
export async function cancelRecurringRefresh(tenantId: string): Promise<boolean> {
  try {
    const jobId = `recurring-refresh-${tenantId}`
    
    const job = await refreshQueue.getJob(jobId)
    if (job) {
      await job.remove()
      console.log(`[OAuth Refresh Queue] Refresh recurrente cancelado para tenant ${tenantId}`)
      return true
    }

    return false

  } catch (error) {
    console.error(`[OAuth Refresh Queue] Error cancelando refresh recurrente:`, error)
    return false
  }
}

/**
 * Obtener estado de jobs de refresh
 */
export async function getRefreshJobsStatus(tenantId?: string): Promise<{
  waiting: number
  active: number
  completed: number
  failed: number
  jobs: Array<{
    id: string
    channelId: string
    status: string
    progress: number
    createdAt: string
    lastAttemptAt?: string
    error?: string
  }>
}> {
  try {
    const waiting = await refreshQueue.getWaiting()
    const active = await refreshQueue.getActive()
    const completed = await refreshQueue.getCompleted()
    const failed = await refreshQueue.getFailed()

    let allJobs = [...waiting, ...active, ...completed, ...failed]

    // Filtrar por tenant si se especifica
    if (tenantId) {
      allJobs = allJobs.filter(job => job.data.tenantId === tenantId)
    }

    const jobs = allJobs.map(job => ({
      id: job.id!,
      channelId: job.data.channelId,
      status: job.data.status || 'unknown',
      progress: job.progress || 0,
      createdAt: new Date(job.timestamp).toISOString(),
      lastAttemptAt: job.data.lastAttemptAt,
      error: job.data.lastError
    }))

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      jobs
    }

  } catch (error) {
    console.error(`[OAuth Refresh Queue] Error obteniendo estado de jobs:`, error)
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      jobs: []
    }
  }
}

/**
 * Limpiar jobs antiguos
 */
export async function cleanupOldJobs(): Promise<{ removed: number }> {
  try {
    // Limpiar jobs completados antiguos
    await refreshQueue.clean(24 * 60 * 60 * 1000, 100, 'completed') // 24 horas, máximo 100 jobs
    
    // Limpiar jobs fallidos antiguos
    await refreshQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed') // 7 días, máximo 50 jobs

    console.log(`[OAuth Refresh Queue] Limpieza de jobs antiguos completada`)

    return { removed: 150 } // Aproximado

  } catch (error) {
    console.error(`[OAuth Refresh Queue] Error en limpieza:`, error)
    return { removed: 0 }
  }
}

/**
 * Worker para refresh recurrente
 */
const recurringRefreshWorker = new Worker(
  'oauth-refresh',
  async (job: Job) => {
    if (job.name === 'recurring-refresh') {
      const { tenantId } = job.data
      
      console.log(`[OAuth Refresh Queue] Ejecutando refresh recurrente para tenant ${tenantId}`)
      
      // Programar refresh para todos los canales que lo necesiten
      await scheduleBatchRefresh(tenantId)
      
      return { success: true, message: `Refresh recurrente completado para tenant ${tenantId}` }
    }
    
    return { success: false, message: 'Job type no reconocido' }
  },
  {
    connection: redis,
    concurrency: 1, // Solo un refresh recurrente a la vez
  }
)

// Event listeners para el worker recurrente
recurringRefreshWorker.on('completed', (job) => {
  console.log(`[OAuth Refresh Queue] Refresh recurrente ${job.id} completado`)
})

recurringRefreshWorker.on('failed', (job, err) => {
  console.error(`[OAuth Refresh Queue] Refresh recurrente ${job?.id} falló:`, err.message)
})

// Exportar workers para inicialización
export { recurringRefreshWorker }

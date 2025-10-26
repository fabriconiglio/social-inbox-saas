"use client"

import { useEffect, useState, useCallback } from 'react'
import { useThreadEvents } from '@/contexts/socket-context'
import { toast } from 'sonner'

interface ThreadUpdate {
  threadId: string
  changes: {
    status?: string
    assigneeId?: string
    assigneeName?: string
    priority?: string
    tags?: string[]
    notes?: string
  }
  updatedBy: string
  updatedByName: string
  timestamp: string
}

export function useRealtimeThreadUpdates(threadId?: string) {
  const { onThreadUpdated, onThreadAssigned, onThreadStatusChanged } = useThreadEvents()
  const [threadUpdates, setThreadUpdates] = useState<ThreadUpdate[]>([])

  // Manejar actualizaciones generales de thread
  useEffect(() => {
    const cleanup = onThreadUpdated((data) => {
      if (threadId && data.threadId !== threadId) return

      const update: ThreadUpdate = {
        threadId: data.threadId,
        changes: data.changes,
        updatedBy: data.updatedBy,
        updatedByName: data.updatedByName,
        timestamp: data.timestamp
      }

      setThreadUpdates(prev => [update, ...prev.slice(0, 9)]) // Mantener solo los últimos 10

      // Mostrar notificación según el tipo de cambio
      if (data.changes.status) {
        toast.info(`Thread actualizado`, {
          description: `Estado cambiado a: ${data.changes.status}`
        })
      }

      if (data.changes.assigneeId && data.changes.assigneeName) {
        toast.info(`Thread asignado`, {
          description: `Asignado a: ${data.changes.assigneeName}`
        })
      }

      if (data.changes.priority) {
        toast.info(`Prioridad actualizada`, {
          description: `Nueva prioridad: ${data.changes.priority}`
        })
      }
    })

    return cleanup
  }, [threadId, onThreadUpdated])

  // Manejar asignaciones específicas
  useEffect(() => {
    const cleanup = onThreadAssigned((data) => {
      if (threadId && data.threadId !== threadId) return

      toast.success(`Thread asignado`, {
        description: `Asignado a: ${data.assigneeName}`
      })
    })

    return cleanup
  }, [threadId, onThreadAssigned])

  // Manejar cambios de estado específicos
  useEffect(() => {
    const cleanup = onThreadStatusChanged((data) => {
      if (threadId && data.threadId !== threadId) return

      toast.info(`Estado actualizado`, {
        description: `Cambiado a: ${data.status} por ${data.changedBy}`
      })
    })

    return cleanup
  }, [threadId, onThreadStatusChanged])

  // Limpiar actualizaciones antiguas
  const clearOldUpdates = useCallback(() => {
    setThreadUpdates([])
  }, [])

  // Obtener actualizaciones recientes
  const getRecentUpdates = useCallback((limit: number = 5) => {
    return threadUpdates.slice(0, limit)
  }, [threadUpdates])

  // Obtener actualizaciones por tipo
  const getUpdatesByType = useCallback((type: keyof ThreadUpdate['changes']) => {
    return threadUpdates.filter(update => update.changes[type])
  }, [threadUpdates])

  return {
    threadUpdates,
    clearOldUpdates,
    getRecentUpdates,
    getUpdatesByType
  }
}

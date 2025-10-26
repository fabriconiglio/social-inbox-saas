"use client"

import { useEffect, useState, useCallback } from 'react'
import { useNotifications } from '@/contexts/socket-context'
import { useSocket } from '@/contexts/socket-context'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  actionUrl?: string
  isRead: boolean
}

interface SLAAlert {
  threadId: string
  slaTime: number
  remainingTime: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  expiredAt?: string
}

export function useRealtimeNotifications() {
  const { socket } = useSocket()
  const { onNotification, onSLAWarning, onSLAExpired } = useNotifications()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [slaAlerts, setSlaAlerts] = useState<SLAAlert[]>([])

  // Manejar notificaciones generales
  useEffect(() => {
    const cleanup = onNotification((data) => {
      const notification: Notification = {
        ...data,
        isRead: false
      }
      
      setNotifications(prev => [notification, ...prev])
      
      // Mostrar toast según el tipo
      switch (data.type) {
        case 'success':
          toast.success(data.title, { description: data.message })
          break
        case 'warning':
          toast.warning(data.title, { description: data.message })
          break
        case 'error':
          toast.error(data.title, { description: data.message })
          break
        default:
          toast.info(data.title, { description: data.message })
      }
    })

    return cleanup
  }, [onNotification])

  // Manejar alertas de SLA
  useEffect(() => {
    const cleanupWarning = onSLAWarning((data) => {
      const alert: SLAAlert = {
        threadId: data.threadId,
        slaTime: data.slaTime,
        remainingTime: data.remainingTime,
        priority: data.priority
      }
      
      setSlaAlerts(prev => {
        const filtered = prev.filter(a => a.threadId !== data.threadId)
        return [...filtered, alert]
      })
      
      // Mostrar notificación de SLA
      const timeLeft = Math.floor(data.remainingTime / 60000) // Convertir a minutos
      toast.warning(`SLA Warning - Thread ${data.threadId}`, {
        description: `Quedan ${timeLeft} minutos para cumplir el SLA`
      })
    })

    const cleanupExpired = onSLAExpired((data) => {
      const alert: SLAAlert = {
        threadId: data.threadId,
        slaTime: data.slaTime,
        remainingTime: 0,
        priority: 'critical',
        expiredAt: data.expiredAt
      }
      
      setSlaAlerts(prev => {
        const filtered = prev.filter(a => a.threadId !== data.threadId)
        return [...filtered, alert]
      })
      
      // Mostrar notificación crítica
      toast.error(`SLA EXPIRADO - Thread ${data.threadId}`, {
        description: `El SLA ha expirado. Acción inmediata requerida.`
      })
    })

    return () => {
      cleanupWarning()
      cleanupExpired()
    }
  }, [onSLAWarning, onSLAExpired])

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    )
  }, [])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    )
  }, [])

  // Eliminar notificación
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }, [])

  // Limpiar alerta de SLA
  const clearSLAAlert = useCallback((threadId: string) => {
    setSlaAlerts(prev => prev.filter(alert => alert.threadId !== threadId))
  }, [])

  // Obtener notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Obtener alertas críticas
  const criticalAlerts = slaAlerts.filter(a => a.priority === 'critical')

  return {
    notifications,
    slaAlerts,
    unreadCount,
    criticalAlerts,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearSLAAlert
  }
}

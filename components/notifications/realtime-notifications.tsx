"use client"

import React, { useEffect, useState } from 'react'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { useSocketConnection } from '@/hooks/use-socket-connection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface RealtimeNotificationsProps {
  tenantId: string
  className?: string
}

export function RealtimeNotifications({ tenantId, className }: RealtimeNotificationsProps) {
  const { 
    notifications, 
    slaAlerts, 
    unreadCount, 
    criticalAlerts,
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    clearSLAAlert 
  } = useRealtimeNotifications()

  const { isConnected } = useSocketConnection({ tenantId })
  const [showAll, setShowAll] = useState(false)

  // Mostrar notificaciones toast cuando llegan
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0]
      if (!latestNotification.isRead) {
        // El toast ya se muestra en el hook, solo marcamos como leído
        markAsRead(latestNotification.id)
      }
    }
  }, [notifications, markAsRead])

  // Obtener icono según el tipo de notificación
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  // Obtener color del badge según el tipo
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  // Obtener color del badge de SLA según la prioridad
  const getSLAColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Formatear tiempo relativo
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Hace un momento'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Hace ${minutes} min`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Hace ${hours}h`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `Hace ${days}d`
    }
  }

  // Filtrar notificaciones para mostrar
  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5)

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Marcar todas como leídas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll ? 'Ver menos' : 'Ver todas'}
              </Button>
            </div>
          </div>
          <CardDescription>
            {isConnected ? 'Notificaciones en tiempo real' : 'Desconectado - Notificaciones limitadas'}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-96">
            <div className="space-y-1">
              {/* Alertas críticas de SLA */}
              {criticalAlerts.length > 0 && (
                <div className="p-3 bg-red-50 border-b">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">Alertas Críticas</span>
                  </div>
                  {criticalAlerts.map((alert) => (
                    <div key={alert.threadId} className="flex items-center justify-between p-2 bg-red-100 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-red-600" />
                        <span className="text-sm text-red-900">
                          Thread {alert.threadId} - SLA expirado
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearSLAAlert(alert.threadId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notificaciones generales */}
              {visibleNotifications.length > 0 ? (
                visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getNotificationColor(notification.type)}`}
                          >
                            {notification.type}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => window.open(notification.actionUrl, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

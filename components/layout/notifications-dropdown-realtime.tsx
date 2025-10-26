"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, Trash2, UserPlus, UserMinus, Clock, AlertTriangle, MessageCircle, Loader2, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import { useSocketConnection } from "@/hooks/use-socket-connection"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface NotificationsDropdownProps {
  tenantId: string
}

export function NotificationsDropdown({ tenantId }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  
  // Hooks para notificaciones en tiempo real
  const { 
    notifications, 
    unreadCount, 
    criticalAlerts,
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useRealtimeNotifications()
  
  const { isConnected } = useSocketConnection({ tenantId })

  const handleMarkAsRead = async (notificationId: string) => {
    markAsRead(notificationId)
    toast.success("Notificación marcada como leída")
  }

  const handleMarkAllAsRead = async () => {
    markAllAsRead()
    toast.success("Todas las notificaciones marcadas como leídas")
  }

  const handleDelete = async (notificationId: string) => {
    removeNotification(notificationId)
    toast.success("Notificación eliminada")
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    
    setOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'assignment':
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case 'unassignment':
        return <UserMinus className="h-4 w-4 text-gray-600" />
      case 'sla':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'assignment':
        return 'bg-blue-100 text-blue-800'
      case 'unassignment':
        return 'bg-gray-100 text-gray-800'
      case 'sla':
        return 'bg-orange-100 text-orange-800'
      case 'message':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-600" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-600" />
            )}
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'En tiempo real' : 'Desconectado'}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {unreadCount > 0 && (
          <>
            <div className="px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="w-full justify-start text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-2" />
                Marcar todas como leídas
              </Button>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getNotificationColor(notification.type)}`}
                        >
                          {notification.type}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(notification.id)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
              {!isConnected && (
                <p className="text-xs mt-1">Conecta para recibir notificaciones en tiempo real</p>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Alertas críticas de SLA */}
        {criticalAlerts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900 text-sm">Alertas Críticas</span>
              </div>
              {criticalAlerts.map((alert) => (
                <div key={alert.threadId} className="text-xs text-red-800">
                  Thread {alert.threadId} - SLA expirado
                </div>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2, UserPlus, UserMinus, Clock, AlertTriangle, MessageCircle, Loader2 } from "lucide-react"
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
import { listNotifications, getUnreadCount, markNotificationAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    
    // Polling para nuevas notificaciones cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Detectar nuevas notificaciones
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotifications(true)
    } else {
      setHasNewNotifications(false)
    }
  }, [unreadCount])

  async function loadNotifications() {
    try {
      // Usar userId del mock para desarrollo
      const { mockUser } = await import("@/lib/mock-data")
      const result = await listNotifications(mockUser.id, 10)
      if (result.success && result.data) {
        setNotifications(result.data)
      }
    } catch (error) {
      // Silenciar error si no hay BD configurada (modo mock)
      console.debug("No se pudieron cargar notificaciones (modo mock activo)")
      setNotifications([])
    }
  }

  async function loadUnreadCount() {
    try {
      // Usar userId del mock para desarrollo
      const { mockUser } = await import("@/lib/mock-data")
      const result = await getUnreadCount(mockUser.id)
      if (result.success) {
        setUnreadCount(result.count || 0)
      }
    } catch (error) {
      // Silenciar error si no hay BD configurada (modo mock)
      console.debug("No se pudo cargar contador de notificaciones (modo mock activo)")
      setUnreadCount(0)
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        await loadNotifications()
        await loadUnreadCount()
      }
    } catch (error) {
      // Silenciar error en modo mock
      console.debug("No se pudo marcar notificación como leída (modo mock activo)")
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setLoading(true)
      const result = await markAllAsRead()
      if (result.success) {
        toast.success("Todas las notificaciones marcadas como leídas")
        await loadNotifications()
        await loadUnreadCount()
      }
    } catch (error) {
      // Silenciar error en modo mock
      console.debug("No se pudieron marcar todas las notificaciones (modo mock activo)")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        await loadNotifications()
        await loadUnreadCount()
      }
    } catch (error) {
      // Silenciar error en modo mock
      console.debug("No se pudo eliminar notificación (modo mock activo)")
    }
  }

  function handleNotificationClick(notification: any) {
    if (!notification.readAt) {
      handleMarkAsRead(notification.id)
    }

    // Navegar según el tipo de notificación
    const pathParts = window.location.pathname.split("/")
    const tenantId = pathParts[2] || "tenant-1" // Fallback al tenant mock
    
    switch (notification.type) {
      case "thread_assigned":
      case "thread_unassigned":
      case "sla_warning":
      case "sla_expired":
      case "new_message":
        if (notification.payloadJSON?.threadId) {
          router.push(`/app/${tenantId}/inbox?thread=${notification.payloadJSON.threadId}`)
          setOpen(false)
        }
        break
      default:
        // Para otros tipos, solo marcar como leída
        break
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "thread_assigned":
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case "thread_unassigned":
        return <UserMinus className="h-4 w-4 text-gray-600" />
      case "sla_warning":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "sla_expired":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "new_message":
        return <MessageCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  function getNotificationMessage(notification: any) {
    switch (notification.type) {
      case "thread_assigned":
        return (
          <div>
            <p className="font-medium text-sm">
              {notification.payloadJSON?.assignedBy || "Sistema"} te asignó una conversación
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {notification.payloadJSON?.threadContact || "Contacto desconocido"} • {notification.payloadJSON?.threadChannel || "Canal desconocido"}
            </p>
          </div>
        )
      case "thread_unassigned":
        return (
          <div>
            <p className="font-medium text-sm">
              Se removió tu asignación de una conversación
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {notification.payloadJSON?.threadContact || "Contacto desconocido"} • {notification.payloadJSON?.threadChannel || "Canal desconocido"}
            </p>
          </div>
        )
      case "sla_warning":
        return (
          <div>
            <p className="font-medium text-sm text-orange-600">
              ⚠️ SLA próximo a expirar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {notification.payloadJSON?.threadContact || "Contacto desconocido"} • Tiempo restante: {notification.payloadJSON?.timeRemaining || "N/A"}
            </p>
          </div>
        )
      case "sla_expired":
        return (
          <div>
            <p className="font-medium text-sm text-red-600">
              🚨 SLA expirado
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {notification.payloadJSON?.threadContact || "Contacto desconocido"} • Tiempo excedido: {notification.payloadJSON?.timeExceeded || "N/A"}
            </p>
          </div>
        )
      case "new_message":
        return (
          <div>
            <p className="font-medium text-sm">
              Nuevo mensaje de {notification.payloadJSON?.contactName || "contacto desconocido"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.payloadJSON?.messagePreview || "Mensaje sin preview"}
            </p>
          </div>
        )
      default:
        return (
          <div>
            <p className="font-medium text-sm">Nueva notificación</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tipo: {notification.type}
            </p>
          </div>
        )
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Limpiar el estado de nuevas notificaciones cuando se abre
      setHasNewNotifications(false)
      loadNotifications()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative hover:bg-accent transition-all duration-200 ${
            hasNewNotifications ? 'ring-2 ring-primary/20' : ''
          }`}
        >
          <Bell className={`h-5 w-5 transition-colors ${
            hasNewNotifications ? 'text-primary' : ''
          }`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs font-semibold animate-pulse"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <DropdownMenuLabel className="text-base font-semibold">Notificaciones</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="h-7 text-xs"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLoading(true)
                Promise.all([loadNotifications(), loadUnreadCount()]).finally(() => {
                  setLoading(false)
                })
              }}
              disabled={loading}
              className="h-7 w-7 p-0"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </Button>
          </div>
        </div>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No hay notificaciones</p>
              <p className="text-xs text-muted-foreground mt-1">
                Te notificaremos cuando tengas nuevas actividades
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative flex items-start gap-3 p-4 transition-all duration-200 hover:bg-accent/50 ${
                    !notification.readAt ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  {/* Indicador de no leído */}
                  {!notification.readAt && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full"></div>
                  )}
                  
                  {/* Icono de la notificación */}
                  <div className={`mt-0.5 p-2 rounded-full ${
                    !notification.readAt ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Contenido de la notificación */}
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {getNotificationMessage(notification)}
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                      {!notification.readAt && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.readAt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-green-100 hover:text-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        title="Marcar como leída"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-red-100 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      title="Eliminar notificación"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer con opciones adicionales */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
            onClick={() => {
              // TODO: Navegar a página de configuración de notificaciones
              console.log("Ir a configuración de notificaciones")
            }}
          >
            <svg className="mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurar notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2, UserPlus } from "lucide-react"
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
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
  }, [])

  async function loadNotifications() {
    try {
      const result = await listNotifications("", 10) // TODO: pasar userId real
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
      const result = await getUnreadCount("") // TODO: pasar userId real
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

    // Navegar al thread si es una notificación de asignación
    if (notification.type === "thread_assigned" && notification.payloadJSON?.threadId) {
      const tenantId = window.location.pathname.split("/")[2]
      router.push(`/app/${tenantId}/inbox?thread=${notification.payloadJSON.threadId}`)
      setOpen(false)
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "thread_assigned":
        return <UserPlus className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  function getNotificationMessage(notification: any) {
    switch (notification.type) {
      case "thread_assigned":
        return (
          <div>
            <p className="font-medium">
              {notification.payloadJSON?.assignedBy} te asignó una conversación
            </p>
            <p className="text-sm text-muted-foreground">
              {notification.payloadJSON?.threadContact} • {notification.payloadJSON?.threadChannel}
            </p>
          </div>
        )
      default:
        return <p>Nueva notificación</p>
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
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
        </div>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 transition-colors hover:bg-accent ${
                    !notification.readAt ? "bg-accent/50" : ""
                  }`}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {getNotificationMessage(notification)}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.readAt && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


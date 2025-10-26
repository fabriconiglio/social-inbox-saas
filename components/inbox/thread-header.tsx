"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SidebarOpen, UserPlus, UserMinus, User, Circle, Clock, CheckCircle2 } from "lucide-react"
import { assignThread, unassignThread, listTenantAgents } from "@/app/actions/thread-assignment"
import { updateThreadStatus } from "@/app/actions/thread-status"
import { ThreadHeaderTypingIndicator } from "@/components/ui/typing-indicator"
import { useTypingIndicator } from "@/hooks/use-typing-indicator"
import { toast } from "sonner"
import type { Channel, Local, Thread, User, Contact } from "@prisma/client"

interface ThreadHeaderProps {
  thread: Thread & {
    channel: Channel
    local: Local
    assignee: User | null
    contact: Contact | null
  }
  onToggleSidebar: () => void
  tenantId: string
  currentUserId: string
}

export function ThreadHeader({ thread, onToggleSidebar, tenantId, currentUserId }: ThreadHeaderProps) {
  const [agents, setAgents] = useState<Array<{ id: string; name: string; email: string; image: string | null }>>([])
  const [loading, setLoading] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<"OPEN" | "PENDING" | "CLOSED" | null>(null)
  
  // Hook para indicador de escritura
  const { typingUsers } = useTypingIndicator(thread.id, tenantId)

  useEffect(() => {
    loadAgents()
  }, [tenantId])

  async function loadAgents() {
    const result = await listTenantAgents(tenantId)
    if (result.success && result.data) {
      setAgents(result.data)
    }
  }

  async function handleAssign(userId?: string) {
    setLoading(true)
    try {
      const result = await assignThread(tenantId, thread.id, userId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(userId ? "Thread asignado exitosamente" : "Thread asignado a ti")
        // Recargar la página para actualizar el estado
        window.location.reload()
      }
    } catch (error) {
      toast.error("Error al asignar thread")
    } finally {
      setLoading(false)
    }
  }

  async function handleUnassign() {
    setLoading(true)
    try {
      const result = await unassignThread(tenantId, thread.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Thread desasignado")
        // Recargar la página para actualizar el estado
        window.location.reload()
      }
    } catch (error) {
      toast.error("Error al desasignar thread")
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(status: "OPEN" | "PENDING" | "CLOSED") {
    // Si intenta cerrar el thread, mostrar confirmación
    if (status === "CLOSED") {
      setPendingStatus(status)
      setShowCloseConfirm(true)
      return
    }

    // Para abrir o poner en pendiente, cambiar directamente
    await updateStatus(status)
  }

  async function updateStatus(status: "OPEN" | "PENDING" | "CLOSED") {
    setLoading(true)
    try {
      const result = await updateThreadStatus(tenantId, thread.id, status)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Thread marcado como ${getStatusLabel(status)}`)
        // Recargar la página para actualizar el estado
        window.location.reload()
      }
    } catch (error) {
      toast.error("Error al actualizar estado")
    } finally {
      setLoading(false)
    }
  }

  function handleConfirmClose() {
    setShowCloseConfirm(false)
    if (pendingStatus) {
      updateStatus(pendingStatus)
      setPendingStatus(null)
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "OPEN":
        return "Abierto"
      case "PENDING":
        return "Pendiente"
      case "CLOSED":
        return "Cerrado"
      default:
        return status
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "OPEN":
        return <Circle className="h-3 w-3" />
      case "PENDING":
        return <Clock className="h-3 w-3" />
      case "CLOSED":
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return null
    }
  }

  function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case "OPEN":
        return "default"
      case "PENDING":
        return "secondary"
      case "CLOSED":
        return "outline"
      default:
        return "secondary"
    }
  }

  const isAssignedToMe = thread.assigneeId === currentUserId

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={thread.contact?.image || undefined} />
          <AvatarFallback>
            {thread.contact?.name?.[0]?.toUpperCase() || thread.contact?.handle?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{thread.contact?.name || thread.contact?.handle || "Desconocido"}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {thread.channel.displayName} • {thread.local.name}
            </p>
            <ThreadHeaderTypingIndicator typingUsers={typingUsers} />
          </div>
        </div>

        {/* Dropdown de Estado */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading} className="gap-2">
              {getStatusIcon(thread.status)}
              <span>{getStatusLabel(thread.status)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange("OPEN")}
              disabled={thread.status === "OPEN"}
            >
              <Circle className="mr-2 h-4 w-4" />
              <span className={thread.status === "OPEN" ? "font-semibold" : ""}>
                Abierto
                {thread.status === "OPEN" && " ✓"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("PENDING")}
              disabled={thread.status === "PENDING"}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span className={thread.status === "PENDING" ? "font-semibold" : ""}>
                Pendiente
                {thread.status === "PENDING" && " ✓"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("CLOSED")}
              disabled={thread.status === "CLOSED"}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span className={thread.status === "CLOSED" ? "font-semibold" : ""}>
                Cerrado
                {thread.status === "CLOSED" && " ✓"}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Asignación */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              {thread.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={thread.assignee.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {thread.assignee.name?.[0]?.toUpperCase() || thread.assignee.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{thread.assignee.name || thread.assignee.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Sin asignar</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Auto-asignarse */}
            {!isAssignedToMe && (
              <>
                <DropdownMenuItem onClick={() => handleAssign()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Asignarme a mí
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Lista de agentes */}
            {agents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => handleAssign(agent.id)}
                disabled={agent.id === thread.assigneeId}
              >
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarImage src={agent.image || undefined} />
                  <AvatarFallback className="text-xs">
                    {agent.name[0]?.toUpperCase() || agent.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className={agent.id === thread.assigneeId ? "font-semibold" : ""}>
                  {agent.name}
                  {agent.id === thread.assigneeId && " ✓"}
                </span>
              </DropdownMenuItem>
            ))}

            {/* Desasignar */}
            {thread.assignee && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUnassign} className="text-destructive">
                  <UserMinus className="mr-2 h-4 w-4" />
                  Desasignar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
        <SidebarOpen className="h-4 w-4" />
      </Button>

      {/* Diálogo de confirmación para cerrar thread */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar esta conversación? El cliente podrá reabrirlo enviando un nuevo mensaje.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cerrar conversación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

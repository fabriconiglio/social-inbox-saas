"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getThreadAuditHistory } from "@/app/actions/audit-log"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { History, UserPlus, UserMinus, ArrowRight, Circle, Clock, CheckCircle2 } from "lucide-react"

interface ThreadAuditLogProps {
  tenantId: string
  threadId: string
}

export function ThreadAuditLog({ tenantId, threadId }: ThreadAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuditLog()
  }, [tenantId, threadId])

  async function loadAuditLog() {
    setLoading(true)
    try {
      const result = await getThreadAuditHistory(tenantId, threadId)
      if (result.success && result.data) {
        setLogs(result.data)
      }
    } catch (error) {
      console.error("Error loading audit log:", error)
    } finally {
      setLoading(false)
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case "thread.status_changed":
        return <ArrowRight className="h-3 w-3" />
      case "thread.assigned":
        return <UserPlus className="h-3 w-3" />
      case "thread.unassigned":
        return <UserMinus className="h-3 w-3" />
      default:
        return <History className="h-3 w-3" />
    }
  }

  function getActionLabel(action: string, diff: any) {
    switch (action) {
      case "thread.status_changed":
        return `Cambió estado de "${getStatusLabel(diff?.status?.from)}" a "${getStatusLabel(diff?.status?.to)}"`
      case "thread.assigned":
        return "Asignó conversación"
      case "thread.unassigned":
        return "Desasignó conversación"
      default:
        return action
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

  function getStatusBadge(status: string) {
    switch (status) {
      case "OPEN":
        return <Badge variant="default" className="text-xs">Abierto</Badge>
      case "PENDING":
        return <Badge variant="secondary" className="text-xs">Pendiente</Badge>
      case "CLOSED":
        return <Badge variant="outline" className="text-xs">Cerrado</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <History className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No hay historial de cambios</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-4">
        {logs.map((log, index) => (
          <div key={log.id} className="relative">
            {index < logs.length - 1 && (
              <div className="absolute left-5 top-8 h-full w-px bg-border" />
            )}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={log.actor?.image || undefined} />
                <AvatarFallback className="text-xs">
                  {log.actor?.name?.[0]?.toUpperCase() || log.actor?.email?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getActionIcon(log.action)}
                  <span className="text-sm font-medium">
                    {log.actor?.name || log.actor?.email || "Usuario desconocido"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getActionLabel(log.action, log.diffJSON)}
                </p>
                {log.action === "thread.status_changed" && log.diffJSON && (
                  <div className="flex items-center gap-2">
                    {getStatusBadge(log.diffJSON.status?.from)}
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    {getStatusBadge(log.diffJSON.status?.to)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}


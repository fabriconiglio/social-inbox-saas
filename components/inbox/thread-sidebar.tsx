"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateThread } from "@/app/actions/threads"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Channel, Local, Thread, User, Contact, Membership } from "@prisma/client"

interface ThreadSidebarProps {
  thread: Thread & {
    channel: Channel
    local: Local
    assignee: User | null
    contact: Contact | null
  }
  tenantId: string
  userId: string
  userRole: string
  members: (Membership & { user: User })[]
}

export function ThreadSidebar({ thread, tenantId, userId, userRole, members }: ThreadSidebarProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(thread.contact?.notes || "")
  const [saving, setSaving] = useState(false)

  async function handleAssigneeChange(assigneeId: string) {
    const formData = new FormData()
    formData.append("threadId", thread.id)
    formData.append("assigneeId", assigneeId === "unassigned" ? "" : assigneeId)

    await updateThread(formData)
    router.refresh()
  }

  async function handleStatusChange(status: string) {
    const formData = new FormData()
    formData.append("threadId", thread.id)
    formData.append("status", status)

    await updateThread(formData)
    router.refresh()
  }

  return (
    <div className="w-80 space-y-6 border-l p-4">
      <div>
        <h3 className="mb-4 font-semibold">Información del contacto</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Nombre:</span>
            <p className="font-medium">{thread.contact?.name || "No disponible"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Handle:</span>
            <p className="font-medium">{thread.contact?.handle}</p>
          </div>
          {thread.contact?.phone && (
            <div>
              <span className="text-muted-foreground">Teléfono:</span>
              <p className="font-medium">{thread.contact.phone}</p>
            </div>
          )}
          {thread.contact?.email && (
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{thread.contact.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={thread.status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Abierto</SelectItem>
            <SelectItem value="PENDING">Pendiente</SelectItem>
            <SelectItem value="CLOSED">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Asignado a</Label>
        <Select value={thread.assigneeId || "unassigned"} onValueChange={handleAssigneeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sin asignar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Sin asignar</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.userId}>
                {member.user.name || member.user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notas internas</Label>
        <Textarea
          placeholder="Agregar notas sobre este contacto..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[100px]"
        />
        <Button size="sm" disabled={saving}>
          Guardar notas
        </Button>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Detalles</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Canal: {thread.channel.displayName}</p>
          <p>Local: {thread.local.name}</p>
          <p>ID externo: {thread.externalId}</p>
        </div>
      </div>
    </div>
  )
}

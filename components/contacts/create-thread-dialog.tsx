"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MessageSquare, 
  Plus,
  Loader2
} from "lucide-react"
import { createThread } from "@/app/actions/threads"
import { toast } from "sonner"

interface Channel {
  id: string
  displayName: string
  type: string
  status: string
}

interface Agent {
  id: string
  name: string | null
  email: string | null
}

interface CreateThreadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string
  contactName: string
  tenantId: string
  channels: Channel[]
  agents: Agent[]
  onThreadCreated?: () => void
}

export function CreateThreadDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  tenantId,
  channels,
  agents,
  onThreadCreated
}: CreateThreadDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    channelId: "",
    subject: "",
    assigneeId: "",
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        channelId: "",
        subject: "",
        assigneeId: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.channelId) {
      toast.error("Selecciona un canal")
      return
    }

    setLoading(true)
    try {
      const result = await createThread({
        tenantId,
        contactId,
        channelId: formData.channelId,
        subject: formData.subject || undefined,
        assigneeId: formData.assigneeId || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Conversación creada exitosamente")
      onOpenChange(false)
      
      // Callback para actualizar la UI
      if (onThreadCreated) {
        onThreadCreated()
      }

      // Navegar al thread creado
      if (result.data) {
        router.push(`/app/${tenantId}/inbox?thread=${result.data.id}`)
      }
    } catch (error) {
      toast.error("Error al crear la conversación")
    } finally {
      setLoading(false)
    }
  }

  const activeChannels = channels.filter(channel => channel.status === "ACTIVE")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nueva Conversación
          </DialogTitle>
          <DialogDescription>
            Crear una nueva conversación con {contactName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Canal */}
          <div className="space-y-2">
            <Label htmlFor="channelId">Canal *</Label>
            <Select
              value={formData.channelId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, channelId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un canal" />
              </SelectTrigger>
              <SelectContent>
                {activeChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{channel.displayName}</span>
                      <span className="text-xs text-muted-foreground">({channel.type})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto (opcional)</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Ej: Consulta sobre productos"
            />
          </div>

          {/* Asignar a */}
          <div className="space-y-2">
            <Label htmlFor="assigneeId">Asignar a (opcional)</Label>
            <Select
              value={formData.assigneeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin asignar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name || agent.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.channelId}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Conversación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

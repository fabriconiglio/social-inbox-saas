"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateCannedResponse } from "@/app/actions/canned-responses"
import { toast } from "sonner"
import type { CannedResponse } from "@prisma/client"

interface EditQuickReplyDialogProps {
  tenantId: string
  response: CannedResponse
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditQuickReplyDialog({
  tenantId,
  response,
  open,
  onOpenChange,
}: EditQuickReplyDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

  useEffect(() => {
    if (response && open) {
      setFormData({
        title: response.title,
        content: response.content,
      })
    }
  }, [response, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setLoading(true)

    try {
      const result = await updateCannedResponse(tenantId, response.id, {
        title: formData.title,
        content: formData.content,
        variablesJSON: (response.variablesJSON as Record<string, string>) || {},
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Respuesta rápida actualizada exitosamente")
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Error al actualizar respuesta rápida")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Respuesta Rápida</DialogTitle>
          <DialogDescription>
            Modifica la plantilla de respuesta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                placeholder="Ej: Saludo inicial"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Contenido</Label>
              <Textarea
                id="edit-content"
                placeholder="Hola {{nombre}}, gracias por contactarnos..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                maxLength={5000}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Usa variables como {"{{nombre}}"}, {"{{local}}"} para personalizar la respuesta
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


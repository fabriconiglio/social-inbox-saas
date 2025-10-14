"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createCannedResponse } from "@/app/actions/canned-responses"
import { toast } from "sonner"

interface CreateQuickReplyDialogProps {
  tenantId: string
  children: React.ReactNode
}

export function CreateQuickReplyDialog({ tenantId, children }: CreateQuickReplyDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setLoading(true)

    try {
      const result = await createCannedResponse(tenantId, {
        title: formData.title,
        content: formData.content,
        variablesJSON: {},
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Respuesta rápida creada exitosamente")
        setOpen(false)
        setFormData({ title: "", content: "" })
      }
    } catch (error) {
      toast.error("Error al crear respuesta rápida")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nueva Respuesta Rápida</DialogTitle>
          <DialogDescription>
            Crea una plantilla de respuesta para agilizar la atención al cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ej: Saludo inicial"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={100}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


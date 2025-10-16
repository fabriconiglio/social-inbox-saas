"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateContact } from "@/app/actions/contacts"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Edit } from "lucide-react"

const updateContactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  handle: z.string().min(1, "El handle es requerido").max(100, "Máximo 100 caracteres"),
  platform: z.enum(["instagram", "facebook", "whatsapp", "tiktok"], {
    required_error: "Selecciona una plataforma",
  }),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().optional(),
})

type UpdateContactForm = z.infer<typeof updateContactSchema>

interface Contact {
  id: string
  name?: string | null
  handle: string
  platform: string
  phone?: string | null
  email?: string | null
  notes?: string | null
}

interface EditContactDialogProps {
  contact: Contact
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactUpdated?: () => void
}

export function EditContactDialog({ 
  contact, 
  tenantId, 
  open, 
  onOpenChange, 
  onContactUpdated 
}: EditContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UpdateContactForm>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      name: "",
      handle: "",
      platform: "instagram",
      phone: "",
      email: "",
      notes: "",
    },
  })

  // Actualizar formulario cuando cambie el contacto
  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name || "",
        handle: contact.handle,
        platform: contact.platform as "instagram" | "facebook" | "whatsapp" | "tiktok",
        phone: contact.phone || "",
        email: contact.email || "",
        notes: contact.notes || "",
      })
    }
  }, [contact, form])

  const onSubmit = async (data: UpdateContactForm) => {
    setIsSubmitting(true)
    try {
      // Limpiar campos vacíos
      const cleanData = {
        id: contact.id,
        ...data,
        phone: data.phone || undefined,
        email: data.email || undefined,
        notes: data.notes || undefined,
      }

      const result = await updateContact(tenantId, cleanData)
      
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Contacto actualizado exitosamente")
      onOpenChange(false)
      onContactUpdated?.()
    } catch (error) {
      toast.error("Error al actualizar el contacto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Resetear formulario al cerrar
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Contacto
          </DialogTitle>
          <DialogDescription>
            Modifica la información del contacto
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handle/Usuario *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: @juanperez, +5493512345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plataforma *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una plataforma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: +5493512345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: juan@ejemplo.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Información adicional sobre el contacto..."
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Actualizar Contacto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

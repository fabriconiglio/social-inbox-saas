"use client"

import { useState, useEffect } from "react"
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
  Save,
  X,
  Loader2,
  User,
  Hash,
  Phone,
  Mail,
  FileText
} from "lucide-react"
import { updateContactById } from "@/app/actions/contacts"
import { toast } from "sonner"

interface ContactForEdit {
  id: string
  name?: string | null
  handle: string
  platform: string
  phone?: string | null
  email?: string | null
  notes?: string | null
  createdAt?: Date
  updatedAt?: Date
}

interface EditContactFormProps {
  contact: ContactForEdit
  tenantId: string
  onSave: (updatedContact: any) => void
  onCancel: () => void
  loading?: boolean
}

const platformOptions = [
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "facebook", label: "Facebook", icon: "👥" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
]

export function EditContactForm({
  contact,
  tenantId,
  onSave,
  onCancel,
  loading = false
}: EditContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact.name || "",
    handle: contact.handle,
    platform: contact.platform,
    phone: contact.phone || "",
    email: contact.email || "",
    notes: contact.notes || "",
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos requeridos
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }
    
    if (!formData.handle.trim()) {
      newErrors.handle = "El handle es requerido"
    }
    
    if (!formData.platform) {
      newErrors.platform = "La plataforma es requerida"
    }
    
    // Validar email si se proporciona
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "El email no es válido"
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    setSaving(true)
    
    try {
      const result = await updateContactById(contact.id, {
        name: formData.name.trim(),
        handle: formData.handle.trim(),
        platform: formData.platform as any,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Contacto actualizado exitosamente")
      onSave(result.data)
    } catch (error) {
      toast.error("Error al actualizar el contacto")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Nombre *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Nombre completo del contacto"
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Handle */}
      <div className="space-y-2">
        <Label htmlFor="handle" className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Handle *
        </Label>
        <Input
          id="handle"
          value={formData.handle}
          onChange={(e) => handleInputChange("handle", e.target.value)}
          placeholder="@usuario o número de teléfono"
          className={errors.handle ? "border-red-500" : ""}
        />
        {errors.handle && (
          <p className="text-sm text-red-500">{errors.handle}</p>
        )}
      </div>

      {/* Plataforma */}
      <div className="space-y-2">
        <Label htmlFor="platform">Plataforma *</Label>
        <Select
          value={formData.platform}
          onValueChange={(value) => handleInputChange("platform", value)}
        >
          <SelectTrigger className={errors.platform ? "border-red-500" : ""}>
            <SelectValue placeholder="Selecciona una plataforma" />
          </SelectTrigger>
          <SelectContent>
            {platformOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.platform && (
          <p className="text-sm text-red-500">{errors.platform}</p>
        )}
      </div>

      {/* Teléfono */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Teléfono
        </Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleInputChange("phone", e.target.value)}
          placeholder="+54 9 11 1234-5678"
          type="tel"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </Label>
        <Input
          id="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="contacto@ejemplo.com"
          type="email"
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Notas
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Notas adicionales sobre el contacto..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving || loading}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving || loading}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

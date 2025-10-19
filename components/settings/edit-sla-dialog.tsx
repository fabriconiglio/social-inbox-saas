"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Edit, Trash2, Copy, Save, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { getSLAForEdit, updateSLA, deleteSLA, duplicateSLA, type EditSLAData } from "@/app/actions/sla-edit"
import { ResponseTimeConfig } from "./response-time-config"
import { SLAPreview } from "./sla-preview"

interface EditSLADialogProps {
  slaId: string
  onSLAUpdated?: () => void
  trigger?: React.ReactNode
}

export function EditSLADialog({ slaId, onSLAUpdated, trigger }: EditSLADialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateName, setDuplicateName] = useState("")
  
  // Form state
  const [formData, setFormData] = useState<EditSLAData>({
    id: slaId,
    name: "",
    description: "",
    responseTimeMinutes: 30,
    resolutionTimeHours: 24,
    isActive: true,
    priority: "MEDIUM",
    businessHours: {
      enabled: false,
      startTime: "09:00",
      endTime: "18:00",
      timezone: "America/Argentina/Cordoba",
      workingDays: [1, 2, 3, 4, 5]
    },
    escalationRules: {
      enabled: false,
      escalationTimeMinutes: 15,
      notifyManagers: false,
      autoAssign: false
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos del SLA al abrir el diálogo
  useEffect(() => {
    if (isOpen && slaId) {
      loadSLAData()
    }
  }, [isOpen, slaId])

  const loadSLAData = async () => {
    try {
      setIsLoading(true)
      const result = await getSLAForEdit(slaId)
      
      if (result.success && result.data) {
        setFormData({
          id: result.data.id,
          name: result.data.name,
          description: result.data.description || "",
          responseTimeMinutes: result.data.responseTimeMinutes,
          resolutionTimeHours: result.data.resolutionTimeHours,
          isActive: result.data.isActive,
          priority: result.data.priority,
          businessHours: result.data.businessHours || {
            enabled: false,
            startTime: "09:00",
            endTime: "18:00",
            timezone: "America/Argentina/Cordoba",
            workingDays: [1, 2, 3, 4, 5]
          },
          escalationRules: result.data.escalationRules || {
            enabled: false,
            escalationTimeMinutes: 15,
            notifyManagers: false,
            autoAssign: false
          }
        })
      } else {
        toast.error(result.error || "Error al cargar el SLA")
        setIsOpen(false)
      }
    } catch (error) {
      toast.error("Error al cargar el SLA")
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (formData.responseTimeMinutes <= 0) {
      newErrors.responseTimeMinutes = "El tiempo de respuesta debe ser mayor a 0"
    }

    if (formData.resolutionTimeHours <= 0) {
      newErrors.resolutionTimeHours = "El tiempo de resolución debe ser mayor a 0"
    }

    if (formData.businessHours?.enabled) {
      if (formData.businessHours.startTime >= formData.businessHours.endTime) {
        newErrors.businessHours = "La hora de inicio debe ser anterior a la hora de fin"
      }
    }

    if (formData.escalationRules?.enabled) {
      if (!formData.escalationRules.escalationTimeMinutes) {
        newErrors.escalationRules = "El tiempo de escalación es requerido"
      } else if (formData.escalationRules.escalationTimeMinutes >= formData.responseTimeMinutes) {
        newErrors.escalationRules = "El tiempo de escalación debe ser menor al tiempo de respuesta"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario")
      return
    }

    try {
      setIsLoading(true)
      const result = await updateSLA(formData)
      
      if (result.success) {
        toast.success(result.message || "SLA actualizado exitosamente")
        setIsOpen(false)
        onSLAUpdated?.()
      } else {
        toast.error(result.error || "Error al actualizar el SLA")
        if (result.details) {
          toast.error(result.details)
        }
      }
    } catch (error) {
      toast.error("Error al actualizar el SLA")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const result = await deleteSLA(slaId)
      
      if (result.success) {
        toast.success(result.message || "SLA eliminado exitosamente")
        setIsOpen(false)
        setShowDeleteDialog(false)
        onSLAUpdated?.()
      } else {
        toast.error(result.error || "Error al eliminar el SLA")
      }
    } catch (error) {
      toast.error("Error al eliminar el SLA")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!duplicateName.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    try {
      setIsDuplicating(true)
      const result = await duplicateSLA(slaId, duplicateName)
      
      if (result.success) {
        toast.success(result.message || "SLA duplicado exitosamente")
        setShowDuplicateDialog(false)
        setDuplicateName("")
        onSLAUpdated?.()
      } else {
        toast.error(result.error || "Error al duplicar el SLA")
      }
    } catch (error) {
      toast.error("Error al duplicar el SLA")
    } finally {
      setIsDuplicating(false)
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar SLA</DialogTitle>
            <DialogDescription>
              Modifica la configuración del SLA. Los cambios se aplicarán inmediatamente.
            </DialogDescription>
          </DialogHeader>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Básica</CardTitle>
                  <CardDescription>Configuración general del SLA</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre del SLA *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Ej: Soporte Estándar"
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="priority">Prioridad</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange("priority", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Baja</SelectItem>
                          <SelectItem value="MEDIUM">Media</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe el propósito y alcance de este SLA"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                    />
                    <Label htmlFor="isActive">SLA Activo</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Tiempos de Respuesta */}
              <ResponseTimeConfig
                value={formData.responseTimeMinutes}
                onChange={(value) => handleInputChange("responseTimeMinutes", value)}
                businessHours={formData.businessHours}
                onBusinessHoursChange={(businessHours) => handleInputChange("businessHours", businessHours)}
              />

              {/* Tiempo de Resolución */}
              <Card>
                <CardHeader>
                  <CardTitle>Tiempo de Resolución</CardTitle>
                  <CardDescription>Define el tiempo máximo para resolver completamente la conversación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="resolutionTime">Resolución (horas) *</Label>
                    <Input
                      id="resolutionTime"
                      type="number"
                      min="1"
                      max="168"
                      value={formData.resolutionTimeHours}
                      onChange={(e) => handleInputChange("resolutionTimeHours", parseInt(e.target.value) || 0)}
                      className={errors.resolutionTimeHours ? "border-red-500" : ""}
                    />
                    {errors.resolutionTimeHours && <p className="text-sm text-red-500 mt-1">{errors.resolutionTimeHours}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Equivale a: {formatHours(formData.resolutionTimeHours)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Horarios de Negocio */}
              <Card>
                <CardHeader>
                  <CardTitle>Horarios de Negocio</CardTitle>
                  <CardDescription>Configura si el SLA solo aplica durante horarios específicos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="businessHoursEnabled"
                      checked={formData.businessHours?.enabled || false}
                      onCheckedChange={(checked) => handleNestedChange("businessHours", "enabled", checked)}
                    />
                    <Label htmlFor="businessHoursEnabled">Aplicar solo en horarios de negocio</Label>
                  </div>

                  {formData.businessHours?.enabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Hora de inicio</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={formData.businessHours?.startTime || "09:00"}
                            onChange={(e) => handleNestedChange("businessHours", "startTime", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime">Hora de fin</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={formData.businessHours?.endTime || "18:00"}
                            onChange={(e) => handleNestedChange("businessHours", "endTime", e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Días de trabajo</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            { value: 0, label: "Dom" },
                            { value: 1, label: "Lun" },
                            { value: 2, label: "Mar" },
                            { value: 3, label: "Mié" },
                            { value: 4, label: "Jue" },
                            { value: 5, label: "Vie" },
                            { value: 6, label: "Sáb" }
                          ].map(day => (
                            <Button
                              key={day.value}
                              variant={formData.businessHours?.workingDays?.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentDays = formData.businessHours?.workingDays || []
                                const newDays = currentDays.includes(day.value)
                                  ? currentDays.filter(d => d !== day.value)
                                  : [...currentDays, day.value]
                                handleNestedChange("businessHours", "workingDays", newDays)
                              }}
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.businessHours && <p className="text-sm text-red-500">{errors.businessHours}</p>}
                </CardContent>
              </Card>

              {/* Reglas de Escalación */}
              <Card>
                <CardHeader>
                  <CardTitle>Reglas de Escalación</CardTitle>
                  <CardDescription>Configura alertas y escalaciones automáticas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="escalationEnabled"
                      checked={formData.escalationRules?.enabled || false}
                      onCheckedChange={(checked) => handleNestedChange("escalationRules", "enabled", checked)}
                    />
                    <Label htmlFor="escalationEnabled">Habilitar escalación automática</Label>
                  </div>

                  {formData.escalationRules?.enabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div>
                        <Label htmlFor="escalationTime">Tiempo para escalación (minutos)</Label>
                        <Input
                          id="escalationTime"
                          type="number"
                          min="1"
                          max="10080"
                          value={formData.escalationRules?.escalationTimeMinutes || 15}
                          onChange={(e) => handleNestedChange("escalationRules", "escalationTimeMinutes", parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Debe ser menor al tiempo de primera respuesta
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="notifyManagers"
                            checked={formData.escalationRules?.notifyManagers || false}
                            onCheckedChange={(checked) => handleNestedChange("escalationRules", "notifyManagers", checked)}
                          />
                          <Label htmlFor="notifyManagers">Notificar a managers</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="autoAssign"
                            checked={formData.escalationRules?.autoAssign || false}
                            onCheckedChange={(checked) => handleNestedChange("escalationRules", "autoAssign", checked)}
                          />
                          <Label htmlFor="autoAssign">Reasignar automáticamente</Label>
                        </div>
                      </div>
                    </div>
                  )}
                  {errors.escalationRules && <p className="text-sm text-red-500">{errors.escalationRules}</p>}
                </CardContent>
              </Card>

              {/* Preview del SLA */}
              <SLAPreview
                responseTimeMinutes={formData.responseTimeMinutes}
                resolutionTimeHours={formData.resolutionTimeHours}
                businessHours={formData.businessHours}
                priority={formData.priority}
              />

              {/* Acciones */}
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDuplicateDialog(true)}
                    disabled={isLoading}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ¿Eliminar SLA?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El SLA será eliminado permanentemente.
              Si hay conversaciones usando este SLA, no se podrá eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de duplicación */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar SLA</AlertDialogTitle>
            <AlertDialogDescription>
              Crea una copia de este SLA con un nuevo nombre. El SLA duplicado estará inactivo por defecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="duplicateName">Nombre del nuevo SLA</Label>
            <Input
              id="duplicateName"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="Ej: Soporte Estándar - Copia"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDuplicateName("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDuplicate}
              disabled={isDuplicating || !duplicateName.trim()}
            >
              {isDuplicating ? "Duplicando..." : "Duplicar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Image, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react"

interface TemplatePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: any
}

const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp", color: "bg-green-100 text-green-800", icon: MessageSquare },
  { value: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-800", icon: Image },
  { value: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-800", icon: MessageSquare },
  { value: "tiktok", label: "TikTok", color: "bg-black text-white", icon: FileText },
  { value: "twitter", label: "Twitter", color: "bg-sky-100 text-sky-800", icon: MessageSquare },
  { value: "telegram", label: "Telegram", color: "bg-blue-100 text-blue-800", icon: MessageSquare }
]

const TEMPLATE_TYPES = [
  { 
    value: "text", 
    label: "Texto", 
    description: "Mensaje de texto simple",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-800"
  },
  { 
    value: "media", 
    label: "Multimedia", 
    description: "Imagen, video o documento",
    icon: Image,
    color: "bg-purple-100 text-purple-800"
  },
  { 
    value: "interactive", 
    label: "Interactivo", 
    description: "Botones o listas",
    icon: FileText,
    color: "bg-orange-100 text-orange-800"
  }
]

const APPROVAL_STATUS = [
  { value: "DRAFT", label: "Borrador", color: "bg-gray-100 text-gray-800", icon: FileText },
  { value: "PENDING", label: "Pendiente", color: "bg-orange-100 text-orange-800", icon: Clock },
  { value: "APPROVED", label: "Aprobada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "REJECTED", label: "Rechazada", color: "bg-red-100 text-red-800", icon: AlertCircle }
]

const DEVICE_SIZES = [
  { value: "mobile", label: "Móvil", icon: Smartphone, width: "w-64" },
  { value: "tablet", label: "Tablet", icon: Tablet, width: "w-80" },
  { value: "desktop", label: "Escritorio", icon: Monitor, width: "w-96" }
]

export function TemplatePreviewDialog({ open, onOpenChange, template }: TemplatePreviewDialogProps) {
  const [selectedDevice, setSelectedDevice] = useState("mobile")
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [previewContent, setPreviewContent] = useState("")

  if (!template) {
    return null
  }

  const contentJSON = template.contentJSON || {}
  const variables = contentJSON.variables || []
  const channelInfo = CHANNEL_TYPES.find(c => c.value === template.channelType)
  const templateTypeInfo = TEMPLATE_TYPES.find(t => t.value === contentJSON.type)
  const statusInfo = APPROVAL_STATUS.find(s => s.value === template.approvedTag)
  const deviceInfo = DEVICE_SIZES.find(d => d.value === selectedDevice)

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }))
  }

  const generatePreview = () => {
    let content = contentJSON.text || contentJSON.content || ""
    
    // Reemplazar variables con valores de ejemplo
    variables.forEach((variable: string) => {
      const value = variableValues[variable] || `[${variable}]`
      content = content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value)
    })
    
    setPreviewContent(content)
  }

  const getStatusIcon = () => {
    if (!statusInfo) return Clock
    return statusInfo.icon
  }

  const getStatusColor = () => {
    if (!statusInfo) return "text-gray-600"
    return statusInfo.color
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Vista Previa de Plantilla
            {channelInfo && (
              <Badge className={channelInfo.color}>
                {channelInfo.label}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Previsualiza cómo se verá la plantilla en diferentes dispositivos
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de la plantilla */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Plantilla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <div className="text-sm text-muted-foreground">{template.name}</div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Canal</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {channelInfo && (
                      <>
                        <channelInfo.icon className="h-4 w-4" />
                        <Badge className={channelInfo.color}>
                          {channelInfo.label}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {templateTypeInfo && (
                      <>
                        <templateTypeInfo.icon className="h-4 w-4" />
                        <Badge className={templateTypeInfo.color}>
                          {templateTypeInfo.label}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {statusInfo && (
                      <>
                        <statusInfo.icon className="h-4 w-4" />
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Fecha de creación</Label>
                  <div className="text-sm text-muted-foreground">
                    {new Date(template.createdAt).toLocaleString()}
                  </div>
                </div>

                {template.updatedAt !== template.createdAt && (
                  <div>
                    <Label className="text-sm font-medium">Última actualización</Label>
                    <div className="text-sm text-muted-foreground">
                      {new Date(template.updatedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Variables */}
            {variables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Variables</CardTitle>
                  <CardDescription>
                    Configura los valores para las variables de la plantilla
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {variables.map((variable: string) => (
                    <div key={variable}>
                      <Label htmlFor={variable} className="text-sm font-medium">
                        {variable}
                      </Label>
                      <Input
                        id={variable}
                        placeholder={`Valor para ${variable}`}
                        value={variableValues[variable] || ""}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                  <Button onClick={generatePreview} className="w-full">
                    Generar Vista Previa
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vista previa */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vista Previa</CardTitle>
                <CardDescription>
                  Selecciona un dispositivo para ver cómo se verá la plantilla
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Selector de dispositivo */}
                <div className="flex gap-2 mb-4">
                  {DEVICE_SIZES.map((device) => {
                    const Icon = device.icon
                    return (
                      <Button
                        key={device.value}
                        variant={selectedDevice === device.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDevice(device.value)}
                        className="flex items-center gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {device.label}
                      </Button>
                    )
                  })}
                </div>

                {/* Simulador de dispositivo */}
                <div className="flex justify-center">
                  <div className={`${deviceInfo?.width} border-2 border-gray-300 rounded-lg bg-white shadow-lg`}>
                    <div className="bg-gray-100 px-4 py-2 rounded-t-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {channelInfo && <channelInfo.icon className="h-4 w-4" />}
                        <span className="text-sm font-medium">{channelInfo?.label}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="p-4 min-h-[200px]">
                      {previewContent ? (
                        <div className="whitespace-pre-wrap text-sm">
                          {previewContent}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">
                            {variables.length > 0 
                              ? "Configura las variables y genera la vista previa"
                              : "Esta plantilla no tiene variables"
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contenido original */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenido Original</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contentJSON.text || contentJSON.content || ""}
                  readOnly
                  className="min-h-[100px] bg-muted/50"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

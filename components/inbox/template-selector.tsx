"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Image,
  Video,
  File,
  Zap,
  Eye,
  Copy
} from "lucide-react"
import { useTemplates } from "@/hooks/use-templates"
import { TemplatePreview } from "@/components/templates/template-preview"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  channelType: string
  contentJSON: any
  approvedTag?: string | null
  createdAt: Date
  updatedAt: Date
}

interface TemplateSelectorProps {
  tenantId: string
  channelType: string
  onSelect: (template: Template, variables: Record<string, string>) => void
  children?: React.ReactNode
}

const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp", color: "bg-green-100 text-green-800", icon: MessageSquare },
  { value: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-800", icon: Image },
  { value: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-800", icon: MessageSquare },
  { value: "tiktok", label: "TikTok", color: "bg-black text-white", icon: Video },
  { value: "twitter", label: "Twitter", color: "bg-sky-100 text-sky-800", icon: MessageSquare },
  { value: "telegram", label: "Telegram", color: "bg-blue-100 text-blue-800", icon: MessageSquare }
]

const TEMPLATE_TYPES = [
  { 
    value: "text", 
    label: "Texto", 
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-800"
  },
  { 
    value: "media", 
    label: "Multimedia", 
    icon: Image,
    color: "bg-purple-100 text-purple-800"
  },
  { 
    value: "interactive", 
    label: "Interactivo", 
    icon: Zap,
    color: "bg-orange-100 text-orange-800"
  }
]

const APPROVAL_STATUS = [
  { value: "APPROVED", label: "Aprobada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  { value: "PENDING", label: "Pendiente", color: "bg-orange-100 text-orange-800", icon: Clock },
  { value: "REJECTED", label: "Rechazada", color: "bg-red-100 text-red-800", icon: AlertCircle }
]

export function TemplateSelector({ tenantId, channelType, onSelect, children }: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)
  const [open, setOpen] = useState(false)
  const [isValid, setIsValid] = useState(true)

  const { templates, loading, error, refetch } = useTemplates({
    tenantId,
    channelType,
    autoLoad: open,
    filter: { status: "APPROVED" }
  })

  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, channelType, refetch])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getChannelInfo = (channelType: string) => {
    return CHANNEL_TYPES.find(c => c.value === channelType) || 
           { value: channelType, label: channelType, color: "bg-gray-100 text-gray-800", icon: FileText }
  }

  const getTemplateTypeInfo = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type) || 
           { value: type, label: type, icon: FileText, color: "bg-gray-100 text-gray-800" }
  }

  const getStatusInfo = (approvedTag?: string | null) => {
    return APPROVAL_STATUS.find(s => s.value === approvedTag) || 
           { value: "UNKNOWN", label: "Desconocido", color: "bg-gray-100 text-gray-800", icon: AlertCircle }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setTemplateVariables({})
    
    // Extraer variables del template
    const variables = template.contentJSON?.variables || []
    const initialVariables: Record<string, string> = {}
    variables.forEach((variable: string) => {
      initialVariables[variable] = ""
    })
    setTemplateVariables(initialVariables)
    setShowPreview(true)
  }

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }))
  }

  const handleUseTemplate = () => {
    if (selectedTemplate && isValid) {
      onSelect(selectedTemplate, templateVariables)
      setOpen(false)
      setShowPreview(false)
      setSelectedTemplate(null)
      setTemplateVariables({})
      toast.success("Plantilla aplicada")
    } else if (!isValid) {
      toast.error("Por favor completa todas las variables requeridas")
    }
  }

  const generatePreview = () => {
    if (!selectedTemplate) return ""
    
    let content = selectedTemplate.contentJSON?.text || selectedTemplate.contentJSON?.content || ""
    
    // Reemplazar variables con valores
    Object.entries(templateVariables).forEach(([variable, value]) => {
      const placeholder = value || `[${variable}]`
      content = content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), placeholder)
    })
    
    return content
  }

  const channelInfo = getChannelInfo(channelType)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" title="Seleccionar plantilla">
            <FileText className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Seleccionar Plantilla
            <Badge className={channelInfo.color}>
              {channelInfo.label}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Elige una plantilla aprobada para usar en tu mensaje
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de plantillas */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay plantillas</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? "No se encontraron plantillas con ese criterio" : "No hay plantillas disponibles para este canal"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => {
                    const templateTypeInfo = getTemplateTypeInfo(template.contentJSON?.type || "text")
                    const statusInfo = getStatusInfo(template.approvedTag)
                    const StatusIcon = statusInfo.icon
                    const TypeIcon = templateTypeInfo.icon

                    return (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4" />
                              <span className="font-medium">{template.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              <Badge className={statusInfo.color} variant="outline">
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.contentJSON?.text || template.contentJSON?.content || "Sin contenido"}
                          </p>
                          {template.contentJSON?.variables && template.contentJSON.variables.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.contentJSON.variables.map((variable: string) => (
                                <Badge key={variable} variant="secondary" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Vista previa y configuración de variables */}
          {showPreview && selectedTemplate && (
            <div className="space-y-4">
              <TemplatePreview
                templateText={selectedTemplate.contentJSON?.text || selectedTemplate.contentJSON?.content || ""}
                templateName={selectedTemplate.name}
                channelType={channelType}
                onPreviewChange={(preview) => {
                  // Actualizar el preview en tiempo real
                }}
                onValidationChange={(valid, errors) => {
                  setIsValid(valid)
                }}
                onVariablesChange={(variables) => {
                  setTemplateVariables(variables)
                }}
                showVariables={true}
                showValidation={true}
                showSuggestions={true}
                compact={false}
              />

              {/* Información adicional de la plantilla */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Tipo:</strong> {getTemplateTypeInfo(selectedTemplate.contentJSON?.type || "text").label}</p>
                    <p><strong>Estado:</strong> {getStatusInfo(selectedTemplate.approvedTag).label}</p>
                    <p><strong>Creada:</strong> {new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleUseTemplate} 
                  className="flex-1"
                  disabled={!isValid}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Usar Plantilla
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

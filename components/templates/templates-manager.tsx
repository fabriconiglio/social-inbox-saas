"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Copy
} from "lucide-react"
import { getTemplates, deleteTemplate, syncTemplatesFromMeta } from "@/app/actions/templates"
import { CreateTemplateDialog } from "./create-template-dialog"
import { EditTemplateDialog } from "./edit-template-dialog"
import { TemplatePreviewDialog } from "./template-preview-dialog"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  channelType: string
  contentJSON: any
  approvedTag?: string | null
  createdAt: Date
  updatedAt: Date
  tenant: {
    name: string
  }
}

interface TemplatesManagerProps {
  tenantId: string
  initialChannel?: string
}

const CHANNEL_TYPES = [
  { value: "whatsapp", label: "WhatsApp", color: "bg-green-100 text-green-800" },
  { value: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-800" },
  { value: "facebook", label: "Facebook", color: "bg-blue-100 text-blue-800" },
  { value: "tiktok", label: "TikTok", color: "bg-black text-white" },
  { value: "twitter", label: "Twitter", color: "bg-sky-100 text-sky-800" },
  { value: "telegram", label: "Telegram", color: "bg-blue-100 text-blue-800" }
]

export function TemplatesManager({ tenantId, initialChannel }: TemplatesManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChannel, setSelectedChannel] = useState(initialChannel || "all")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [tenantId, selectedChannel])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const result = await getTemplates(
        tenantId, 
        selectedChannel === "all" ? undefined : selectedChannel
      )
      
      if (result.success) {
        setTemplates(result.data)
      } else {
        toast.error("Error al cargar plantillas")
      }
    } catch (error) {
      console.error("[Templates Manager] Error:", error)
      toast.error("Error al cargar plantillas")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      return
    }

    try {
      const result = await deleteTemplate({ id: templateId, tenantId })
      
      if (result.success) {
        toast.success("Plantilla eliminada")
        loadTemplates()
      } else {
        toast.error(result.error || "Error al eliminar plantilla")
      }
    } catch (error) {
      console.error("[Delete Template] Error:", error)
      toast.error("Error al eliminar plantilla")
    }
  }

  const handleSync = async (channelType: "whatsapp" | "instagram" | "facebook" | "tiktok" | "twitter" | "telegram") => {
    try {
      setSyncing(true)
      const result = await syncTemplatesFromMeta({ tenantId, channelType })
      
      if (result.success) {
        toast.success(`${result.data.synced} plantillas sincronizadas`)
        loadTemplates()
      } else {
        toast.error(result.error || "Error al sincronizar plantillas")
      }
    } catch (error) {
      console.error("[Sync Templates] Error:", error)
      toast.error("Error al sincronizar plantillas")
    } finally {
      setSyncing(false)
    }
  }

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template)
    setShowEditDialog(true)
  }

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

  const handleDuplicate = (template: Template) => {
    setSelectedTemplate({
      ...template,
      name: `${template.name} (copia)`,
      id: ""
    })
    setShowCreateDialog(true)
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getChannelInfo = (channelType: string) => {
    return CHANNEL_TYPES.find(c => c.value === channelType) || 
           { value: channelType, label: channelType, color: "bg-gray-100 text-gray-800" }
  }

  const getStatusInfo = (approvedTag?: string | null) => {
    switch (approvedTag) {
      case "APPROVED":
        return { 
          icon: CheckCircle, 
          label: "Aprobada", 
          color: "text-green-600",
          bgColor: "bg-green-100"
        }
      case "PENDING":
        return { 
          icon: Clock, 
          label: "Pendiente", 
          color: "text-orange-600",
          bgColor: "bg-orange-100"
        }
      case "REJECTED":
        return { 
          icon: AlertCircle, 
          label: "Rechazada", 
          color: "text-red-600",
          bgColor: "bg-red-100"
        }
      default:
        return { 
          icon: Clock, 
          label: "Sin estado", 
          color: "text-gray-600",
          bgColor: "bg-gray-100"
        }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando plantillas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plantillas de Mensajes</CardTitle>
              <CardDescription>
                Gestiona las plantillas aprobadas para cada canal
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(selectedChannel === "all" ? "whatsapp" : selectedChannel as "whatsapp" | "instagram" | "facebook" | "tiktok" | "twitter" | "telegram")}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantillas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                {CHANNEL_TYPES.map(channel => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de plantillas */}
          <div className="space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay plantillas</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No se encontraron plantillas con ese criterio" : "Crea tu primera plantilla o sincroniza desde Meta"}
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Plantilla
                </Button>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const channelInfo = getChannelInfo(template.channelType)
                const statusInfo = getStatusInfo(template.approvedTag)
                const StatusIcon = statusInfo.icon

                return (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge className={channelInfo.color}>
                          {channelInfo.label}
                        </Badge>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                          <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                          <span className={`text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Creada: {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogos */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          loadTemplates()
        }}
        tenantId={tenantId}
        initialData={selectedTemplate}
      />

      <EditTemplateDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false)
          setSelectedTemplate(null)
          loadTemplates()
        }}
        template={selectedTemplate}
        tenantId={tenantId}
      />

      <TemplatePreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        template={selectedTemplate}
      />
    </>
  )
}

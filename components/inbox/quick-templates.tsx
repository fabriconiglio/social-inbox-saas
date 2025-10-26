"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, 
  MessageSquare,
  Image,
  Video,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { useApprovedTemplates } from "@/hooks/use-templates"
import { TemplateSelector } from "./template-selector"

interface QuickTemplatesProps {
  tenantId: string
  channelType: string
  onSelect: (template: any, variables: Record<string, string>) => void
}

interface Template {
  id: string
  name: string
  channelType: string
  contentJSON: any
  approvedTag?: string | null
  createdAt: Date
  updatedAt: Date
}

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

export function QuickTemplates({ tenantId, channelType, onSelect }: QuickTemplatesProps) {
  const { templates: allTemplates, loading } = useApprovedTemplates(tenantId, channelType)
  
  // Mostrar solo las primeras 5 plantillas aprobadas
  const templates = allTemplates.slice(0, 5)

  const getTemplateTypeInfo = (type: string) => {
    return TEMPLATE_TYPES.find(t => t.value === type) || 
           { value: type, label: type, icon: FileText, color: "bg-gray-100 text-gray-800" }
  }

  const handleQuickSelect = (template: Template) => {
    // Para plantillas sin variables, aplicar directamente
    const variables: Record<string, string> = {}
    onSelect(template, variables)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-4">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No hay plantillas disponibles</p>
        <TemplateSelector
          tenantId={tenantId}
          channelType={channelType}
          onSelect={onSelect}
        >
          <Button variant="outline" size="sm" className="mt-2">
            Ver todas las plantillas
          </Button>
        </TemplateSelector>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Plantillas rápidas</h4>
        <TemplateSelector
          tenantId={tenantId}
          channelType={channelType}
          onSelect={onSelect}
        >
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todas
          </Button>
        </TemplateSelector>
      </div>
      
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {templates.map((template) => {
            const templateTypeInfo = getTemplateTypeInfo(template.contentJSON?.type || "text")
            const TypeIcon = templateTypeInfo.icon

            return (
              <Card 
                key={template.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleQuickSelect(template)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <TypeIcon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{template.name}</span>
                        <Badge className={templateTypeInfo.color} variant="outline">
                          {templateTypeInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.contentJSON?.text || template.contentJSON?.content || "Sin contenido"}
                      </p>
                      {template.contentJSON?.variables && template.contentJSON.variables.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {template.contentJSON.variables.slice(0, 2).map((variable: string) => (
                            <Badge key={variable} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.contentJSON.variables.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.contentJSON.variables.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

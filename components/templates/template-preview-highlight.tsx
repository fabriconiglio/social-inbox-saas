"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { 
  extractVariables,
  generateTemplatePreview
} from "@/lib/template-validation"
import { toast } from "sonner"

interface TemplatePreviewHighlightProps {
  templateText: string
  variableValues: Record<string, string>
  templateName?: string
  channelType?: string
  showVariables?: boolean
  compact?: boolean
  className?: string
}

export function TemplatePreviewHighlight({
  templateText,
  variableValues,
  templateName,
  channelType,
  showVariables = true,
  compact = false,
  className
}: TemplatePreviewHighlightProps) {
  const [preview, setPreview] = useState("")
  const [variables, setVariables] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(!compact)

  // Extraer variables y generar preview
  useEffect(() => {
    const extractedVariables = extractVariables(templateText)
    setVariables(extractedVariables)
    
    const newPreview = generateTemplatePreview(templateText, variableValues, true)
    setPreview(newPreview)
  }, [templateText, variableValues])

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(preview)
    toast.success("Preview copiado al portapapeles")
  }

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(templateText)
    toast.success("Plantilla copiada al portapapeles")
  }

  // Función para resaltar variables en el texto
  const highlightVariables = (text: string) => {
    let highlightedText = text
    const variableRegex = /\{\{([^}]+)\}\}/g
    
    // Reemplazar variables con valores resaltados
    variables.forEach(variable => {
      const value = variableValues[variable] || `[${variable}]`
      const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
      highlightedText = highlightedText.replace(regex, value)
    })
    
    return highlightedText
  }

  // Función para crear el JSX con resaltado
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g)
    
    return parts.map((part, index) => {
      if (part.match(/\{\{[^}]+\}\}/)) {
        const variable = part.replace(/\{\{|\}\}/g, '')
        const value = variableValues[variable] || `[${variable}]`
        const hasValue = variableValues[variable] && variableValues[variable].trim() !== ''
        
        return (
          <span
            key={index}
            className={`px-1 py-0.5 rounded text-sm font-medium ${
              hasValue 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-orange-100 text-orange-800 border border-orange-200'
            }`}
            title={`Variable: ${variable}`}
          >
            {value}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  const completedVariables = variables.filter(v => variableValues[v] && variableValues[v].trim() !== '').length
  const totalVariables = variables.length
  const completionPercentage = totalVariables > 0 ? Math.round((completedVariables / totalVariables) * 100) : 100

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Preview compacto */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Vista Previa</span>
              {totalVariables > 0 && (
                <Badge variant="outline" className="text-xs">
                  {completedVariables}/{totalVariables} variables
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPreview}
                className="h-6 px-2"
              >
                <Copy className="h-3 w-3" />
              </Button>
              {totalVariables > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-6 px-2"
                >
                  {showDetails ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-sm whitespace-pre-wrap">
            {renderHighlightedText(templateText)}
          </div>
          
          {totalVariables > 0 && completionPercentage < 100 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Progreso: {completionPercentage}% completado
            </div>
          )}
        </div>

        {/* Variables compactas */}
        {showDetails && showVariables && variables.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Variables</span>
              <div className="flex items-center gap-1">
                {completionPercentage === 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span className="text-xs text-muted-foreground">
                  {completionPercentage}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {variables.map((variable) => {
                const hasValue = variableValues[variable] && variableValues[variable].trim() !== ''
                return (
                  <div key={variable} className="flex items-center gap-1 text-xs">
                    {hasValue ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-orange-600" />
                    )}
                    <span className="truncate">{variable}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-lg">
              {templateName || "Vista Previa de Plantilla"}
            </CardTitle>
            {channelType && (
              <Badge variant="outline" className="text-xs">
                {channelType}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalVariables > 0 && (
              <Badge 
                variant={completionPercentage === 100 ? "default" : "outline"}
                className={completionPercentage === 100 ? "bg-green-100 text-green-800" : "text-orange-600"}
              >
                {completedVariables}/{totalVariables} variables
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Detalles
                </>
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Vista previa del mensaje con variables resaltadas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview del mensaje */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Mensaje Final</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyPreview}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTemplate}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Plantilla
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/50 min-h-[120px]">
            <div className="whitespace-pre-wrap text-sm">
              {renderHighlightedText(templateText)}
            </div>
          </div>
          
          {totalVariables > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Variable completada</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                <span>Variable pendiente</span>
              </div>
            </div>
          )}
        </div>

        {/* Variables */}
        {showDetails && showVariables && variables.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Estado de Variables</h4>
              <div className="flex items-center gap-2">
                {completionPercentage === 100 ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Completado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{completionPercentage}% completado</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {variables.map((variable) => {
                const hasValue = variableValues[variable] && variableValues[variable].trim() !== ''
                const value = variableValues[variable] || ''
                
                return (
                  <div key={variable} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      {hasValue ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="font-medium text-sm">{variable}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {hasValue ? 'Completado' : 'Pendiente'}
                      </div>
                      {hasValue && (
                        <div className="text-xs text-muted-foreground truncate max-w-32">
                          {value}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Información adicional */}
        {variables.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>Esta plantilla no contiene variables</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

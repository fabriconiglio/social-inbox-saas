"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Info,
  MessageSquare
} from "lucide-react"
import { 
  validateTemplateVariables,
  extractVariables,
  generateTemplatePreview,
  generateVariableConfig,
  type TemplateValidationResult
} from "@/lib/template-validation"
import { TemplateVariableSuggestions } from "@/components/templates/template-variable-suggestions"
import { toast } from "sonner"

interface TemplatePreviewProps {
  templateText: string
  templateName?: string
  channelType?: string
  onPreviewChange?: (preview: string) => void
  onValidationChange?: (isValid: boolean, errors: string[]) => void
  onVariablesChange?: (variables: Record<string, string>) => void
  showVariables?: boolean
  showValidation?: boolean
  showSuggestions?: boolean
  compact?: boolean
  className?: string
}

export function TemplatePreview({
  templateText,
  templateName,
  channelType,
  onPreviewChange,
  onValidationChange,
  onVariablesChange,
  showVariables = true,
  showValidation = true,
  showSuggestions = false,
  compact = false,
  className
}: TemplatePreviewProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null)
  const [showDetails, setShowDetails] = useState(!compact)
  const [preview, setPreview] = useState("")

  // Extraer variables del template
  const variables = extractVariables(templateText)

  // Inicializar variables cuando cambie el template
  useEffect(() => {
    const initialValues: Record<string, string> = {}
    variables.forEach(variable => {
      initialValues[variable] = variableValues[variable] || ""
    })
    setVariableValues(initialValues)
  }, [templateText])

  // Generar preview cuando cambien las variables
  useEffect(() => {
    const newPreview = generateTemplatePreview(templateText, variableValues, true)
    setPreview(newPreview)
    onPreviewChange?.(newPreview)
  }, [templateText, variableValues, onPreviewChange])

  // Validar variables cuando cambien
  useEffect(() => {
    if (!showValidation || variables.length === 0) {
      setValidationResult(null)
      onValidationChange?.(true, [])
      return
    }

    const result = validateTemplateVariables(templateText, variableValues)
    setValidationResult(result)
    onValidationChange?.(result.isValid, result.globalErrors)
  }, [templateText, variableValues, showValidation, onValidationChange])

  const handleVariableChange = (variable: string, value: string) => {
    const newValues = {
      ...variableValues,
      [variable]: value
    }
    setVariableValues(newValues)
    onVariablesChange?.(newValues)
  }

  const handleCopyPreview = () => {
    navigator.clipboard.writeText(preview)
    toast.success("Preview copiado al portapapeles")
  }

  const handleResetVariables = () => {
    const resetValues: Record<string, string> = {}
    variables.forEach(variable => {
      resetValues[variable] = ""
    })
    setVariableValues(resetValues)
    toast.success("Variables reiniciadas")
  }

  const getVariableConfig = (variable: string) => {
    return generateVariableConfig(variable)
  }

  const hasErrors = (validationResult?.globalErrors.length ?? 0) > 0
  const hasWarnings = (validationResult?.globalWarnings.length ?? 0) > 0

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Preview compacto */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Vista Previa</span>
            <div className="flex items-center gap-1">
              {validationResult && (
                <>
                  {hasErrors ? (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {validationResult.globalErrors.length} error{validationResult.globalErrors.length !== 1 ? 'es' : ''}
                    </Badge>
                  ) : hasWarnings ? (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {validationResult.globalWarnings.length} advertencia{validationResult.globalWarnings.length !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Válido
                    </Badge>
                  )}
                </>
              )}
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
            </div>
          </div>
          <div className="text-sm whitespace-pre-wrap text-muted-foreground">
            {preview}
          </div>
        </div>

        {/* Variables compactas */}
        {showDetails && showVariables && variables.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Variables ({variables.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetVariables}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reiniciar
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {variables.map((variable) => {
                const config = getVariableConfig(variable)
                const variableValidation = validationResult?.variables[variable]
                
                return (
                  <div key={variable} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={variable} className="text-xs font-medium">
                        {variable}
                      </Label>
                      {variableValidation && (
                        <div className="flex items-center gap-1">
                          {variableValidation.isValid ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <Input
                      id={variable}
                      value={variableValues[variable] || ""}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={config.placeholder || `Valor para ${variable}`}
                      className="h-8 text-xs"
                    />
                    {(variableValidation?.errors.length ?? 0) > 0 && (
                      <p className="text-xs text-red-600">
                        {variableValidation?.errors[0]}
                      </p>
                    )}
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
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
            {validationResult && (
              <>
                {hasErrors ? (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationResult.globalErrors.length} error{validationResult.globalErrors.length !== 1 ? 'es' : ''}
                  </Badge>
                ) : hasWarnings ? (
                  <Badge variant="outline" className="text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {validationResult.globalWarnings.length} advertencia{validationResult.globalWarnings.length !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Válido
                  </Badge>
                )}
              </>
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
          Configura las variables y previsualiza el mensaje final
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Errores y advertencias */}
        {showValidation && validationResult && (
          <>
            {hasErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.globalErrors.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {hasWarnings && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationResult.globalWarnings.map((warning, index) => (
                      <p key={index} className="text-sm">{warning}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Sugerencias de variables */}
        {showDetails && showSuggestions && variables.length > 0 && (
          <TemplateVariableSuggestions
            templateText={templateText}
            onVariableSelect={(variable, value) => {
              handleVariableChange(variable, value)
            }}
            className="mb-4"
          />
        )}

        {/* Variables */}
        {showDetails && showVariables && variables.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Variables ({variables.length})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetVariables}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
            </div>
            
            <ScrollArea className="max-h-60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variables.map((variable) => {
                  const config = getVariableConfig(variable)
                  const variableValidation = validationResult?.variables[variable]
                  
                  return (
                    <div key={variable} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={variable} className="text-sm font-medium">
                          {variable}
                        </Label>
                        {variableValidation && (
                          <div className="flex items-center gap-1">
                            {variableValidation.isValid ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-600" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {variableValues[variable] ? 'Completado' : 'Pendiente'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <Input
                        id={variable}
                        value={variableValues[variable] || ""}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={config.placeholder || `Valor para ${variable}`}
                        className={(variableValidation?.errors.length ?? 0) > 0 ? "border-red-500" : ""}
                      />
                      
                      {config.description && (
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      )}
                      
                      {(variableValidation?.errors.length ?? 0) > 0 && (
                        <div className="space-y-1">
                          {variableValidation?.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-600">
                              {error}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {(variableValidation?.warnings.length ?? 0) > 0 && (
                        <div className="space-y-1">
                          {variableValidation?.warnings.map((warning, index) => (
                            <p key={index} className="text-xs text-orange-600">
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Preview del mensaje */}
        {showDetails && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Mensaje Final</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPreview}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50 min-h-[120px]">
                <div className="whitespace-pre-wrap text-sm">
                  {preview}
                </div>
              </div>
              
              {variables.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <span>Esta plantilla no contiene variables</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

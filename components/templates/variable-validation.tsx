"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Settings
} from "lucide-react"
import { 
  validateTemplateVariables,
  generateVariableConfig,
  generateTemplatePreview,
  suggestTemplateImprovements,
  extractVariables,
  type TemplateVariable,
  type TemplateValidationResult
} from "@/lib/template-validation"

interface VariableValidationProps {
  templateText: string
  onValidationChange?: (isValid: boolean, errors: string[]) => void
  onPreviewChange?: (preview: string) => void
  variableConfigs?: Record<string, Partial<TemplateVariable>>
  showPreview?: boolean
  showSuggestions?: boolean
}

export function VariableValidation({
  templateText,
  onValidationChange,
  onPreviewChange,
  variableConfigs = {},
  showPreview = true,
  showSuggestions = true
}: VariableValidationProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoGenerateConfig, setAutoGenerateConfig] = useState(true)

  // Extraer variables del template
  const variables = extractVariables(templateText)

  // Generar configuración automática si está habilitada
  useEffect(() => {
    if (autoGenerateConfig && variables.length > 0) {
      const autoConfigs: Record<string, Partial<TemplateVariable>> = {}
      for (const variable of variables) {
        if (!variableConfigs[variable]) {
          autoConfigs[variable] = generateVariableConfig(variable)
        }
      }
      // Aquí podrías actualizar las configuraciones si fuera necesario
    }
  }, [variables, autoGenerateConfig, variableConfigs])

  // Validar variables cuando cambian
  useEffect(() => {
    if (variables.length > 0) {
      const result = validateTemplateVariables(templateText, variableValues, variableConfigs)
      setValidationResult(result)
      
      // Notificar cambios
      onValidationChange?.(result.isValid, result.globalErrors)
    } else {
      setValidationResult(null)
      onValidationChange?.(true, [])
    }
  }, [templateText, variableValues, variableConfigs, onValidationChange])

  // Generar preview cuando cambian las variables
  useEffect(() => {
    if (showPreview && templateText) {
      const preview = generateTemplatePreview(templateText, variableValues, true)
      onPreviewChange?.(preview)
    }
  }, [templateText, variableValues, showPreview, onPreviewChange])

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variableName]: value
    }))
  }

  const clearAllVariables = () => {
    setVariableValues({})
  }

  const fillSampleData = () => {
    const sampleData: Record<string, string> = {}
    for (const variable of variables) {
      const config = variableConfigs[variable] || generateVariableConfig(variable)
      sampleData[variable] = config.placeholder || `Ejemplo ${variable}`
    }
    setVariableValues(sampleData)
  }

  const getVariableConfig = (variableName: string): Partial<TemplateVariable> => {
    return variableConfigs[variableName] || generateVariableConfig(variableName)
  }

  const getVariableValidation = (variableName: string) => {
    return validationResult?.variables[variableName] || { isValid: true, errors: [], warnings: [] }
  }

  const suggestions = suggestTemplateImprovements(templateText)

  if (variables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Sin Variables
          </CardTitle>
          <CardDescription>
            Esta plantilla no contiene variables para validar
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {validationResult?.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Validación de Variables
              </CardTitle>
              <CardDescription>
                {variables.length} variable{variables.length !== 1 ? 's' : ''} detectada{variables.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Ocultar' : 'Avanzado'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fillSampleData}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Datos de ejemplo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllVariables}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Errores globales */}
      {validationResult && validationResult.globalErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Errores de validación:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.globalErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Advertencias globales */}
      {validationResult && validationResult.globalWarnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Advertencias:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.globalWarnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Variables de la Plantilla</CardTitle>
          <CardDescription>
            Configura los valores para cada variable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {variables.map((variableName) => {
                const config = getVariableConfig(variableName)
                const validation = getVariableValidation(variableName)
                const value = variableValues[variableName] || ''

                return (
                  <div key={variableName} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={variableName} className="font-medium">
                        {variableName}
                      </Label>
                      <Badge variant={config.type === 'text' ? 'secondary' : 'outline'}>
                        {config.type || 'text'}
                      </Badge>
                      {config.required !== false && (
                        <Badge variant="destructive" className="text-xs">
                          Requerido
                        </Badge>
                      )}
                      {validation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>

                    <Input
                      id={variableName}
                      placeholder={config.placeholder || `Valor para ${variableName}`}
                      value={value}
                      onChange={(e) => handleVariableChange(variableName, e.target.value)}
                      className={validation.isValid ? '' : 'border-red-500'}
                    />

                    {config.description && (
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    )}

                    {/* Errores de la variable */}
                    {validation.errors.length > 0 && (
                      <div className="space-y-1">
                        {validation.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Advertencias de la variable */}
                    {validation.warnings.length > 0 && (
                      <div className="space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <p key={index} className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
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
        </CardContent>
      </Card>

      {/* Configuración avanzada */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración Avanzada</CardTitle>
            <CardDescription>
              Personaliza la validación de variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoGenerate"
                checked={autoGenerateConfig}
                onChange={(e) => setAutoGenerateConfig(e.target.checked)}
              />
              <Label htmlFor="autoGenerate">
                Generar configuración automática de variables
              </Label>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>La configuración automática detecta el tipo de variable basándose en su nombre:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>email</code> → Tipo email con validación</li>
                <li><code>phone</code> → Tipo teléfono con validación</li>
                <li><code>url</code> → Tipo URL con validación</li>
                <li><code>date</code> → Tipo fecha con validación</li>
                <li><code>number</code> → Tipo número con validación</li>
                <li>Otros → Tipo texto</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sugerencias de mejora */}
      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sugerencias de Mejora
            </CardTitle>
            <CardDescription>
              Recomendaciones para optimizar la plantilla
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de validación */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Validación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {variables.filter(v => getVariableValidation(v).isValid).length}
                </div>
                <div className="text-xs text-muted-foreground">Válidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {variables.filter(v => !getVariableValidation(v).isValid).length}
                </div>
                <div className="text-xs text-muted-foreground">Con errores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {validationResult.globalWarnings.length}
                </div>
                <div className="text-xs text-muted-foreground">Advertencias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {variables.length}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

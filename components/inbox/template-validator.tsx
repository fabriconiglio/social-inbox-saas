"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Eye,
  EyeOff
} from "lucide-react"
import { 
  validateTemplateVariables,
  extractVariables,
  generateTemplatePreview,
  type TemplateValidationResult
} from "@/lib/template-validation"

interface TemplateValidatorProps {
  templateText: string
  variableValues: Record<string, string>
  onValidationChange?: (isValid: boolean, errors: string[]) => void
  compact?: boolean
}

export function TemplateValidator({
  templateText,
  variableValues,
  onValidationChange,
  compact = false
}: TemplateValidatorProps) {
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const variables = extractVariables(templateText)
    
    if (variables.length === 0) {
      setValidationResult(null)
      onValidationChange?.(true, [])
      return
    }

    const result = validateTemplateVariables(templateText, variableValues)
    setValidationResult(result)
    onValidationChange?.(result.isValid, result.globalErrors)
  }, [templateText, variableValues, onValidationChange])

  if (!validationResult) {
    return null
  }

  const variables = extractVariables(templateText)
  const hasErrors = validationResult.globalErrors.length > 0
  const hasWarnings = validationResult.globalWarnings.length > 0

  if (compact) {
    return (
      <div className="flex items-center gap-2">
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
        
        {variables.length > 0 && (
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
    )
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {hasErrors ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : hasWarnings ? (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <span className="font-medium text-sm">
              Validación de Variables ({variables.length})
            </span>
          </div>
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

        {/* Errores */}
        {hasErrors && (
          <Alert variant="destructive" className="mb-3">
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

        {/* Advertencias */}
        {hasWarnings && (
          <Alert className="mb-3">
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

        {/* Detalles de variables */}
        {showDetails && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Estado de Variables:</h4>
            <div className="grid grid-cols-2 gap-2">
              {variables.map((variable) => {
                const variableValidation = validationResult.variables[variable]
                const value = variableValues[variable] || ''
                
                return (
                  <div key={variable} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{variable}</span>
                    <div className="flex items-center gap-1">
                      {variableValidation.isValid ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {value ? 'Completado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Preview del mensaje */}
        {showDetails && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Vista Previa:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm whitespace-pre-wrap">
                {generateTemplatePreview(templateText, variableValues, true)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

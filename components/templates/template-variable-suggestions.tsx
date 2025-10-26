"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Lightbulb,
  Copy,
  RefreshCw,
  Info,
  MessageSquare,
  User,
  Calendar,
  Phone,
  Mail,
  Globe,
  Hash
} from "lucide-react"
import { 
  extractVariables,
  generateVariableConfig,
  type TemplateVariable
} from "@/lib/template-validation"
import { toast } from "sonner"

interface VariableSuggestion {
  variable: string
  config: Partial<TemplateVariable>
  suggestions: string[]
  examples: string[]
}

interface TemplateVariableSuggestionsProps {
  templateText: string
  onVariableSelect?: (variable: string, value: string) => void
  className?: string
}

export function TemplateVariableSuggestions({
  templateText,
  onVariableSelect,
  className
}: TemplateVariableSuggestionsProps) {
  const [variables, setVariables] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<VariableSuggestion[]>([])
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({})

  // Extraer variables del template
  useEffect(() => {
    const extractedVariables = extractVariables(templateText)
    setVariables(extractedVariables)
    
    // Generar sugerencias para cada variable
    const variableSuggestions: VariableSuggestion[] = extractedVariables.map(variable => {
      const config = generateVariableConfig(variable)
      const suggestions = generateSuggestions(variable, config)
      const examples = generateExamples(variable, config)
      
      return {
        variable,
        config,
        suggestions,
        examples
      }
    })
    
    setSuggestions(variableSuggestions)
  }, [templateText])

  const generateSuggestions = (variable: string, config: Partial<TemplateVariable>): string[] => {
    const name = variable.toLowerCase()
    const suggestions: string[] = []
    
    // Sugerencias basadas en el tipo de variable
    switch (config.type) {
      case 'email':
        suggestions.push('usuario@ejemplo.com', 'cliente@empresa.com', 'soporte@servicio.com')
        break
      case 'phone':
        suggestions.push('+1234567890', '+5491123456789', '+34123456789')
        break
      case 'url':
        suggestions.push('https://ejemplo.com', 'https://www.servicio.com', 'https://app.plataforma.com')
        break
      case 'date':
        suggestions.push('2024-01-01', '15/03/2024', 'Marzo 15, 2024')
        break
      case 'number':
        suggestions.push('100', '1,500', '99.99')
        break
      default:
        // Sugerencias basadas en el nombre de la variable
        if (name.includes('name') || name.includes('nombre')) {
          suggestions.push('Juan Pérez', 'María García', 'Carlos López')
        } else if (name.includes('company') || name.includes('empresa')) {
          suggestions.push('Mi Empresa S.A.', 'Servicios Generales', 'Innovación Digital')
        } else if (name.includes('product') || name.includes('producto')) {
          suggestions.push('Producto Premium', 'Servicio Básico', 'Solución Avanzada')
        } else if (name.includes('price') || name.includes('precio')) {
          suggestions.push('$99.99', '$1,500', 'Gratis')
        } else if (name.includes('time') || name.includes('tiempo')) {
          suggestions.push('2 horas', '1 día', '30 minutos')
        } else {
          suggestions.push('Valor ejemplo', 'Dato requerido', 'Información')
        }
    }
    
    return suggestions
  }

  const generateExamples = (variable: string, config: Partial<TemplateVariable>): string[] => {
    const name = variable.toLowerCase()
    const examples: string[] = []
    
    // Ejemplos basados en el contexto
    if (name.includes('name') || name.includes('nombre')) {
      examples.push('Nombre del cliente', 'Nombre completo', 'Nombre de contacto')
    } else if (name.includes('email') || name.includes('correo')) {
      examples.push('Dirección de correo', 'Email de contacto', 'Correo electrónico')
    } else if (name.includes('phone') || name.includes('telefono')) {
      examples.push('Número de teléfono', 'Teléfono de contacto', 'Celular')
    } else if (name.includes('company') || name.includes('empresa')) {
      examples.push('Nombre de la empresa', 'Razón social', 'Organización')
    } else if (name.includes('product') || name.includes('producto')) {
      examples.push('Nombre del producto', 'Servicio contratado', 'Solución')
    } else if (name.includes('price') || name.includes('precio')) {
      examples.push('Precio del producto', 'Costo del servicio', 'Valor')
    } else if (name.includes('date') || name.includes('fecha')) {
      examples.push('Fecha de entrega', 'Fecha límite', 'Fecha de vencimiento')
    } else if (name.includes('time') || name.includes('tiempo')) {
      examples.push('Tiempo de entrega', 'Duración', 'Plazo')
    } else {
      examples.push('Información requerida', 'Dato necesario', 'Valor esperado')
    }
    
    return examples
  }

  const handleSuggestionSelect = (variable: string, value: string) => {
    setSelectedValues(prev => ({
      ...prev,
      [variable]: value
    }))
    onVariableSelect?.(variable, value)
    toast.success(`Valor aplicado para ${variable}`)
  }

  const handleCopyAll = () => {
    const allValues = Object.entries(selectedValues)
      .map(([variable, value]) => `${variable}: ${value}`)
      .join('\n')
    
    navigator.clipboard.writeText(allValues)
    toast.success("Valores copiados al portapapeles")
  }

  const handleResetAll = () => {
    setSelectedValues({})
    toast.success("Valores reiniciados")
  }

  const getVariableIcon = (type?: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'url':
        return <Globe className="h-4 w-4" />
      case 'date':
        return <Calendar className="h-4 w-4" />
      case 'number':
        return <Hash className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  if (variables.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin variables</h3>
          <p className="text-muted-foreground">
            Esta plantilla no contiene variables para configurar
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle>Sugerencias de Variables</CardTitle>
            <Badge variant="outline">{variables.length} variable{variables.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAll}
              disabled={Object.keys(selectedValues).length === 0}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copiar Todo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reiniciar
            </Button>
          </div>
        </div>
        <CardDescription>
          Selecciona valores sugeridos para las variables de tu plantilla
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.variable} className="space-y-3">
                <div className="flex items-center gap-2">
                  {getVariableIcon(suggestion.config.type)}
                  <Label className="text-sm font-medium">
                    {suggestion.variable}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.config.type || 'text'}
                  </Badge>
                  {suggestion.config.required && (
                    <Badge variant="destructive" className="text-xs">
                      Requerido
                    </Badge>
                  )}
                </div>

                {/* Sugerencias */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Sugerencias:</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.suggestions.map((suggestionValue, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionSelect(suggestion.variable, suggestionValue)}
                        className="text-xs"
                      >
                        {suggestionValue}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Ejemplos de uso */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Ejemplos de uso:</h4>
                  <div className="space-y-1">
                    {suggestion.examples.map((example, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        • {example}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Valor seleccionado */}
                {selectedValues[suggestion.variable] && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Valor seleccionado:
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {selectedValues[suggestion.variable]}
                    </p>
                  </div>
                )}

                {/* Input personalizado */}
                <div className="space-y-1">
                  <Label htmlFor={suggestion.variable} className="text-xs">
                    O escribe un valor personalizado:
                  </Label>
                  <Input
                    id={suggestion.variable}
                    value={selectedValues[suggestion.variable] || ""}
                    onChange={(e) => handleSuggestionSelect(suggestion.variable, e.target.value)}
                    placeholder={suggestion.config.placeholder || `Valor para ${suggestion.variable}`}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Resumen */}
        {Object.keys(selectedValues).length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Resumen de valores:</h4>
            <div className="space-y-1">
              {Object.entries(selectedValues).map(([variable, value]) => (
                <div key={variable} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{variable}:</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

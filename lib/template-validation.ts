/**
 * Template Validation Utilities
 * Maneja la validación de variables en plantillas de mensajes
 */

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'url' | 'custom'
  required: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  placeholder?: string
  description?: string
  options?: string[] // Para variables con opciones predefinidas
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'phone' | 'url' | 'date' | 'custom'
  value?: any
  message: string
}

export interface VariableValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface TemplateValidationResult {
  isValid: boolean
  variables: Record<string, VariableValidationResult>
  globalErrors: string[]
  globalWarnings: string[]
}

/**
 * Extrae variables de un texto de plantilla
 */
export function extractVariables(templateText: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = variableRegex.exec(templateText)) !== null) {
    const variableName = match[1].trim()
    if (!variables.includes(variableName)) {
      variables.push(variableName)
    }
  }

  return variables
}

/**
 * Valida una variable individual
 */
export function validateVariable(
  variableName: string,
  value: string,
  rules: ValidationRule[]
): VariableValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.trim() === '') {
          errors.push(rule.message)
        }
        break

      case 'minLength':
        if (value && value.length < (rule.value || 0)) {
          errors.push(rule.message)
        }
        break

      case 'maxLength':
        if (value && value.length > (rule.value || 0)) {
          errors.push(rule.message)
        }
        break

      case 'pattern':
        if (value && rule.value && !new RegExp(rule.value).test(value)) {
          errors.push(rule.message)
        }
        break

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(rule.message)
        }
        break

      case 'phone':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value)) {
          errors.push(rule.message)
        }
        break

      case 'url':
        if (value && !/^https?:\/\/.+/.test(value)) {
          errors.push(rule.message)
        }
        break

      case 'date':
        if (value && isNaN(Date.parse(value))) {
          errors.push(rule.message)
        }
        break

      case 'custom':
        if (value && rule.value && typeof rule.value === 'function') {
          const customResult = rule.value(value)
          if (!customResult.isValid) {
            if (customResult.severity === 'error') {
              errors.push(rule.message)
            } else {
              warnings.push(rule.message)
            }
          }
        }
        break
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Genera reglas de validación para un tipo de variable
 */
export function generateValidationRules(variableType: string, config?: Partial<TemplateVariable>): ValidationRule[] {
  const rules: ValidationRule[] = []

  // Regla de requerido
  if (config?.required !== false) {
    rules.push({
      type: 'required',
      message: `La variable ${config?.name || 'variable'} es requerida`
    })
  }

  // Reglas específicas por tipo
  switch (variableType) {
    case 'text':
      if (config?.minLength) {
        rules.push({
          type: 'minLength',
          value: config.minLength,
          message: `Debe tener al menos ${config.minLength} caracteres`
        })
      }
      if (config?.maxLength) {
        rules.push({
          type: 'maxLength',
          value: config.maxLength,
          message: `No puede tener más de ${config.maxLength} caracteres`
        })
      }
      break

    case 'email':
      rules.push({
        type: 'email',
        message: 'Debe ser un email válido'
      })
      break

    case 'phone':
      rules.push({
        type: 'phone',
        message: 'Debe ser un número de teléfono válido'
      })
      break

    case 'url':
      rules.push({
        type: 'url',
        message: 'Debe ser una URL válida'
      })
      break

    case 'date':
      rules.push({
        type: 'date',
        message: 'Debe ser una fecha válida'
      })
      break

    case 'number':
      rules.push({
        type: 'pattern',
        value: '^[0-9]+(\.[0-9]+)?$',
        message: 'Debe ser un número válido'
      })
      break
  }

  // Patrón personalizado
  if (config?.pattern) {
    rules.push({
      type: 'pattern',
      value: config.pattern,
      message: 'El formato no es válido'
    })
  }

  return rules
}

/**
 * Valida todas las variables de una plantilla
 */
export function validateTemplateVariables(
  templateText: string,
  variableValues: Record<string, string>,
  variableConfigs?: Record<string, Partial<TemplateVariable>>
): TemplateValidationResult {
  const variables = extractVariables(templateText)
  const results: Record<string, VariableValidationResult> = {}
  const globalErrors: string[] = []
  const globalWarnings: string[] = []

  // Verificar que todas las variables requeridas tengan valores
  for (const variableName of variables) {
    const config = variableConfigs?.[variableName] || {}
    const value = variableValues[variableName] || ''
    
    // Generar reglas de validación
    const rules = generateValidationRules(config.type || 'text', {
      name: variableName,
      required: config.required !== false,
      ...config
    })

    // Validar variable
    const result = validateVariable(variableName, value, rules)
    results[variableName] = result

    // Agregar errores globales
    globalErrors.push(...result.errors)
    globalWarnings.push(...result.warnings)
  }

  // Verificar variables no utilizadas
  const usedVariables = Object.keys(variableValues)
  const templateVariables = variables
  const unusedVariables = usedVariables.filter(v => !templateVariables.includes(v))
  
  if (unusedVariables.length > 0) {
    globalWarnings.push(`Variables no utilizadas: ${unusedVariables.join(', ')}`)
  }

  return {
    isValid: globalErrors.length === 0,
    variables: results,
    globalErrors,
    globalWarnings
  }
}

/**
 * Genera configuración automática de variables basada en el nombre
 */
export function generateVariableConfig(variableName: string): Partial<TemplateVariable> {
  const name = variableName.toLowerCase()
  
  // Detectar tipo por nombre
  if (name.includes('email') || name.includes('correo')) {
    return {
      type: 'email',
      required: true,
      placeholder: 'usuario@ejemplo.com'
    }
  }
  
  if (name.includes('phone') || name.includes('telefono') || name.includes('celular')) {
    return {
      type: 'phone',
      required: true,
      placeholder: '+1234567890'
    }
  }
  
  if (name.includes('url') || name.includes('link') || name.includes('enlace')) {
    return {
      type: 'url',
      required: true,
      placeholder: 'https://ejemplo.com'
    }
  }
  
  if (name.includes('date') || name.includes('fecha')) {
    return {
      type: 'date',
      required: true,
      placeholder: '2024-01-01'
    }
  }
  
  if (name.includes('number') || name.includes('numero') || name.includes('cantidad')) {
    return {
      type: 'number',
      required: true,
      placeholder: '123'
    }
  }
  
  // Por defecto, texto
  return {
    type: 'text',
    required: true,
    placeholder: `Valor para ${variableName}`
  }
}

/**
 * Valida el formato de una plantilla completa
 */
export function validateTemplateFormat(templateText: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Verificar llaves balanceadas
  const openBraces = (templateText.match(/\{\{/g) || []).length
  const closeBraces = (templateText.match(/\}\}/g) || []).length
  
  if (openBraces !== closeBraces) {
    errors.push('Las llaves de variables no están balanceadas')
  }

  // Verificar variables mal formateadas
  const malformedVariables = templateText.match(/\{[^{]|\}[^}]/g)
  if (malformedVariables) {
    errors.push('Variables mal formateadas detectadas')
  }

  // Verificar variables vacías
  const emptyVariables = templateText.match(/\{\{\s*\}\}/g)
  if (emptyVariables) {
    warnings.push('Variables vacías detectadas')
  }

  // Verificar variables con espacios
  const spacedVariables = templateText.match(/\{\{\s+[^}]+\s+\}\}/g)
  if (spacedVariables) {
    warnings.push('Variables con espacios innecesarios detectadas')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Genera un preview de la plantilla con variables reemplazadas
 */
export function generateTemplatePreview(
  templateText: string,
  variableValues: Record<string, string>,
  showPlaceholders: boolean = true
): string {
  let preview = templateText

  // Reemplazar variables con valores o placeholders
  const variables = extractVariables(templateText)
  
  for (const variable of variables) {
    const value = variableValues[variable] || (showPlaceholders ? `[${variable}]` : '')
    preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value)
  }

  return preview
}

/**
 * Sugiere mejoras para una plantilla
 */
export function suggestTemplateImprovements(templateText: string): string[] {
  const suggestions: string[] = []
  const variables = extractVariables(templateText)

  // Verificar nombres de variables
  for (const variable of variables) {
    if (variable.includes(' ')) {
      suggestions.push(`Considera usar nombres de variables sin espacios: "${variable}" → "${variable.replace(/\s+/g, '_')}"`)
    }
    
    if (variable !== variable.toLowerCase()) {
      suggestions.push(`Considera usar nombres de variables en minúsculas: "${variable}" → "${variable.toLowerCase()}"`)
    }
  }

  // Verificar longitud del texto
  if (templateText.length > 1000) {
    suggestions.push('El texto es muy largo, considera dividirlo en múltiples mensajes')
  }

  // Verificar variables repetidas
  const variableCounts: Record<string, number> = {}
  for (const variable of variables) {
    variableCounts[variable] = (variableCounts[variable] || 0) + 1
  }
  
  for (const [variable, count] of Object.entries(variableCounts)) {
    if (count > 1) {
      suggestions.push(`La variable "${variable}" aparece ${count} veces, considera reutilizarla`)
    }
  }

  return suggestions
}

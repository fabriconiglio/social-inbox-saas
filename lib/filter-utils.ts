/**
 * Utilidades para manejar filtros personalizables
 */

export interface CustomFilter {
  id: string
  name: string
  description?: string
  filters: {
    localId?: string
    channel?: string
    startDate?: string
    endDate?: string
    status?: string[]
    assigneeId?: string
    tags?: string[]
  }
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
}

export interface FilterPreset {
  id: string
  name: string
  description: string
  icon: string
  filters: CustomFilter['filters']
}

// Filtros predefinidos
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'high-priority',
    name: 'Alta Prioridad',
    description: 'Conversaciones urgentes y sin asignar',
    icon: '🔥',
    filters: {
      status: ['OPEN', 'PENDING'],
      assigneeId: undefined
    }
  },
  {
    id: 'resolved-recently',
    name: 'Resueltas Recientemente',
    description: 'Conversaciones cerradas en los últimos 7 días',
    icon: '✅',
    filters: {
      status: ['CLOSED'],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  },
  {
    id: 'instagram-only',
    name: 'Solo Instagram',
    description: 'Conversaciones únicamente de Instagram',
    icon: '📸',
    filters: {
      channel: 'INSTAGRAM'
    }
  },
  {
    id: 'whatsapp-only',
    name: 'Solo WhatsApp',
    description: 'Conversaciones únicamente de WhatsApp',
    icon: '💬',
    filters: {
      channel: 'WHATSAPP'
    }
  },
  {
    id: 'unassigned',
    name: 'Sin Asignar',
    description: 'Conversaciones que no tienen agente asignado',
    icon: '❓',
    filters: {
      assigneeId: 'none'
    }
  },
  {
    id: 'this-week',
    name: 'Esta Semana',
    description: 'Conversaciones de la semana actual',
    icon: '📅',
    filters: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }
]

/**
 * Obtiene filtros personalizados del localStorage
 */
export function getCustomFilters(): CustomFilter[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem('customFilters')
    if (!stored) return []
    
    const filters = JSON.parse(stored)
    return filters.map((filter: any) => ({
      ...filter,
      createdAt: new Date(filter.createdAt),
      updatedAt: new Date(filter.updatedAt)
    }))
  } catch (error) {
    console.error('Error loading custom filters:', error)
    return []
  }
}

/**
 * Guarda filtros personalizados en localStorage
 */
export function saveCustomFilters(filters: CustomFilter[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('customFilters', JSON.stringify(filters))
  } catch (error) {
    console.error('Error saving custom filters:', error)
  }
}

/**
 * Agrega un nuevo filtro personalizado
 */
export function addCustomFilter(filter: Omit<CustomFilter, 'id' | 'createdAt' | 'updatedAt'>): CustomFilter {
  const newFilter: CustomFilter = {
    ...filter,
    id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  const existingFilters = getCustomFilters()
  const updatedFilters = [...existingFilters, newFilter]
  saveCustomFilters(updatedFilters)
  
  return newFilter
}

/**
 * Actualiza un filtro personalizado existente
 */
export function updateCustomFilter(id: string, updates: Partial<CustomFilter>): CustomFilter | null {
  const filters = getCustomFilters()
  const index = filters.findIndex(f => f.id === id)
  
  if (index === -1) return null
  
  const updatedFilter: CustomFilter = {
    ...filters[index],
    ...updates,
    updatedAt: new Date()
  }
  
  filters[index] = updatedFilter
  saveCustomFilters(filters)
  
  return updatedFilter
}

/**
 * Elimina un filtro personalizado
 */
export function deleteCustomFilter(id: string): boolean {
  const filters = getCustomFilters()
  const filtered = filters.filter(f => f.id !== id)
  
  if (filtered.length === filters.length) return false
  
  saveCustomFilters(filtered)
  return true
}

/**
 * Aplica un filtro a los parámetros de URL
 */
export function applyFilterToURL(filter: CustomFilter['filters'], baseURL: string): string {
  const params = new URLSearchParams()
  
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value.toString())
      }
    }
  })
  
  return `${baseURL}?${params.toString()}`
}

/**
 * Convierte parámetros de URL a filtros
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): CustomFilter['filters'] {
  const filters: CustomFilter['filters'] = {}
  
  const localId = searchParams.get('localId')
  if (localId) filters.localId = localId
  
  const channel = searchParams.get('channel')
  if (channel) filters.channel = channel
  
  const startDate = searchParams.get('startDate')
  if (startDate) filters.startDate = startDate
  
  const endDate = searchParams.get('endDate')
  if (endDate) filters.endDate = endDate
  
  const status = searchParams.get('status')
  if (status) filters.status = status.split(',')
  
  const assigneeId = searchParams.get('assigneeId')
  if (assigneeId) filters.assigneeId = assigneeId
  
  const tags = searchParams.get('tags')
  if (tags) filters.tags = tags.split(',')
  
  return filters
}

/**
 * Valida un filtro personalizado
 */
export function validateFilter(filter: CustomFilter['filters']): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validar fechas
  if (filter.startDate && filter.endDate) {
    const start = new Date(filter.startDate)
    const end = new Date(filter.endDate)
    
    if (start > end) {
      errors.push('La fecha de inicio no puede ser posterior a la fecha de fin')
    }
  }
  
  // Validar que al menos un filtro esté definido
  const hasFilters = Object.values(filter).some(value => 
    value !== undefined && value !== null && value !== '' && 
    (!Array.isArray(value) || value.length > 0)
  )
  
  if (!hasFilters) {
    errors.push('Debe especificar al menos un criterio de filtrado')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Genera un nombre sugerido para un filtro basado en sus criterios
 */
export function generateFilterName(filters: CustomFilter['filters']): string {
  const parts: string[] = []
  
  if (filters.channel) {
    const channelNames: Record<string, string> = {
      'INSTAGRAM': 'Instagram',
      'FACEBOOK': 'Facebook',
      'WHATSAPP': 'WhatsApp',
      'TIKTOK': 'TikTok'
    }
    parts.push(channelNames[filters.channel] || filters.channel)
  }
  
  if (filters.status && filters.status.length > 0) {
    const statusNames: Record<string, string> = {
      'OPEN': 'Abiertas',
      'PENDING': 'Pendientes',
      'CLOSED': 'Cerradas'
    }
    const statusLabels = filters.status.map(s => statusNames[s] || s)
    parts.push(statusLabels.join(', '))
  }
  
  if (filters.assigneeId === 'none') {
    parts.push('Sin Asignar')
  }
  
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      parts.push('Hoy')
    } else if (diffDays === 6) {
      parts.push('Esta Semana')
    } else if (diffDays === 29) {
      parts.push('Este Mes')
    } else {
      parts.push(`${diffDays + 1} días`)
    }
  }
  
  return parts.length > 0 ? parts.join(' - ') : 'Filtro Personalizado'
}

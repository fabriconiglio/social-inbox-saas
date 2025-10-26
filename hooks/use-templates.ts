"use client"

import { useState, useEffect, useCallback } from "react"
import { getTemplates } from "@/app/actions/templates"

interface Template {
  id: string
  name: string
  channelType: string
  contentJSON: any
  approvedTag?: string | null
  createdAt: Date
  updatedAt: Date
}

interface UseTemplatesOptions {
  tenantId: string
  channelType: string
  autoLoad?: boolean
  filter?: {
    status?: "APPROVED" | "PENDING" | "REJECTED"
    type?: "text" | "media" | "interactive"
    search?: string
  }
}

interface UseTemplatesReturn {
  templates: Template[]
  loading: boolean
  error: string | null
  loadTemplates: () => Promise<void>
  refetch: () => Promise<void>
  getTemplateById: (id: string) => Template | undefined
  getTemplatesByStatus: (status: string) => Template[]
  getTemplatesByType: (type: string) => Template[]
  searchTemplates: (query: string) => Template[]
}

export function useTemplates({
  tenantId,
  channelType,
  autoLoad = true,
  filter
}: UseTemplatesOptions): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getTemplates(tenantId, channelType)
      
      if (result.success) {
        let filteredTemplates = result.data
        
        // Aplicar filtros
        if (filter?.status) {
          filteredTemplates = filteredTemplates.filter(t => t.approvedTag === filter.status)
        }
        
        if (filter?.type) {
          filteredTemplates = filteredTemplates.filter(t => 
            (t.contentJSON as any)?.type === filter.type
          )
        }
        
        if (filter?.search) {
          const searchTerm = filter.search.toLowerCase()
          filteredTemplates = filteredTemplates.filter(t => 
            t.name.toLowerCase().includes(searchTerm) ||
            ((t.contentJSON as any)?.text || "").toLowerCase().includes(searchTerm)
          )
        }
        
        setTemplates(filteredTemplates)
      } else {
        setError(result.error || "Error al cargar plantillas")
      }
    } catch (err) {
      console.error("[useTemplates] Error:", err)
      setError("Error al cargar plantillas")
    } finally {
      setLoading(false)
    }
  }, [tenantId, channelType, filter])

  const refetch = useCallback(async () => {
    await loadTemplates()
  }, [loadTemplates])

  const getTemplateById = useCallback((id: string) => {
    return templates.find(t => t.id === id)
  }, [templates])

  const getTemplatesByStatus = useCallback((status: string) => {
    return templates.filter(t => t.approvedTag === status)
  }, [templates])

  const getTemplatesByType = useCallback((type: string) => {
    return templates.filter(t => (t.contentJSON as any)?.type === type)
  }, [templates])

  const searchTemplates = useCallback((query: string) => {
    if (!query.trim()) return templates
    
    const searchTerm = query.toLowerCase()
    return templates.filter(t => 
      t.name.toLowerCase().includes(searchTerm) ||
      ((t.contentJSON as any)?.text || "").toLowerCase().includes(searchTerm) ||
      ((t.contentJSON as any)?.content || "").toLowerCase().includes(searchTerm)
    )
  }, [templates])

  useEffect(() => {
    if (autoLoad) {
      loadTemplates()
    }
  }, [autoLoad, loadTemplates])

  return {
    templates,
    loading,
    error,
    loadTemplates,
    refetch,
    getTemplateById,
    getTemplatesByStatus,
    getTemplatesByType,
    searchTemplates
  }
}

/**
 * Hook especializado para plantillas aprobadas
 */
export function useApprovedTemplates(tenantId: string, channelType: string) {
  return useTemplates({
    tenantId,
    channelType,
    filter: { status: "APPROVED" }
  })
}

/**
 * Hook especializado para plantillas por tipo
 */
export function useTemplatesByType(tenantId: string, channelType: string, type: "text" | "media" | "interactive") {
  return useTemplates({
    tenantId,
    channelType,
    filter: { status: "APPROVED", type }
  })
}

/**
 * Hook para búsqueda de plantillas
 */
export function useTemplateSearch(tenantId: string, channelType: string, query: string) {
  return useTemplates({
    tenantId,
    channelType,
    filter: { status: "APPROVED", search: query }
  })
}

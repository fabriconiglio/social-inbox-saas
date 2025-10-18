"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export interface AdvancedFilters {
  localId?: string
  channel?: string
  status?: string
  assignee?: string
  dateRange?: string
  q?: string
}

export function useAdvancedFilters(tenantId: string) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estado de los filtros basado en URL
  const filters = useMemo<AdvancedFilters>(() => ({
    localId: searchParams.get("localId") || undefined,
    channel: searchParams.get("channel") || undefined,
    status: searchParams.get("status") || undefined,
    assignee: searchParams.get("assignee") || undefined,
    dateRange: searchParams.get("dateRange") || undefined,
    q: searchParams.get("q") || undefined,
  }), [searchParams])

  // Estado interno para debounce de búsqueda
  const [searchQuery, setSearchQuery] = useState(filters.q || "")
  const [isSearching, setIsSearching] = useState(false)

  // Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== undefined).length
  }, [filters])

  // Actualizar filtro individual
  function updateFilter(key: keyof AdvancedFilters, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    router.push(`/app/${tenantId}/inbox?${params.toString()}`)
  }

  // Limpiar todos los filtros
  function clearFilters() {
    router.push(`/app/${tenantId}/inbox`)
    setSearchQuery("")
  }

  // Limpiar filtro específico
  function clearFilter(key: keyof AdvancedFilters) {
    updateFilter(key, null)
  }

  // Manejar búsqueda con debounce optimizado
  useEffect(() => {
    // Si la búsqueda está vacía, actualizar inmediatamente
    if (!searchQuery.trim()) {
      if (filters.q) {
        setIsSearching(true)
        updateFilter("q", null)
        setTimeout(() => setIsSearching(false), 100)
      }
      return
    }

    // Mostrar indicador de búsqueda
    setIsSearching(true)

    // Debounce solo para búsquedas con contenido
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() !== filters.q) {
        updateFilter("q", searchQuery.trim() || null)
      }
      setIsSearching(false)
    }, 300) // Reducido a 300ms para mejor UX

    return () => {
      clearTimeout(timeoutId)
      setIsSearching(false)
    }
  }, [searchQuery, filters.q, updateFilter])

  // Sincronizar búsqueda interna con filtros externos
  useEffect(() => {
    setSearchQuery(filters.q || "")
  }, [filters.q])

  // Función para destacar resultados de búsqueda
  function highlightSearchTerm(text: string, searchTerm: string) {
    if (!searchTerm || searchTerm.length < 2) return text
    
    const regex = new RegExp(`(${searchTerm})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  // Función para obtener estadísticas de búsqueda
  function getSearchStats(totalThreads: number, filteredThreads: number) {
    return {
      total: totalThreads,
      filtered: filteredThreads,
      percentage: totalThreads > 0 ? Math.round((filteredThreads / totalThreads) * 100) : 0
    }
  }

  // Obtener rangos de fecha
  function getDateRangeFilter(dateRange?: string) {
    if (!dateRange || dateRange === "all") return null

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    switch (dateRange) {
      case "today":
        return { from: startOfDay, to: endOfDay }
      case "yesterday":
        const yesterday = new Date(startOfDay)
        yesterday.setDate(yesterday.getDate() - 1)
        const endYesterday = new Date(endOfDay)
        endYesterday.setDate(endYesterday.getDate() - 1)
        return { from: yesterday, to: endYesterday }
      case "thisWeek":
        const startOfWeek = new Date(startOfDay)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        return { from: startOfWeek, to: endOfDay }
      case "lastWeek":
        const startLastWeek = new Date(startOfDay)
        startLastWeek.setDate(startLastWeek.getDate() - startLastWeek.getDay() - 7)
        const endLastWeek = new Date(startOfDay)
        endLastWeek.setDate(endLastWeek.getDate() - startLastWeek.getDay())
        return { from: startLastWeek, to: endLastWeek }
      case "thisMonth":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return { from: startOfMonth, to: endOfDay }
      case "lastMonth":
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        return { from: startLastMonth, to: endLastMonth }
      default:
        return null
    }
  }

  // Validar si un thread cumple con los filtros (optimizado)
  const matchesFilters = useMemo(() => {
    return (thread: any, userMembership?: any) => {
      // Filtro por local
      if (filters.localId && thread.localId !== filters.localId) return false

      // Filtro por canal
      if (filters.channel && thread.channel.type.toLowerCase() !== filters.channel.toLowerCase()) return false

      // Filtro por estado
      if (filters.status && thread.status.toLowerCase() !== filters.status.toLowerCase()) return false

      // Filtro por asignado
      if (filters.assignee) {
        if (filters.assignee === "me" && thread.assigneeId !== userMembership?.userId) return false
        if (filters.assignee === "unassigned" && thread.assigneeId !== null) return false
        if (filters.assignee !== "me" && filters.assignee !== "unassigned" && thread.assigneeId !== filters.assignee) return false
      }

      // Filtro por rango de fechas
      if (filters.dateRange) {
        const dateRange = getDateRangeFilter(filters.dateRange)
        if (dateRange) {
          const threadDate = new Date(thread.lastMessageAt)
          if (threadDate < dateRange.from || threadDate > dateRange.to) return false
        }
      }

      // Filtro por búsqueda (optimizado)
      if (filters.q && filters.q.length >= 2) {
        const query = filters.q.toLowerCase()
        
        // Buscar en nombre del contacto
        if (thread.contact?.name?.toLowerCase().includes(query)) return true
        
        // Buscar en handle del contacto
        if (thread.contact?.handle?.toLowerCase().includes(query)) return true
        
        // Buscar en external ID
        if (thread.externalId?.toLowerCase().includes(query)) return true
        
        // Buscar en mensajes (solo si no se encontró en otros campos)
        if (thread.messages?.some((msg: any) => msg.body.toLowerCase().includes(query))) return true
        
        return false
      }

      return true
    }
  }, [filters, getDateRangeFilter])

  return {
    filters,
    searchQuery,
    setSearchQuery,
    isSearching,
    activeFiltersCount,
    updateFilter,
    clearFilters,
    clearFilter,
    getDateRangeFilter,
    matchesFilters,
    highlightSearchTerm,
    getSearchStats,
  }
}

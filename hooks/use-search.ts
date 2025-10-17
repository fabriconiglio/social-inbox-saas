import { useState, useEffect } from "react"
import useSWR from "swr"
import { searchThreads, searchContacts, type SearchFilters } from "@/app/actions/search"

interface UseSearchOptions {
  tenantId: string
  enabled?: boolean
  debounceMs?: number
}

interface UseSearchResult {
  query: string
  setQuery: (query: string) => void
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  results: any[] | undefined
  contacts: any[] | undefined
  isLoading: boolean
  error: any
  clearSearch: () => void
}

export function useSearch({ tenantId, enabled = true, debounceMs = 300 }: UseSearchOptions): UseSearchResult {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>({})

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [filters, debounceMs])

  // Search threads
  const { data: threadsData, error: threadsError, isLoading: threadsLoading } = useSWR(
    enabled && (debouncedQuery.length >= 2 || Object.keys(debouncedFilters).length > 0)
      ? [`search-threads`, tenantId, debouncedQuery, debouncedFilters]
      : null,
    () => searchThreads(debouncedQuery, tenantId, debouncedFilters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000
    }
  )

  // Search contacts
  const { data: contactsData, error: contactsError, isLoading: contactsLoading } = useSWR(
    enabled && debouncedQuery.length >= 2
      ? [`search-contacts`, tenantId, debouncedQuery]
      : null,
    () => searchContacts(debouncedQuery, tenantId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000
    }
  )

  const clearSearch = () => {
    setQuery("")
    setFilters({})
  }

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results: threadsData?.data,
    contacts: contactsData?.data,
    isLoading: threadsLoading || contactsLoading,
    error: threadsError || contactsError,
    clearSearch
  }
}

// Hook simplificado para búsqueda de threads solamente
export function useThreadSearch(tenantId: string, query: string, filters: SearchFilters = {}) {
  return useSWR(
    query.length >= 2 || Object.keys(filters).length > 0
      ? [`thread-search`, tenantId, query, filters]
      : null,
    () => searchThreads(query, tenantId, filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000
    }
  )
}

// Hook para sugerencias de búsqueda
export function useSearchSuggestions(tenantId: string, query: string) {
  return useSWR(
    query.length >= 2 ? [`search-suggestions`, tenantId, query] : null,
    async () => {
      const response = await fetch(`/api/search/suggestions?tenantId=${tenantId}&q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to fetch suggestions')
      return response.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 2000
    }
  )
}

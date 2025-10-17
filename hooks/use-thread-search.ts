import { useState, useEffect } from "react"
import useSWR from "swr"
import { searchThreads, type SearchFilters } from "@/app/actions/search-threads"

interface UseThreadSearchOptions {
  tenantId: string
  enabled?: boolean
  debounceMs?: number
}

interface UseThreadSearchResult {
  query: string
  setQuery: (query: string) => void
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  results: any[] | undefined
  isLoading: boolean
  error: any
  clearSearch: () => void
}

export function useThreadSearch({ tenantId, enabled = true, debounceMs = 500 }: UseThreadSearchOptions): UseThreadSearchResult {
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
  const { data: searchData, error, isLoading } = useSWR(
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

  const clearSearch = () => {
    setQuery("")
    setFilters({})
  }

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results: searchData?.data,
    isLoading,
    error,
    clearSearch
  }
}

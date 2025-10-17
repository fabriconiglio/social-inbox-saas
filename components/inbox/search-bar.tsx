"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Filter, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  isLoading?: boolean
  className?: string
  showFilters?: boolean
  onToggleFilters?: () => void
  activeFiltersCount?: number
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Buscar conversaciones...",
  isLoading = false,
  className,
  showFilters = true,
  onToggleFilters,
  activeFiltersCount = 0
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current!)
    }

    debounceRef.current = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current!)
      }
    }
  }, [internalValue, value, onChange])

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleClear = () => {
    setInternalValue("")
    onClear()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClear()
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-20 transition-all duration-200",
            isFocused && "ring-2 ring-primary/20",
            isLoading && "pr-24"
          )}
          disabled={isLoading}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Clear Button */}
        {internalValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
            disabled={isLoading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Filters Button */}
        {showFilters && onToggleFilters && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFilters}
              className="h-6 w-6 p-0 hover:bg-muted"
              disabled={isLoading}
            >
              <Filter className="h-3 w-3" />
            </Button>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Search Suggestions (Future Enhancement) */}
      {isFocused && internalValue && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover p-1 shadow-lg">
          <div className="text-sm text-muted-foreground p-2">
            Buscar en: conversaciones, contactos, mensajes
          </div>
        </div>
      )}
    </div>
  )
}

interface SearchFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    localId?: string
    channel?: string
    status?: string
    assignee?: string
    dateRange?: string
  }
  onFilterChange: (key: string, value: string | null) => void
  onClearFilters: () => void
  locals: Array<{ id: string; name: string }>
  members: Array<{ id: string; user: { name?: string; email: string } }>
  channels: Array<{ type: string; name: string }>
}

export function SearchFilters({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
  locals,
  members,
  channels
}: SearchFiltersProps) {
  if (!isOpen) return null

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-md border bg-popover p-4 shadow-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Filtros avanzados</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Local Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Local</label>
            <select
              value={filters.localId || "all"}
              onChange={(e) => onFilterChange("localId", e.target.value === "all" ? null : e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Todos los locales</option>
              {locals.map((local) => (
                <option key={local.id} value={local.id}>
                  {local.name}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Canal</label>
            <select
              value={filters.channel || "all"}
              onChange={(e) => onFilterChange("channel", e.target.value === "all" ? null : e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Todos los canales</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={filters.status || "all"}
              onChange={(e) => onFilterChange("status", e.target.value === "all" ? null : e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Todos</option>
              <option value="open">Abiertas</option>
              <option value="pending">Pendientes</option>
              <option value="closed">Cerradas</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Asignado a</label>
            <select
              value={filters.assignee || "all"}
              onChange={(e) => onFilterChange("assignee", e.target.value === "all" ? null : e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Todos</option>
              <option value="me">Yo</option>
              <option value="unassigned">Sin asignar</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user.name || member.user.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Rango de fechas</label>
          <select
            value={filters.dateRange || "all"}
            onChange={(e) => onFilterChange("dateRange", e.target.value === "all" ? null : e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">Todos los tiempos</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="thisWeek">Esta semana</option>
            <option value="lastWeek">Semana pasada</option>
            <option value="thisMonth">Este mes</option>
            <option value="lastMonth">Mes pasado</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(filters.localId || filters.channel || filters.status || filters.assignee || filters.dateRange) && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="w-full">
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  )
}

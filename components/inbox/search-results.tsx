"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { SearchResult } from "@/app/actions/search"

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onSelectResult: (threadId: string) => void
  className?: string
}

export function SearchResults({ results, query, onSelectResult, className }: SearchResultsProps) {
  if (!results || results.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <p>No se encontraron resultados para "{query}"</p>
        <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="px-4 py-2 text-sm text-muted-foreground border-b">
        {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
      </div>
      
      {results.map((result) => (
        <SearchResultItem
          key={result.id}
          result={result}
          query={query}
          onClick={() => onSelectResult(result.id)}
        />
      ))}
    </div>
  )
}

interface SearchResultItemProps {
  result: SearchResult
  query: string
  onClick: () => void
}

function SearchResultItem({ result, query, onClick }: SearchResultItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getChannelColor = (channelType: string) => {
    switch (channelType) {
      case "instagram":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
      case "facebook":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "whatsapp":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "tiktok":
        return "bg-black text-white dark:bg-white dark:text-black"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  const getMatchedFieldsBadges = (matchedFields: string[]) => {
    const fieldLabels: Record<string, string> = {
      "contact.name": "Nombre",
      "contact.handle": "Handle",
      "messages": "Mensajes",
      "externalId": "ID"
    }

    return matchedFields.slice(0, 2).map(field => (
      <Badge key={field} variant="outline" className="text-xs">
        {fieldLabels[field] || field}
      </Badge>
    ))
  }

  return (
    <div
      onClick={onClick}
      className="p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar del contacto */}
        <Avatar className="h-10 w-10">
          <AvatarImage src={result.contact?.name ? undefined : "/placeholder-user.jpg"} />
          <AvatarFallback>
            {result.contact?.name?.[0]?.toUpperCase() || result.contact?.handle?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header con nombre y badges */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">
              {result.contact?.name ? (
                highlightText(result.contact.name, query)
              ) : (
                highlightText(result.contact?.handle || "Contacto desconocido", query)
              )}
            </h3>
            
            <div className="flex gap-1 flex-shrink-0">
              <Badge variant="secondary" className={cn("text-xs", getStatusColor(result.status))}>
                {result.status === "open" ? "Abierto" : result.status === "pending" ? "Pendiente" : "Cerrado"}
              </Badge>
              <Badge variant="secondary" className={cn("text-xs", getChannelColor(result.channel.type))}>
                {result.channel.type}
              </Badge>
            </div>
          </div>

          {/* Último mensaje destacado */}
          {result.messages.length > 0 && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {highlightText(result.messages[0].body, query)}
            </p>
          )}

          {/* Información adicional */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{result.local.name}</span>
              {result.assignee && (
                <>
                  <span>•</span>
                  <span>Asignado a {result.assignee.name || result.assignee.email}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {getMatchedFieldsBadges(result.matchedFields)}
              <span>{formatDistanceToNow(result.updatedAt, { addSuffix: true, locale: es })}</span>
            </div>
          </div>

          {/* Indicador de relevancia */}
          {result.relevanceScore > 5 && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((result.relevanceScore / 20) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round((result.relevanceScore / 20) * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar estadísticas de búsqueda
interface SearchStatsProps {
  query: string
  results: SearchResult[]
  isLoading: boolean
  className?: string
}

export function SearchStats({ query, results, isLoading, className }: SearchStatsProps) {
  if (isLoading) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-muted rounded w-24 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!results || results.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <p className="text-sm">No se encontraron resultados</p>
      </div>
    )
  }

  const stats = {
    total: results.length,
    open: results.filter(r => r.status === "open").length,
    pending: results.filter(r => r.status === "pending").length,
    closed: results.filter(r => r.status === "closed").length,
    withMessages: results.filter(r => r.messages.length > 0).length,
    assigned: results.filter(r => r.assignee).length
  }

  return (
    <div className={cn("p-4 space-y-2", className)}>
      <div className="text-sm text-muted-foreground">
        {stats.total} resultado{stats.total !== 1 ? 's' : ''} para "{query}"
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">
          {stats.open} abiertas
        </Badge>
        <Badge variant="outline">
          {stats.pending} pendientes
        </Badge>
        <Badge variant="outline">
          {stats.closed} cerradas
        </Badge>
        <Badge variant="outline">
          {stats.assigned} asignadas
        </Badge>
      </div>
    </div>
  )
}

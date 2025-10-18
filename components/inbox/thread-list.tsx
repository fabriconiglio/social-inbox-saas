"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Instagram, Facebook, MessageCircle, Music } from "lucide-react"
import type { Channel, Local, Thread, User, Contact, Message, Membership } from "@prisma/client"
import { cn } from "@/lib/utils"
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"
import { TextHighlight } from "@/components/ui/text-highlight"

interface ThreadListProps {
  threads: (Thread & {
    channel: Channel
    local: Local
    assignee: User | null
    contact: Contact | null
    messages: Message[]
  })[]
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
  tenantId: string
  userId: string
  userMembership?: Membership
}

export function ThreadList({ 
  threads, 
  selectedThreadId, 
  onSelectThread, 
  tenantId, 
  userId,
  userMembership
}: ThreadListProps) {
  const { filters, matchesFilters, isSearching, highlightSearchTerm, getSearchStats } = useAdvancedFilters(tenantId)

  // Filtrar threads usando filtros avanzados
  const filteredThreads = threads.filter(thread => 
    matchesFilters(thread, userMembership)
  )

  // Obtener estadísticas de búsqueda
  const searchStats = getSearchStats(threads.length, filteredThreads.length)
  function getChannelIcon(type: string) {
    switch (type.toLowerCase()) {
      case "instagram":
        return <Instagram className="h-4 w-4" />
      case "facebook":
        return <Facebook className="h-4 w-4" />
      case "whatsapp":
        return <MessageCircle className="h-4 w-4" />
      case "tiktok":
        return <Music className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "OPEN":
        return "bg-green-500"
      case "PENDING":
        return "bg-yellow-500"
      case "CLOSED":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex w-96 flex-col border-r">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {filters.q ? "Resultados de búsqueda" : "Conversaciones"} 
            ({filteredThreads.length})
          </h3>
          {isSearching && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              Buscando...
            </div>
          )}
        </div>
        
        {filters.q && (
          <p className="text-sm text-muted-foreground mt-1">
            Buscando: "{filters.q}"
          </p>
        )}
        
        {/* Estadísticas de filtrado */}
        {searchStats.filtered !== searchStats.total && (
          <p className="text-xs text-muted-foreground mt-1">
            Mostrando {searchStats.filtered} de {searchStats.total} conversaciones ({searchStats.percentage}%)
          </p>
        )}
        {/* Mostrar filtros activos */}
        {(filters.localId || filters.channel || filters.status || filters.assignee || filters.dateRange) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {filters.localId && (
              <Badge variant="secondary" className="text-xs">
                Local: {filters.localId}
              </Badge>
            )}
            {filters.channel && (
              <Badge variant="secondary" className="text-xs">
                Canal: {filters.channel}
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="text-xs">
                Estado: {filters.status}
              </Badge>
            )}
            {filters.assignee && (
              <Badge variant="secondary" className="text-xs">
                Asignado: {filters.assignee}
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="secondary" className="text-xs">
                Fecha: {filters.dateRange}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            {filters.q ? (
              <>
                No se encontraron resultados para "{filters.q}"
                <br />
                <span className="text-xs">Intenta con otros términos de búsqueda</span>
              </>
            ) : (
              "No hay conversaciones que coincidan con los filtros"
            )}
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const lastMessage = thread.messages[0]
            const isSelected = thread.id === selectedThreadId

            return (
              <button
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={cn(
                  "w-full border-b p-4 text-left transition-colors hover:bg-accent",
                  isSelected && "bg-accent",
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>
                      {thread.contact?.name?.[0]?.toUpperCase() || thread.contact?.handle?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TextHighlight
                          text={thread.contact?.name || thread.contact?.handle || "Desconocido"}
                          searchTerm={filters.q || ""}
                          className="font-medium"
                        />
                        <div className="text-muted-foreground">{getChannelIcon(thread.channel.type)}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>

                    <p className="truncate text-sm text-muted-foreground">
                      <TextHighlight
                        text={lastMessage?.body || "Sin mensajes"}
                        searchTerm={filters.q || ""}
                      />
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", getStatusColor(thread.status))} />
                      <span className="text-xs text-muted-foreground">{thread.local.name}</span>
                      {thread.assignee && (
                        <Badge variant="secondary" className="text-xs">
                          {thread.assignee.name || thread.assignee.email}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Instagram, Facebook, MessageCircle, Music } from "lucide-react"
import type { Channel, Local, Thread, User, Contact, Message } from "@prisma/client"
import { cn } from "@/lib/utils"

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
  searchQuery?: string
}

export function ThreadList({ 
  threads, 
  selectedThreadId, 
  onSelectThread, 
  tenantId, 
  searchQuery
}: ThreadListProps) {
  // Filtrar threads localmente si hay query de búsqueda
  const filteredThreads = searchQuery && searchQuery.length >= 2 
    ? threads.filter(thread => {
        const query = searchQuery.toLowerCase()
        
        // Buscar en nombre del contacto
        if (thread.contact?.name?.toLowerCase().includes(query)) return true
        
        // Buscar en handle del contacto
        if (thread.contact?.handle?.toLowerCase().includes(query)) return true
        
        // Buscar en mensajes
        if (thread.messages.some(msg => msg.body.toLowerCase().includes(query))) return true
        
        // Buscar en external ID
        if (thread.externalId.toLowerCase().includes(query)) return true
        
        return false
      })
    : threads
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
        <h3 className="font-semibold">
          {searchQuery ? "Resultados de búsqueda" : "Conversaciones"} 
          ({filteredThreads.length})
        </h3>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-1">
            Buscando: "{searchQuery}"
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {filteredThreads.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? (
              <>
                No se encontraron resultados para "{searchQuery}"
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
                    <AvatarImage src={thread.contact?.image || undefined} />
                    <AvatarFallback>
                      {thread.contact?.name?.[0]?.toUpperCase() || thread.contact?.handle?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {thread.contact?.name || thread.contact?.handle || "Desconocido"}
                        </span>
                        <div className="text-muted-foreground">{getChannelIcon(thread.channel.type)}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>

                    <p className="truncate text-sm text-muted-foreground">{lastMessage?.body || "Sin mensajes"}</p>

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

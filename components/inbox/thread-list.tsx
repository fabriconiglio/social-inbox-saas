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
}

export function ThreadList({ threads, selectedThreadId, onSelectThread }: ThreadListProps) {
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
        <h3 className="font-semibold">Conversaciones ({threads.length})</h3>
      </div>

      <div className="flex-1 overflow-auto">
        {threads.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No hay conversaciones que coincidan con los filtros
          </div>
        ) : (
          threads.map((thread) => {
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

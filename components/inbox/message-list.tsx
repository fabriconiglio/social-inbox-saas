"use client"

import { useEffect, useRef } from "react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface MessageListProps {
  threadId: string
  tenantId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function MessageList({ threadId, tenantId }: MessageListProps) {
  const { data: messages, error } = useSWR(`/api/tenants/${tenantId}/threads/${threadId}/messages`, fetcher, {
    refreshInterval: 3000, // Poll every 3 seconds for new messages
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (error) {
    return <div className="flex flex-1 items-center justify-center text-destructive">Error al cargar los mensajes</div>
  }

  if (!messages) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Cargando mensajes...</div>
  }

  return (
    <div className="flex-1 space-y-4 overflow-auto p-4">
      {messages.map((message: any) => {
        const isOutbound = message.direction === "OUTBOUND"

        return (
          <div key={message.id} className={cn("flex gap-3", isOutbound && "flex-row-reverse")}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.author?.image || undefined} />
              <AvatarFallback>
                {isOutbound
                  ? message.author?.name?.[0]?.toUpperCase() || "A"
                  : message.contact?.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className={cn("flex max-w-[70%] flex-col gap-1", isOutbound && "items-end")}>
              <div className={cn("rounded-lg p-3", isOutbound ? "bg-primary text-primary-foreground" : "bg-muted")}>
                <p className="text-sm">{message.body}</p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((att: any, idx: number) => (
                      <div key={idx}>
                        {att.type === "image" && (
                          <img src={att.url || "/placeholder.svg"} alt="Attachment" className="max-h-64 rounded" />
                        )}
                        {att.type === "file" && (
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline">
                            {att.filename || "Archivo adjunto"}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true, locale: es })}
                {message.failedReason && <span className="ml-2 text-destructive">• Falló</span>}
              </span>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}

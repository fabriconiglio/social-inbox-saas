"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarOpen } from "lucide-react"
import type { Channel, Local, Thread, User, Contact } from "@prisma/client"

interface ThreadHeaderProps {
  thread: Thread & {
    channel: Channel
    local: Local
    assignee: User | null
    contact: Contact | null
  }
  onToggleSidebar: () => void
}

export function ThreadHeader({ thread, onToggleSidebar }: ThreadHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={thread.contact?.image || undefined} />
          <AvatarFallback>
            {thread.contact?.name?.[0]?.toUpperCase() || thread.contact?.handle?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{thread.contact?.name || thread.contact?.handle || "Desconocido"}</h3>
          <p className="text-sm text-muted-foreground">
            {thread.channel.displayName} • {thread.local.name}
          </p>
        </div>
        <Badge variant={thread.status === "OPEN" ? "default" : "secondary"}>{thread.status}</Badge>
      </div>

      <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
        <SidebarOpen className="h-4 w-4" />
      </Button>
    </div>
  )
}

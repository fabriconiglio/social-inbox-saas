"use client"

import { useState } from "react"
import { MessageList } from "./message-list"
import { MessageComposer } from "./message-composer"
import { ThreadHeader } from "./thread-header"
import { ThreadSidebar } from "./thread-sidebar"
import type { Channel, Local, Thread, User, Contact, Membership } from "@prisma/client"

interface ThreadViewProps {
  thread: Thread & {
    channel: Channel
    local: Local
    assignee: User | null
    contact: Contact | null
  }
  tenantId: string
  userId: string
  userRole: string
  members: (Membership & { user: User })[]
}

export function ThreadView({ thread, tenantId, userId, userRole, members }: ThreadViewProps) {
  const [showSidebar, setShowSidebar] = useState(true)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <ThreadHeader 
        thread={thread} 
        onToggleSidebar={() => setShowSidebar(!showSidebar)} 
        tenantId={tenantId}
        currentUserId={userId}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <MessageList threadId={thread.id} tenantId={tenantId} />
          <MessageComposer 
            threadId={thread.id} 
            channelId={thread.channelId} 
            tenantId={tenantId} 
            userId={userId}
            channelType={thread.channel?.type || "whatsapp"}
          />
        </div>

        {showSidebar && (
          <ThreadSidebar thread={thread} tenantId={tenantId} userId={userId} userRole={userRole} members={members} />
        )}
      </div>
    </div>
  )
}

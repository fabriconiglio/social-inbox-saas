"use client"

import { useState } from "react"
import { InboxSidebar } from "./inbox-sidebar"
import { ThreadList } from "./thread-list"
import { ThreadView } from "./thread-view"
import type { Channel, Local, Membership, Thread, User, Contact, Message } from "@prisma/client"

interface InboxLayoutProps {
  tenantId: string
  userId: string
  userRole: string
  locals: (Local & { channels: Channel[] })[]
  members: (Membership & { user: User })[]
  threads: (Thread & {
    channel: Channel
    local: Local
    assignee: User | null
    contact: Contact | null
    messages: Message[]
  })[]
  filters: {
    localId?: string
    channel?: string
    status?: string
    assignee?: string
    q?: string
  }
}

export function InboxLayout({ tenantId, userId, userRole, locals, members, threads, filters }: InboxLayoutProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threads[0]?.id || null)

  const selectedThread = threads.find((t) => t.id === selectedThreadId)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar with filters */}
      <InboxSidebar tenantId={tenantId} locals={locals} members={members} filters={filters} />

      {/* Thread list */}
      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={setSelectedThreadId}
        tenantId={tenantId}
      />

      {/* Thread view */}
      {selectedThread ? (
        <ThreadView thread={selectedThread} tenantId={tenantId} userId={userId} userRole={userRole} members={members} />
      ) : (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <p>Selecciona una conversación para comenzar</p>
        </div>
      )}
    </div>
  )
}

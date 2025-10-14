import { InboxLayout } from "@/components/inbox/inbox-layout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Bandeja de Entrada | MessageHub",
}

interface InboxPageProps {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<{
    localId?: string
    channel?: string
    status?: string
    assignee?: string
    q?: string
  }>
}

export default async function InboxPage({ params, searchParams }: InboxPageProps) {
  const { tenantId } = await params
  const filters = await searchParams

  const { mockUser, mockLocals, mockMembers, mockThreads } = await import("@/lib/mock-data")

  return (
    <InboxLayout
      tenantId={tenantId}
      userId={mockUser.id}
      userRole={mockUser.role}
      locals={mockLocals as any}
      members={mockMembers as any}
      threads={mockThreads as any}
      filters={filters}
    />
  )

  // Original database code (commented for preview)
  /*
  const user = await requireAuth()
  const membership = await requireTenantAccess(user.id!, tenantId)

  // Fetch locals for this tenant
  const locals = await prisma.local.findMany({
    where: { tenantId },
    include: {
      channels: {
        where: { status: "ACTIVE" },
      },
    },
    orderBy: { name: "asc" },
  })

  // Fetch team members
  const members = await prisma.membership.findMany({
    where: { tenantId },
    include: {
      user: true,
    },
    orderBy: { user: { name: "asc" } },
  })

  // Build thread filters
  const threadFilters: any = {
    tenantId,
  }

  // Por defecto, mostrar solo conversaciones abiertas
  // Si el usuario selecciona otro filtro de estado, se aplicará ese
  if (filters.status) {
    threadFilters.status = filters.status.toUpperCase()
  } else {
    // Filtro por defecto: solo abiertas
    threadFilters.status = "OPEN"
  }

  if (filters.localId) {
    threadFilters.localId = filters.localId
  }

  if (filters.channel) {
    threadFilters.channel = {
      type: filters.channel.toUpperCase(),
    }
  }

  if (filters.assignee === "me") {
    threadFilters.assigneeId = user.id
  } else if (filters.assignee === "unassigned") {
    threadFilters.assigneeId = null
  } else if (filters.assignee) {
    threadFilters.assigneeId = filters.assignee
  }

  if (filters.q) {
    threadFilters.OR = [
      { subject: { contains: filters.q, mode: "insensitive" } },
      { contact: { name: { contains: filters.q, mode: "insensitive" } } },
      { contact: { handle: { contains: filters.q, mode: "insensitive" } } },
    ]
  }

  // Fetch threads
  const threads = await prisma.thread.findMany({
    where: threadFilters,
    include: {
      channel: true,
      local: true,
      assignee: true,
      contact: true,
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  })

  return (
    <InboxLayout
      tenantId={tenantId}
      userId={user.id!}
      userRole={membership.role}
      locals={locals}
      members={members}
      threads={threads}
      filters={filters}
    />
  )
  */
}

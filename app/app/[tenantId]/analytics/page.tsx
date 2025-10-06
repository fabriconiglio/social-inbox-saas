import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import type { Metadata } from "next"
import { startOfDay, endOfDay, subDays } from "date-fns"

export const metadata: Metadata = {
  title: "Analíticas | MessageHub",
}

interface AnalyticsPageProps {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<{
    localId?: string
    channel?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function AnalyticsPage({ params, searchParams }: AnalyticsPageProps) {
  const { tenantId } = await params
  const filters = await searchParams

  const { mockAnalytics, mockLocals } = await import("@/lib/mock-data")

  const endDate = filters.endDate ? new Date(filters.endDate) : endOfDay(new Date())
  const startDate = filters.startDate ? new Date(filters.startDate) : startOfDay(subDays(endDate, 30))

  return (
    <AnalyticsDashboard
      tenantId={tenantId}
      analytics={mockAnalytics}
      locals={mockLocals as any}
      filters={filters}
      startDate={startDate}
      endDate={endDate}
    />
  )

  // Original database code (commented for preview)
  /*
  const user = await requireAuth()
  await requireTenantAccess(user.id!, tenantId)

  // Date range defaults to last 30 days
  const endDate = filters.endDate ? new Date(filters.endDate) : endOfDay(new Date())
  const startDate = filters.startDate ? new Date(filters.startDate) : startOfDay(subDays(endDate, 30))

  // Build filters
  const threadFilters: any = {
    tenantId,
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (filters.localId) {
    threadFilters.localId = filters.localId
  }

  if (filters.channel) {
    threadFilters.channel = {
      type: filters.channel.toUpperCase(),
    }
  }

  // Fetch analytics data
  const [totalThreads, openThreads, closedThreads, avgResponseTime, threadsByChannel, threadsByAgent, messageVolume] =
    await Promise.all([
      // Total threads
      prisma.thread.count({ where: threadFilters }),

      // Open threads
      prisma.thread.count({
        where: { ...threadFilters, status: "OPEN" },
      }),

      // Closed threads
      prisma.thread.count({
        where: { ...threadFilters, status: "CLOSED" },
      }),

      // Average response time (simplified - first response)
      prisma.message.aggregate({
        where: {
          thread: threadFilters,
          direction: "OUTBOUND",
        },
        _avg: {
          sentAt: true,
        },
      }),

      // Threads by channel
      prisma.thread.groupBy({
        by: ["channelId"],
        where: threadFilters,
        _count: true,
      }),

      // Threads by agent
      prisma.thread.groupBy({
        by: ["assigneeId"],
        where: threadFilters,
        _count: true,
      }),

      // Message volume by day
      prisma.message.groupBy({
        by: ["sentAt"],
        where: {
          thread: threadFilters,
        },
        _count: true,
      }),
    ])

  // Fetch channels for grouping
  const channels = await prisma.channel.findMany({
    where: {
      local: {
        tenantId,
      },
    },
  })

  // Fetch users for grouping
  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          tenantId,
        },
      },
    },
  })

  // Fetch locals for filter
  const locals = await prisma.local.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  })

  // Process data for charts
  const channelData = threadsByChannel.map((item) => {
    const channel = channels.find((c) => c.id === item.channelId)
    return {
      name: channel?.displayName || "Unknown",
      value: item._count,
    }
  })

  const agentData = threadsByAgent
    .filter((item) => item.assigneeId)
    .map((item) => {
      const user = users.find((u) => u.id === item.assigneeId)
      return {
        name: user?.name || user?.email || "Unknown",
        value: item._count,
      }
    })

  const analytics = {
    totalThreads,
    openThreads,
    closedThreads,
    avgResponseTime: 0, // Would calculate properly in production
    channelData,
    agentData,
    messageVolume: messageVolume.length,
  }

  return (
    <AnalyticsDashboard
      tenantId={tenantId}
      analytics={analytics}
      locals={locals}
      filters={filters}
      startDate={startDate}
      endDate={endDate}
    />
  )
  */
}

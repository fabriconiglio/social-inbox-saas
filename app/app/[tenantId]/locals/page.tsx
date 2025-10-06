import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Locales | MessageHub",
}

interface LocalsPageProps {
  params: Promise<{ tenantId: string }>
}

export default async function LocalsPage({ params }: LocalsPageProps) {
  const { tenantId } = await params

  const { mockLocalsWithCount } = await import("@/lib/mock-data")

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Locales</h1>
        <p className="text-muted-foreground">Gestiona las sucursales de tu empresa</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockLocalsWithCount.map((local) => (
          <div key={local.id} className="rounded-lg border p-4">
            <h3 className="font-semibold">{local.name}</h3>
            {local.address && <p className="text-sm text-muted-foreground">{local.address}</p>}
            <p className="mt-2 text-sm">
              {local.channels.length} canal(es) • {local._count.threads} conversación(es)
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {local.channels.map((channel) => (
                <span key={channel.id} className="rounded-full bg-muted px-2 py-1 text-xs">
                  {channel.type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Original database code (commented for preview)
  /*
  const user = await requireAuth()
  await requireTenantAccess(user.id!, tenantId, "ADMIN")

  const locals = await prisma.local.findMany({
    where: { tenantId },
    include: {
      channels: true,
      _count: {
        select: {
          threads: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Locales</h1>
        <p className="text-muted-foreground">Gestiona las sucursales de tu empresa</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {locals.map((local) => (
          <div key={local.id} className="rounded-lg border p-4">
            <h3 className="font-semibold">{local.name}</h3>
            {local.address && <p className="text-sm text-muted-foreground">{local.address}</p>}
            <p className="mt-2 text-sm">
              {local.channels.length} canal(es) • {local._count.threads} conversación(es)
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {local.channels.map((channel) => (
                <span key={channel.id} className="rounded-full bg-muted px-2 py-1 text-xs">
                  {channel.type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  */
}

import { Metadata } from "next"
import { getChannels, getLocals } from "@/app/actions/channels"
import { ChannelCard } from "@/components/channels/channel-card"
import { ConnectChannelButton } from "@/components/channels/connect-channel-button"
import { Button } from "@/components/ui/button"
import { Plus, History } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Canales | MessageHub",
}

export default async function ChannelsPage({
  params,
}: {
  params: { tenantId: string }
}) {
  const [channelsResult, localsResult] = await Promise.all([
    getChannels(params.tenantId),
    getLocals(params.tenantId),
  ])

  if (channelsResult.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Error</h2>
          <p className="text-muted-foreground">{channelsResult.error}</p>
        </div>
      </div>
    )
  }

  const channels = channelsResult.channels || []
  const locals = localsResult.locals || []

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Canales</h1>
          <p className="text-muted-foreground">
            Gestiona tus canales de mensajería conectados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/${params.tenantId}/audit?entity=Channel`}>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" />
              Historial
            </Button>
          </Link>
          <ConnectChannelButton tenantId={params.tenantId} locals={locals} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Total de Canales
          </div>
          <div className="text-2xl font-bold">{channels.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Canales Activos
          </div>
          <div className="text-2xl font-bold text-green-500">
            {channels.filter((c) => c.status === "ACTIVE").length}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium text-muted-foreground">
            Canales Inactivos
          </div>
          <div className="text-2xl font-bold text-muted-foreground">
            {channels.filter((c) => c.status === "INACTIVE").length}
          </div>
        </div>
      </div>

      {/* Channel List */}
      {channels.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No hay canales conectados</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Conecta tu primer canal para empezar a recibir mensajes
            </p>
            <ConnectChannelButton tenantId={params.tenantId} locals={locals} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              tenantId={params.tenantId}
            />
          ))}
        </div>
      )}
    </div>
  )
}




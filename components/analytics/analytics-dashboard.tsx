"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { MessageSquare, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Local } from "@prisma/client"

interface AnalyticsDashboardProps {
  tenantId: string
  analytics: {
    totalThreads: number
    openThreads: number
    closedThreads: number
    avgResponseTime: number
    channelData: { name: string; value: number }[]
    agentData: { name: string; value: number }[]
    messageVolume: number
  }
  locals: Local[]
  filters: {
    localId?: string
    channel?: string
    startDate?: string
    endDate?: string
  }
  startDate: Date
  endDate: Date
}

export function AnalyticsDashboard({
  tenantId,
  analytics,
  locals,
  filters,
  startDate,
  endDate,
}: AnalyticsDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/app/${tenantId}/analytics?${params.toString()}`)
  }

  const responseRate = analytics.totalThreads > 0 ? (analytics.closedThreads / analytics.totalThreads) * 100 : 0

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          {format(startDate, "PPP", { locale: es })} - {format(endDate, "PPP", { locale: es })}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => updateFilter("startDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Fecha fin</Label>
            <Input
              id="endDate"
              type="date"
              value={format(endDate, "yyyy-MM-dd")}
              onChange={(e) => updateFilter("endDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Select
              value={filters.localId || "all"}
              onValueChange={(v) => updateFilter("localId", v === "all" ? null : v)}
            >
              <SelectTrigger id="local">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los locales</SelectItem>
                {locals.map((local) => (
                  <SelectItem key={local.id} value={local.id}>
                    {local.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel">Canal</Label>
            <Select
              value={filters.channel || "all"}
              onValueChange={(v) => updateFilter("channel", v === "all" ? null : v)}
            >
              <SelectTrigger id="channel">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="mock">Mock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversaciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalThreads}</div>
            <p className="text-xs text-muted-foreground">En el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones Abiertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.openThreads}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones Cerradas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.closedThreads}</div>
            <p className="text-xs text-muted-foreground">{responseRate.toFixed(1)}% tasa de cierre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volumen de Mensajes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.messageVolume}</div>
            <p className="text-xs text-muted-foreground">Mensajes totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversaciones por Canal</CardTitle>
            <CardDescription>Distribución de conversaciones por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.channelData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(item.value / analytics.totalThreads) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                </div>
              ))}
              {analytics.channelData.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversaciones por Agente</CardTitle>
            <CardDescription>Distribución de conversaciones asignadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.agentData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(item.value / analytics.totalThreads) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                </div>
              ))}
              {analytics.agentData.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No hay datos disponibles</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
import { HourlyChart } from "./hourly-chart"
import { VolumePeaksChart } from "./volume-peaks-chart"
import { VolumeTimelineChart } from "./volume-timeline-chart"
import { PeriodComparisonChart } from "./period-comparison-chart"
import { ScheduleHeatmapChart } from "./schedule-heatmap-chart"
import { ConversationFunnelChart } from "./conversation-funnel-chart"
import { ExportButton } from "./export-button"
import { ExportPDFButton } from "./export-pdf-button"
import { DateRangeSelector } from "./date-range-selector"
import { CustomFiltersManager } from "./custom-filters-manager"
import { AgentRankingChart } from "./agent-ranking-chart"
import { ConversationVolumeChart } from "./conversation-volume-chart"

interface AnalyticsDashboardProps {
  tenantId: string
  analytics: {
    totalThreads: number
    openThreads: number
    closedThreads: number
    avgResponseTime: number
    averageFirstResponseTime?: number
    averageResolutionTime?: number
    closeRate?: number
    channelData: { name: string; value: number }[]
    agentData: { name: string; value: number }[]
    messageVolume: number
    hourlyMetrics?: {
      hour: number
      inbound: number
      outbound: number
      total: number
    }[]
    peakMetrics?: {
      peaks: Array<{
        date: string
        hour: number
        volume: number
        intensity: 'low' | 'medium' | 'high'
      }>
      averageVolume: number
      maxVolume: number
      peakThreshold: number
      patterns: {
        mostFrequentHours: Array<{ hour: number; count: number }>
        mostActiveDays: Array<{ date: string; count: number }>
        totalPeaks: number
      }
    }
    timelineMetrics?: {
      timeline: Array<{
        period: string
        inbound: number
        outbound: number
        total: number
      }>
      totalMessages: number
      averagePerPeriod: number
      trend: 'increasing' | 'decreasing' | 'stable'
      granularity: 'hour' | 'day' | 'week'
    }
    comparisonMetrics?: {
      current: any
      previous: any
      comparisons: {
        totalThreads: {
          current: number
          previous: number
          change: number
          changeType: 'increase' | 'decrease' | 'stable'
        }
        totalMessages: {
          current: number
          previous: number
          change: number
          changeType: 'increase' | 'decrease' | 'stable'
        }
        avgResponseTime: {
          current: number
          previous: number
          change: number
          changeType: 'increase' | 'decrease' | 'stable'
        }
        closeRate: {
          current: number
          previous: number
          change: number
          changeType: 'increase' | 'decrease' | 'stable'
        }
        inboundMessages: {
          current: number
          previous: number
          change: number
          changeType: 'increase' | 'decrease' | 'stable'
        }
        outboundMessages: {
          current: number
          previous: number
          change: number
          changeType: 'increase' | 'decrease' | 'stable'
        }
      }
      periodInfo: {
        currentStart: Date
        currentEnd: Date
        previousStart: Date
        previousEnd: Date
        comparisonType: 'previous_period' | 'same_period_last_year'
      }
    }
    heatmapMetrics?: {
      heatmap: Array<{
        day: string
        dayIndex: number
        hours: Array<{
          hour: number
          inbound: number
          outbound: number
          total: number
        }>
      }>
      maxActivity: number
      totalMessages: number
      peakHours: Array<{
        hour: number
        total: number
      }>
      peakDays: Array<{
        day: number
        total: number
      }>
      averagePerHour: number
    }
    funnelMetrics?: {
      funnel: {
        totalThreads: number
        assignedThreads: number
        threadsWithAgentResponse: number
        resolvedThreads: number
        openThreads: number
        pendingThreads: number
        closedThreads: number
      }
      conversionRates: {
        assignmentRate: number
        responseRate: number
        resolutionRate: number
      }
      averageTimes: {
        timeToAssignment: number
        timeToFirstResponse: number
        timeToResolution: number
      }
      losses: {
        lostAtAssignment: number
        lostAtResponse: number
        lostAtResolution: number
        lossRateAtAssignment: number
        lossRateAtResponse: number
        lossRateAtResolution: number
      }
      stages: Array<{
        name: string
        count: number
        percentage: number
        color: string
      }>
    }
    rankingMetrics?: {
      agents: Array<{
        position: number
        agent: {
          id: string
          name: string
          email: string
        }
        metrics: {
          totalThreads: number
          openThreads: number
          closedThreads: number
          totalMessages: number
          inboundMessages: number
          outboundMessages: number
          avgFirstResponseTime: number
          avgResolutionTime: number
          resolutionRate: number
          productivity: number
          avgMessageLength: number
          score: number
        }
        trend: 'top' | 'good' | 'average'
      }>
      summary: {
        totalAgents: number
        avgScore: number
        topPerformers: any[]
        needsImprovement: any[]
      }
      categories: {
        byScore: any[]
        byThreads: any[]
        byResolutionRate: any[]
        byResponseTime: any[]
      }
    }
    volumeMetrics?: {
      agents: Array<{
        agent: {
          id: string
          name: string
          email: string
        }
        metrics: {
          totalThreads: number
          openThreads: number
          pendingThreads: number
          closedThreads: number
          totalMessages: number
          inboundMessages: number
          outboundMessages: number
          avgMessagesPerThread: number
          avgThreadDuration: number
          productivity: number
          threadsByDay: Record<string, number>
          threadsByHour: Record<number, number>
          threadsByStatus: Record<string, number>
        }
      }>
      summary: {
        totalAgents: number
        totalThreads: number
        totalMessages: number
        avgThreadsPerAgent: number
        avgMessagesPerThread: number
      }
      topPerformers: {
        byVolume: any[]
        byMessages: any[]
        byProductivity: any[]
      }
      distribution: {
        byStatus: {
          open: number
          pending: number
          closed: number
        }
        byHour: Record<number, number>
        byDay: Record<string, number>
      }
    }
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filtros</CardTitle>
          <div className="flex gap-2">
            <ExportButton 
              tenantId={tenantId}
              startDate={format(startDate, "yyyy-MM-dd")}
              endDate={format(endDate, "yyyy-MM-dd")}
            />
            <ExportPDFButton 
              tenantId={tenantId}
              startDate={format(startDate, "yyyy-MM-dd")}
              endDate={format(endDate, "yyyy-MM-dd")}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Rango de fechas</Label>
              <DateRangeSelector
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={(start, end) => {
                  updateFilter("startDate", format(start, "yyyy-MM-dd"))
                  updateFilter("endDate", format(end, "yyyy-MM-dd"))
                }}
              />
            </div>
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
          </div>
          
          {/* Filtros Personalizables */}
          <div className="border-t pt-4">
            <CustomFiltersManager
              currentFilters={{
                localId: filters.localId,
                channel: filters.channel,
                startDate: format(startDate, "yyyy-MM-dd"),
                endDate: format(endDate, "yyyy-MM-dd")
              }}
              onFilterApply={(appliedFilters) => {
                Object.entries(appliedFilters).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '') {
                    updateFilter(key, value.toString())
                  }
                })
              }}
            />
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

      {/* Advanced Metrics */}
      {(analytics.averageFirstResponseTime !== undefined || analytics.averageResolutionTime !== undefined || analytics.closeRate !== undefined) && (
        <div className="grid gap-4 md:grid-cols-3">
          {analytics.averageFirstResponseTime !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Promedio de Primera Respuesta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.averageFirstResponseTime < 60 
                    ? `${analytics.averageFirstResponseTime} min`
                    : `${Math.floor(analytics.averageFirstResponseTime / 60)}h ${analytics.averageFirstResponseTime % 60}min`
                  }
                </div>
                <p className="text-xs text-muted-foreground">Tiempo promedio para primera respuesta</p>
              </CardContent>
            </Card>
          )}

          {analytics.averageResolutionTime !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo Promedio de Resolución</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.averageResolutionTime < 60 
                    ? `${analytics.averageResolutionTime} min`
                    : `${Math.floor(analytics.averageResolutionTime / 60)}h ${analytics.averageResolutionTime % 60}min`
                  }
                </div>
                <p className="text-xs text-muted-foreground">Tiempo promedio para cerrar conversación</p>
              </CardContent>
            </Card>
          )}

          {analytics.closeRate !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Cierre</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.closeRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Conversaciones cerradas vs total</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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

      {/* Mensajes por Hora */}
      {analytics.hourlyMetrics && analytics.hourlyMetrics.length > 0 && (
        <div className="grid gap-4">
          <HourlyChart 
            data={analytics.hourlyMetrics}
            title="Mensajes por Hora del Día"
            description="Distribución de mensajes entrantes y salientes por hora del día"
          />
        </div>
      )}

      {/* Picos de Volumen */}
      {analytics.peakMetrics && (
        <div className="grid gap-4">
          <VolumePeaksChart 
            peaks={analytics.peakMetrics.peaks}
            patterns={analytics.peakMetrics.patterns}
            averageVolume={analytics.peakMetrics.averageVolume}
            maxVolume={analytics.peakMetrics.maxVolume}
            peakThreshold={analytics.peakMetrics.peakThreshold}
            title="Análisis de Picos de Volumen"
            description="Detección y análisis de momentos de mayor actividad"
          />
        </div>
      )}

      {/* Línea de Tiempo de Volumen */}
      {analytics.timelineMetrics && (
        <div className="grid gap-4">
          <VolumeTimelineChart 
            timeline={analytics.timelineMetrics.timeline}
            totalMessages={analytics.timelineMetrics.totalMessages}
            averagePerPeriod={analytics.timelineMetrics.averagePerPeriod}
            trend={analytics.timelineMetrics.trend}
            granularity={analytics.timelineMetrics.granularity}
            title="Línea de Tiempo de Volumen"
            description="Evolución del volumen de mensajes a lo largo del tiempo"
          />
        </div>
      )}

      {/* Comparación con Período Anterior */}
      {analytics.comparisonMetrics && (
        <div className="grid gap-4">
          <PeriodComparisonChart 
            current={analytics.comparisonMetrics.current}
            previous={analytics.comparisonMetrics.previous}
            comparisons={analytics.comparisonMetrics.comparisons}
            periodInfo={analytics.comparisonMetrics.periodInfo}
            title="Comparación con Período Anterior"
            description="Análisis comparativo de métricas entre períodos"
          />
        </div>
      )}

      {/* Heatmap de Horarios */}
      {analytics.heatmapMetrics && (
        <div className="grid gap-4">
          <ScheduleHeatmapChart 
            heatmap={analytics.heatmapMetrics.heatmap}
            maxActivity={analytics.heatmapMetrics.maxActivity}
            totalMessages={analytics.heatmapMetrics.totalMessages}
            peakHours={analytics.heatmapMetrics.peakHours}
            peakDays={analytics.heatmapMetrics.peakDays}
            averagePerHour={analytics.heatmapMetrics.averagePerHour}
            title="Heatmap de Horarios"
            description="Actividad por día de la semana y hora del día"
          />
        </div>
      )}

      {/* Funnel de Conversaciones */}
      {analytics.funnelMetrics && (
        <div className="grid gap-4">
          <ConversationFunnelChart 
            funnel={analytics.funnelMetrics.funnel}
            conversionRates={analytics.funnelMetrics.conversionRates}
            averageTimes={analytics.funnelMetrics.averageTimes}
            losses={analytics.funnelMetrics.losses}
            stages={analytics.funnelMetrics.stages}
            title="Funnel de Conversaciones"
            description="Análisis del flujo de conversaciones desde inicio hasta resolución"
          />
        </div>
      )}

      {/* Ranking de Agentes */}
      {analytics.rankingMetrics && (
        <div className="grid gap-4">
          <AgentRankingChart 
            agents={analytics.rankingMetrics.agents}
            summary={analytics.rankingMetrics.summary}
            categories={analytics.rankingMetrics.categories}
            title="Ranking de Agentes"
            description="Evaluación del rendimiento de agentes basada en múltiples métricas"
          />
        </div>
      )}

      {/* Volumen de Conversaciones */}
      {analytics.volumeMetrics && (
        <div className="grid gap-4">
          <ConversationVolumeChart 
            agents={analytics.volumeMetrics.agents}
            summary={analytics.volumeMetrics.summary}
            topPerformers={analytics.volumeMetrics.topPerformers}
            distribution={analytics.volumeMetrics.distribution}
            title="Cantidad de Conversaciones Manejadas"
            description="Análisis detallado del volumen de conversaciones por agente"
          />
        </div>
      )}
    </div>
  )
}

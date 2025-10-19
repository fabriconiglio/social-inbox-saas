"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TimelineData {
  period: string
  inbound: number
  outbound: number
  total: number
}

interface VolumeTimelineChartProps {
  timeline: TimelineData[]
  totalMessages: number
  averagePerPeriod: number
  trend: 'increasing' | 'decreasing' | 'stable'
  granularity: 'hour' | 'day' | 'week'
  title?: string
  description?: string
}

export function VolumeTimelineChart({ 
  timeline, 
  totalMessages,
  averagePerPeriod,
  trend,
  granularity,
  title = "Línea de Tiempo de Volumen",
  description = "Evolución del volumen de mensajes a lo largo del tiempo"
}: VolumeTimelineChartProps) {
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600'
      case 'decreasing': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'En Aumento'
      case 'decreasing': return 'En Disminución'
      default: return 'Estable'
    }
  }

  const formatPeriod = (period: string, granularity: string) => {
    try {
      const date = new Date(period)
      
      switch (granularity) {
        case 'hour':
          return format(date, "dd/MM HH:mm", { locale: es })
        case 'day':
          return format(date, "dd/MM/yyyy", { locale: es })
        case 'week':
          return `Semana del ${format(date, "dd/MM", { locale: es })}`
        default:
          return format(date, "dd/MM/yyyy", { locale: es })
      }
    } catch {
      return period
    }
  }

  const formatTooltipLabel = (label: string) => {
    return formatPeriod(label, granularity)
  }

  const formatTooltipValue = (value: number, name: string) => {
    const label = name === 'inbound' ? 'Entrantes' : 
                  name === 'outbound' ? 'Salientes' : 'Total'
    return [value, label]
  }

  // Preparar datos para el gráfico
  const chartData = timeline.map(item => ({
    period: item.period,
    entrantes: item.inbound,
    salientes: item.outbound,
    total: item.total
  }))

  return (
    <div className="space-y-6">
      {/* Resumen de Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalMessages}</div>
              <div className="text-xs text-muted-foreground">Total Mensajes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{averagePerPeriod.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Promedio por Período</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{timeline.length}</div>
              <div className="text-xs text-muted-foreground">Períodos Analizados</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                {getTrendIcon(trend)}
                <span className={`text-lg font-bold ${getTrendLabel(trend)}`}>
                  {getTrendLabel(trend)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Tendencia</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Línea de Tiempo */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución del Volumen</CardTitle>
          <CardDescription>
            Distribución de mensajes entrantes y salientes por {granularity === 'hour' ? 'hora' : granularity === 'day' ? 'día' : 'semana'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tickFormatter={(value) => formatPeriod(value, granularity)}
                  tick={{ fontSize: 12 }}
                  angle={granularity === 'hour' ? -45 : 0}
                  textAnchor={granularity === 'hour' ? "end" : "middle"}
                  height={granularity === 'hour' ? 80 : 60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={formatTooltipLabel}
                  formatter={formatTooltipValue}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="entrantes" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Entrantes"
                />
                <Area 
                  type="monotone" 
                  dataKey="salientes" 
                  stackId="1"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Salientes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Adicionales */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Períodos de Mayor Actividad</CardTitle>
            <CardDescription>Top 5 períodos con más mensajes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((item, index) => (
                  <div key={item.period} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="font-medium">{formatPeriod(item.period, granularity)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${(item.total / timeline.sort((a, b) => b.total - a.total)[0]?.total || 1) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.total}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Tipo</CardTitle>
            <CardDescription>Proporción de mensajes entrantes vs salientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">Mensajes Entrantes</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {timeline.reduce((sum, item) => sum + item.inbound, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((timeline.reduce((sum, item) => sum + item.inbound, 0) / totalMessages) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Mensajes Salientes</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {timeline.reduce((sum, item) => sum + item.outbound, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((timeline.reduce((sum, item) => sum + item.outbound, 0) / totalMessages) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

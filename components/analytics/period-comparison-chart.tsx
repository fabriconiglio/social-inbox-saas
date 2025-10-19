"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ComparisonData {
  current: number
  previous: number
  change: number
  changeType: 'increase' | 'decrease' | 'stable'
}

interface PeriodInfo {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
  comparisonType: 'previous_period' | 'same_period_last_year'
}

interface PeriodComparisonChartProps {
  current: any
  previous: any
  comparisons: {
    totalThreads: ComparisonData
    totalMessages: ComparisonData
    avgResponseTime: ComparisonData
    closeRate: ComparisonData
    inboundMessages: ComparisonData
    outboundMessages: ComparisonData
  }
  periodInfo: PeriodInfo
  title?: string
  description?: string
}

export function PeriodComparisonChart({ 
  current,
  previous,
  comparisons,
  periodInfo,
  title = "Comparación con Período Anterior",
  description = "Análisis comparativo de métricas entre períodos"
}: PeriodComparisonChartProps) {
  
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-600'
      case 'decrease': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getChangeLabel = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'Aumento'
      case 'decrease': return 'Disminución'
      default: return 'Estable'
    }
  }

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  const formatPeriod = (start: Date, end: Date) => {
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  // Preparar datos para el gráfico de barras
  const chartData = [
    {
      metric: 'Conversaciones',
      actual: current.totalThreads,
      anterior: previous.totalThreads,
      cambio: comparisons.totalThreads.change
    },
    {
      metric: 'Mensajes',
      actual: current.totalMessages,
      anterior: previous.totalMessages,
      cambio: comparisons.totalMessages.change
    },
    {
      metric: 'Tiempo Resp.',
      actual: current.avgResponseTime,
      anterior: previous.avgResponseTime,
      cambio: comparisons.avgResponseTime.change
    },
    {
      metric: 'Tasa Cierre',
      actual: current.closeRate,
      anterior: previous.closeRate,
      cambio: comparisons.closeRate.change
    }
  ]

  return (
    <div className="space-y-6">
      {/* Información de Períodos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-700">Período Actual</h4>
              <p className="text-sm text-muted-foreground">
                {formatPeriod(periodInfo.currentStart, periodInfo.currentEnd)}
              </p>
              <div className="text-xs text-muted-foreground">
                {current.periodLength} días
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-700">Período Anterior</h4>
              <p className="text-sm text-muted-foreground">
                {formatPeriod(periodInfo.previousStart, periodInfo.previousEnd)}
              </p>
              <div className="text-xs text-muted-foreground">
                {previous.periodLength} días
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Comparación */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Métricas</CardTitle>
          <CardDescription>
            Comparación lado a lado entre períodos actual y anterior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value, 
                    name === 'actual' ? 'Período Actual' : 'Período Anterior'
                  ]}
                />
                <Legend />
                <Bar dataKey="actual" fill="#10b981" name="Período Actual" />
                <Bar dataKey="anterior" fill="#3b82f6" name="Período Anterior" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalladas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversaciones</CardTitle>
            <CardDescription>Comparación de conversaciones totales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Actual</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{current.totalThreads}</div>
                  <div className="text-xs text-muted-foreground">
                    {current.openThreads} abiertas, {current.closedThreads} cerradas
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Anterior</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{previous.totalThreads}</div>
                  <div className="text-xs text-muted-foreground">
                    {previous.openThreads} abiertas, {previous.closedThreads} cerradas
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {getChangeIcon(comparisons.totalThreads.changeType)}
                  <span className="font-medium">Cambio</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getChangeColor(comparisons.totalThreads.changeType)}`}>
                    {comparisons.totalThreads.change > 0 ? '+' : ''}{comparisons.totalThreads.change.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getChangeLabel(comparisons.totalThreads.changeType)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mensajes</CardTitle>
            <CardDescription>Comparación de volumen de mensajes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Actual</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{current.totalMessages}</div>
                  <div className="text-xs text-muted-foreground">
                    {current.inboundMessages} entrantes, {current.outboundMessages} salientes
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Anterior</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{previous.totalMessages}</div>
                  <div className="text-xs text-muted-foreground">
                    {previous.inboundMessages} entrantes, {previous.outboundMessages} salientes
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {getChangeIcon(comparisons.totalMessages.changeType)}
                  <span className="font-medium">Cambio</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getChangeColor(comparisons.totalMessages.changeType)}`}>
                    {comparisons.totalMessages.change > 0 ? '+' : ''}{comparisons.totalMessages.change.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getChangeLabel(comparisons.totalMessages.changeType)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tiempo de Respuesta</CardTitle>
            <CardDescription>Comparación de tiempo promedio de respuesta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Actual</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {current.avgResponseTime < 60 
                      ? `${current.avgResponseTime} min`
                      : `${Math.floor(current.avgResponseTime / 60)}h ${current.avgResponseTime % 60}min`
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Anterior</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">
                    {previous.avgResponseTime < 60 
                      ? `${previous.avgResponseTime} min`
                      : `${Math.floor(previous.avgResponseTime / 60)}h ${previous.avgResponseTime % 60}min`
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {getChangeIcon(comparisons.avgResponseTime.changeType)}
                  <span className="font-medium">Cambio</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getChangeColor(comparisons.avgResponseTime.changeType)}`}>
                    {comparisons.avgResponseTime.change > 0 ? '+' : ''}{comparisons.avgResponseTime.change.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getChangeLabel(comparisons.avgResponseTime.changeType)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasa de Cierre</CardTitle>
            <CardDescription>Comparación de porcentaje de conversaciones cerradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Actual</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{current.closeRate.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Período Anterior</span>
                <div className="text-right">
                  <div className="font-semibold text-lg">{previous.closeRate.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  {getChangeIcon(comparisons.closeRate.changeType)}
                  <span className="font-medium">Cambio</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${getChangeColor(comparisons.closeRate.changeType)}`}>
                    {comparisons.closeRate.change > 0 ? '+' : ''}{comparisons.closeRate.change.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getChangeLabel(comparisons.closeRate.changeType)}
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

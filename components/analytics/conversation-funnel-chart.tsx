"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingDown, Clock, Users, CheckCircle2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FunnelStage {
  name: string
  count: number
  percentage: number
  color: string
}

interface ConversationFunnelChartProps {
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
  stages: FunnelStage[]
  title: string
  description: string
}

export function ConversationFunnelChart({
  funnel,
  conversionRates,
  averageTimes,
  losses,
  stages,
  title,
  description,
}: ConversationFunnelChartProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}h ${remainingMinutes}m`
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${Math.round(hours * 10) / 10}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round((hours % 24) * 10) / 10
    return `${days}d ${remainingHours}h`
  }

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return "text-green-600"
    if (rate >= 60) return "text-yellow-600"
    if (rate >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getLossColor = (rate: number) => {
    if (rate <= 10) return "text-green-600"
    if (rate <= 20) return "text-yellow-600"
    if (rate <= 30) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Visual */}
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <span className="font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{stage.count}</Badge>
                  <span className={`text-sm font-medium ${getConversionColor(stage.percentage)}`}>
                    {stage.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={stage.percentage} 
                className="h-2"
              />
              {index < stages.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-0.5 h-4 bg-gray-200"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Métricas de Conversión */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Tasa de Asignación</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {conversionRates.assignmentRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {funnel.assignedThreads} de {funnel.totalThreads} conversaciones
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Tasa de Respuesta</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {conversionRates.responseRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {funnel.threadsWithAgentResponse} de {funnel.totalThreads} conversaciones
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Tasa de Resolución</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {conversionRates.resolutionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {funnel.resolvedThreads} de {funnel.totalThreads} conversaciones
            </div>
          </div>
        </div>

        {/* Tiempos Promedio */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tiempos Promedio
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Hasta Asignación</div>
              <div className="text-lg font-semibold">
                {formatTime(averageTimes.timeToAssignment)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Hasta Primera Respuesta</div>
              <div className="text-lg font-semibold">
                {formatTime(averageTimes.timeToFirstResponse)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Hasta Resolución</div>
              <div className="text-lg font-semibold">
                {formatHours(averageTimes.timeToResolution)}
              </div>
            </div>
          </div>
        </div>

        {/* Análisis de Pérdidas */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Análisis de Pérdidas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Pérdidas en Asignación</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">{losses.lostAtAssignment}</div>
                <span className={`text-sm ${getLossColor(losses.lossRateAtAssignment)}`}>
                  ({losses.lossRateAtAssignment.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Pérdidas en Respuesta</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">{losses.lostAtResponse}</div>
                <span className={`text-sm ${getLossColor(losses.lossRateAtResponse)}`}>
                  ({losses.lossRateAtResponse.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Pérdidas en Resolución</div>
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">{losses.lostAtResolution}</div>
                <span className={`text-sm ${getLossColor(losses.lossRateAtResolution)}`}>
                  ({losses.lossRateAtResolution.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Estado */}
        <div className="space-y-4">
          <h4 className="font-medium">Estado Actual de Conversaciones</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-blue-600">{funnel.openThreads}</div>
              <div className="text-xs text-muted-foreground">Abiertas</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-yellow-600">{funnel.pendingThreads}</div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-green-600">{funnel.closedThreads}</div>
              <div className="text-xs text-muted-foreground">Cerradas</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-2xl font-bold text-gray-600">{funnel.totalThreads}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

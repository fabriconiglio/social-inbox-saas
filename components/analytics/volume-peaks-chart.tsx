"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle, Clock, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PeakData {
  date: string
  hour: number
  volume: number
  intensity: 'low' | 'medium' | 'high'
}

interface PeakPatterns {
  mostFrequentHours: Array<{ hour: number; count: number }>
  mostActiveDays: Array<{ date: string; count: number }>
  totalPeaks: number
}

interface VolumePeaksChartProps {
  peaks: PeakData[]
  patterns: PeakPatterns
  averageVolume: number
  maxVolume: number
  peakThreshold: number
  title?: string
  description?: string
}

export function VolumePeaksChart({ 
  peaks, 
  patterns,
  averageVolume,
  maxVolume,
  peakThreshold,
  title = "Picos de Volumen",
  description = "Análisis de momentos de mayor actividad"
}: VolumePeaksChartProps) {
  
  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'high': return 'Alto'
      case 'medium': return 'Medio'
      case 'low': return 'Bajo'
      default: return 'Desconocido'
    }
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: es })
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Picos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{peaks.length}</div>
              <div className="text-xs text-muted-foreground">Picos Detectados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{averageVolume.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Promedio por Hora</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{maxVolume}</div>
              <div className="text-xs text-muted-foreground">Máximo Volumen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{peakThreshold.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Umbral de Pico</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Picos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Principales Picos de Volumen
          </CardTitle>
          <CardDescription>Los momentos de mayor actividad detectados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {peaks.slice(0, 5).map((peak, index) => (
              <div key={`${peak.date}-${peak.hour}`} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatDate(peak.date)} a las {formatHour(peak.hour)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {peak.volume} mensajes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getIntensityColor(peak.intensity)}>
                    {getIntensityLabel(peak.intensity)}
                  </Badge>
                  <div className="text-right">
                    <div className="font-semibold text-lg">{peak.volume}</div>
                    <div className="text-xs text-muted-foreground">mensajes</div>
                  </div>
                </div>
              </div>
            ))}
            {peaks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se detectaron picos de volumen en el período seleccionado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patrones de Picos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horas Más Activas
            </CardTitle>
            <CardDescription>Horarios con mayor frecuencia de picos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.mostFrequentHours.map((item, index) => (
                <div key={item.hour} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{formatHour(item.hour)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.count / patterns.mostFrequentHours[0]?.count || 1) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
              {patterns.mostFrequentHours.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  No hay datos suficientes para analizar patrones
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Días Más Activos
            </CardTitle>
            <CardDescription>Fechas con mayor número de picos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.mostActiveDays.map((item, index) => (
                <div key={item.date} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{formatDate(item.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.count / patterns.mostActiveDays[0]?.count || 1) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
              {patterns.mostActiveDays.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  No hay datos suficientes para analizar patrones
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

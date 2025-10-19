"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, TrendingUp, BarChart3 } from "lucide-react"

interface HourData {
  hour: number
  inbound: number
  outbound: number
  total: number
}

interface DayData {
  day: string
  dayIndex: number
  hours: HourData[]
}

interface PeakHour {
  hour: number
  total: number
}

interface PeakDay {
  day: number
  total: number
}

interface ScheduleHeatmapChartProps {
  heatmap: DayData[]
  maxActivity: number
  totalMessages: number
  peakHours: PeakHour[]
  peakDays: PeakDay[]
  averagePerHour: number
  title?: string
  description?: string
}

export function ScheduleHeatmapChart({ 
  heatmap,
  maxActivity,
  totalMessages,
  peakHours,
  peakDays,
  averagePerHour,
  title = "Heatmap de Horarios",
  description = "Actividad por día de la semana y hora del día"
}: ScheduleHeatmapChartProps) {
  
  const getIntensityColor = (value: number, max: number) => {
    if (value === 0) return 'bg-gray-100'
    if (value <= max * 0.2) return 'bg-blue-200'
    if (value <= max * 0.4) return 'bg-blue-300'
    if (value <= max * 0.6) return 'bg-blue-400'
    if (value <= max * 0.8) return 'bg-blue-500'
    return 'bg-blue-600'
  }

  const getIntensityTextColor = (value: number, max: number) => {
    if (value === 0) return 'text-gray-500'
    if (value <= max * 0.4) return 'text-gray-700'
    return 'text-white'
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const getDayName = (dayIndex: number) => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return dayNames[dayIndex]
  }

  return (
    <div className="space-y-6">
      {/* Resumen de Actividad */}
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
              <div className="text-2xl font-bold text-green-600">{maxActivity}</div>
              <div className="text-xs text-muted-foreground">Máxima Actividad</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{averagePerHour.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Promedio por Hora</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{peakHours.length}</div>
              <div className="text-xs text-muted-foreground">Horas Pico</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor de Actividad</CardTitle>
          <CardDescription>
            Intensidad de actividad por día de la semana y hora del día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header con horas */}
              <div className="flex mb-2">
                <div className="w-16 flex-shrink-0"></div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="w-6 text-xs text-center text-muted-foreground">
                    {i % 4 === 0 ? i : ''}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="space-y-1">
                {heatmap.map((dayData) => (
                  <div key={dayData.dayIndex} className="flex items-center">
                    <div className="w-16 flex-shrink-0 text-sm font-medium text-right pr-2">
                      {getDayName(dayData.dayIndex)}
                    </div>
                    <div className="flex">
                      {dayData.hours.map((hourData) => (
                        <div
                          key={hourData.hour}
                          className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-sm border border-gray-200 ${getIntensityColor(hourData.total, maxActivity)} ${getIntensityTextColor(hourData.total, maxActivity)}`}
                          title={`${dayData.day} ${formatHour(hourData.hour)}: ${hourData.total} mensajes (${hourData.inbound} entrantes, ${hourData.outbound} salientes)`}
                        >
                          {hourData.total > 0 && hourData.total}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Leyenda */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Menos actividad</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  </div>
                  <span>Más actividad</span>
                </div>
                <div className="text-right">
                  <div>Hover para ver detalles</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Patrones */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horas Más Activas
            </CardTitle>
            <CardDescription>Top 3 horas con mayor actividad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakHours.map((item, index) => (
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
                        style={{ width: `${(item.total / peakHours[0]?.total || 1) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.total}</span>
                  </div>
                </div>
              ))}
              {peakHours.length === 0 && (
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
              <Calendar className="h-5 w-5" />
              Días Más Activos
            </CardTitle>
            <CardDescription>Top 3 días con mayor actividad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {peakDays.map((item, index) => (
                <div key={item.day} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="font-medium">{getDayName(item.day)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.total / peakDays[0]?.total || 1) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.total}</span>
                  </div>
                </div>
              ))}
              {peakDays.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">
                  No hay datos suficientes para analizar patrones
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Adicionales */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Actividad</CardTitle>
          <CardDescription>Análisis detallado de patrones de actividad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {heatmap.reduce((sum, day) => sum + day.hours.reduce((daySum, hour) => daySum + hour.inbound, 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Mensajes Entrantes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {heatmap.reduce((sum, day) => sum + day.hours.reduce((daySum, hour) => daySum + hour.outbound, 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Mensajes Salientes</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-purple-600">
                {Math.round((totalMessages / (7 * 24)) * 100) / 100}
              </div>
              <div className="text-sm text-muted-foreground">Promedio por Celda</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Calendar, CheckCircle, AlertTriangle, Users, Zap } from "lucide-react"
import { format, isWithinInterval, addDays, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"

interface SchedulePreviewProps {
  schedules: Array<{
    day: number
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
  }>
  className?: string
}

const DAYS = [
  { value: 0, label: "Domingo", short: "Dom", isWeekend: true },
  { value: 1, label: "Lunes", short: "Lun", isWeekend: false },
  { value: 2, label: "Martes", short: "Mar", isWeekend: false },
  { value: 3, label: "Miércoles", short: "Mié", isWeekend: false },
  { value: 4, label: "Jueves", short: "Jue", isWeekend: false },
  { value: 5, label: "Viernes", short: "Vie", isWeekend: false },
  { value: 6, label: "Sábado", short: "Sáb", isWeekend: true }
]

export function SchedulePreview({ schedules, className }: SchedulePreviewProps) {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = format(now, "HH:mm")
  
  // Calcular estadísticas
  const enabledDays = schedules.filter(s => s.enabled).length
  const totalWeeklyHours = schedules.reduce((total, schedule) => {
    if (!schedule.enabled) return total
    
    const start = new Date(`2000-01-01T${schedule.startTime}:00`)
    const end = new Date(`2000-01-01T${schedule.endTime}:00`)
    
    if (end <= start) {
      // Horario que cruza medianoche
      const nextDay = new Date(end)
      nextDay.setDate(nextDay.getDate() + 1)
      const diff = nextDay.getTime() - start.getTime()
      return total + (diff / (1000 * 60 * 60))
    }
    
    const diff = end.getTime() - start.getTime()
    return total + (diff / (1000 * 60 * 60))
  }, 0)

  const averageDailyHours = enabledDays > 0 ? totalWeeklyHours / enabledDays : 0

  // Verificar si estamos en horario de atención
  const currentSchedule = schedules.find(s => s.day === currentDay)
  const isCurrentlyOpen = currentSchedule?.enabled && 
    currentSchedule.startTime <= currentTime && 
    currentSchedule.endTime >= currentTime

  // Calcular próximos horarios de atención
  const getNextOpenTime = () => {
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7
      const schedule = schedules.find(s => s.day === checkDay)
      if (schedule?.enabled) {
        const nextDate = addDays(now, i)
        return {
          day: DAYS[checkDay].label,
          time: schedule.startTime,
          date: format(nextDate, "dd/MM/yyyy")
        }
      }
    }
    return null
  }

  const nextOpenTime = getNextOpenTime()

  // Generar vista semanal
  const generateWeeklyView = () => {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Lunes
    const weekDays = []
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      const dayOfWeek = day.getDay()
      const schedule = schedules.find(s => s.day === dayOfWeek)
      
      weekDays.push({
        date: day,
        dayOfWeek,
        schedule,
        isToday: day.toDateString() === now.toDateString()
      })
    }
    
    return weekDays
  }

  const weeklyView = generateWeeklyView()

  const getStatusColor = (schedule: any, isToday: boolean) => {
    if (!schedule?.enabled) return "bg-gray-100 text-gray-600"
    if (isToday && isCurrentlyOpen) return "bg-green-100 text-green-800"
    if (isToday && !isCurrentlyOpen) return "bg-red-100 text-red-800"
    return "bg-blue-100 text-blue-800"
  }

  const getStatusLabel = (schedule: any, isToday: boolean) => {
    if (!schedule?.enabled) return "Cerrado"
    if (isToday && isCurrentlyOpen) return "Abierto ahora"
    if (isToday && !isCurrentlyOpen) return "Cerrado hoy"
    return "Programado"
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    
    if (hour === 0 && minute === 0) return "00:00"
    if (hour === 23 && minute === 59) return "24:00"
    
    return time
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Preview de Horarios
          </CardTitle>
          <CardDescription>
            Cómo se verán los horarios de atención configurados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estado Actual */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Estado Actual</span>
                </div>
                <div className="text-2xl font-bold mt-1">
                  {isCurrentlyOpen ? "Abierto" : "Cerrado"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(now, "EEEE, dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
              <div className="text-right">
                <Badge className={isCurrentlyOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {isCurrentlyOpen ? "En horario" : "Fuera de horario"}
                </Badge>
                {nextOpenTime && !isCurrentlyOpen && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Próximo: {nextOpenTime.day} {nextOpenTime.time}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vista Semanal */}
          <div>
            <h4 className="font-medium mb-3">Vista Semanal</h4>
            <div className="grid grid-cols-7 gap-2">
              {weeklyView.map((day, index) => {
                const dayInfo = DAYS[day.dayOfWeek]
                const statusColor = getStatusColor(day.schedule, day.isToday)
                const statusLabel = getStatusLabel(day.schedule, day.isToday)
                
                return (
                  <div key={index} className="text-center p-3 border rounded-lg">
                    <div className="text-sm font-medium">{dayInfo.short}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(day.date, "dd/MM")}
                    </div>
                    <div className="mt-2">
                      <Badge className={`text-xs ${statusColor}`}>
                        {statusLabel}
                      </Badge>
                    </div>
                    {day.schedule?.enabled && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatTime(day.schedule.startTime)} - {formatTime(day.schedule.endTime)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{enabledDays}</div>
              <div className="text-sm text-muted-foreground">Días habilitados</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalWeeklyHours.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Total semanal</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{averageDailyHours.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Promedio diario</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {((enabledDays / 7) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Cobertura</div>
            </div>
          </div>

          {/* Configuración por Día */}
          <div>
            <h4 className="font-medium mb-3">Configuración Detallada</h4>
            <div className="space-y-2">
              {schedules.map((schedule) => {
                const dayInfo = DAYS[schedule.day]
                const isToday = schedule.day === currentDay
                const isOpen = isToday && schedule.enabled && 
                  schedule.startTime <= currentTime && 
                  schedule.endTime >= currentTime
                
                return (
                  <div key={schedule.day} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{dayInfo.short}</span>
                      </div>
                      <div>
                        <div className="font-medium">{dayInfo.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.enabled 
                            ? `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
                            : "Cerrado"
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <Badge variant={isOpen ? "default" : "secondary"}>
                          {isOpen ? "Hoy - Abierto" : "Hoy - Cerrado"}
                        </Badge>
                      )}
                      <Badge variant={schedule.enabled ? "default" : "outline"}>
                        {schedule.enabled ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recomendaciones */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Recomendaciones</div>
                <div className="text-sm">
                  {enabledDays === 0 && "⚠️ No hay días habilitados - el SLA no se aplicará"}
                  {enabledDays > 0 && enabledDays < 5 && "💡 Considera habilitar más días para mejor cobertura"}
                  {enabledDays >= 5 && totalWeeklyHours < 40 && "✅ Buena configuración para horarios estándar"}
                  {totalWeeklyHours >= 40 && "🔥 Configuración intensiva - asegúrate de tener suficiente personal"}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

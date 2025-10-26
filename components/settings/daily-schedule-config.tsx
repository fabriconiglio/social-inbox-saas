"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Calendar, AlertTriangle, CheckCircle, Copy, Trash2, Plus, Zap } from "lucide-react"

interface DailySchedule {
  day: number // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  enabled: boolean
  startTime: string
  endTime: string
  timezone: string
  isHoliday?: boolean
  specialHours?: boolean
}

interface DailyScheduleConfigProps {
  schedules: DailySchedule[]
  onChange: (schedules: DailySchedule[]) => void
  timezone?: string
  className?: string
  show24x7Toggle?: boolean
  on24x7Toggle?: (enabled: boolean) => void
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

const PRESET_SCHEDULES = {
  "business": {
    name: "Horario Comercial",
    description: "Lunes a Viernes, 9:00 - 18:00",
    schedules: DAYS.map(day => ({
      day: day.value,
      enabled: !day.isWeekend,
      startTime: "09:00",
      endTime: "18:00",
      timezone: "America/Argentina/Cordoba"
    }))
  },
  "extended": {
    name: "Horario Extendido",
    description: "Lunes a Sábado, 8:00 - 20:00",
    schedules: DAYS.map(day => ({
      day: day.value,
      enabled: day.value !== 0, // Todos excepto domingo
      startTime: "08:00",
      endTime: "20:00",
      timezone: "America/Argentina/Cordoba"
    }))
  },
  "24x7": {
    name: "24/7",
    description: "Todos los días, 24 horas",
    schedules: DAYS.map(day => ({
      day: day.value,
      enabled: true,
      startTime: "00:00",
      endTime: "23:59",
      timezone: "America/Argentina/Cordoba"
    }))
  },
  "weekend": {
    name: "Solo Fines de Semana",
    description: "Sábado y Domingo, 10:00 - 16:00",
    schedules: DAYS.map(day => ({
      day: day.value,
      enabled: day.isWeekend,
      startTime: "10:00",
      endTime: "16:00",
      timezone: "America/Argentina/Cordoba"
    }))
  }
}

export function DailyScheduleConfig({
  schedules,
  onChange,
  timezone = "America/Argentina/Cordoba",
  className,
  show24x7Toggle = true,
  on24x7Toggle
}: DailyScheduleConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [is24x7Mode, setIs24x7Mode] = useState(false)
  const [previousSchedules, setPreviousSchedules] = useState<DailySchedule[]>([])

  // Inicializar horarios si no existen
  useEffect(() => {
    if (schedules.length === 0) {
      const defaultSchedules = DAYS.map(day => ({
        day: day.value,
        enabled: !day.isWeekend,
        startTime: "09:00",
        endTime: "18:00",
        timezone
      }))
      onChange(defaultSchedules)
    }
  }, [schedules.length, onChange, timezone])

  // Detectar modo 24/7
  useEffect(() => {
    const is24x7 = schedules.every(schedule => 
      schedule.enabled && 
      schedule.startTime === "00:00" && 
      schedule.endTime === "23:59"
    )
    setIs24x7Mode(is24x7)
  }, [schedules])

  // Manejar toggle 24/7
  const handle24x7Toggle = (enabled: boolean) => {
    if (enabled) {
      // Guardar estado anterior
      setPreviousSchedules([...schedules])
      
      // Aplicar 24/7 a todos los días
      const newSchedules = DAYS.map(day => ({
        day: day.value,
        enabled: true,
        startTime: "00:00",
        endTime: "23:59",
        timezone
      }))
      onChange(newSchedules)
    } else {
      // Restaurar estado anterior si existe
      if (previousSchedules.length > 0) {
        onChange(previousSchedules)
      } else {
        // Restaurar a horario comercial por defecto
        const defaultSchedules = DAYS.map(day => ({
          day: day.value,
          enabled: !day.isWeekend,
          startTime: "09:00",
          endTime: "18:00",
          timezone
        }))
        onChange(defaultSchedules)
      }
    }
    
    if (on24x7Toggle) {
      on24x7Toggle(enabled)
    }
  }

  // Validar horarios
  useEffect(() => {
    const newWarnings: string[] = []
    
    schedules.forEach(schedule => {
      if (schedule.enabled) {
        if (schedule.startTime >= schedule.endTime) {
          newWarnings.push(`${DAYS[schedule.day].label}: La hora de inicio debe ser anterior a la hora de fin`)
        }
        
        if (schedule.startTime === "00:00" && schedule.endTime === "23:59") {
          newWarnings.push(`${DAYS[schedule.day].label}: Considera usar horario 24/7 para días completos`)
        }
      }
    })

    // Verificar si hay días sin horario
    const enabledDays = schedules.filter(s => s.enabled).length
    if (enabledDays === 0) {
      newWarnings.push("No hay días habilitados - el SLA no se aplicará")
    }

    setWarnings(newWarnings)
  }, [schedules])

  const handleDayToggle = (day: number, enabled: boolean) => {
    const newSchedules = schedules.map(schedule => 
      schedule.day === day 
        ? { ...schedule, enabled }
        : schedule
    )
    onChange(newSchedules)
  }

  const handleTimeChange = (day: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedules = schedules.map(schedule => 
      schedule.day === day 
        ? { ...schedule, [field]: value }
        : schedule
    )
    onChange(newSchedules)
  }

  const handlePresetApply = (presetKey: string) => {
    const preset = PRESET_SCHEDULES[presetKey as keyof typeof PRESET_SCHEDULES]
    if (preset) {
      onChange(preset.schedules)
      setSelectedPreset(presetKey)
    }
  }

  const handleCopyDay = (sourceDay: number) => {
    const sourceSchedule = schedules.find(s => s.day === sourceDay)
    if (sourceSchedule) {
      const newSchedules = schedules.map(schedule => 
        schedule.day !== sourceDay && schedule.enabled
          ? {
              ...schedule,
              startTime: sourceSchedule.startTime,
              endTime: sourceSchedule.endTime
            }
          : schedule
      )
      onChange(newSchedules)
    }
  }

  const handleClearDay = (day: number) => {
    const newSchedules = schedules.map(schedule => 
      schedule.day === day 
        ? { ...schedule, enabled: false, startTime: "09:00", endTime: "18:00" }
        : schedule
    )
    onChange(newSchedules)
  }

  const getDayStatus = (schedule: DailySchedule) => {
    if (!schedule.enabled) return "disabled"
    if (schedule.startTime === "00:00" && schedule.endTime === "23:59") return "24x7"
    if (schedule.startTime === "00:00" && schedule.endTime === "23:59") return "full"
    return "custom"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disabled": return "bg-gray-100 text-gray-600 border-gray-200"
      case "24x7": return "bg-green-100 text-green-800 border-green-200"
      case "full": return "bg-blue-100 text-blue-800 border-blue-200"
      case "custom": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "disabled": return "Deshabilitado"
      case "24x7": return "24/7"
      case "full": return "Día Completo"
      case "custom": return "Personalizado"
      default: return "Deshabilitado"
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const minute = parseInt(minutes)
    
    if (hour === 0 && minute === 0) return "00:00"
    if (hour === 23 && minute === 59) return "24:00"
    
    return time
  }

  const getTotalHours = (schedule: DailySchedule) => {
    if (!schedule.enabled) return 0
    
    const start = new Date(`2000-01-01T${schedule.startTime}:00`)
    const end = new Date(`2000-01-01T${schedule.endTime}:00`)
    
    if (end <= start) {
      // Horario que cruza medianoche
      const nextDay = new Date(end)
      nextDay.setDate(nextDay.getDate() + 1)
      const diff = nextDay.getTime() - start.getTime()
      return diff / (1000 * 60 * 60)
    }
    
    const diff = end.getTime() - start.getTime()
    return diff / (1000 * 60 * 60)
  }

  const getWeeklyTotal = () => {
    return schedules.reduce((total, schedule) => total + getTotalHours(schedule), 0)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horarios de Atención por Día
          </CardTitle>
          <CardDescription>
            Configura horarios específicos para cada día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presets */}
          <div>
            <Label className="text-sm font-medium">Configuraciones Predefinidas</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {Object.entries(PRESET_SCHEDULES).map(([key, preset]) => (
                <Button
                  key={key}
                  variant={selectedPreset === key ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => handlePresetApply(key)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium text-sm">{preset.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-left">
                    {preset.description}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Toggle 24/7 */}
          {show24x7Toggle && (
            <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    id="24x7Toggle"
                    checked={is24x7Mode}
                    onCheckedChange={handle24x7Toggle}
                    className="data-[state=checked]:bg-green-600"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Modo 24/7</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {is24x7Mode 
                        ? "Atención continua las 24 horas, todos los días"
                        : "Horarios específicos por día"
                      }
                    </div>
                  </div>
                </div>
                
                <Badge className={is24x7Mode ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                  {is24x7Mode ? "24/7 Activo" : "Horarios Específicos"}
                </Badge>
              </div>
              
              {is24x7Mode && (
                <div className="mt-3 p-3 bg-green-100 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Todos los días configurados para 24/7
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Configuración por Día */}
          <div className={`space-y-4 ${is24x7Mode ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Configuración por Día
                {is24x7Mode && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Deshabilitado en modo 24/7)
                  </span>
                )}
              </Label>
              <div className="text-sm text-muted-foreground">
                Total semanal: {getWeeklyTotal().toFixed(1)}h
              </div>
            </div>

            {schedules.map((schedule) => {
              const dayInfo = DAYS[schedule.day]
              const status = getDayStatus(schedule)
              const totalHours = getTotalHours(schedule)

              return (
                <div key={schedule.day} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => handleDayToggle(schedule.day, checked)}
                      />
                      <div>
                        <div className="font-medium">{dayInfo.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {dayInfo.isWeekend ? "Fin de semana" : "Día laborable"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(status)}>
                        {getStatusLabel(status)}
                      </Badge>
                      {schedule.enabled && (
                        <span className="text-sm text-muted-foreground">
                          {totalHours.toFixed(1)}h
                        </span>
                      )}
                    </div>
                  </div>

                  {schedule.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`start-${schedule.day}`}>Hora de inicio</Label>
                        <Input
                          id={`start-${schedule.day}`}
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => handleTimeChange(schedule.day, 'startTime', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`end-${schedule.day}`}>Hora de fin</Label>
                        <Input
                          id={`end-${schedule.day}`}
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => handleTimeChange(schedule.day, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {schedule.enabled && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyDay(schedule.day)}
                        disabled={!schedule.enabled}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar a otros días
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearDay(schedule.day)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Limpiar
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-sm">{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Resumen */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Resumen Semanal</span>
              <span className="text-2xl font-bold">{getWeeklyTotal().toFixed(1)}h</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Días habilitados:</span>
                <span className="ml-2 font-medium">
                  {schedules.filter(s => s.enabled).length}/7
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Promedio diario:</span>
                <span className="ml-2 font-medium">
                  {(getWeeklyTotal() / 7).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          {!is24x7Mode && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const newSchedules = schedules.map(schedule => {
                    const dayInfo = DAYS[schedule.day]
                    return {
                      ...schedule,
                      enabled: !dayInfo.isWeekend,
                      startTime: "09:00",
                      endTime: "18:00"
                    }
                  })
                  onChange(newSchedules)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Solo días laborables
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newSchedules = schedules.map(schedule => ({
                    ...schedule,
                    enabled: true,
                    startTime: "00:00",
                    endTime: "23:59"
                  }))
                  onChange(newSchedules)
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Habilitar 24/7
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newSchedules = schedules.map(schedule => ({
                    ...schedule,
                    enabled: false
                  }))
                  onChange(newSchedules)
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deshabilitar todo
              </Button>
            </div>
          )}

          {/* Acciones para Modo 24/7 */}
          {is24x7Mode && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handle24x7Toggle(false)}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Volver a Horarios Específicos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Calendar, AlertTriangle, CheckCircle, Zap, Users, MessageSquare, Timer, Target, ArrowRight } from "lucide-react"
import { format, addMinutes, addHours, isWithinInterval, startOfDay, endOfDay, differenceInMinutes, differenceInHours } from "date-fns"
import { es } from "date-fns/locale"

interface SLATimelineProps {
  responseTimeMinutes: number
  resolutionTimeHours: number
  businessHours?: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
    workingDays: number[]
  }
  priority: string
  className?: string
}

interface TimelineEvent {
  id: string
  title: string
  description: string
  time: Date
  status: "completed" | "pending" | "overdue"
  icon: React.ReactNode
  color: string
}

export function SLATimeline({
  responseTimeMinutes,
  resolutionTimeHours,
  businessHours,
  priority,
  className
}: SLATimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [simulatedTime, setSimulatedTime] = useState(new Date())

  // Actualizar tiempo cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Verificar si estamos en horario de atención
  const isCurrentlyOpen = () => {
    if (!businessHours?.enabled) return true
    
    const currentDay = currentTime.getDay()
    const currentTimeStr = format(currentTime, "HH:mm")
    
    return businessHours.workingDays.includes(currentDay) &&
           currentTimeStr >= businessHours.startTime &&
           currentTimeStr <= businessHours.endTime
  }

  // Calcular tiempos de respuesta considerando horarios
  const calculateResponseTime = () => {
    if (!businessHours?.enabled) {
      return responseTimeMinutes
    }

    if (isCurrentlyOpen()) {
      return responseTimeMinutes
    }

    // Si está fuera de horario, calcular hasta el próximo horario de atención
    const nextOpenTime = getNextOpenTime()
    if (nextOpenTime) {
      const now = new Date()
      const nextOpen = new Date(nextOpenTime)
      const diffMinutes = Math.floor((nextOpen.getTime() - now.getTime()) / (1000 * 60))
      return responseTimeMinutes + diffMinutes
    }

    return responseTimeMinutes
  }

  const getNextOpenTime = () => {
    if (!businessHours?.enabled) return null

    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentTime.getDay() + i) % 7
      if (businessHours.workingDays.includes(checkDay)) {
        const nextDate = new Date(currentTime)
        nextDate.setDate(nextDate.getDate() + i)
        nextDate.setHours(parseInt(businessHours.startTime.split(':')[0]))
        nextDate.setMinutes(parseInt(businessHours.startTime.split(':')[1]))
        return nextDate
      }
    }
    return null
  }

  // Generar eventos del timeline
  const generateTimelineEvents = (): TimelineEvent[] => {
    const events: TimelineEvent[] = []
    const messageTime = simulatedTime
    const responseTime = addMinutes(messageTime, calculateResponseTime())
    const resolutionTime = addHours(messageTime, resolutionTimeHours)

    // Evento 1: Mensaje recibido
    events.push({
      id: "message",
      title: "Mensaje Recibido",
      description: "Cliente envía mensaje",
      time: messageTime,
      status: "completed",
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-600"
    })

    // Evento 2: Primera respuesta
    events.push({
      id: "response",
      title: "Primera Respuesta",
      description: `Tiempo máximo: ${formatTime(calculateResponseTime())}`,
      time: responseTime,
      status: currentTime >= responseTime ? "overdue" : "pending",
      icon: <Timer className="h-4 w-4" />,
      color: currentTime >= responseTime ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
    })

    // Evento 3: Resolución completa
    events.push({
      id: "resolution",
      title: "Resolución Completa",
      description: `Tiempo máximo: ${formatHours(resolutionTimeHours)}`,
      time: resolutionTime,
      status: currentTime >= resolutionTime ? "overdue" : "pending",
      icon: <CheckCircle className="h-4 w-4" />,
      color: currentTime >= resolutionTime ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
    })

    return events
  }

  const events = generateTimelineEvents()

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "overdue": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completado"
      case "pending": return "Pendiente"
      case "overdue": return "Vencido"
      default: return "Desconocido"
    }
  }

  const simulateTime = (hours: number) => {
    const newTime = new Date(simulatedTime)
    newTime.setHours(newTime.getHours() + hours)
    setSimulatedTime(newTime)
  }

  const resetTime = () => {
    setSimulatedTime(new Date())
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline del SLA
          </CardTitle>
          <CardDescription>
            Visualización temporal de cómo se comporta el SLA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles de Simulación */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium">Simulación de Tiempo</div>
                <div className="text-sm text-muted-foreground">
                  Tiempo simulado: {format(simulatedTime, "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateTime(-1)}
                >
                  -1h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateTime(1)}
                >
                  +1h
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => simulateTime(24)}
                >
                  +1d
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetTime}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline Visual */}
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.color}`}>
                    {event.icon}
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{event.title}</span>
                    <Badge className={getStatusColor(event.status)}>
                      {getStatusLabel(event.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {event.description}
                  </div>
                  <div className="text-sm">
                    <strong>Tiempo:</strong> {format(event.time, "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                  
                  {event.status === "pending" && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Tiempo restante: {formatTime(differenceInMinutes(event.time, currentTime))}
                      </div>
                      <Progress 
                        value={Math.max(0, 100 - (differenceInMinutes(currentTime, simulatedTime) / differenceInMinutes(event.time, simulatedTime)) * 100)}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de Tiempos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(calculateResponseTime())}
              </div>
              <div className="text-sm text-muted-foreground">Primera Respuesta</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(addMinutes(simulatedTime, calculateResponseTime()), "HH:mm")}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatHours(resolutionTimeHours)}
              </div>
              <div className="text-sm text-muted-foreground">Resolución</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(addHours(simulatedTime, resolutionTimeHours), "dd/MM HH:mm")}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {isCurrentlyOpen() ? "Abierto" : "Cerrado"}
              </div>
              <div className="text-sm text-muted-foreground">Estado</div>
              <div className="text-xs text-muted-foreground mt-1">
                {businessHours?.enabled ? "Horarios específicos" : "24/7"}
              </div>
            </div>
          </div>

          {/* Alertas y Recomendaciones */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Análisis del Timeline</div>
                <div className="text-sm space-y-1">
                  {events.some(e => e.status === "overdue") && (
                    <div>⚠️ Algunos eventos han vencido - revisa la configuración</div>
                  )}
                  {!isCurrentlyOpen() && businessHours?.enabled && (
                    <div>ℹ️ Fuera de horario - los tiempos se extienden hasta el próximo día laborable</div>
                  )}
                  {calculateResponseTime() > responseTimeMinutes && (
                    <div>⏰ Tiempo de respuesta extendido debido a horarios de atención</div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

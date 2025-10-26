"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Calendar, AlertTriangle, CheckCircle, Zap, Users, MessageSquare, Timer, Target } from "lucide-react"
import { format, addMinutes, addHours, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"

interface SLAImpactPreviewProps {
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

interface SLAExample {
  id: string
  title: string
  description: string
  scenario: string
  expectedResponse: string
  expectedResolution: string
  status: "success" | "warning" | "error"
  impact: string
}

const PRIORITY_COLORS = {
  LOW: "bg-blue-100 text-blue-800",
  MEDIUM: "bg-yellow-100 text-yellow-800", 
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800"
}

const PRIORITY_LABELS = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta", 
  URGENT: "Urgente"
}

export function SLAImpactPreview({
  responseTimeMinutes,
  resolutionTimeHours,
  businessHours,
  priority,
  className
}: SLAImpactPreviewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

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

  // Generar ejemplos de SLA
  const generateSLAExamples = (): SLAExample[] => {
    const examples: SLAExample[] = []
    const isOpen = isCurrentlyOpen()
    const actualResponseTime = calculateResponseTime()

    // Ejemplo 1: Mensaje recibido ahora
    examples.push({
      id: "now",
      title: "Mensaje Recibido Ahora",
      description: "Un cliente envía un mensaje en este momento",
      scenario: `Cliente envía mensaje a las ${format(currentTime, "HH:mm")}`,
      expectedResponse: format(addMinutes(currentTime, actualResponseTime), "dd/MM HH:mm"),
      expectedResolution: format(addHours(currentTime, resolutionTimeHours), "dd/MM HH:mm"),
      status: isOpen ? "success" : "warning",
      impact: isOpen 
        ? `Respuesta esperada en ${actualResponseTime} minutos`
        : `Respuesta esperada mañana a las ${format(getNextOpenTime() || new Date(), "HH:mm")}`
    })

    // Ejemplo 2: Mensaje en horario pico
    const peakTime = new Date(currentTime)
    peakTime.setHours(14, 0, 0, 0) // 2 PM
    examples.push({
      id: "peak",
      title: "Horario Pico (2 PM)",
      description: "Mensaje recibido durante horario de mayor actividad",
      scenario: `Cliente envía mensaje a las 14:00`,
      expectedResponse: format(addMinutes(peakTime, responseTimeMinutes), "dd/MM HH:mm"),
      expectedResolution: format(addHours(peakTime, resolutionTimeHours), "dd/MM HH:mm"),
      status: "success",
      impact: `Respuesta rápida en ${responseTimeMinutes} minutos`
    })

    // Ejemplo 3: Mensaje fuera de horario
    const afterHours = new Date(currentTime)
    afterHours.setHours(22, 0, 0, 0) // 10 PM
    examples.push({
      id: "afterhours",
      title: "Fuera de Horario (10 PM)",
      description: "Mensaje recibido fuera del horario de atención",
      scenario: `Cliente envía mensaje a las 22:00`,
      expectedResponse: format(getNextOpenTime() || new Date(), "dd/MM HH:mm"),
      expectedResolution: format(addHours(getNextOpenTime() || new Date(), resolutionTimeHours), "dd/MM HH:mm"),
      status: "warning",
      impact: `Respuesta al siguiente día laborable`
    })

    // Ejemplo 4: Mensaje urgente
    examples.push({
      id: "urgent",
      title: "Mensaje Urgente",
      description: "Situación crítica que requiere atención inmediata",
      scenario: `Cliente reporta problema crítico`,
      expectedResponse: format(addMinutes(currentTime, Math.max(5, responseTimeMinutes / 2)), "dd/MM HH:mm"),
      expectedResolution: format(addHours(currentTime, Math.max(1, resolutionTimeHours / 2)), "dd/MM HH:mm"),
      status: "error",
      impact: `Prioridad alta - respuesta acelerada`
    })

    return examples
  }

  const examples = generateSLAExamples()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800"
      case "warning": return "bg-yellow-100 text-yellow-800"
      case "error": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4" />
      case "warning": return <AlertTriangle className="h-4 w-4" />
      case "error": return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

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

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Impacto del SLA
          </CardTitle>
          <CardDescription>
            Cómo afectan los horarios y configuraciones al comportamiento del SLA
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
                  {isCurrentlyOpen() ? "En Horario" : "Fuera de Horario"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(currentTime, "EEEE, dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
              <div className="text-right">
                <Badge className={isCurrentlyOpen() ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {isCurrentlyOpen() ? "Abierto" : "Cerrado"}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  Tiempo de respuesta: {formatTime(calculateResponseTime())}
                </div>
              </div>
            </div>
          </div>

          {/* Configuración del SLA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(responseTimeMinutes)}
              </div>
              <div className="text-sm text-muted-foreground">Primera Respuesta</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatHours(resolutionTimeHours)}
              </div>
              <div className="text-sm text-muted-foreground">Resolución</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Badge className={PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]}>
                {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Prioridad</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {businessHours?.enabled ? "Específico" : "24/7"}
              </div>
              <div className="text-sm text-muted-foreground">Horarios</div>
            </div>
          </div>

          {/* Ejemplos de Escenarios */}
          <div>
            <h4 className="font-medium mb-3">Escenarios de Ejemplo</h4>
            <div className="space-y-3">
              {examples.map((example) => (
                <div key={example.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(example.status)}
                        <span className="font-medium">{example.title}</span>
                        <Badge className={getStatusColor(example.status)}>
                          {example.status === "success" ? "Normal" : 
                           example.status === "warning" ? "Retrasado" : "Urgente"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {example.description}
                      </div>
                      <div className="text-sm">
                        <strong>Escenario:</strong> {example.scenario}
                      </div>
                      <div className="text-sm">
                        <strong>Respuesta esperada:</strong> {example.expectedResponse}
                      </div>
                      <div className="text-sm">
                        <strong>Resolución esperada:</strong> {example.expectedResolution}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-muted/50 rounded">
                    <div className="text-sm font-medium text-blue-600">
                      💡 {example.impact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Visual */}
          <div>
            <h4 className="font-medium mb-3">Timeline de Respuesta</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Mensaje Recibido</div>
                  <div className="text-sm text-muted-foreground">Cliente envía mensaje</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(currentTime, "HH:mm")}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Timer className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Primera Respuesta</div>
                  <div className="text-sm text-muted-foreground">
                    Tiempo máximo: {formatTime(calculateResponseTime())}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(addMinutes(currentTime, calculateResponseTime()), "HH:mm")}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Resolución Completa</div>
                  <div className="text-sm text-muted-foreground">
                    Tiempo máximo: {formatHours(resolutionTimeHours)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(addHours(currentTime, resolutionTimeHours), "dd/MM HH:mm")}
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Recomendaciones</div>
                <div className="text-sm space-y-1">
                  {!businessHours?.enabled && (
                    <div>• Considera habilitar horarios específicos para mejor control</div>
                  )}
                  {businessHours?.enabled && !isCurrentlyOpen() && (
                    <div>• Los mensajes fuera de horario tendrán respuesta al siguiente día laborable</div>
                  )}
                  {priority === "URGENT" && (
                    <div>• Los mensajes urgentes deberían tener tiempos de respuesta más cortos</div>
                  )}
                  {responseTimeMinutes > 60 && (
                    <div>• Tiempo de respuesta alto - considera reducirlo para mejor experiencia</div>
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

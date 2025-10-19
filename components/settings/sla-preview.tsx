"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, CheckCircle, Users, MessageSquare, TrendingUp } from "lucide-react"
import { format, addMinutes, addHours, isWithinInterval, isWeekend } from "date-fns"
import { es } from "date-fns/locale"

interface SLAPreviewProps {
  responseTimeMinutes: number
  resolutionTimeHours: number
  businessHours?: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
    workingDays: number[]
  }
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  className?: string
}

export function SLAPreview({
  responseTimeMinutes,
  resolutionTimeHours,
  businessHours,
  priority,
  className
}: SLAPreviewProps) {
  const now = new Date()
  
  // Calcular tiempos de vencimiento
  const responseDeadline = businessHours?.enabled 
    ? calculateBusinessDeadline(now, responseTimeMinutes, businessHours)
    : addMinutes(now, responseTimeMinutes)
  
  const resolutionDeadline = businessHours?.enabled
    ? calculateBusinessDeadline(now, resolutionTimeHours * 60, businessHours)
    : addHours(now, resolutionTimeHours)

  // Calcular progreso simulado
  const responseProgress = Math.min(85, (responseTimeMinutes * 0.6) / responseTimeMinutes * 100)
  const resolutionProgress = Math.min(70, (resolutionTimeHours * 0.4) / resolutionTimeHours * 100)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW": return "bg-gray-100 text-gray-800 border-gray-200"
      case "MEDIUM": return "bg-blue-100 text-blue-800 border-blue-200"
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200"
      case "URGENT": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "LOW": return "Baja"
      case "MEDIUM": return "Media"
      case "HIGH": return "Alta"
      case "URGENT": return "Urgente"
      default: return "Media"
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}min`
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) {
      return `${days}d`
    }
    return `${days}d ${remainingHours}h`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Preview del SLA
          </CardTitle>
          <CardDescription>
            Cómo se verá este SLA en acción
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(responseTimeMinutes)}
              </div>
              <div className="text-sm text-muted-foreground">Primera Respuesta</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatHours(resolutionTimeHours)}
              </div>
              <div className="text-sm text-muted-foreground">Resolución</div>
            </div>
          </div>

          {/* Prioridad */}
          <div className="flex items-center justify-center">
            <Badge className={getPriorityColor(priority)}>
              Prioridad: {getPriorityLabel(priority)}
            </Badge>
          </div>

          {/* Horarios de Negocio */}
          {businessHours?.enabled && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Horarios de Negocio Activos</div>
                  <div className="text-sm">
                    {businessHours.startTime} - {businessHours.endTime} 
                    {businessHours.workingDays.length < 7 && (
                      <span> (Solo días laborables)</span>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Simulación de Conversación */}
          <div className="space-y-4">
            <h4 className="font-medium">Simulación de Conversación</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Nueva conversación recibida</div>
                  <div className="text-sm text-muted-foreground">
                    {format(now, "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                </div>
                <Badge variant="outline">Nuevo</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progreso hacia primera respuesta</span>
                  <span>{responseProgress.toFixed(0)}%</span>
                </div>
                <Progress value={responseProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Vence: {format(responseDeadline, "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progreso hacia resolución</span>
                  <span>{resolutionProgress.toFixed(0)}%</span>
                </div>
                <Progress value={resolutionProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Vence: {format(resolutionDeadline, "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
            </div>
          </div>

          {/* Alertas y Notificaciones */}
          <div className="space-y-3">
            <h4 className="font-medium">Alertas Configuradas</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>Alerta cuando falten {formatTime(Math.max(5, responseTimeMinutes * 0.2))} para primera respuesta</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Alerta cuando se exceda el tiempo de primera respuesta</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Alerta cuando se exceda el tiempo de resolución</span>
              </div>
            </div>
          </div>

          {/* Impacto en Métricas */}
          <div className="space-y-3">
            <h4 className="font-medium">Impacto en Métricas</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>SLA cumplido: ~85%</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Agentes notificados</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span>Métricas actualizadas</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Tiempo promedio: {formatTime(responseTimeMinutes * 0.7)}</span>
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Recomendaciones</div>
                <div className="text-sm">
                  {responseTimeMinutes <= 15 && "Tiempo muy agresivo - asegúrate de tener suficiente personal"}
                  {responseTimeMinutes > 15 && responseTimeMinutes <= 60 && "Tiempo equilibrado para la mayoría de casos"}
                  {responseTimeMinutes > 60 && "Considera tiempos más cortos para mejorar la satisfacción"}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Calcula el deadline considerando horarios de negocio
 */
function calculateBusinessDeadline(
  startTime: Date, 
  totalMinutes: number, 
  businessHours: {
    startTime: string
    endTime: string
    workingDays: number[]
  }
): Date {
  let currentTime = new Date(startTime)
  let remainingMinutes = totalMinutes
  
  while (remainingMinutes > 0) {
    const currentDay = currentTime.getDay()
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinute
    
    // Verificar si es día laborable
    if (!businessHours.workingDays.includes(currentDay)) {
      // Saltar al siguiente día laborable
      currentTime = new Date(currentTime)
      currentTime.setDate(currentTime.getDate() + 1)
      currentTime.setHours(parseInt(businessHours.startTime.split(':')[0]), parseInt(businessHours.startTime.split(':')[1]), 0, 0)
      continue
    }
    
    const [startHour, startMinute] = businessHours.startTime.split(':').map(Number)
    const [endHour, endMinute] = businessHours.endTime.split(':').map(Number)
    const businessStartMinutes = startHour * 60 + startMinute
    const businessEndMinutes = endHour * 60 + endMinute
    
    // Si estamos fuera del horario de negocio, saltar al siguiente
    if (currentTimeMinutes < businessStartMinutes) {
      currentTime.setHours(startHour, startMinute, 0, 0)
      continue
    }
    
    if (currentTimeMinutes >= businessEndMinutes) {
      // Saltar al siguiente día
      currentTime = new Date(currentTime)
      currentTime.setDate(currentTime.getDate() + 1)
      currentTime.setHours(startHour, startMinute, 0, 0)
      continue
    }
    
    // Calcular minutos disponibles en el día actual
    const availableMinutes = businessEndMinutes - currentTimeMinutes
    
    if (remainingMinutes <= availableMinutes) {
      // Podemos completar el tiempo en este día
      currentTime = new Date(currentTime.getTime() + remainingMinutes * 60000)
      remainingMinutes = 0
    } else {
      // Usar todos los minutos disponibles y continuar al siguiente día
      remainingMinutes -= availableMinutes
      currentTime = new Date(currentTime)
      currentTime.setDate(currentTime.getDate() + 1)
      currentTime.setHours(startHour, startMinute, 0, 0)
    }
  }
  
  return currentTime
}

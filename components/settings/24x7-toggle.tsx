"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Zap, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface Schedule24x7ToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onApply24x7: () => void
  onRevert: () => void
  className?: string
}

export function Schedule24x7Toggle({
  enabled,
  onToggle,
  onApply24x7,
  onRevert,
  className
}: Schedule24x7ToggleProps) {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [previousState, setPreviousState] = useState(enabled)

  // Guardar estado anterior cuando se activa
  useEffect(() => {
    if (enabled && !previousState) {
      setPreviousState(false)
    }
  }, [enabled, previousState])

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setShowConfirmation(true)
    } else {
      onToggle(false)
    }
  }

  const handleConfirm24x7 = () => {
    onToggle(true)
    onApply24x7()
    setShowConfirmation(false)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const handleRevert = () => {
    onToggle(false)
    onRevert()
  }

  const getStatusColor = () => {
    if (enabled) return "bg-green-100 text-green-800 border-green-200"
    return "bg-gray-100 text-gray-600 border-gray-200"
  }

  const getStatusLabel = () => {
    if (enabled) return "24/7 Activo"
    return "Horarios Específicos"
  }

  const getStatusIcon = () => {
    if (enabled) return <Zap className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Modo 24/7
          </CardTitle>
          <CardDescription>
            Habilita atención continua las 24 horas, todos los días
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle Principal */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <Switch
                id="24x7Toggle"
                checked={enabled}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-green-600"
              />
              <div>
                <Label htmlFor="24x7Toggle" className="text-lg font-medium">
                  {enabled ? "Modo 24/7 Activo" : "Horarios Específicos"}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {enabled 
                    ? "El SLA se aplica las 24 horas, todos los días"
                    : "El SLA se aplica según horarios configurados"
                  }
                </div>
              </div>
            </div>
            
            <Badge className={getStatusColor()}>
              {getStatusLabel()}
            </Badge>
          </div>

          {/* Información del Modo 24/7 */}
          {enabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Modo 24/7 Activo</div>
                  <div className="text-sm space-y-1">
                    <div>• El SLA se aplica las 24 horas, todos los días</div>
                    <div>• No hay restricciones de horario</div>
                    <div>• Tiempos de respuesta se calculan continuamente</div>
                    <div>• Ideal para servicios de emergencia o soporte global</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Advertencias para Modo 24/7 */}
          {enabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Consideraciones Importantes</div>
                  <div className="text-sm space-y-1">
                    <div>• Asegúrate de tener personal disponible las 24 horas</div>
                    <div>• Los tiempos de respuesta deben ser realistas</div>
                    <div>• Considera la carga de trabajo del equipo</div>
                    <div>• Revisa la configuración de escalación</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Información para Horarios Específicos */}
          {!enabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Horarios Específicos</div>
                  <div className="text-sm space-y-1">
                    <div>• El SLA se aplica solo durante horarios configurados</div>
                    <div>• Fuera de horario, el SLA se pausa</div>
                    <div>• Ideal para negocios con horarios definidos</div>
                    <div>• Permite configurar días y horarios específicos</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Acciones */}
          <div className="flex gap-2">
            {enabled ? (
              <Button
                variant="outline"
                onClick={handleRevert}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Volver a Horarios Específicos
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowConfirmation(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4" />
                Activar 24/7
              </Button>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {enabled ? "168" : "40-60"}
              </div>
              <div className="text-sm text-muted-foreground">
                Horas semanales
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {enabled ? "100%" : "60-80%"}
              </div>
              <div className="text-sm text-muted-foreground">
                Cobertura
              </div>
            </div>
          </div>

          {/* Comparación de Modos */}
          <div className="space-y-3">
            <h4 className="font-medium">Comparación de Modos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="font-medium text-green-600 mb-2">Modo 24/7</div>
                <div className="text-sm space-y-1">
                  <div>✅ Atención continua</div>
                  <div>✅ Sin restricciones de tiempo</div>
                  <div>✅ Ideal para emergencias</div>
                  <div>⚠️ Requiere más personal</div>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium text-blue-600 mb-2">Horarios Específicos</div>
                <div className="text-sm space-y-1">
                  <div>✅ Control de recursos</div>
                  <div>✅ Horarios definidos</div>
                  <div>✅ Mejor para negocios</div>
                  <div>⚠️ Limitado por horarios</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Confirmar Modo 24/7
              </CardTitle>
              <CardDescription>
                Esta acción cambiará todos los horarios a 24/7
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">¿Estás seguro?</div>
                    <div className="text-sm">
                      Esta acción:
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Cambiará todos los días a 24/7</li>
                        <li>Reemplazará la configuración actual</li>
                        <li>No se puede deshacer automáticamente</li>
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleConfirm24x7}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Activar 24/7
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

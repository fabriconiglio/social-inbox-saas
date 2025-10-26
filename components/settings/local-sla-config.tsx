"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Building, Settings, AlertTriangle, CheckCircle, Info, Zap, Clock, MapPin } from "lucide-react"

interface LocalSLAConfigProps {
  localId: string
  localName: string
  localAddress?: string
  localTimezone: string
  currentSLAId?: string
  availableSLAs: Array<{
    id: string
    name: string
    description?: string
    responseTimeMinutes: number
    resolutionTimeHours: number
    priority: string
    isActive: boolean
  }>
  onSLAChange: (slaId: string | null) => void
  onEnableLocalSLA: (enabled: boolean) => void
  className?: string
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

export function LocalSLAConfig({
  localId,
  localName,
  localAddress,
  localTimezone,
  currentSLAId,
  availableSLAs,
  onSLAChange,
  onEnableLocalSLA,
  className
}: LocalSLAConfigProps) {
  const [isEnabled, setIsEnabled] = useState(!!currentSLAId)
  const [selectedSLAId, setSelectedSLAId] = useState(currentSLAId || "")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const activeSLAs = availableSLAs.filter(sla => sla.isActive)

  useEffect(() => {
    if (currentSLAId) {
      setSelectedSLAId(currentSLAId)
      setIsEnabled(true)
    }
  }, [currentSLAId])

  const handleEnableToggle = (enabled: boolean) => {
    setIsEnabled(enabled)
    onEnableLocalSLA(enabled)
    
    if (!enabled) {
      setSelectedSLAId("")
      onSLAChange(null)
    }
  }

  const handleSLAChange = (slaId: string) => {
    setSelectedSLAId(slaId)
    onSLAChange(slaId)
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

  const getLocalSpecificRecommendations = () => {
    const recommendations: string[] = []
    
    // Recomendaciones basadas en el timezone del local
    if (localTimezone.includes("America/Argentina")) {
      recommendations.push("Horarios comerciales argentinos (9:00 - 18:00)")
      recommendations.push("Considera horarios de almuerzo (12:00 - 13:00)")
    } else if (localTimezone.includes("America/New_York")) {
      recommendations.push("Horarios comerciales estadounidenses (9:00 - 17:00)")
      recommendations.push("Considera horarios de almuerzo (12:00 - 13:00)")
    } else if (localTimezone.includes("Europe")) {
      recommendations.push("Horarios comerciales europeos (9:00 - 17:00)")
      recommendations.push("Considera horarios de almuerzo (12:00 - 13:00)")
    }
    
    // Recomendaciones generales
    recommendations.push("Configura horarios según la zona horaria del local")
    recommendations.push("Considera días festivos locales")
    recommendations.push("Ajusta tiempos de respuesta según el tipo de negocio")
    
    return recommendations
  }

  const recommendations = getLocalSpecificRecommendations()

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            SLA para {localName}
          </CardTitle>
          <CardDescription>
            Configura un SLA específico para este local
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del Local */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{localName}</div>
                {localAddress && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {localAddress}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Zona horaria: {localTimezone}
                </div>
              </div>
              <Badge variant="outline">
                Local
              </Badge>
            </div>
          </div>

          {/* Toggle de Habilitación */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Switch
                id="enableLocalSLA"
                checked={isEnabled}
                onCheckedChange={handleEnableToggle}
              />
              <div>
                <Label htmlFor="enableLocalSLA" className="text-lg font-medium">
                  SLA Específico para {localName}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {isEnabled 
                    ? "Este local tiene su propio SLA configurado"
                    : "Este local usa el SLA general del tenant"
                  }
                </div>
              </div>
            </div>
            
            <Badge className={isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
              {isEnabled ? "Habilitado" : "Deshabilitado"}
            </Badge>
          </div>

          {/* Selector de SLA */}
          {isEnabled && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="slaSelect">Seleccionar SLA</Label>
                <Select value={selectedSLAId} onValueChange={handleSLAChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un SLA para este local" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSLAs.map((sla) => (
                      <SelectItem key={sla.id} value={sla.id}>
                        <div className="flex items-center gap-2">
                          <span>{sla.name}</span>
                          <Badge className={PRIORITY_COLORS[sla.priority as keyof typeof PRIORITY_COLORS]}>
                            {PRIORITY_LABELS[sla.priority as keyof typeof PRIORITY_LABELS]}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Información del SLA Seleccionado */}
              {selectedSLAId && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  {(() => {
                    const selectedSLA = activeSLAs.find(sla => sla.id === selectedSLAId)
                    if (!selectedSLA) return null
                    
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium">{selectedSLA.name}</div>
                          <Badge className={PRIORITY_COLORS[selectedSLA.priority as keyof typeof PRIORITY_COLORS]}>
                            {PRIORITY_LABELS[selectedSLA.priority as keyof typeof PRIORITY_LABELS]}
                          </Badge>
                        </div>
                        
                        {selectedSLA.description && (
                          <div className="text-sm text-muted-foreground mb-3">
                            {selectedSLA.description}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatTime(selectedSLA.responseTimeMinutes)}
                            </div>
                            <div className="text-sm text-muted-foreground">Primera Respuesta</div>
                          </div>
                          <div className="text-center p-3 border rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {formatHours(selectedSLA.resolutionTimeHours)}
                            </div>
                            <div className="text-sm text-muted-foreground">Resolución</div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Recomendaciones Específicas del Local */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Recomendaciones para {localName}</div>
                    <div className="text-sm space-y-1">
                      {recommendations.map((rec, index) => (
                        <div key={index}>• {rec}</div>
                      ))}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Configuración Avanzada */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvanced ? "Ocultar" : "Mostrar"} Configuración Avanzada
                </Button>

                {showAdvanced && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Configuración Avanzada</Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Opciones adicionales para personalizar el SLA de este local
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">Horarios Específicos</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Configurar horarios específicos para este local
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">Escalación Personalizada</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Reglas de escalación específicas para este local
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Configurar Horarios
                      </Button>
                      <Button variant="outline" size="sm">
                        <Zap className="h-4 w-4 mr-2" />
                        Configurar Escalación
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Estado Actual */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Estado Actual</div>
                <div className="text-sm text-muted-foreground">
                  {isEnabled 
                    ? `SLA específico: ${activeSLAs.find(sla => sla.id === selectedSLAId)?.name || "No seleccionado"}`
                    : "Usando SLA general del tenant"
                  }
                </div>
              </div>
              <Badge className={isEnabled ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {isEnabled ? "Específico" : "General"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

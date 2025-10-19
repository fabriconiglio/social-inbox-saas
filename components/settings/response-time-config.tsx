"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, AlertTriangle, CheckCircle, Info, Zap } from "lucide-react"

interface ResponseTimeConfigProps {
  value: number // en minutos
  onChange: (value: number) => void
  businessHours?: {
    enabled: boolean
    startTime: string
    endTime: string
    timezone: string
    workingDays: number[]
  }
  onBusinessHoursChange?: (businessHours: any) => void
  className?: string
}

interface TimePreset {
  id: string
  name: string
  minutes: number
  description: string
  category: "instant" | "fast" | "standard" | "extended"
  icon: React.ReactNode
}

const TIME_PRESETS: TimePreset[] = [
  {
    id: "instant",
    name: "Instantáneo",
    minutes: 5,
    description: "Respuesta inmediata para casos críticos",
    category: "instant",
    icon: <Zap className="h-4 w-4 text-green-500" />
  },
  {
    id: "fast",
    name: "Rápido",
    minutes: 15,
    description: "Respuesta rápida para soporte prioritario",
    category: "fast",
    icon: <Clock className="h-4 w-4 text-blue-500" />
  },
  {
    id: "standard",
    name: "Estándar",
    minutes: 30,
    description: "Tiempo estándar para la mayoría de casos",
    category: "standard",
    icon: <Clock className="h-4 w-4 text-yellow-500" />
  },
  {
    id: "extended",
    name: "Extendido",
    minutes: 60,
    description: "Tiempo extendido para casos complejos",
    category: "extended",
    icon: <Clock className="h-4 w-4 text-orange-500" />
  },
  {
    id: "custom",
    name: "Personalizado",
    minutes: 0,
    description: "Configurar tiempo personalizado",
    category: "standard",
    icon: <Clock className="h-4 w-4 text-gray-500" />
  }
]

export function ResponseTimeConfig({
  value,
  onChange,
  businessHours,
  onBusinessHoursChange,
  className
}: ResponseTimeConfigProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("standard")
  const [customMinutes, setCustomMinutes] = useState(value)
  const [customHours, setCustomHours] = useState(Math.floor(value / 60))
  const [customMinutesOnly, setCustomMinutesOnly] = useState(value % 60)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])

  // Actualizar valores cuando cambie el prop
  useEffect(() => {
    const preset = TIME_PRESETS.find(p => p.minutes === value)
    if (preset) {
      setSelectedPreset(preset.id)
    } else {
      setSelectedPreset("custom")
      setCustomMinutes(value)
      setCustomHours(Math.floor(value / 60))
      setCustomMinutesOnly(value % 60)
    }
  }, [value])

  // Validar y generar warnings
  useEffect(() => {
    const newWarnings: string[] = []
    
    if (value < 5) {
      newWarnings.push("Tiempos muy cortos pueden ser difíciles de cumplir")
    }
    
    if (value > 480) { // 8 horas
      newWarnings.push("Tiempos muy largos pueden afectar la satisfacción del cliente")
    }
    
    if (value > 1440) { // 24 horas
      newWarnings.push("Tiempos superiores a 24 horas no son recomendados")
    }

    if (businessHours?.enabled && value > 480) {
      newWarnings.push("Con horarios de negocio, considera tiempos más cortos")
    }

    setWarnings(newWarnings)
  }, [value, businessHours])

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    
    if (presetId !== "custom") {
      const preset = TIME_PRESETS.find(p => p.id === presetId)
      if (preset) {
        onChange(preset.minutes)
      }
    }
  }

  const handleCustomChange = () => {
    const totalMinutes = customHours * 60 + customMinutesOnly
    setCustomMinutes(totalMinutes)
    onChange(totalMinutes)
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

  const getTimeCategory = (minutes: number) => {
    if (minutes <= 5) return "instant"
    if (minutes <= 15) return "fast"
    if (minutes <= 60) return "standard"
    return "extended"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "instant": return "bg-green-100 text-green-800 border-green-200"
      case "fast": return "bg-blue-100 text-blue-800 border-blue-200"
      case "standard": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "extended": return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "instant": return "Instantáneo"
      case "fast": return "Rápido"
      case "standard": return "Estándar"
      case "extended": return "Extendido"
      default: return "Personalizado"
    }
  }

  const currentCategory = getTimeCategory(value)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tiempo de Primera Respuesta
          </CardTitle>
          <CardDescription>
            Configura cuánto tiempo tiene el equipo para responder a una nueva conversación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Presets */}
          <div>
            <Label className="text-sm font-medium">Configuración Rápida</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedPreset === preset.id ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => handlePresetChange(preset.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {preset.icon}
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-left">
                    {preset.id === "custom" ? preset.description : formatTime(preset.minutes)}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Configuración Personalizada */}
          {selectedPreset === "custom" && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <Label className="text-sm font-medium">Configuración Personalizada</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customHours">Horas</Label>
                  <Input
                    id="customHours"
                    type="number"
                    min="0"
                    max="168"
                    value={customHours}
                    onChange={(e) => {
                      setCustomHours(parseInt(e.target.value) || 0)
                      handleCustomChange()
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="customMinutes">Minutos</Label>
                  <Input
                    id="customMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutesOnly}
                    onChange={(e) => {
                      setCustomMinutesOnly(parseInt(e.target.value) || 0)
                      handleCustomChange()
                    }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {formatTime(customHours * 60 + customMinutesOnly)}
              </div>
            </div>
          )}

          {/* Preview del Tiempo Configurado */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={getCategoryColor(currentCategory)}>
                    {getCategoryLabel(currentCategory)}
                  </Badge>
                  <span className="text-2xl font-bold">{formatTime(value)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Tiempo máximo para primera respuesta
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Categoría</div>
                <div className="font-medium">{getCategoryLabel(currentCategory)}</div>
              </div>
            </div>
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

          {/* Configuración Avanzada */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              <Info className="h-4 w-4 mr-2" />
              {showAdvanced ? "Ocultar" : "Mostrar"} Configuración Avanzada
            </Button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">Horarios de Negocio</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Si está habilitado, el tiempo solo cuenta durante horarios de trabajo
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="businessHoursEnabled"
                      checked={businessHours?.enabled || false}
                      onCheckedChange={(checked) => 
                        onBusinessHoursChange?.({
                          ...businessHours,
                          enabled: checked
                        })
                      }
                    />
                    <Label htmlFor="businessHoursEnabled">
                      Aplicar solo en horarios de negocio
                    </Label>
                  </div>

                  {businessHours?.enabled && (
                    <div className="mt-4 space-y-3 pl-6 border-l-2 border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime">Hora de inicio</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={businessHours.startTime}
                            onChange={(e) => 
                              onBusinessHoursChange?.({
                                ...businessHours,
                                startTime: e.target.value
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime">Hora de fin</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={businessHours.endTime}
                            onChange={(e) => 
                              onBusinessHoursChange?.({
                                ...businessHours,
                                endTime: e.target.value
                              })
                            }
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Días de trabajo</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            { value: 0, label: "Dom" },
                            { value: 1, label: "Lun" },
                            { value: 2, label: "Mar" },
                            { value: 3, label: "Mié" },
                            { value: 4, label: "Jue" },
                            { value: 5, label: "Vie" },
                            { value: 6, label: "Sáb" }
                          ].map(day => (
                            <Button
                              key={day.value}
                              variant={businessHours.workingDays?.includes(day.value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentDays = businessHours.workingDays || []
                                const newDays = currentDays.includes(day.value)
                                  ? currentDays.filter(d => d !== day.value)
                                  : [...currentDays, day.value]
                                onBusinessHoursChange?.({
                                  ...businessHours,
                                  workingDays: newDays
                                })
                              }}
                            >
                              {day.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Impacto en el SLA</Label>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Alertas se activarán después de {formatTime(value)}</span>
                    </div>
                    {businessHours?.enabled && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Solo cuenta durante horarios de trabajo</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="h-4 w-4 text-gray-500" />
                      <span>Se aplicará a todas las conversaciones nuevas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

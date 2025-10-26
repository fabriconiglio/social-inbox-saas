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
import { MessageSquare, Settings, AlertTriangle, CheckCircle, Info, Zap, Clock } from "lucide-react"

interface ChannelSLAConfigProps {
  channelType: string
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
  onEnableChannelSLA: (enabled: boolean) => void
  className?: string
}

const CHANNEL_TYPES = {
  WHATSAPP: {
    name: "WhatsApp",
    icon: "💬",
    description: "Mensajería instantánea",
    defaultSLA: "whatsapp-standard"
  },
  INSTAGRAM: {
    name: "Instagram",
    icon: "📸",
    description: "Red social visual",
    defaultSLA: "instagram-standard"
  },
  TIKTOK: {
    name: "TikTok",
    icon: "🎵",
    description: "Red social de video",
    defaultSLA: "tiktok-standard"
  },
  FACEBOOK: {
    name: "Facebook",
    icon: "👥",
    description: "Red social general",
    defaultSLA: "facebook-standard"
  },
  TWITTER: {
    name: "Twitter",
    icon: "🐦",
    description: "Microblogging",
    defaultSLA: "twitter-standard"
  },
  TELEGRAM: {
    name: "Telegram",
    icon: "✈️",
    description: "Mensajería segura",
    defaultSLA: "telegram-standard"
  }
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

export function ChannelSLAConfig({
  channelType,
  currentSLAId,
  availableSLAs,
  onSLAChange,
  onEnableChannelSLA,
  className
}: ChannelSLAConfigProps) {
  const [isEnabled, setIsEnabled] = useState(!!currentSLAId)
  const [selectedSLAId, setSelectedSLAId] = useState(currentSLAId || "")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const channelInfo = CHANNEL_TYPES[channelType as keyof typeof CHANNEL_TYPES] || {
    name: channelType,
    icon: "📱",
    description: "Canal de comunicación",
    defaultSLA: "standard"
  }

  const selectedSLA = availableSLAs.find(sla => sla.id === selectedSLAId)
  const activeSLAs = availableSLAs.filter(sla => sla.isActive)

  useEffect(() => {
    if (currentSLAId) {
      setSelectedSLAId(currentSLAId)
      setIsEnabled(true)
    }
  }, [currentSLAId])

  const handleEnableToggle = (enabled: boolean) => {
    setIsEnabled(enabled)
    onEnableChannelSLA(enabled)
    
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

  const getChannelSpecificRecommendations = () => {
    const recommendations: string[] = []
    
    switch (channelType) {
      case "WHATSAPP":
        recommendations.push("WhatsApp requiere respuestas rápidas (5-15 min)")
        recommendations.push("Ideal para soporte técnico y ventas")
        recommendations.push("Considera horarios 24/7 para WhatsApp Business")
        break
      case "INSTAGRAM":
        recommendations.push("Instagram es visual - respuestas más creativas")
        recommendations.push("Tiempo de respuesta: 30-60 minutos")
        recommendations.push("Ideal para marketing y engagement")
        break
      case "TIKTOK":
        recommendations.push("TikTok es para audiencia joven")
        recommendations.push("Respuestas más informales y rápidas")
        recommendations.push("Tiempo de respuesta: 15-30 minutos")
        break
      case "FACEBOOK":
        recommendations.push("Facebook es más formal")
        recommendations.push("Tiempo de respuesta: 1-2 horas")
        recommendations.push("Ideal para soporte general")
        break
      case "TWITTER":
        recommendations.push("Twitter requiere respuestas muy rápidas")
        recommendations.push("Tiempo de respuesta: 5-15 minutos")
        recommendations.push("Ideal para atención al cliente")
        break
      case "TELEGRAM":
        recommendations.push("Telegram es para usuarios técnicos")
        recommendations.push("Respuestas más detalladas")
        recommendations.push("Tiempo de respuesta: 30-60 minutos")
        break
      default:
        recommendations.push("Configura SLA según el tipo de audiencia")
        recommendations.push("Considera el comportamiento del canal")
    }
    
    return recommendations
  }

  const recommendations = getChannelSpecificRecommendations()

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SLA para {channelInfo.name}
          </CardTitle>
          <CardDescription>
            Configura un SLA específico para {channelInfo.name} {channelInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del Canal */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{channelInfo.icon}</div>
              <div>
                <div className="font-medium">{channelInfo.name}</div>
                <div className="text-sm text-muted-foreground">
                  {channelInfo.description}
                </div>
              </div>
              <Badge variant="outline" className="ml-auto">
                {channelType}
              </Badge>
            </div>
          </div>

          {/* Toggle de Habilitación */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Switch
                id="enableChannelSLA"
                checked={isEnabled}
                onCheckedChange={handleEnableToggle}
              />
              <div>
                <Label htmlFor="enableChannelSLA" className="text-lg font-medium">
                  SLA Específico para {channelInfo.name}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {isEnabled 
                    ? "Este canal tiene su propio SLA configurado"
                    : "Este canal usa el SLA general del tenant"
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
                    <SelectValue placeholder="Selecciona un SLA para este canal" />
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
              {selectedSLA && (
                <div className="p-4 border rounded-lg bg-muted/50">
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
                </div>
              )}

              {/* Recomendaciones Específicas del Canal */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Recomendaciones para {channelInfo.name}</div>
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
                        Opciones adicionales para personalizar el SLA de este canal
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">Horarios Específicos</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Configurar horarios diferentes para este canal
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">Escalación Personalizada</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Reglas de escalación específicas para este canal
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
                    ? `SLA específico: ${selectedSLA?.name || "No seleccionado"}`
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

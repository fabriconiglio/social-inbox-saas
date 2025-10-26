"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Settings, AlertTriangle, CheckCircle, Info, Plus, Edit, Trash2 } from "lucide-react"
import { ChannelSLAConfig } from "./channel-sla-config"

interface ChannelSLAManagerProps {
  tenantId: string
  availableSLAs: Array<{
    id: string
    name: string
    description?: string
    responseTimeMinutes: number
    resolutionTimeHours: number
    priority: string
    isActive: boolean
  }>
  channelSLAs: Record<string, string | null> // channelType -> slaId
  onChannelSLAChange: (channelType: string, slaId: string | null) => void
  className?: string
}

const CHANNEL_TYPES = [
  { value: "WHATSAPP", name: "WhatsApp", icon: "💬", description: "Mensajería instantánea" },
  { value: "INSTAGRAM", name: "Instagram", icon: "📸", description: "Red social visual" },
  { value: "TIKTOK", name: "TikTok", icon: "🎵", description: "Red social de video" },
  { value: "FACEBOOK", name: "Facebook", icon: "👥", description: "Red social general" },
  { value: "TWITTER", name: "Twitter", icon: "🐦", description: "Microblogging" },
  { value: "TELEGRAM", name: "Telegram", icon: "✈️", description: "Mensajería segura" }
]

export function ChannelSLAManager({
  tenantId,
  availableSLAs,
  channelSLAs,
  onChannelSLAChange,
  className
}: ChannelSLAManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [enabledChannels, setEnabledChannels] = useState<Record<string, boolean>>({})

  // Inicializar estado de canales habilitados
  useEffect(() => {
    const enabled: Record<string, boolean> = {}
    CHANNEL_TYPES.forEach(channel => {
      enabled[channel.value] = !!channelSLAs[channel.value]
    })
    setEnabledChannels(enabled)
  }, [channelSLAs])

  const handleChannelSLAChange = (channelType: string, slaId: string | null) => {
    onChannelSLAChange(channelType, slaId)
  }

  const handleEnableChannelSLA = (channelType: string, enabled: boolean) => {
    setEnabledChannels(prev => ({
      ...prev,
      [channelType]: enabled
    }))
    
    if (!enabled) {
      onChannelSLAChange(channelType, null)
    }
  }

  const getChannelStats = () => {
    const totalChannels = CHANNEL_TYPES.length
    const enabledChannelsCount = Object.values(enabledChannels).filter(Boolean).length
    const channelsWithSLA = Object.values(channelSLAs).filter(Boolean).length
    
    return {
      total: totalChannels,
      enabled: enabledChannelsCount,
      withSLA: channelsWithSLA,
      percentage: Math.round((channelsWithSLA / totalChannels) * 100)
    }
  }

  const stats = getChannelStats()

  const getChannelStatus = (channelType: string) => {
    const isEnabled = enabledChannels[channelType]
    const hasSLA = !!channelSLAs[channelType]
    
    if (!isEnabled) return "disabled"
    if (hasSLA) return "configured"
    return "enabled"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disabled": return "bg-gray-100 text-gray-600"
      case "enabled": return "bg-yellow-100 text-yellow-800"
      case "configured": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "disabled": return "Deshabilitado"
      case "enabled": return "Habilitado"
      case "configured": return "Configurado"
      default: return "Desconocido"
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestión de SLAs por Canal
          </CardTitle>
          <CardDescription>
            Configura SLAs específicos para cada tipo de canal de comunicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="channels">Canales</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            {/* Resumen */}
            <TabsContent value="overview" className="space-y-6">
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Canales</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
                  <div className="text-sm text-muted-foreground">Habilitados</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.withSLA}</div>
                  <div className="text-sm text-muted-foreground">Con SLA</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.percentage}%</div>
                  <div className="text-sm text-muted-foreground">Cobertura</div>
                </div>
              </div>

              {/* Lista de Canales */}
              <div>
                <h4 className="font-medium mb-3">Estado de Canales</h4>
                <div className="space-y-2">
                  {CHANNEL_TYPES.map((channel) => {
                    const status = getChannelStatus(channel.value)
                    const sla = channelSLAs[channel.value]
                    const slaInfo = availableSLAs.find(s => s.id === sla)
                    
                    return (
                      <div key={channel.value} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{channel.icon}</div>
                          <div>
                            <div className="font-medium">{channel.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {channel.description}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {slaInfo && (
                            <div className="text-right">
                              <div className="text-sm font-medium">{slaInfo.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {slaInfo.responseTimeMinutes}min / {slaInfo.resolutionTimeHours}h
                              </div>
                            </div>
                          )}
                          <Badge className={getStatusColor(status)}>
                            {getStatusLabel(status)}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recomendaciones */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Recomendaciones</div>
                    <div className="text-sm space-y-1">
                      {stats.percentage < 50 && (
                        <div>• Considera configurar SLAs específicos para mejorar la experiencia</div>
                      )}
                      {stats.percentage >= 50 && stats.percentage < 100 && (
                        <div>• Buen progreso - completa la configuración de todos los canales</div>
                      )}
                      {stats.percentage === 100 && (
                        <div>• Excelente - todos los canales tienen SLA configurado</div>
                      )}
                      <div>• WhatsApp y Twitter requieren respuestas más rápidas</div>
                      <div>• Instagram y TikTok pueden tener tiempos más flexibles</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Canales */}
            <TabsContent value="channels" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CHANNEL_TYPES.map((channel) => (
                  <ChannelSLAConfig
                    key={channel.value}
                    channelType={channel.value}
                    currentSLAId={channelSLAs[channel.value] || undefined}
                    availableSLAs={availableSLAs}
                    onSLAChange={(slaId) => handleChannelSLAChange(channel.value, slaId)}
                    onEnableChannelSLA={(enabled) => handleEnableChannelSLA(channel.value, enabled)}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Configuración */}
            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Configuración Global</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">SLA por Defecto</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        SLA que se aplica cuando un canal no tiene configuración específica
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">Herencia de SLA</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Cómo se heredan los SLAs entre canales similares
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Acciones Masivas</h4>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Aplicar SLA a Todos
                    </Button>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Múltiples
                    </Button>
                    <Button variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpiar Todo
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

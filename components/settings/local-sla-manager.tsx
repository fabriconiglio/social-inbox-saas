"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Settings, AlertTriangle, CheckCircle, Info, Plus, Edit, Trash2, MapPin } from "lucide-react"
import { LocalSLAConfig } from "./local-sla-config"

interface LocalSLAManagerProps {
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
  locals: Array<{
    id: string
    name: string
    address?: string
    timezone: string
  }>
  localSLAs: Record<string, string | null> // localId -> slaId
  onLocalSLAChange: (localId: string, slaId: string | null) => void
  className?: string
}

export function LocalSLAManager({
  tenantId,
  availableSLAs,
  locals,
  localSLAs,
  onLocalSLAChange,
  className
}: LocalSLAManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [enabledLocals, setEnabledLocals] = useState<Record<string, boolean>>({})

  // Inicializar estado de locales habilitados
  useEffect(() => {
    const enabled: Record<string, boolean> = {}
    locals.forEach(local => {
      enabled[local.id] = !!localSLAs[local.id]
    })
    setEnabledLocals(enabled)
  }, [locals, localSLAs])

  const handleLocalSLAChange = (localId: string, slaId: string | null) => {
    onLocalSLAChange(localId, slaId)
  }

  const handleEnableLocalSLA = (localId: string, enabled: boolean) => {
    setEnabledLocals(prev => ({
      ...prev,
      [localId]: enabled
    }))
    
    if (!enabled) {
      onLocalSLAChange(localId, null)
    }
  }

  const getLocalStats = () => {
    const totalLocals = locals.length
    const enabledLocalsCount = Object.values(enabledLocals).filter(Boolean).length
    const localsWithSLA = Object.values(localSLAs).filter(Boolean).length
    
    return {
      total: totalLocals,
      enabled: enabledLocalsCount,
      withSLA: localsWithSLA,
      percentage: totalLocals > 0 ? Math.round((localsWithSLA / totalLocals) * 100) : 0
    }
  }

  const stats = getLocalStats()

  const getLocalStatus = (localId: string) => {
    const isEnabled = enabledLocals[localId]
    const hasSLA = !!localSLAs[localId]
    
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
            <Settings className="h-5 w-5" />
            Gestión de SLAs por Local
          </CardTitle>
          <CardDescription>
            Configura SLAs específicos para cada local (sucursal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="locals">Locales</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            {/* Resumen */}
            <TabsContent value="overview" className="space-y-6">
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Locales</div>
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

              {/* Lista de Locales */}
              <div>
                <h4 className="font-medium mb-3">Estado de Locales</h4>
                <div className="space-y-2">
                  {locals.map((local) => {
                    const status = getLocalStatus(local.id)
                    const sla = localSLAs[local.id]
                    const slaInfo = availableSLAs.find(s => s.id === sla)
                    
                    return (
                      <div key={local.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{local.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {local.address || "Sin dirección"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {local.timezone}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {slaInfo && (
                            <div className="text-right">
                              <div className="text-sm font-medium">{slaInfo.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatTime(slaInfo.responseTimeMinutes)} / {formatHours(slaInfo.resolutionTimeHours)}
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
                        <div>• Buen progreso - completa la configuración de todos los locales</div>
                      )}
                      {stats.percentage === 100 && (
                        <div>• Excelente - todos los locales tienen SLA configurado</div>
                      )}
                      <div>• Configura horarios según la zona horaria de cada local</div>
                      <div>• Considera días festivos locales en cada región</div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Locales */}
            <TabsContent value="locals" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {locals.map((local) => (
                  <LocalSLAConfig
                    key={local.id}
                    localId={local.id}
                    localName={local.name}
                    localAddress={local.address}
                    localTimezone={local.timezone}
                    currentSLAId={localSLAs[local.id] || undefined}
                    availableSLAs={availableSLAs}
                    onSLAChange={(slaId) => handleLocalSLAChange(local.id, slaId)}
                    onEnableLocalSLA={(enabled) => handleEnableLocalSLA(local.id, enabled)}
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
                        SLA que se aplica cuando un local no tiene configuración específica
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium mb-2">Herencia de SLA</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Cómo se heredan los SLAs entre locales similares
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

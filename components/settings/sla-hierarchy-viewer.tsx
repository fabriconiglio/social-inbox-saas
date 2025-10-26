"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Building, 
  MessageSquare, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  ArrowDown,
  ArrowRight,
  Settings,
  Clock,
  Zap
} from "lucide-react"
import { SLAHierarchyResult } from "@/lib/sla-hierarchy"

interface SLAHierarchyViewerProps {
  tenantId: string
  localId?: string
  channelType?: string
  hierarchy: SLAHierarchyResult
  availableSLAs: {
    local?: SLAHierarchyResult
    channel?: SLAHierarchyResult
    tenant?: SLAHierarchyResult
  }
  recommendations: string[]
  onConfigureLocal?: () => void
  onConfigureChannel?: () => void
  onConfigureTenant?: () => void
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

const SOURCE_COLORS = {
  local: "bg-green-100 text-green-800",
  channel: "bg-blue-100 text-blue-800",
  tenant: "bg-purple-100 text-purple-800",
  none: "bg-gray-100 text-gray-600"
}

const SOURCE_LABELS = {
  local: "Local",
  channel: "Canal",
  tenant: "Tenant",
  none: "Ninguno"
}

const SOURCE_ICONS = {
  local: Building,
  channel: MessageSquare,
  tenant: Globe,
  none: XCircle
}

export function SLAHierarchyViewer({
  tenantId,
  localId,
  channelType,
  hierarchy,
  availableSLAs,
  recommendations,
  onConfigureLocal,
  onConfigureChannel,
  onConfigureTenant,
  className
}: SLAHierarchyViewerProps) {
  const [showDetails, setShowDetails] = useState(false)

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

  const getHierarchyLevels = () => {
    const levels = []
    
    // Nivel 1: Local (máxima prioridad)
    if (availableSLAs.local) {
      levels.push({
        level: 'local',
        title: 'SLA del Local',
        description: availableSLAs.local.localSLA?.localName || 'Local específico',
        isActive: hierarchy.source === 'local',
        sla: availableSLAs.local.sla,
        hasConfig: true,
        onConfigure: onConfigureLocal
      })
    } else {
      levels.push({
        level: 'local',
        title: 'SLA del Local',
        description: localId ? 'Sin configuración específica' : 'No aplicable',
        isActive: false,
        sla: null,
        hasConfig: false,
        onConfigure: onConfigureLocal
      })
    }

    // Nivel 2: Canal (segunda prioridad)
    if (availableSLAs.channel) {
      levels.push({
        level: 'channel',
        title: 'SLA del Canal',
        description: `${channelType} - Canal específico`,
        isActive: hierarchy.source === 'channel',
        sla: availableSLAs.channel.sla,
        hasConfig: true,
        onConfigure: onConfigureChannel
      })
    } else {
      levels.push({
        level: 'channel',
        title: 'SLA del Canal',
        description: channelType ? 'Sin configuración específica' : 'No aplicable',
        isActive: false,
        sla: null,
        hasConfig: false,
        onConfigure: onConfigureChannel
      })
    }

    // Nivel 3: Tenant (prioridad más baja)
    if (availableSLAs.tenant) {
      levels.push({
        level: 'tenant',
        title: 'SLA del Tenant',
        description: 'SLA general del tenant',
        isActive: hierarchy.source === 'tenant',
        sla: availableSLAs.tenant.sla,
        hasConfig: true,
        onConfigure: onConfigureTenant
      })
    } else {
      levels.push({
        level: 'tenant',
        title: 'SLA del Tenant',
        description: 'Sin SLA por defecto configurado',
        isActive: false,
        sla: null,
        hasConfig: false,
        onConfigure: onConfigureTenant
      })
    }

    return levels
  }

  const levels = getHierarchyLevels()
  const activeLevel = levels.find(level => level.isActive)

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Jerarquía de SLAs
          </CardTitle>
          <CardDescription>
            Sistema de herencia: Local > Canal > Tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SLA Activo */}
          <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {hierarchy.source !== 'none' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">SLA Activo</span>
              </div>
              <Badge className={SOURCE_COLORS[hierarchy.source]}>
                {SOURCE_LABELS[hierarchy.source]}
              </Badge>
            </div>
            
            {hierarchy.sla ? (
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-lg">{hierarchy.sla.name}</div>
                  {hierarchy.sla.description && (
                    <div className="text-sm text-muted-foreground">
                      {hierarchy.sla.description}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg bg-white">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatTime(hierarchy.sla.responseTimeMinutes)}
                    </div>
                    <div className="text-sm text-muted-foreground">Primera Respuesta</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg bg-white">
                    <div className="text-2xl font-bold text-green-600">
                      {formatHours(hierarchy.sla.resolutionTimeHours)}
                    </div>
                    <div className="text-sm text-muted-foreground">Resolución</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={PRIORITY_COLORS[hierarchy.sla.priority as keyof typeof PRIORITY_COLORS]}>
                    {PRIORITY_LABELS[hierarchy.sla.priority as keyof typeof PRIORITY_LABELS]}
                  </Badge>
                  <Badge variant="outline">
                    {hierarchy.sla.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="font-medium text-red-600">No hay SLA configurado</div>
                <div className="text-sm text-muted-foreground">
                  Configura un SLA por defecto para este tenant
                </div>
              </div>
            )}
          </div>

          {/* Jerarquía de Niveles */}
          <div className="space-y-3">
            <h4 className="font-medium">Jerarquía de Configuración</h4>
            <div className="space-y-2">
              {levels.map((level, index) => {
                const Icon = SOURCE_ICONS[level.level as keyof typeof SOURCE_ICONS]
                const isLast = index === levels.length - 1
                
                return (
                  <div key={level.level} className="relative">
                    <div className={`flex items-center gap-3 p-3 border rounded-lg ${
                      level.isActive 
                        ? 'bg-green-50 border-green-200' 
                        : level.hasConfig 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          level.isActive 
                            ? 'bg-green-100 text-green-600' 
                            : level.hasConfig 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{level.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {level.description}
                          </div>
                          {level.sla && (
                            <div className="text-sm font-medium text-green-600 mt-1">
                              {level.sla.name} - {formatTime(level.sla.responseTimeMinutes)} / {formatHours(level.sla.resolutionTimeHours)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {level.isActive && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        )}
                        {level.hasConfig && !level.isActive && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Configurado
                          </Badge>
                        )}
                        {!level.hasConfig && (
                          <Badge className="bg-gray-100 text-gray-600">
                            Sin configurar
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!isLast && (
                      <div className="flex justify-center my-2">
                        <ArrowDown className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recomendaciones */}
          {recommendations.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Recomendaciones</div>
                  <div className="text-sm space-y-1">
                    {recommendations.map((rec, index) => (
                      <div key={index}>• {rec}</div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Acciones */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Info className="h-4 w-4 mr-2" />
              {showDetails ? "Ocultar" : "Mostrar"} Detalles
            </Button>
            
            {onConfigureLocal && (
              <Button variant="outline" onClick={onConfigureLocal}>
                <Building className="h-4 w-4 mr-2" />
                Configurar Local
              </Button>
            )}
            
            {onConfigureChannel && (
              <Button variant="outline" onClick={onConfigureChannel}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Configurar Canal
              </Button>
            )}
            
            {onConfigureTenant && (
              <Button variant="outline" onClick={onConfigureTenant}>
                <Globe className="h-4 w-4 mr-2" />
                Configurar Tenant
              </Button>
            )}
          </div>

          {/* Detalles Adicionales */}
          {showDetails && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Información Técnica</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Tenant ID:</strong> {tenantId}</div>
                  {localId && <div><strong>Local ID:</strong> {localId}</div>}
                  {channelType && <div><strong>Tipo de Canal:</strong> {channelType}</div>}
                  <div><strong>Fuente del SLA:</strong> {SOURCE_LABELS[hierarchy.source]}</div>
                  <div><strong>ID del SLA:</strong> {hierarchy.slaId || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

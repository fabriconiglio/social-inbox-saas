"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, 
  Building, 
  MessageSquare, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  ArrowDown,
  ArrowRight,
  Clock,
  Zap
} from "lucide-react"
import { SLAHierarchyViewer } from "./sla-hierarchy-viewer"
import { getSLAHierarchy, resolveSLAHierarchy } from "@/lib/sla-hierarchy"

interface SLAHierarchyManagerProps {
  tenantId: string
  localId?: string
  channelType?: string
  onConfigureLocal?: () => void
  onConfigureChannel?: () => void
  onConfigureTenant?: () => void
  className?: string
}

export function SLAHierarchyManager({
  tenantId,
  localId,
  channelType,
  onConfigureLocal,
  onConfigureChannel,
  onConfigureTenant,
  className
}: SLAHierarchyManagerProps) {
  const [hierarchyData, setHierarchyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHierarchyData()
  }, [tenantId, localId, channelType])

  const loadHierarchyData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getSLAHierarchy(tenantId, localId, channelType)
      setHierarchyData(data)
    } catch (err) {
      setError("Error al cargar jerarquía de SLAs")
      console.error("[SLA Hierarchy Manager] Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getContextDescription = () => {
    const parts = []
    
    if (localId) {
      parts.push("Local específico")
    }
    
    if (channelType) {
      parts.push(`Canal ${channelType}`)
    }
    
    if (parts.length === 0) {
      return "Contexto general del tenant"
    }
    
    return parts.join(" + ")
  }

  const getHierarchyStatus = () => {
    if (!hierarchyData) return "loading"
    
    const { hierarchy } = hierarchyData
    
    if (hierarchy.source === 'none') return "no-sla"
    if (hierarchy.source === 'tenant') return "tenant-only"
    if (hierarchy.source === 'channel') return "channel-specific"
    if (hierarchy.source === 'local') return "local-specific"
    
    return "unknown"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "local-specific": return "bg-green-100 text-green-800"
      case "channel-specific": return "bg-blue-100 text-blue-800"
      case "tenant-only": return "bg-purple-100 text-purple-800"
      case "no-sla": return "bg-red-100 text-red-800"
      case "loading": return "bg-gray-100 text-gray-600"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "local-specific": return "SLA Específico del Local"
      case "channel-specific": return "SLA Específico del Canal"
      case "tenant-only": return "SLA General del Tenant"
      case "no-sla": return "Sin SLA Configurado"
      case "loading": return "Cargando..."
      default: return "Desconocido"
    }
  }

  const getOptimizationLevel = () => {
    if (!hierarchyData) return 0
    
    const { availableSLAs } = hierarchyData
    let score = 0
    
    if (availableSLAs.local) score += 3
    if (availableSLAs.channel) score += 2
    if (availableSLAs.tenant) score += 1
    
    return score
  }

  const getOptimizationColor = (score: number) => {
    if (score >= 5) return "bg-green-100 text-green-800"
    if (score >= 3) return "bg-yellow-100 text-yellow-800"
    if (score >= 1) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getOptimizationLabel = (score: number) => {
    if (score >= 5) return "Excelente"
    if (score >= 3) return "Bueno"
    if (score >= 1) return "Básico"
    return "Crítico"
  }

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando jerarquía de SLAs...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadHierarchyData}
                  className="ml-2"
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = getHierarchyStatus()
  const optimizationScore = getOptimizationLevel()

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestión de Jerarquía de SLAs
          </CardTitle>
          <CardDescription>
            Sistema de herencia: Local {'>'} Canal {'>'} Tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hierarchy" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hierarchy">Jerarquía</TabsTrigger>
              <TabsTrigger value="status">Estado</TabsTrigger>
              <TabsTrigger value="optimization">Optimización</TabsTrigger>
            </TabsList>

            {/* Jerarquía */}
            <TabsContent value="hierarchy" className="space-y-6">
              <SLAHierarchyViewer
                tenantId={tenantId}
                localId={localId}
                channelType={channelType}
                hierarchy={hierarchyData.hierarchy}
                availableSLAs={hierarchyData.availableSLAs}
                recommendations={hierarchyData.recommendations}
                onConfigureLocal={onConfigureLocal}
                onConfigureChannel={onConfigureChannel}
                onConfigureTenant={onConfigureTenant}
              />
            </TabsContent>

            {/* Estado */}
            <TabsContent value="status" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estado Actual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">SLA Activo</span>
                      <Badge className={getStatusColor(status)}>
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Contexto</span>
                      <span className="text-sm text-muted-foreground">
                        {getContextDescription()}
                      </span>
                    </div>
                    
                    {hierarchyData.hierarchy.sla && (
                      <div className="space-y-2">
                        <div className="font-medium">SLA Aplicado</div>
                        <div className="text-sm space-y-1">
                          <div><strong>Nombre:</strong> {hierarchyData.hierarchy.sla.name}</div>
                          <div><strong>Respuesta:</strong> {hierarchyData.hierarchy.sla.responseTimeMinutes} min</div>
                          <div><strong>Resolución:</strong> {hierarchyData.hierarchy.sla.resolutionTimeHours} h</div>
                          <div><strong>Prioridad:</strong> {hierarchyData.hierarchy.sla.priority}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuración Disponible</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Local
                        </span>
                        <Badge className={hierarchyData.availableSLAs.local ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {hierarchyData.availableSLAs.local ? "Configurado" : "Sin configurar"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Canal
                        </span>
                        <Badge className={hierarchyData.availableSLAs.channel ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {hierarchyData.availableSLAs.channel ? "Configurado" : "Sin configurar"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Tenant
                        </span>
                        <Badge className={hierarchyData.availableSLAs.tenant ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                          {hierarchyData.availableSLAs.tenant ? "Configurado" : "Sin configurar"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Optimización */}
            <TabsContent value="optimization" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nivel de Optimización</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">{optimizationScore}/6</div>
                      <Badge className={getOptimizationColor(optimizationScore)}>
                        {getOptimizationLabel(optimizationScore)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Local específico</span>
                        <span>{hierarchyData.availableSLAs.local ? "3 pts" : "0 pts"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Canal específico</span>
                        <span>{hierarchyData.availableSLAs.channel ? "2 pts" : "0 pts"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tenant por defecto</span>
                        <span>{hierarchyData.availableSLAs.tenant ? "1 pt" : "0 pts"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recomendaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hierarchyData.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

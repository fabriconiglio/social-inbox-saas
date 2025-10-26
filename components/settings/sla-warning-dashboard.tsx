"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  Clock, 
  User, 
  MessageSquare, 
  Building, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart
} from "lucide-react"
import { SLAWarning, SLAWarningStats } from "@/lib/sla-warning-detector"

interface SLAWarningDashboardProps {
  tenantId: string
  stats: SLAWarningStats
  warnings: SLAWarning[]
  onRefresh?: () => void
  className?: string
}

export function SLAWarningDashboard({
  tenantId,
  stats,
  warnings,
  onRefresh,
  className
}: SLAWarningDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    await onRefresh?.()
    setLoading(false)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "critical": return XCircle
      case "high": return AlertTriangle
      case "medium": return AlertTriangle
      case "low": return Clock
      default: return Clock
    }
  }

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case "WHATSAPP": return "📱"
      case "INSTAGRAM": return "📸"
      case "TIKTOK": return "🎵"
      case "FACEBOOK": return "👥"
      case "TWITTER": return "🐦"
      case "TELEGRAM": return "✈️"
      default: return "💬"
    }
  }

  const getTopChannels = () => {
    const channelCounts = Object.entries(stats.byChannel)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    return channelCounts.map(([channel, count]) => ({
      channel,
      count,
      percentage: Math.round((count / stats.total) * 100)
    }))
  }

  const getTopLocals = () => {
    const localCounts = Object.entries(stats.byLocal)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    return localCounts.map(([local, count]) => ({
      local,
      count,
      percentage: Math.round((count / stats.total) * 100)
    }))
  }

  const getTopAgents = () => {
    const agentCounts = Object.entries(stats.byAgent)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
    
    return agentCounts.map(([agent, count]) => ({
      agent,
      count,
      percentage: Math.round((count / stats.total) * 100)
    }))
  }

  const getCriticalWarnings = () => {
    return warnings.filter(w => w.warningLevel === 'critical')
  }

  const getRecentWarnings = () => {
    return warnings
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard de Advertencias de SLA
              </CardTitle>
              <CardDescription>
                Estadísticas y análisis de threads con SLA por vencer
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="breakdown">Desglose</TabsTrigger>
              <TabsTrigger value="critical">Críticas</TabsTrigger>
              <TabsTrigger value="recent">Recientes</TabsTrigger>
            </TabsList>

            {/* Resumen */}
            <TabsContent value="overview" className="space-y-6">
              {/* Métricas Principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Advertencias</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.byLevel.critical}</div>
                  <div className="text-sm text-muted-foreground">Críticas</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.byLevel.high}</div>
                  <div className="text-sm text-muted-foreground">Altas</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.byLevel.medium}</div>
                  <div className="text-sm text-muted-foreground">Medias</div>
                </div>
              </div>

              {/* Distribución por Nivel */}
              <div>
                <h4 className="font-medium mb-3">Distribución por Nivel</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byLevel).map(([level, count]) => {
                    const Icon = getLevelIcon(level)
                    const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                    
                    return (
                      <div key={level} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            level === 'critical' ? 'bg-red-100 text-red-600' :
                            level === 'high' ? 'bg-orange-100 text-orange-600' :
                            level === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium capitalize">{level}</div>
                            <div className="text-sm text-muted-foreground">{count} advertencias</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{count}</div>
                          <div className="text-sm text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Alertas Críticas */}
              {stats.byLevel.critical > 0 && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">¡Atención!</div>
                    <div>Tienes {stats.byLevel.critical} advertencias críticas que requieren atención inmediata.</div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Desglose */}
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Por Canal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Por Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getTopChannels().map(({ channel, count, percentage }) => (
                        <div key={channel} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getChannelIcon(channel)}</span>
                            <span className="font-medium">{channel}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Por Local */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Por Local</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getTopLocals().map(({ local, count, percentage }) => (
                        <div key={local} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{local}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Por Agente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Por Agente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getTopAgents().map(({ agent, count, percentage }) => (
                        <div key={agent} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{agent}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{count}</div>
                            <div className="text-sm text-muted-foreground">{percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Críticas */}
            <TabsContent value="critical" className="space-y-6">
              <div className="space-y-3">
                {getCriticalWarnings().map((warning) => (
                  <div key={warning.threadId} className="p-4 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div className="font-medium">{warning.threadSubject}</div>
                          <Badge className="bg-red-100 text-red-800">Crítica</Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-3">
                          {warning.contactName} ({warning.contactHandle}) • {warning.channelType} • {warning.localName}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-red-600">
                              {warning.timeRemaining} min
                            </div>
                            <div className="text-xs text-muted-foreground">Tiempo restante</div>
                          </div>
                          
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-red-600">
                              {Math.round(warning.percentageUsed)}%
                            </div>
                            <div className="text-xs text-muted-foreground">SLA usado</div>
                          </div>
                          
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-blue-600">
                              {warning.slaName}
                            </div>
                            <div className="text-xs text-muted-foreground">SLA aplicado</div>
                          </div>
                          
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-green-600">
                              {warning.assignedToName || 'Sin asignar'}
                            </div>
                            <div className="text-xs text-muted-foreground">Asignado a</div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/app/${tenantId}/threads/${warning.threadId}`, '_blank')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver thread
                      </Button>
                    </div>
                  </div>
                ))}
                
                {getCriticalWarnings().length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="font-medium text-green-600">No hay advertencias críticas</div>
                    <div className="text-sm text-muted-foreground">
                      Excelente trabajo manteniendo los SLAs al día
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Recientes */}
            <TabsContent value="recent" className="space-y-6">
              <div className="space-y-3">
                {getRecentWarnings().map((warning) => (
                  <div key={warning.threadId} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            warning.warningLevel === 'critical' ? 'bg-red-100 text-red-600' :
                            warning.warningLevel === 'high' ? 'bg-orange-100 text-orange-600' :
                            warning.warningLevel === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {getLevelIcon(warning.warningLevel)({ className: "h-3 w-3" })}
                          </div>
                          
                          <div className="font-medium">{warning.threadSubject}</div>
                          <Badge className={getLevelColor(warning.warningLevel)}>
                            {warning.warningLevel.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {warning.contactName} ({warning.contactHandle}) • {warning.channelType} • {warning.localName}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {warning.timeRemaining} min restantes
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {Math.round(warning.percentageUsed)}% usado
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {warning.assignedToName || 'Sin asignar'}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/app/${tenantId}/threads/${warning.threadId}`, '_blank')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
                
                {getRecentWarnings().length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="font-medium text-green-600">No hay advertencias recientes</div>
                    <div className="text-sm text-muted-foreground">
                      No hay threads con SLA por vencer
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

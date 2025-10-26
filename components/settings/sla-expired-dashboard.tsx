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
  PieChart,
  AlertCircle,
  Zap
} from "lucide-react"
import { SLAExpired, SLAExpiredStats } from "@/lib/sla-expired-detector"

interface SLAExpiredDashboardProps {
  tenantId: string
  stats: SLAExpiredStats
  expired: SLAExpired[]
  onRefresh?: () => void
  className?: string
}

export function SLAExpiredDashboard({
  tenantId,
  stats,
  expired,
  onRefresh,
  className
}: SLAExpiredDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    await onRefresh?.()
    setLoading(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "urgent": return "bg-red-100 text-red-800"
      case "critical": return "bg-orange-100 text-orange-800"
      case "overdue": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "urgent": return XCircle
      case "critical": return AlertTriangle
      case "overdue": return Clock
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

  const getUrgentExpired = () => {
    return expired.filter(e => e.severity === 'urgent')
  }

  const getCriticalExpired = () => {
    return expired.filter(e => e.severity === 'critical')
  }

  const getRecentExpired = () => {
    return expired
      .sort((a, b) => new Date(b.expiredAt).getTime() - new Date(a.expiredAt).getTime())
      .slice(0, 10)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard de SLAs Vencidos
              </CardTitle>
              <CardDescription>
                Estadísticas y análisis de threads con SLA vencido
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
              <TabsTrigger value="urgent">Urgentes</TabsTrigger>
              <TabsTrigger value="recent">Recientes</TabsTrigger>
            </TabsList>

            {/* Resumen */}
            <TabsContent value="overview" className="space-y-6">
              {/* Métricas Principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Vencidos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.bySeverity.urgent}</div>
                  <div className="text-sm text-muted-foreground">Urgentes</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.bySeverity.critical}</div>
                  <div className="text-sm text-muted-foreground">Críticos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.bySeverity.overdue}</div>
                  <div className="text-sm text-muted-foreground">Retrasados</div>
                </div>
              </div>

              {/* Estadísticas de Tiempo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tiempo Promedio de Retraso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {formatTime(stats.averageOverdue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Promedio de todos los SLAs vencidos
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Máximo Retraso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {formatTime(stats.maxOverdue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      El SLA más retrasado
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Distribución por Severidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Urgentes</span>
                        <span>{stats.bySeverity.urgent} ({Math.round((stats.bySeverity.urgent / stats.total) * 100)}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Críticos</span>
                        <span>{stats.bySeverity.critical} ({Math.round((stats.bySeverity.critical / stats.total) * 100)}%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Retrasados</span>
                        <span>{stats.bySeverity.overdue} ({Math.round((stats.bySeverity.overdue / stats.total) * 100)}%)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alertas Críticas */}
              {stats.bySeverity.urgent > 0 && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">¡Atención Crítica!</div>
                    <div>Tienes {stats.bySeverity.urgent} SLAs urgentes que requieren atención inmediata.</div>
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

            {/* Urgentes */}
            <TabsContent value="urgent" className="space-y-6">
              <div className="space-y-3">
                {getUrgentExpired().map((item) => (
                  <div key={item.threadId} className="p-4 border rounded-lg bg-red-50 border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div className="font-medium">{item.threadSubject}</div>
                          <Badge className="bg-red-100 text-red-800">Urgente</Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-3">
                          {item.contactName} ({item.contactHandle}) • {item.channelType} • {item.localName}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-red-600">
                              {formatTime(item.timeOverdue)}
                            </div>
                            <div className="text-xs text-muted-foreground">Tiempo de retraso</div>
                          </div>
                          
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-red-600">
                              {Math.round(item.percentageOverdue)}%
                            </div>
                            <div className="text-xs text-muted-foreground">% de retraso</div>
                          </div>
                          
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-blue-600">
                              {item.slaName}
                            </div>
                            <div className="text-xs text-muted-foreground">SLA aplicado</div>
                          </div>
                          
                          <div className="text-center p-2 border rounded bg-white">
                            <div className="text-lg font-bold text-green-600">
                              {item.assignedToName || 'Sin asignar'}
                            </div>
                            <div className="text-xs text-muted-foreground">Asignado a</div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/app/${tenantId}/threads/${item.threadId}`, '_blank')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver thread
                      </Button>
                    </div>
                  </div>
                ))}
                
                {getUrgentExpired().length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="font-medium text-green-600">No hay SLAs urgentes</div>
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
                {getRecentExpired().map((item) => (
                  <div key={item.threadId} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            item.severity === 'urgent' ? 'bg-red-100 text-red-600' :
                            item.severity === 'critical' ? 'bg-orange-100 text-orange-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {getSeverityIcon(item.severity)({ className: "h-3 w-3" })}
                          </div>
                          
                          <div className="font-medium">{item.threadSubject}</div>
                          <Badge className={getSeverityColor(item.severity)}>
                            {item.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {item.contactName} ({item.contactHandle}) • {item.channelType} • {item.localName}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.timeOverdue)} de retraso
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {Math.round(item.percentageOverdue)}% de retraso
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.assignedToName || 'Sin asignar'}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/app/${tenantId}/threads/${item.threadId}`, '_blank')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
                
                {getRecentExpired().length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="font-medium text-green-600">No hay SLAs vencidos recientes</div>
                    <div className="text-sm text-muted-foreground">
                      No hay threads con SLA vencido
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

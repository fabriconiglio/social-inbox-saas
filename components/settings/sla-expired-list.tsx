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
  Filter,
  SortAsc,
  SortDesc,
  AlertCircle,
  Zap
} from "lucide-react"
import { SLAExpired } from "@/lib/sla-expired-detector"

interface SLAExpiredListProps {
  tenantId: string
  expired: SLAExpired[]
  onRefresh?: () => void
  onMarkAsViewed?: (threadId: string) => void
  className?: string
}

const SEVERITY_COLORS = {
  overdue: "bg-yellow-100 text-yellow-800",
  critical: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
}

const SEVERITY_LABELS = {
  overdue: "Retrasado",
  critical: "Crítico",
  urgent: "Urgente"
}

const SEVERITY_ICONS = {
  overdue: Clock,
  critical: AlertTriangle,
  urgent: XCircle
}

export function SLAExpiredList({
  tenantId,
  expired,
  onRefresh,
  onMarkAsViewed,
  className
}: SLAExpiredListProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState<"timeOverdue" | "percentageOverdue" | "severity">("timeOverdue")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  const formatPercentage = (percentage: number) => {
    return `${Math.round(percentage)}%`
  }

  const getFilteredExpired = () => {
    let filtered = expired

    // Filtrar por severidad
    if (filterSeverity !== "all") {
      filtered = filtered.filter(e => e.severity === filterSeverity)
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "timeOverdue":
          comparison = a.timeOverdue - b.timeOverdue
          break
        case "percentageOverdue":
          comparison = a.percentageOverdue - b.percentageOverdue
          break
        case "severity":
          const severityOrder = { urgent: 3, critical: 2, overdue: 1 }
          comparison = severityOrder[a.severity] - severityOrder[b.severity]
          break
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }

  const getTabExpired = (tab: string) => {
    const filtered = getFilteredExpired()
    
    switch (tab) {
      case "urgent":
        return filtered.filter(e => e.severity === "urgent")
      case "critical":
        return filtered.filter(e => e.severity === "critical")
      case "overdue":
        return filtered.filter(e => e.severity === "overdue")
      default:
        return filtered
    }
  }

  const getExpiredStats = () => {
    const stats = {
      total: expired.length,
      urgent: expired.filter(e => e.severity === "urgent").length,
      critical: expired.filter(e => e.severity === "critical").length,
      overdue: expired.filter(e => e.severity === "overdue").length
    }
    return stats
  }

  const stats = getExpiredStats()

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                SLAs Vencidos
              </CardTitle>
              <CardDescription>
                Threads con SLA completamente vencido
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="urgent">Urgentes ({stats.urgent})</TabsTrigger>
              <TabsTrigger value="critical">Críticos ({stats.critical})</TabsTrigger>
              <TabsTrigger value="overdue">Retrasados ({stats.overdue})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Filtros y Ordenamiento */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filtrar:</span>
                  <select 
                    value={filterSeverity} 
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">Todas las severidades</option>
                    <option value="urgent">Urgentes</option>
                    <option value="critical">Críticos</option>
                    <option value="overdue">Retrasados</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Ordenar:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="timeOverdue">Tiempo de retraso</option>
                    <option value="percentageOverdue">Porcentaje de retraso</option>
                    <option value="severity">Severidad</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Lista de SLAs Vencidos */}
              <div className="space-y-3">
                {getTabExpired(activeTab).map((item) => {
                  const Icon = SEVERITY_ICONS[item.severity]
                  
                  return (
                    <div key={item.threadId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              item.severity === 'urgent' ? 'bg-red-100 text-red-600' :
                              item.severity === 'critical' ? 'bg-orange-100 text-orange-600' :
                              'bg-yellow-100 text-yellow-600'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium">{item.threadSubject}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.contactName} ({item.contactHandle}) • {item.channelType} • {item.localName}
                              </div>
                            </div>
                            
                            <Badge className={SEVERITY_COLORS[item.severity]}>
                              {SEVERITY_LABELS[item.severity]}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-red-600">
                                {formatTime(item.timeOverdue)}
                              </div>
                              <div className="text-xs text-muted-foreground">Tiempo de retraso</div>
                            </div>
                            
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-orange-600">
                                {formatPercentage(item.percentageOverdue)}
                              </div>
                              <div className="text-xs text-muted-foreground">% de retraso</div>
                            </div>
                            
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-blue-600">
                                {formatTime(item.responseTimeMinutes)}
                              </div>
                              <div className="text-xs text-muted-foreground">SLA original</div>
                            </div>
                            
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-green-600">
                                {item.slaName}
                              </div>
                              <div className="text-xs text-muted-foreground">SLA aplicado</div>
                            </div>
                          </div>
                          
                          {item.assignedToName && (
                            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              Asignado a: {item.assignedToName}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Creado: {new Date(item.createdAt).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Vencido: {new Date(item.expiredAt).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Último mensaje: {new Date(item.lastMessageAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkAsViewed?.(item.threadId)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como visto
                          </Button>
                          
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
                    </div>
                  )
                })}
                
                {getTabExpired(activeTab).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="font-medium text-green-600">No hay SLAs vencidos</div>
                    <div className="text-sm text-muted-foreground">
                      {activeTab === "all" 
                        ? "Excelente trabajo manteniendo los SLAs al día"
                        : `No hay SLAs vencidos de severidad ${activeTab}`
                      }
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

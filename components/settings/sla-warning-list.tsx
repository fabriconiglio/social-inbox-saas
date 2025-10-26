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
  SortDesc
} from "lucide-react"
import { SLAWarning } from "@/lib/sla-warning-detector"

interface SLAWarningListProps {
  tenantId: string
  warnings: SLAWarning[]
  onRefresh?: () => void
  onMarkAsViewed?: (threadId: string) => void
  className?: string
}

const WARNING_LEVEL_COLORS = {
  low: "bg-yellow-100 text-yellow-800",
  medium: "bg-orange-100 text-orange-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-200 text-red-900"
}

const WARNING_LEVEL_LABELS = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica"
}

const WARNING_LEVEL_ICONS = {
  low: Clock,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: XCircle
}

export function SLAWarningList({
  tenantId,
  warnings,
  onRefresh,
  onMarkAsViewed,
  className
}: SLAWarningListProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [sortBy, setSortBy] = useState<"timeRemaining" | "percentageUsed" | "warningLevel">("timeRemaining")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterLevel, setFilterLevel] = useState<string>("all")

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

  const getFilteredWarnings = () => {
    let filtered = warnings

    // Filtrar por nivel
    if (filterLevel !== "all") {
      filtered = filtered.filter(w => w.warningLevel === filterLevel)
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "timeRemaining":
          comparison = a.timeRemaining - b.timeRemaining
          break
        case "percentageUsed":
          comparison = a.percentageUsed - b.percentageUsed
          break
        case "warningLevel":
          const levelOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          comparison = levelOrder[a.warningLevel] - levelOrder[b.warningLevel]
          break
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }

  const getTabWarnings = (tab: string) => {
    const filtered = getFilteredWarnings()
    
    switch (tab) {
      case "critical":
        return filtered.filter(w => w.warningLevel === "critical")
      case "high":
        return filtered.filter(w => w.warningLevel === "high")
      case "medium":
        return filtered.filter(w => w.warningLevel === "medium")
      case "low":
        return filtered.filter(w => w.warningLevel === "low")
      default:
        return filtered
    }
  }

  const getWarningStats = () => {
    const stats = {
      total: warnings.length,
      critical: warnings.filter(w => w.warningLevel === "critical").length,
      high: warnings.filter(w => w.warningLevel === "high").length,
      medium: warnings.filter(w => w.warningLevel === "medium").length,
      low: warnings.filter(w => w.warningLevel === "low").length
    }
    return stats
  }

  const stats = getWarningStats()

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Advertencias de SLA
              </CardTitle>
              <CardDescription>
                Threads con SLA por vencer (75% o más del tiempo transcurrido)
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
              <TabsTrigger value="critical">Críticas ({stats.critical})</TabsTrigger>
              <TabsTrigger value="high">Altas ({stats.high})</TabsTrigger>
              <TabsTrigger value="medium">Medias ({stats.medium})</TabsTrigger>
              <TabsTrigger value="low">Bajas ({stats.low})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Filtros y Ordenamiento */}
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filtrar:</span>
                  <select 
                    value={filterLevel} 
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">Todos los niveles</option>
                    <option value="critical">Críticas</option>
                    <option value="high">Altas</option>
                    <option value="medium">Medias</option>
                    <option value="low">Bajas</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Ordenar:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="timeRemaining">Tiempo restante</option>
                    <option value="percentageUsed">Porcentaje usado</option>
                    <option value="warningLevel">Nivel de advertencia</option>
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

              {/* Lista de Advertencias */}
              <div className="space-y-3">
                {getTabWarnings(activeTab).map((warning) => {
                  const Icon = WARNING_LEVEL_ICONS[warning.warningLevel]
                  
                  return (
                    <div key={warning.threadId} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              warning.warningLevel === 'critical' ? 'bg-red-100 text-red-600' :
                              warning.warningLevel === 'high' ? 'bg-orange-100 text-orange-600' :
                              warning.warningLevel === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium">{warning.threadSubject}</div>
                              <div className="text-sm text-muted-foreground">
                                {warning.contactName} ({warning.contactHandle}) • {warning.channelType} • {warning.localName}
                              </div>
                            </div>
                            
                            <Badge className={WARNING_LEVEL_COLORS[warning.warningLevel]}>
                              {WARNING_LEVEL_LABELS[warning.warningLevel]}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-red-600">
                                {formatTime(warning.timeRemaining)}
                              </div>
                              <div className="text-xs text-muted-foreground">Tiempo restante</div>
                            </div>
                            
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-orange-600">
                                {formatPercentage(warning.percentageUsed)}
                              </div>
                              <div className="text-xs text-muted-foreground">SLA usado</div>
                            </div>
                            
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-blue-600">
                                {formatTime(warning.responseTimeMinutes)}
                              </div>
                              <div className="text-xs text-muted-foreground">SLA total</div>
                            </div>
                            
                            <div className="text-center p-2 border rounded">
                              <div className="text-lg font-bold text-green-600">
                                {warning.slaName}
                              </div>
                              <div className="text-xs text-muted-foreground">SLA aplicado</div>
                            </div>
                          </div>
                          
                          {warning.assignedToName && (
                            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              Asignado a: {warning.assignedToName}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Creado: {new Date(warning.createdAt).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Último mensaje: {new Date(warning.lastMessageAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkAsViewed?.(warning.threadId)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como vista
                          </Button>
                          
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
                    </div>
                  )
                })}
                
                {getTabWarnings(activeTab).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="font-medium text-green-600">No hay advertencias de SLA</div>
                    <div className="text-sm text-muted-foreground">
                      {activeTab === "all" 
                        ? "No hay threads con SLA por vencer"
                        : `No hay advertencias de nivel ${activeTab}`
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

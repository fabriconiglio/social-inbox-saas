"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Zap,
  Timer,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { getSLAWarningStats } from "@/lib/sla-warning-detector"
import { getSLAExpiredStats } from "@/lib/sla-expired-detector"

interface SLAVisualSummaryProps {
  tenantId: string
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function SLAVisualSummary({
  tenantId,
  className,
  showDetails = true,
  compact = false
}: SLAVisualSummaryProps) {
  const [warningStats, setWarningStats] = useState<any>(null)
  const [expiredStats, setExpiredStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSLAStats()
  }, [tenantId])

  const loadSLAStats = async () => {
    try {
      setLoading(true)
      
      const [warnings, expired] = await Promise.all([
        getSLAWarningStats(tenantId),
        getSLAExpiredStats(tenantId)
      ])
      
      setWarningStats(warnings)
      setExpiredStats(expired)
      
    } catch (error) {
      console.error("[SLA Visual Summary] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalIssues = () => {
    if (!warningStats || !expiredStats) return 0
    return warningStats.total + expiredStats.total
  }

  const getCriticalIssues = () => {
    if (!warningStats || !expiredStats) return 0
    return warningStats.byLevel.critical + expiredStats.bySeverity.urgent + expiredStats.bySeverity.critical
  }

  const getStatusColor = () => {
    const critical = getCriticalIssues()
    const total = getTotalIssues()
    
    if (critical > 0) return "text-red-600"
    if (total > 0) return "text-orange-600"
    return "text-green-600"
  }

  const getStatusIcon = () => {
    const critical = getCriticalIssues()
    const total = getTotalIssues()
    
    if (critical > 0) return XCircle
    if (total > 0) return AlertTriangle
    return CheckCircle
  }

  const getStatusLabel = () => {
    const critical = getCriticalIssues()
    const total = getTotalIssues()
    
    if (critical > 0) return "Crítico"
    if (total > 0) return "Atención"
    return "OK"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={cn("flex items-center gap-1", getStatusColor())}>
          {getStatusIcon()({ className: "h-4 w-4" })}
          <span className="text-sm font-medium">{getStatusLabel()}</span>
        </div>
        {getTotalIssues() > 0 && (
          <Badge variant="outline" className="text-xs">
            {getTotalIssues()} issues
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={cn("flex items-center gap-1", getStatusColor())}>
            {getStatusIcon()({ className: "h-5 w-5" })}
            <span>Estado de SLAs</span>
          </div>
          {getTotalIssues() > 0 && (
            <Badge variant="outline" className="ml-auto">
              {getTotalIssues()} issues
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Resumen de advertencias y SLAs vencidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {warningStats?.total || 0}
            </div>
            <div className="text-sm text-muted-foreground">Advertencias</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {expiredStats?.total || 0}
            </div>
            <div className="text-sm text-muted-foreground">Vencidos</div>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Advertencias por nivel */}
            {warningStats && warningStats.total > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Advertencias por nivel:</div>
                <div className="space-y-1">
                  {warningStats.byLevel.critical > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>Críticas</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {warningStats.byLevel.critical}
                      </Badge>
                    </div>
                  )}
                  {warningStats.byLevel.high > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                        <span>Altas</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        {warningStats.byLevel.high}
                      </Badge>
                    </div>
                  )}
                  {warningStats.byLevel.medium > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <span>Medias</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {warningStats.byLevel.medium}
                      </Badge>
                    </div>
                  )}
                  {warningStats.byLevel.low > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <span>Bajas</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {warningStats.byLevel.low}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SLAs vencidos por severidad */}
            {expiredStats && expiredStats.total > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">SLAs vencidos por severidad:</div>
                <div className="space-y-1">
                  {expiredStats.bySeverity.urgent > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-red-600" />
                        <span>Urgentes</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {expiredStats.bySeverity.urgent}
                      </Badge>
                    </div>
                  )}
                  {expiredStats.bySeverity.critical > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>Críticos</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {expiredStats.bySeverity.critical}
                      </Badge>
                    </div>
                  )}
                  {expiredStats.bySeverity.overdue > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                        <span>Retrasados</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">
                        {expiredStats.bySeverity.overdue}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estadísticas de tiempo */}
            {expiredStats && expiredStats.total > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Estadísticas de retraso:</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Promedio de retraso:</span>
                    <span className="font-medium">
                      {Math.floor(expiredStats.averageOverdue / 60)}h {expiredStats.averageOverdue % 60}min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Máximo retraso:</span>
                    <span className="font-medium">
                      {Math.floor(expiredStats.maxOverdue / 60)}h {expiredStats.maxOverdue % 60}min
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={loadSLAStats}>
                <Timer className="h-3 w-3 mr-1" />
                Actualizar
              </Button>
              {getTotalIssues() > 0 && (
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Ver detalles
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Hook para usar el estado de SLA en otros componentes
export function useSLAStatus(tenantId: string, threadId: string) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [tenantId, threadId])

  const loadStatus = async () => {
    try {
      setLoading(true)
      // Implementar lógica de carga de estado
      // Esto se puede expandir según necesidades específicas
    } catch (error) {
      console.error("[Use SLA Status] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, refresh: loadStatus }
}

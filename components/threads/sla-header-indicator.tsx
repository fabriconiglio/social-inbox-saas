"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  AlertTriangle, 
  XCircle, 
  Clock,
  Bell,
  Zap
} from "lucide-react"
import { getSLAWarningStats } from "@/lib/sla-warning-detector"
import { getSLAExpiredStats } from "@/lib/sla-expired-detector"

interface SLAHeaderIndicatorProps {
  tenantId: string
  className?: string
  showNotifications?: boolean
  onNotificationClick?: () => void
}

export function SLAHeaderIndicator({
  tenantId,
  className,
  showNotifications = true,
  onNotificationClick
}: SLAHeaderIndicatorProps) {
  const [stats, setStats] = useState<{
    warnings: any
    expired: any
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSLAStats()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadSLAStats, 30000)
    return () => clearInterval(interval)
  }, [tenantId])

  const loadSLAStats = async () => {
    try {
      setLoading(true)
      
      const [warnings, expired] = await Promise.all([
        getSLAWarningStats(tenantId),
        getSLAExpiredStats(tenantId)
      ])
      
      setStats({ warnings, expired })
      
    } catch (error) {
      console.error("[SLA Header Indicator] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalIssues = () => {
    if (!stats) return 0
    return stats.warnings.total + stats.expired.total
  }

  const getCriticalIssues = () => {
    if (!stats) return 0
    return stats.warnings.byLevel.critical + stats.expired.bySeverity.urgent + stats.expired.bySeverity.critical
  }

  const getIndicatorConfig = () => {
    const critical = getCriticalIssues()
    const total = getTotalIssues()
    
    if (critical > 0) {
      return {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
        label: "Crítico",
        description: `${critical} issues críticos`
      }
    }
    
    if (total > 0) {
      return {
        icon: AlertTriangle,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
        label: "Atención",
        description: `${total} issues pendientes`
      }
    }
    
    return {
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      label: "OK",
      description: "Todos los SLAs al día"
    }
  }

  const config = getIndicatorConfig()
  const Icon = config.icon

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    )
  }

  const indicatorContent = (
    <Button
      variant="outline"
      size="sm"
      className={`${config.bgColor} ${config.borderColor} ${config.color} hover:opacity-80 transition-opacity ${className}`}
      onClick={onNotificationClick}
    >
      <Icon className="h-4 w-4 mr-1" />
      <span className="font-medium">{config.label}</span>
      {getTotalIssues() > 0 && (
        <Badge 
          variant="secondary" 
          className={`ml-2 ${getCriticalIssues() > 0 ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'}`}
        >
          {getTotalIssues()}
        </Badge>
      )}
    </Button>
  )

  if (!showNotifications) {
    return indicatorContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicatorContent}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-3">
            <div className="font-medium">{config.description}</div>
            
            {stats && (
              <div className="space-y-2 text-sm">
                {/* Advertencias */}
                {stats.warnings.total > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium text-orange-600">Advertencias ({stats.warnings.total})</div>
                    <div className="space-y-1">
                      {stats.warnings.byLevel.critical > 0 && (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-red-600" />
                          <span>Críticas: {stats.warnings.byLevel.critical}</span>
                        </div>
                      )}
                      {stats.warnings.byLevel.high > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                          <span>Altas: {stats.warnings.byLevel.high}</span>
                        </div>
                      )}
                      {stats.warnings.byLevel.medium > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-600" />
                          <span>Medias: {stats.warnings.byLevel.medium}</span>
                        </div>
                      )}
                      {stats.warnings.byLevel.low > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>Bajas: {stats.warnings.byLevel.low}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* SLAs vencidos */}
                {stats.expired.total > 0 && (
                  <div className="space-y-1">
                    <div className="font-medium text-red-600">Vencidos ({stats.expired.total})</div>
                    <div className="space-y-1">
                      {stats.expired.bySeverity.urgent > 0 && (
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-red-600" />
                          <span>Urgentes: {stats.expired.bySeverity.urgent}</span>
                        </div>
                      )}
                      {stats.expired.bySeverity.critical > 0 && (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-red-600" />
                          <span>Críticos: {stats.expired.bySeverity.critical}</span>
                        </div>
                      )}
                      {stats.expired.bySeverity.overdue > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                          <span>Retrasados: {stats.expired.bySeverity.overdue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Estadísticas adicionales */}
                {stats.expired.total > 0 && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <div>Promedio de retraso: {Math.floor(stats.expired.averageOverdue / 60)}h {stats.expired.averageOverdue % 60}min</div>
                    <div>Máximo retraso: {Math.floor(stats.expired.maxOverdue / 60)}h {stats.expired.maxOverdue % 60}min</div>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <Bell className="h-3 w-3 mr-1" />
                Ver todas las notificaciones
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Componente compacto para espacios reducidos
export function SLAHeaderIndicatorCompact({
  tenantId,
  className
}: {
  tenantId: string
  className?: string
}) {
  const [totalIssues, setTotalIssues] = useState(0)
  const [criticalIssues, setCriticalIssues] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSLAStats()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadSLAStats, 30000)
    return () => clearInterval(interval)
  }, [tenantId])

  const loadSLAStats = async () => {
    try {
      setLoading(true)
      
      const [warnings, expired] = await Promise.all([
        getSLAWarningStats(tenantId),
        getSLAExpiredStats(tenantId)
      ])
      
      const total = warnings.total + expired.total
      const critical = warnings.byLevel.critical + expired.bySeverity.urgent + expired.bySeverity.critical
      
      setTotalIssues(total)
      setCriticalIssues(critical)
      
    } catch (error) {
      console.error("[SLA Header Indicator Compact] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
      </div>
    )
  }

  if (totalIssues === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative ${className}`}>
            <Bell className={`h-5 w-5 ${criticalIssues > 0 ? 'text-red-600' : 'text-orange-600'}`} />
            <Badge 
              className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs ${
                criticalIssues > 0 ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
              }`}
            >
              {totalIssues}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-sm">
            {criticalIssues > 0 ? (
              <span className="text-red-600 font-medium">{criticalIssues} issues críticos</span>
            ) : (
              <span className="text-orange-600 font-medium">{totalIssues} issues pendientes</span>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Clock, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Zap,
  Timer,
  AlertCircle
} from "lucide-react"
import { getThreadSLATimeRemaining } from "@/lib/sla-warning-detector"
import { getThreadSLAOverdue } from "@/lib/sla-expired-detector"

interface SLAStatusIndicatorProps {
  tenantId: string
  threadId: string
  className?: string
  showDetails?: boolean
  size?: "sm" | "md" | "lg"
}

export function SLAStatusIndicator({
  tenantId,
  threadId,
  className,
  showDetails = false,
  size = "md"
}: SLAStatusIndicatorProps) {
  const [slaStatus, setSlaStatus] = useState<{
    type: 'none' | 'warning' | 'expired'
    level: 'low' | 'medium' | 'high' | 'critical' | 'urgent' | 'overdue' | 'none'
    timeRemaining?: number
    timeOverdue?: number
    percentageUsed?: number
    percentageOverdue?: number
    isWarning: boolean
    isExpired: boolean
  } | null>(null)
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSLAStatus()
  }, [tenantId, threadId])

  const loadSLAStatus = async () => {
    try {
      setLoading(true)
      
      // Verificar si hay advertencia de SLA
      const warningStatus = await getThreadSLATimeRemaining(tenantId, threadId)
      
      if (warningStatus && warningStatus.isWarning) {
        setSlaStatus({
          type: 'warning',
          level: warningStatus.warningLevel,
          timeRemaining: warningStatus.timeRemaining,
          percentageUsed: warningStatus.percentageUsed,
          isWarning: true,
          isExpired: false
        })
        return
      }
      
      // Verificar si hay SLA vencido
      const expiredStatus = await getThreadSLAOverdue(tenantId, threadId)
      
      if (expiredStatus && expiredStatus.isExpired) {
        setSlaStatus({
          type: 'expired',
          level: expiredStatus.severity,
          timeOverdue: expiredStatus.timeOverdue,
          percentageOverdue: expiredStatus.percentageOverdue,
          isWarning: false,
          isExpired: true
        })
        return
      }
      
      // Sin SLA configurado o dentro del tiempo
      setSlaStatus({
        type: 'none',
        level: 'none',
        isWarning: false,
        isExpired: false
      })
      
    } catch (error) {
      console.error("[SLA Status Indicator] Error:", error)
      setSlaStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = () => {
    if (!slaStatus) return null

    switch (slaStatus.type) {
      case 'warning':
        return getWarningConfig(slaStatus.level)
      case 'expired':
        return getExpiredConfig(slaStatus.level)
      default:
        return getNormalConfig()
    }
  }

  const getWarningConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600',
          label: 'SLA Crítico',
          description: 'SLA por vencer (95%+)'
        }
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          iconColor: 'text-orange-600',
          label: 'SLA Alto',
          description: 'SLA por vencer (90%+)'
        }
      case 'medium':
        return {
          icon: AlertTriangle,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          iconColor: 'text-yellow-600',
          label: 'SLA Medio',
          description: 'SLA por vencer (85%+)'
        }
      case 'low':
        return {
          icon: Clock,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-600',
          label: 'SLA Bajo',
          description: 'SLA por vencer (75%+)'
        }
      default:
        return getNormalConfig()
    }
  }

  const getExpiredConfig = (level: string) => {
    switch (level) {
      case 'urgent':
        return {
          icon: Zap,
          color: 'bg-red-200 text-red-900 border-red-300',
          iconColor: 'text-red-700',
          label: 'SLA Urgente',
          description: 'SLA vencido (2+ horas)'
        }
      case 'critical':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-800 border-red-200',
          iconColor: 'text-red-600',
          label: 'SLA Crítico',
          description: 'SLA vencido (1+ hora)'
        }
      case 'overdue':
        return {
          icon: AlertCircle,
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          iconColor: 'text-orange-600',
          label: 'SLA Retrasado',
          description: 'SLA vencido'
        }
      default:
        return getNormalConfig()
    }
  }

  const getNormalConfig = () => ({
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
    label: 'SLA OK',
    description: 'Dentro del tiempo de SLA'
  })

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-sm px-4 py-2'
      default:
        return 'text-sm px-3 py-1.5'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3'
      case 'lg':
        return 'h-5 w-5'
      default:
        return 'h-4 w-4'
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-full ${getSizeClasses()}`}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span className="text-gray-400">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!slaStatus) {
    return null
  }

  const config = getStatusConfig()
  if (!config) return null

  const Icon = config.icon

  const badgeContent = (
    <Badge 
      className={`${config.color} ${getSizeClasses()} ${className}`}
      variant="outline"
    >
      <Icon className={`${getIconSize()} mr-1 ${config.iconColor}`} />
      <span className="font-medium">{config.label}</span>
    </Badge>
  )

  if (!showDetails) {
    return badgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{config.label}</div>
            <div className="text-sm text-muted-foreground">
              {config.description}
            </div>
            
            {slaStatus.type === 'warning' && slaStatus.timeRemaining !== undefined && (
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  <span>Tiempo restante: {formatTime(slaStatus.timeRemaining)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Progreso: {Math.round(slaStatus.percentageUsed || 0)}%</span>
                </div>
              </div>
            )}
            
            {slaStatus.type === 'expired' && slaStatus.timeOverdue !== undefined && (
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  <span>Retraso: {formatTime(slaStatus.timeOverdue)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Exceso: {Math.round(slaStatus.percentageOverdue || 0)}%</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

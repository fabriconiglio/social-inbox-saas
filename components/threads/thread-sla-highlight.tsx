"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { SLAStatusIndicator } from "./sla-status-indicator"
import { getThreadSLATimeRemaining } from "@/lib/sla-warning-detector"
import { getThreadSLAOverdue } from "@/lib/sla-expired-detector"

interface ThreadSLAHighlightProps {
  tenantId: string
  threadId: string
  children: React.ReactNode
  className?: string
  showBorder?: boolean
  showBackground?: boolean
  showBadge?: boolean
  badgePosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
}

export function ThreadSLAHighlight({
  tenantId,
  threadId,
  children,
  className,
  showBorder = true,
  showBackground = true,
  showBadge = true,
  badgePosition = "top-right"
}: ThreadSLAHighlightProps) {
  const [slaStatus, setSlaStatus] = useState<{
    type: 'none' | 'warning' | 'expired'
    level: 'low' | 'medium' | 'high' | 'critical' | 'urgent' | 'overdue' | 'none'
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
      console.error("[Thread SLA Highlight] Error:", error)
      setSlaStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const getHighlightStyles = () => {
    if (!slaStatus || slaStatus.type === 'none') {
      return {
        border: '',
        background: '',
        badge: null
      }
    }

    const styles = {
      border: '',
      background: '',
      badge: null as React.ReactNode | null
    }

    switch (slaStatus.type) {
      case 'warning':
        switch (slaStatus.level) {
          case 'critical':
            styles.border = 'border-red-300 border-2'
            styles.background = 'bg-red-50/30'
            break
          case 'high':
            styles.border = 'border-orange-300 border-2'
            styles.background = 'bg-orange-50/30'
            break
          case 'medium':
            styles.border = 'border-yellow-300 border-2'
            styles.background = 'bg-yellow-50/30'
            break
          case 'low':
            styles.border = 'border-blue-300 border-2'
            styles.background = 'bg-blue-50/30'
            break
        }
        break
      case 'expired':
        switch (slaStatus.level) {
          case 'urgent':
            styles.border = 'border-red-400 border-2'
            styles.background = 'bg-red-100/50'
            break
          case 'critical':
            styles.border = 'border-red-300 border-2'
            styles.background = 'bg-red-50/50'
            break
          case 'overdue':
            styles.border = 'border-orange-300 border-2'
            styles.background = 'bg-orange-50/50'
            break
        }
        break
    }

    if (showBadge) {
      styles.badge = (
        <div className={cn(
          "absolute z-10",
          badgePosition === "top-right" && "top-2 right-2",
          badgePosition === "top-left" && "top-2 left-2",
          badgePosition === "bottom-right" && "bottom-2 right-2",
          badgePosition === "bottom-left" && "bottom-2 left-2"
        )}>
          <SLAStatusIndicator
            tenantId={tenantId}
            threadId={threadId}
            size="sm"
            showDetails={true}
          />
        </div>
      )
    }

    return styles
  }

  const getPulseAnimation = () => {
    if (!slaStatus) return ''
    
    // Solo animar si es crítico o urgente
    if (slaStatus.level === 'critical' || slaStatus.level === 'urgent') {
      return 'animate-pulse'
    }
    
    return ''
  }

  const styles = getHighlightStyles()
  const pulseClass = getPulseAnimation()

  return (
    <div className={cn(
      "relative",
      showBorder && styles.border,
      showBackground && styles.background,
      pulseClass,
      className
    )}>
      {children}
      {styles.badge}
    </div>
  )
}

// Componente específico para cards de thread
interface ThreadCardSLAProps {
  tenantId: string
  threadId: string
  children: React.ReactNode
  className?: string
}

export function ThreadCardSLA({
  tenantId,
  threadId,
  children,
  className
}: ThreadCardSLAProps) {
  return (
    <ThreadSLAHighlight
      tenantId={tenantId}
      threadId={threadId}
      showBorder={true}
      showBackground={true}
      showBadge={true}
      badgePosition="top-right"
      className={className}
    >
      {children}
    </ThreadSLAHighlight>
  )
}

// Componente específico para filas de tabla
interface ThreadRowSLAProps {
  tenantId: string
  threadId: string
  children: React.ReactNode
  className?: string
}

export function ThreadRowSLA({
  tenantId,
  threadId,
  children,
  className
}: ThreadRowSLAProps) {
  return (
    <ThreadSLAHighlight
      tenantId={tenantId}
      threadId={threadId}
      showBorder={false}
      showBackground={true}
      showBadge={false}
      className={cn("hover:bg-opacity-50", className)}
    >
      {children}
    </ThreadSLAHighlight>
  )
}

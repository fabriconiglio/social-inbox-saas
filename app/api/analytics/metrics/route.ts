import { NextRequest, NextResponse } from "next/server"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { calculateAdvancedAnalytics, calculateAverageFirstResponseTimeByAgent, calculateMessagesByHour, detectVolumePeaks, calculateVolumeTimeline, calculatePeriodComparison, calculateScheduleHeatmap, calculateConversationFunnel, calculateAgentRanking, calculateConversationVolume } from "@/lib/analytics-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const tenantId = searchParams.get("tenantId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const includeAgents = searchParams.get("includeAgents") === "true"
    const includeHourly = searchParams.get("includeHourly") === "true"
    const includePeaks = searchParams.get("includePeaks") === "true"
    const includeTimeline = searchParams.get("includeTimeline") === "true"
    const granularity = (searchParams.get("granularity") as 'hour' | 'day' | 'week') || 'day'
    const includeComparison = searchParams.get("includeComparison") === "true"
    const comparisonType = (searchParams.get("comparisonType") as 'previous_period' | 'same_period_last_year') || 'previous_period'
    const includeHeatmap = searchParams.get("includeHeatmap") === "true"
    const includeFunnel = searchParams.get("includeFunnel") === "true"
    const includeRanking = searchParams.get("includeRanking") === "true"
    const includeVolume = searchParams.get("includeVolume") === "true"

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 })
    }

    // Verificar acceso al tenant
    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Parsear fechas
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    // Calcular métricas avanzadas
    const analyticsResult = await calculateAdvancedAnalytics(tenantId, start, end)
    
    if (!analyticsResult.success) {
      return NextResponse.json({ error: analyticsResult.error }, { status: 500 })
    }

    let agentMetrics = null
    if (includeAgents) {
      const agentResult = await calculateAverageFirstResponseTimeByAgent(tenantId, start, end)
      if (agentResult.success) {
        agentMetrics = agentResult.data
      }
    }

    let hourlyMetrics = null
    if (includeHourly) {
      const hourlyResult = await calculateMessagesByHour(tenantId, start, end)
      if (hourlyResult.success) {
        hourlyMetrics = hourlyResult.data
      }
    }

    let peakMetrics = null
    if (includePeaks) {
      const peakResult = await detectVolumePeaks(tenantId, start, end)
      if (peakResult.success) {
        peakMetrics = peakResult.data
      }
    }

    let timelineMetrics = null
    if (includeTimeline) {
      const timelineResult = await calculateVolumeTimeline(tenantId, start, end, granularity)
      if (timelineResult.success) {
        timelineMetrics = timelineResult.data
      }
    }

    let comparisonMetrics = null
    if (includeComparison && start && end) {
      const comparisonResult = await calculatePeriodComparison(tenantId, start, end, comparisonType)
      if (comparisonResult.success) {
        comparisonMetrics = comparisonResult.data
      }
    }

    let heatmapMetrics = null
    if (includeHeatmap) {
      const heatmapResult = await calculateScheduleHeatmap(tenantId, start, end)
      if (heatmapResult.success) {
        heatmapMetrics = heatmapResult.data
      }
    }

    let funnelMetrics = null
    if (includeFunnel) {
      const funnelResult = await calculateConversationFunnel(tenantId, start, end)
      if (funnelResult.success) {
        funnelMetrics = funnelResult.data
      }
    }

    let rankingMetrics = null
    if (includeRanking) {
      const rankingResult = await calculateAgentRanking(tenantId, start, end)
      if (rankingResult.success) {
        rankingMetrics = rankingResult.data
      }
    }

    let volumeMetrics = null
    if (includeVolume) {
      const volumeResult = await calculateConversationVolume(tenantId, start, end)
      if (volumeResult.success) {
        volumeMetrics = volumeResult.data
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...analyticsResult.data,
        agentMetrics,
        hourlyMetrics,
        peakMetrics,
        timelineMetrics,
        comparisonMetrics,
        heatmapMetrics,
        funnelMetrics,
        rankingMetrics,
        volumeMetrics
      }
    })
  } catch (error) {
    console.error("[Analytics API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

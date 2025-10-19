import { NextRequest, NextResponse } from "next/server"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { calculateAdvancedAnalytics, calculateAverageFirstResponseTimeByAgent, calculateMessagesByHour, detectVolumePeaks, calculateVolumeTimeline, calculatePeriodComparison, calculateScheduleHeatmap, calculateConversationFunnel } from "@/lib/analytics-utils"
import { analyticsToCSV, timelineToCSV, volumePeaksToCSV, heatmapToCSV, generateFilename } from "@/lib/csv-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const tenantId = searchParams.get("tenantId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const exportType = searchParams.get("type") || "analytics" // analytics, timeline, peaks, heatmap, funnel
    const includeAgents = searchParams.get("includeAgents") === "true"
    const includeHourly = searchParams.get("includeHourly") === "true"
    const includePeaks = searchParams.get("includePeaks") === "true"
    const includeTimeline = searchParams.get("includeTimeline") === "true"
    const includeHeatmap = searchParams.get("includeHeatmap") === "true"
    const includeFunnel = searchParams.get("includeFunnel") === "true"
    const granularity = (searchParams.get("granularity") as 'hour' | 'day' | 'week') || 'day'

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

    let csvContent = ""
    let filename = ""

    switch (exportType) {
      case "analytics":
        // Exportar métricas generales de analytics
        const analyticsResult = await calculateAdvancedAnalytics(tenantId, start, end)
        if (!analyticsResult.success) {
          return NextResponse.json({ error: analyticsResult.error }, { status: 500 })
        }

        // Agregar métricas adicionales si se solicitan
        let enhancedAnalytics: any = { ...analyticsResult.data }

        if (includeAgents) {
          const agentResult = await calculateAverageFirstResponseTimeByAgent(tenantId, start, end)
          if (agentResult.success) {
            enhancedAnalytics.agentData = agentResult.data
          }
        }

        if (includeHourly) {
          const hourlyResult = await calculateMessagesByHour(tenantId, start, end)
          if (hourlyResult.success) {
            enhancedAnalytics.hourlyMetrics = hourlyResult.data
          }
        }

        if (includeFunnel) {
          const funnelResult = await calculateConversationFunnel(tenantId, start, end)
          if (funnelResult.success) {
            enhancedAnalytics.funnelMetrics = funnelResult.data
          }
        }

        csvContent = analyticsToCSV(enhancedAnalytics)
        filename = generateFilename("analytics")
        break

      case "timeline":
        // Exportar datos de timeline
        const timelineResult = await calculateVolumeTimeline(tenantId, start, end, granularity)
        if (!timelineResult.success) {
          return NextResponse.json({ error: timelineResult.error }, { status: 500 })
        }
        csvContent = timelineToCSV(timelineResult.data?.timeline || [])
        filename = generateFilename("timeline")
        break

      case "peaks":
        // Exportar datos de picos de volumen
        const peaksResult = await detectVolumePeaks(tenantId, start, end)
        if (!peaksResult.success) {
          return NextResponse.json({ error: peaksResult.error }, { status: 500 })
        }
        csvContent = volumePeaksToCSV(peaksResult.data)
        filename = generateFilename("volume_peaks")
        break

      case "heatmap":
        // Exportar datos de heatmap
        const heatmapResult = await calculateScheduleHeatmap(tenantId, start, end)
        if (!heatmapResult.success) {
          return NextResponse.json({ error: heatmapResult.error }, { status: 500 })
        }
        csvContent = heatmapToCSV(heatmapResult.data)
        filename = generateFilename("schedule_heatmap")
        break

      case "funnel":
        // Exportar datos de funnel
        const funnelResult = await calculateConversationFunnel(tenantId, start, end)
        if (!funnelResult.success) {
          return NextResponse.json({ error: funnelResult.error }, { status: 500 })
        }
        csvContent = analyticsToCSV({ funnelMetrics: funnelResult.data })
        filename = generateFilename("conversation_funnel")
        break

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }

    // Crear respuesta con archivo CSV
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    console.error("[CSV Export] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

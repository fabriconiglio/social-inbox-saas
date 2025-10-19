import { NextRequest, NextResponse } from "next/server"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { calculateAdvancedAnalytics, calculateAverageFirstResponseTimeByAgent, calculateMessagesByHour, detectVolumePeaks, calculateVolumeTimeline, calculatePeriodComparison, calculateScheduleHeatmap, calculateConversationFunnel } from "@/lib/analytics-utils"
import { generateAnalyticsPDF, generatePDFFilename } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const tenantId = searchParams.get("tenantId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const exportType = searchParams.get("type") || "analytics" // analytics, charts
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

    let pdfBlob: Blob
    let filename: string

    switch (exportType) {
      case "analytics":
        // Exportar métricas generales de analytics
        const analyticsResult = await calculateAdvancedAnalytics(tenantId, start, end)
        if (!analyticsResult.success) {
          return NextResponse.json({ error: analyticsResult.error }, { status: 500 })
        }

        // Agregar métricas adicionales si se solicitan
        let enhancedAnalytics = { ...analyticsResult.data }

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

        if (includePeaks) {
          const peakResult = await detectVolumePeaks(tenantId, start, end)
          if (peakResult.success) {
            enhancedAnalytics.peakMetrics = peakResult.data
          }
        }

        if (includeTimeline) {
          const timelineResult = await calculateVolumeTimeline(tenantId, start, end, granularity)
          if (timelineResult.success) {
            enhancedAnalytics.timelineMetrics = timelineResult.data
          }
        }

        if (includeHeatmap) {
          const heatmapResult = await calculateScheduleHeatmap(tenantId, start, end)
          if (heatmapResult.success) {
            enhancedAnalytics.heatmapMetrics = heatmapResult.data
          }
        }

        // Generar PDF con métricas
        pdfBlob = await generateAnalyticsPDF(enhancedAnalytics, {
          title: 'Reporte de Analytics',
          filename: 'analytics_report.pdf',
          orientation: 'portrait'
        })
        filename = generatePDFFilename("analytics")
        break

      case "charts":
        // Para exportar gráficos, necesitaríamos capturar elementos del DOM
        // Por ahora, generamos un PDF básico con mensaje
        const basicAnalytics = await calculateAdvancedAnalytics(tenantId, start, end)
        if (!basicAnalytics.success) {
          return NextResponse.json({ error: basicAnalytics.error }, { status: 500 })
        }

        pdfBlob = await generateAnalyticsPDF(basicAnalytics.data, {
          title: 'Reporte de Gráficos',
          filename: 'charts_report.pdf',
          orientation: 'landscape'
        })
        filename = generatePDFFilename("charts")
        break

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }

    // Crear respuesta con archivo PDF
    const response = new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    console.error("[PDF Export] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

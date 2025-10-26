import { NextRequest, NextResponse } from "next/server"
import { exportAuditLogsCSV, exportAuditLogsJSON, exportAuditLogsPDF } from "@/app/actions/audit-export"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format, ...exportData } = body

    let result

    switch (format) {
      case "csv":
        result = await exportAuditLogsCSV(exportData)
        break
      case "json":
        result = await exportAuditLogsJSON(exportData)
        break
      case "pdf":
        result = await exportAuditLogsPDF(exportData)
        break
      default:
        return NextResponse.json(
          { success: false, error: "Formato no soportado" },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Determinar content type
    let contentType = "text/plain"
    if (format === "csv") {
      contentType = "text/csv"
    } else if (format === "json") {
      contentType = "application/json"
    } else if (format === "pdf") {
      contentType = "text/html" // Por ahora HTML, en producción sería application/pdf
    }

    // Crear respuesta con el archivo
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    })

  } catch (error) {
    console.error("[AuditExport API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

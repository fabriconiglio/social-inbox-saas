import { NextRequest, NextResponse } from "next/server"
import { monitorSLAs, monitorSLAsForTenant } from "@/lib/sla-monitor"
import { requireAuth } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { tenantId } = await request.json()

    if (tenantId) {
      // Monitorear SLA para un tenant específico
      await monitorSLAsForTenant(tenantId)
    } else {
      // Monitorear SLA para todos los tenants
      await monitorSLAs()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SLA Monitor API] Error:", error)
    return NextResponse.json({ error: "Error al monitorear SLAs" }, { status: 500 })
  }
}

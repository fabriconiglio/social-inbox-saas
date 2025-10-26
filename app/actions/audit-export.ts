"use server"

import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"

interface ExportAuditLogsData {
  tenantId: string
  entity?: string
  entityId?: string
  action?: string
  actor?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  includeDetails?: boolean
  includeDiffs?: boolean
}

interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId: string
  diffJSON: Record<string, any>
  createdAt: string
  actor: {
    id: string
    name: string
    email: string
    image?: string
  } | null
}

export async function getAuditLogsForExport(data: ExportAuditLogsData) {
  try {
    const user = await requireAuth()
    const membership = await checkTenantAccess(user.id!, data.tenantId)

    if (!membership) {
      return { success: false, error: "No tienes acceso a este tenant" }
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return { success: false, error: "No tienes permisos para exportar audit logs" }
    }

    // Construir filtros de consulta
    const whereClause: any = {
      tenantId: data.tenantId
    }

    if (data.entity && data.entity !== "all") {
      whereClause.entity = data.entity
    }

    if (data.entityId && data.entityId !== "all") {
      whereClause.entityId = data.entityId
    }

    if (data.action && data.action !== "all") {
      whereClause.action = {
        contains: data.action,
        mode: "insensitive"
      }
    }

    if (data.actor) {
      whereClause.actor = {
        OR: [
          { name: { contains: data.actor, mode: "insensitive" } },
          { email: { contains: data.actor, mode: "insensitive" } }
        ]
      }
    }

    if (data.dateFrom || data.dateTo) {
      whereClause.createdAt = {}
      if (data.dateFrom) {
        whereClause.createdAt.gte = new Date(data.dateFrom)
      }
      if (data.dateTo) {
        whereClause.createdAt.lte = new Date(data.dateTo)
      }
    }

    // Obtener logs de auditoría
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: data.limit || 1000
    })

    return { success: true, data: logs }

  } catch (error) {
    console.error("[AuditExport] Error:", error)
    return { success: false, error: "Error al obtener logs de auditoría" }
  }
}

export async function exportAuditLogsCSV(data: ExportAuditLogsData) {
  try {
    const result = await getAuditLogsForExport(data)
    
    if (!result.success) {
      return { success: false, error: result.error }
    }

    const logs = result.data as AuditLogEntry[]
    
    // Generar CSV
    const headers = [
      "ID",
      "Acción",
      "Entidad", 
      "ID Entidad",
      "Usuario",
      "Email Usuario",
      "Fecha",
      "Cambios"
    ]

    const rows = logs.map(log => [
      log.id,
      log.action,
      log.entity,
      log.entityId,
      log.actor?.name || "Sistema",
      log.actor?.email || "",
      new Date(log.createdAt).toISOString(),
      data.includeDiffs ? JSON.stringify(log.diffJSON) : ""
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    return { success: true, data: csvContent, filename: `audit-log-${data.tenantId}-${new Date().toISOString().split('T')[0]}.csv` }

  } catch (error) {
    console.error("[AuditExport CSV] Error:", error)
    return { success: false, error: "Error al generar CSV" }
  }
}

export async function exportAuditLogsJSON(data: ExportAuditLogsData) {
  try {
    const result = await getAuditLogsForExport(data)
    
    if (!result.success) {
      return { success: false, error: result.error }
    }

    const logs = result.data as AuditLogEntry[]
    
    // Generar JSON
    const exportData = {
      metadata: {
        tenantId: data.tenantId,
        exportDate: new Date().toISOString(),
        format: "json",
        includeDetails: data.includeDetails,
        includeDiffs: data.includeDiffs,
        recordCount: logs.length,
        filters: {
          entity: data.entity,
          entityId: data.entityId,
          action: data.action,
          actor: data.actor,
          dateFrom: data.dateFrom,
          dateTo: data.dateTo
        }
      },
      logs: data.includeDetails ? logs : logs.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        actor: log.actor ? {
          name: log.actor.name,
          email: log.actor.email
        } : null,
        createdAt: log.createdAt,
        ...(data.includeDiffs && { changes: log.diffJSON })
      }))
    }
    
    return { 
      success: true, 
      data: JSON.stringify(exportData, null, 2),
      filename: `audit-log-${data.tenantId}-${new Date().toISOString().split('T')[0]}.json`
    }

  } catch (error) {
    console.error("[AuditExport JSON] Error:", error)
    return { success: false, error: "Error al generar JSON" }
  }
}

export async function exportAuditLogsPDF(data: ExportAuditLogsData) {
  try {
    const result = await getAuditLogsForExport(data)
    
    if (!result.success) {
      return { success: false, error: result.error }
    }

    const logs = result.data as AuditLogEntry[]
    
    // Generar contenido HTML para PDF (en producción usarías una librería como puppeteer)
    const htmlContent = generatePDFHTML(logs, data)
    
    return { 
      success: true, 
      data: htmlContent,
      filename: `audit-log-${data.tenantId}-${new Date().toISOString().split('T')[0]}.html`
    }

  } catch (error) {
    console.error("[AuditExport PDF] Error:", error)
    return { success: false, error: "Error al generar PDF" }
  }
}

function generatePDFHTML(logs: AuditLogEntry[], data: ExportAuditLogsData): string {
  const formatDate = (date: string) => new Date(date).toLocaleString("es-ES")
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Audit Log Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .metadata { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .log-entry { margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
        .log-header { font-weight: bold; color: #333; }
        .log-details { margin-top: 5px; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Auditoría</h1>
        <p>Generado el: ${new Date().toLocaleString("es-ES")}</p>
      </div>
      
      <div class="metadata">
        <h3>Información del Reporte</h3>
        <p><strong>Tenant ID:</strong> ${data.tenantId}</p>
        <p><strong>Total de registros:</strong> ${logs.length}</p>
        <p><strong>Filtros aplicados:</strong></p>
        <ul>
          ${data.entity && data.entity !== "all" ? `<li>Entidad: ${data.entity}</li>` : ""}
          ${data.action && data.action !== "all" ? `<li>Acción: ${data.action}</li>` : ""}
          ${data.actor ? `<li>Usuario: ${data.actor}</li>` : ""}
          ${data.dateFrom ? `<li>Desde: ${data.dateFrom}</li>` : ""}
          ${data.dateTo ? `<li>Hasta: ${data.dateTo}</li>` : ""}
        </ul>
      </div>
      
      <h3>Registros de Auditoría</h3>
      ${logs.map(log => `
        <div class="log-entry">
          <div class="log-header">${log.action} - ${log.entity}</div>
          <div class="log-details">
            <strong>ID:</strong> ${log.id}<br>
            <strong>Entidad ID:</strong> ${log.entityId}<br>
            <strong>Usuario:</strong> ${log.actor?.name || "Sistema"} (${log.actor?.email || "N/A"})<br>
            <strong>Fecha:</strong> ${formatDate(log.createdAt)}<br>
            ${data.includeDiffs && Object.keys(log.diffJSON).length > 0 ? `
              <strong>Cambios:</strong><br>
              <pre style="background: #f9f9f9; padding: 10px; border-radius: 3px; font-size: 0.8em;">${JSON.stringify(log.diffJSON, null, 2)}</pre>
            ` : ""}
          </div>
        </div>
      `).join("")}
    </body>
    </html>
  `
}

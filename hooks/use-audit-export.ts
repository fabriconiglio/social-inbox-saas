"use client"

import { useState } from "react"
import { toast } from "sonner"

interface ExportOptions {
  format: "csv" | "json" | "pdf"
  includeDetails: boolean
  includeDiffs: boolean
}

interface ExportFilters {
  entity?: string
  entityId?: string
  action?: string
  actor?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

interface UseAuditExportProps {
  tenantId: string
  filters: ExportFilters
}

export function useAuditExport({ tenantId, filters }: UseAuditExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [lastExport, setLastExport] = useState<{
    format: string
    timestamp: string
    recordCount: number
  } | null>(null)

  const exportAuditLogs = async (options: ExportOptions) => {
    try {
      setIsExporting(true)
      
      // Preparar datos para exportación
      const exportData = {
        tenantId,
        entity: filters.entity || "all",
        entityId: filters.entityId || "all",
        action: filters.action || "all",
        actor: filters.actor || "",
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        limit: filters.limit || 1000,
        includeDetails: options.includeDetails,
        includeDiffs: options.includeDiffs,
        format: options.format
      }

      // Llamar a la API de exportación
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en la exportación')
      }

      // Obtener el archivo de la respuesta
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      // Crear enlace de descarga
      const link = document.createElement('a')
      link.href = url
      
      // Obtener nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `audit-log-${tenantId}-${new Date().toISOString().split('T')[0]}.${options.format}`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // Actualizar estado
      setLastExport({
        format: options.format,
        timestamp: new Date().toISOString(),
        recordCount: 0 // Se actualizará cuando se obtenga la respuesta real
      })
      
      toast.success(`Exportación completada: ${filename}`)
      
      return { success: true, filename }
      
    } catch (error) {
      console.error("[useAuditExport] Error:", error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al exportar: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsExporting(false)
    }
  }

  const getMimeType = (format: string): string => {
    switch (format) {
      case "csv":
        return "text/csv"
      case "json":
        return "application/json"
      case "pdf":
        return "text/html" // Por ahora HTML, en producción sería application/pdf
      default:
        return "text/plain"
    }
  }

  const getFormatDescription = (format: string): string => {
    switch (format) {
      case "csv":
        return "Excel compatible"
      case "json":
        return "Datos estructurados"
      case "pdf":
        return "Reporte formateado"
      default:
        return "Archivo de texto"
    }
  }

  return {
    isExporting,
    lastExport,
    exportAuditLogs,
    getMimeType,
    getFormatDescription
  }
}

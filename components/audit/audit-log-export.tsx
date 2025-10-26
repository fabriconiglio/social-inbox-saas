"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useAuditExport } from "@/hooks/use-audit-export"

interface AuditLogExportProps {
  tenantId: string
  filters?: Record<string, any>
  className?: string
}

type ExportFormat = "csv" | "json" | "pdf"

interface ExportOptions {
  format: ExportFormat
  includeDetails: boolean
  includeDiffs: boolean
  dateRange?: {
    from: string
    to: string
  }
}

export function AuditLogExport({ 
  tenantId, 
  filters = {},
  className 
}: AuditLogExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    includeDetails: true,
    includeDiffs: false
  })
  
  const { isExporting, lastExport, exportAuditLogs } = useAuditExport({
    tenantId,
    filters
  })

  const formatOptions = [
    { 
      value: "csv" as const, 
      label: "CSV", 
      description: "Excel compatible",
      icon: FileSpreadsheet,
      color: "bg-green-100 text-green-800"
    },
    { 
      value: "json" as const, 
      label: "JSON", 
      description: "Datos estructurados",
      icon: FileJson,
      color: "bg-blue-100 text-blue-800"
    },
    { 
      value: "pdf" as const, 
      label: "PDF", 
      description: "Reporte formateado",
      icon: FileText,
      color: "bg-red-100 text-red-800"
    }
  ]

  const handleExport = async () => {
    await exportAuditLogs(exportOptions)
  }


  const getMimeType = (format: ExportFormat): string => {
    switch (format) {
      case "csv":
        return "text/csv"
      case "json":
        return "application/json"
      case "pdf":
        return "application/pdf"
      default:
        return "text/plain"
    }
  }

  const selectedFormat = formatOptions.find(f => f.value === exportOptions.format)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Audit Log
        </CardTitle>
        <CardDescription>
          Descarga el historial de auditoría en diferentes formatos
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Formato de exportación */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Formato de Exportación</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon
              const isSelected = exportOptions.format === format.value
              
              return (
                <div
                  key={format.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value }))}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${format.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{format.label}</p>
                      <p className="text-sm text-muted-foreground">{format.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Opciones de exportación */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Opciones de Exportación</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportOptions.includeDetails}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeDetails: e.target.checked 
                }))}
                className="rounded"
              />
              <span className="text-sm">Incluir detalles completos</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={exportOptions.includeDiffs}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  includeDiffs: e.target.checked 
                }))}
                className="rounded"
              />
              <span className="text-sm">Incluir diffs de cambios</span>
            </label>
          </div>
        </div>

        {/* Información de la exportación */}
        {selectedFormat && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <selectedFormat.icon className="h-4 w-4" />
              <span className="font-medium">{selectedFormat.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedFormat.description}
            </p>
          </div>
        )}

        {/* Última exportación */}
        {lastExport && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Última exportación exitosa
              </span>
            </div>
            <p className="text-xs text-green-700">
              {lastExport.format.toUpperCase()} - {lastExport.recordCount} registros - 
              {new Date(lastExport.timestamp).toLocaleString("es-ES")}
            </p>
          </div>
        )}

        {/* Botón de exportación */}
        <Button 
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar {exportOptions.format.toUpperCase()}
            </>
          )}
        </Button>

        {/* Advertencias */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Información importante
            </span>
          </div>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Los archivos se descargan automáticamente</li>
            <li>• Los datos sensibles pueden estar incluidos</li>
            <li>• Verifica los permisos antes de compartir</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

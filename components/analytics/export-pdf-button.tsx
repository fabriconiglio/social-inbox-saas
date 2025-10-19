"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { FileText, BarChart3, TrendingUp, Calendar, Clock, Download } from "lucide-react"
import { toast } from "sonner"

interface ExportPDFButtonProps {
  tenantId: string
  startDate?: string
  endDate?: string
  className?: string
}

export function ExportPDFButton({ 
  tenantId, 
  startDate, 
  endDate, 
  className 
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (exportType: string, includeOptions: string[] = []) => {
    try {
      setIsExporting(true)
      
      // Construir URL con parámetros
      const params = new URLSearchParams({
        tenantId,
        type: exportType
      })

      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      // Agregar opciones de inclusión
      includeOptions.forEach(option => {
        params.append(option, 'true')
      })

      const response = await fetch(`/api/analytics/export/pdf?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar PDF')
      }

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${exportType}_${new Date().toISOString().slice(0, 10)}.pdf`

      // Crear blob y descargar
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Archivo PDF ${filename} descargado exitosamente`)
      
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Error al exportar PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions = [
    {
      label: "Reporte Completo",
      value: "analytics",
      icon: FileText,
      description: "Exportar todas las métricas y análisis",
      includeOptions: ["includeAgents", "includeHourly", "includeFunnel", "includePeaks", "includeTimeline", "includeHeatmap"]
    },
    {
      label: "Métricas Principales",
      value: "analytics",
      icon: BarChart3,
      description: "Solo métricas básicas de analytics",
      includeOptions: []
    },
    {
      label: "Análisis de Funnel",
      value: "analytics",
      icon: Clock,
      description: "Funnel de conversaciones y métricas de flujo",
      includeOptions: ["includeFunnel"]
    },
    {
      label: "Análisis Temporal",
      value: "analytics",
      icon: TrendingUp,
      description: "Timeline y picos de volumen",
      includeOptions: ["includeTimeline", "includePeaks"]
    },
    {
      label: "Heatmap de Horarios",
      value: "analytics",
      icon: Calendar,
      description: "Actividad por día y hora",
      includeOptions: ["includeHeatmap"]
    }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={isExporting}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Generando PDF..." : "Exportar PDF"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Seleccionar tipo de reporte PDF
        </div>
        <DropdownMenuSeparator />
        {exportOptions.map((option, index) => (
          <DropdownMenuItem
            key={`${option.value}-${index}`}
            onClick={() => handleExport(option.value, option.includeOptions)}
            disabled={isExporting}
            className="flex items-start gap-3 p-3"
          >
            <option.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">
                {option.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Los archivos PDF se generan con formato profesional
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

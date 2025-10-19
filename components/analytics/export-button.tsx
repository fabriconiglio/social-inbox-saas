"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Download, FileText, BarChart3, TrendingUp, Calendar, Clock } from "lucide-react"
import { toast } from "sonner"

interface ExportButtonProps {
  tenantId: string
  startDate?: string
  endDate?: string
  className?: string
}

export function ExportButton({ 
  tenantId, 
  startDate, 
  endDate, 
  className 
}: ExportButtonProps) {
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

      const response = await fetch(`/api/analytics/export/csv?${params.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar datos')
      }

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`

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

      toast.success(`Archivo ${filename} descargado exitosamente`)
      
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error(error instanceof Error ? error.message : 'Error al exportar datos')
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions = [
    {
      label: "Métricas Generales",
      value: "analytics",
      icon: BarChart3,
      description: "Exportar métricas principales de analytics",
      includeOptions: ["includeAgents", "includeHourly", "includeFunnel"]
    },
    {
      label: "Timeline de Volumen",
      value: "timeline",
      icon: TrendingUp,
      description: "Exportar evolución del volumen de mensajes",
      includeOptions: []
    },
    {
      label: "Picos de Volumen",
      value: "peaks",
      icon: BarChart3,
      description: "Exportar análisis de picos de actividad",
      includeOptions: []
    },
    {
      label: "Heatmap de Horarios",
      value: "heatmap",
      icon: Calendar,
      description: "Exportar actividad por día y hora",
      includeOptions: []
    },
    {
      label: "Funnel de Conversaciones",
      value: "funnel",
      icon: Clock,
      description: "Exportar análisis del flujo de conversaciones",
      includeOptions: []
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
          {isExporting ? "Exportando..." : "Exportar CSV"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Seleccionar tipo de exportación
        </div>
        <DropdownMenuSeparator />
        {exportOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
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
          Los archivos se descargan automáticamente
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

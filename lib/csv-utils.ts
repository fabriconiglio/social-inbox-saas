/**
 * Utilidades para exportar datos a formato CSV
 */

export interface CSVExportOptions {
  filename?: string
  includeHeaders?: boolean
  delimiter?: string
}

/**
 * Convierte un array de objetos a formato CSV
 */
export function arrayToCSV(
  data: Record<string, any>[],
  options: CSVExportOptions = {}
): string {
  const {
    includeHeaders = true,
    delimiter = ','
  } = options

  if (data.length === 0) {
    return ''
  }

  // Obtener todas las claves únicas de todos los objetos
  const allKeys = Array.from(
    new Set(data.flatMap(obj => Object.keys(obj)))
  )

  // Crear las filas CSV
  const rows: string[] = []

  // Agregar encabezados si se solicitan
  if (includeHeaders) {
    const headers = allKeys.map(key => escapeCSVField(key))
    rows.push(headers.join(delimiter))
  }

  // Agregar datos
  for (const item of data) {
    const values = allKeys.map(key => {
      const value = item[key]
      return escapeCSVField(value)
    })
    rows.push(values.join(delimiter))
  }

  return rows.join('\n')
}

/**
 * Escapa un campo para formato CSV
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return ''
  }

  const stringValue = String(field)
  
  // Si el campo contiene comillas, comas, saltos de línea o espacios al inicio/final,
  // lo envolvemos en comillas y escapamos las comillas internas
  if (stringValue.includes('"') || 
      stringValue.includes(',') || 
      stringValue.includes('\n') || 
      stringValue.includes('\r') ||
      stringValue.startsWith(' ') || 
      stringValue.endsWith(' ')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Genera un nombre de archivo con timestamp
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Convierte métricas de analytics a formato CSV
 */
export function analyticsToCSV(analytics: any): string {
  const csvData: Record<string, any>[] = []

  // Métricas básicas
  csvData.push({
    'Métrica': 'Total de Conversaciones',
    'Valor': analytics.totalThreads || 0,
    'Categoría': 'Conversaciones'
  })
  
  csvData.push({
    'Métrica': 'Conversaciones Abiertas',
    'Valor': analytics.openThreads || 0,
    'Categoría': 'Conversaciones'
  })
  
  csvData.push({
    'Métrica': 'Conversaciones Cerradas',
    'Valor': analytics.closedThreads || 0,
    'Categoría': 'Conversaciones'
  })
  
  csvData.push({
    'Métrica': 'Tiempo Promedio de Respuesta (min)',
    'Valor': analytics.avgResponseTime || 0,
    'Categoría': 'Tiempos'
  })

  // Métricas avanzadas si están disponibles
  if (analytics.averageFirstResponseTime) {
    csvData.push({
      'Métrica': 'Tiempo Promedio Primera Respuesta (min)',
      'Valor': analytics.averageFirstResponseTime,
      'Categoría': 'Tiempos'
    })
  }

  if (analytics.averageResolutionTime) {
    csvData.push({
      'Métrica': 'Tiempo Promedio de Resolución (min)',
      'Valor': analytics.averageResolutionTime,
      'Categoría': 'Tiempos'
    })
  }

  if (analytics.closeRate) {
    csvData.push({
      'Métrica': 'Tasa de Cierre (%)',
      'Valor': analytics.closeRate,
      'Categoría': 'Tasas'
    })
  }

  // Datos por canal
  if (analytics.channelData && Array.isArray(analytics.channelData)) {
    analytics.channelData.forEach((channel: any) => {
      csvData.push({
        'Métrica': `Conversaciones - ${channel.name}`,
        'Valor': channel.value,
        'Categoría': 'Por Canal'
      })
    })
  }

  // Datos por agente
  if (analytics.agentData && Array.isArray(analytics.agentData)) {
    analytics.agentData.forEach((agent: any) => {
      csvData.push({
        'Métrica': `Conversaciones - ${agent.name}`,
        'Valor': agent.value,
        'Categoría': 'Por Agente'
      })
    })
  }

  // Métricas de funnel si están disponibles
  if (analytics.funnelMetrics) {
    const funnel = analytics.funnelMetrics
    csvData.push({
      'Métrica': 'Conversaciones Iniciadas',
      'Valor': funnel.funnel.totalThreads,
      'Categoría': 'Funnel'
    })
    csvData.push({
      'Métrica': 'Conversaciones Asignadas',
      'Valor': funnel.funnel.assignedThreads,
      'Categoría': 'Funnel'
    })
    csvData.push({
      'Métrica': 'Conversaciones con Respuesta',
      'Valor': funnel.funnel.threadsWithAgentResponse,
      'Categoría': 'Funnel'
    })
    csvData.push({
      'Métrica': 'Conversaciones Resueltas',
      'Valor': funnel.funnel.resolvedThreads,
      'Categoría': 'Funnel'
    })
    csvData.push({
      'Métrica': 'Tasa de Asignación (%)',
      'Valor': funnel.conversionRates.assignmentRate,
      'Categoría': 'Funnel'
    })
    csvData.push({
      'Métrica': 'Tasa de Respuesta (%)',
      'Valor': funnel.conversionRates.responseRate,
      'Categoría': 'Funnel'
    })
    csvData.push({
      'Métrica': 'Tasa de Resolución (%)',
      'Valor': funnel.conversionRates.resolutionRate,
      'Categoría': 'Funnel'
    })
  }

  // Métricas por hora si están disponibles
  if (analytics.hourlyMetrics && Array.isArray(analytics.hourlyMetrics)) {
    analytics.hourlyMetrics.forEach((hour: any) => {
      csvData.push({
        'Métrica': `Mensajes Hora ${hour.hour}:00`,
        'Valor': hour.total,
        'Categoría': 'Por Hora'
      })
    })
  }

  return arrayToCSV(csvData)
}

/**
 * Convierte datos de timeline a formato CSV
 */
export function timelineToCSV(timelineData: any[]): string {
  const csvData = timelineData.map(item => ({
    'Período': item.period,
    'Mensajes Entrantes': item.inbound,
    'Mensajes Salientes': item.outbound,
    'Total Mensajes': item.total
  }))

  return arrayToCSV(csvData)
}

/**
 * Convierte datos de picos de volumen a formato CSV
 */
export function volumePeaksToCSV(peaksData: any): string {
  const csvData: Record<string, any>[] = []

  // Información general
  csvData.push({
    'Métrica': 'Volumen Promedio',
    'Valor': peaksData.averageVolume,
    'Categoría': 'Picos de Volumen'
  })
  csvData.push({
    'Métrica': 'Volumen Máximo',
    'Valor': peaksData.maxVolume,
    'Categoría': 'Picos de Volumen'
  })
  csvData.push({
    'Métrica': 'Umbral de Pico',
    'Valor': peaksData.peakThreshold,
    'Categoría': 'Picos de Volumen'
  })
  csvData.push({
    'Métrica': 'Total de Picos',
    'Valor': peaksData.patterns.totalPeaks,
    'Categoría': 'Picos de Volumen'
  })

  // Picos individuales
  if (peaksData.peaks && Array.isArray(peaksData.peaks)) {
    peaksData.peaks.forEach((peak: any, index: number) => {
      csvData.push({
        'Métrica': `Pico ${index + 1} - Fecha`,
        'Valor': peak.date,
        'Categoría': 'Picos Individuales'
      })
      csvData.push({
        'Métrica': `Pico ${index + 1} - Hora`,
        'Valor': peak.hour,
        'Categoría': 'Picos Individuales'
      })
      csvData.push({
        'Métrica': `Pico ${index + 1} - Volumen`,
        'Valor': peak.volume,
        'Categoría': 'Picos Individuales'
      })
      csvData.push({
        'Métrica': `Pico ${index + 1} - Intensidad`,
        'Valor': peak.intensity,
        'Categoría': 'Picos Individuales'
      })
    })
  }

  return arrayToCSV(csvData)
}

/**
 * Convierte datos de heatmap a formato CSV
 */
export function heatmapToCSV(heatmapData: any): string {
  const csvData: Record<string, any>[] = []

  // Información general
  csvData.push({
    'Métrica': 'Actividad Máxima',
    'Valor': heatmapData.maxActivity,
    'Categoría': 'Heatmap'
  })
  csvData.push({
    'Métrica': 'Total de Mensajes',
    'Valor': heatmapData.totalMessages,
    'Categoría': 'Heatmap'
  })
  csvData.push({
    'Métrica': 'Promedio por Hora',
    'Valor': heatmapData.averagePerHour,
    'Categoría': 'Heatmap'
  })

  // Datos por día y hora
  if (heatmapData.heatmap && Array.isArray(heatmapData.heatmap)) {
    heatmapData.heatmap.forEach((day: any) => {
      day.hours.forEach((hour: any) => {
        csvData.push({
          'Día': day.day,
          'Hora': `${hour.hour}:00`,
          'Mensajes Entrantes': hour.inbound,
          'Mensajes Salientes': hour.outbound,
          'Total Mensajes': hour.total
        })
      })
    })
  }

  return arrayToCSV(csvData)
}

/**
 * Descarga un archivo CSV
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

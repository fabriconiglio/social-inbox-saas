/**
 * Utilidades para exportar datos a formato PDF
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  title?: string
  filename?: string
  orientation?: 'portrait' | 'landscape'
  format?: 'a4' | 'letter'
  margin?: number
}

/**
 * Genera un PDF con métricas de analytics
 */
export async function generateAnalyticsPDF(
  analytics: any,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    title = 'Reporte de Analytics',
    filename = 'analytics_report.pdf',
    orientation = 'portrait',
    format = 'a4',
    margin = 20
  } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format
  })

  // Configurar fuentes y colores
  const primaryColor = '#1f2937'
  const secondaryColor = '#6b7280'
  const accentColor = '#3b82f6'

  // Función helper para agregar texto
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 12)
    doc.setTextColor(options.color || primaryColor)
    doc.text(text, x, y)
  }

  // Función helper para agregar línea
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(200, 200, 200)
    doc.line(x1, y1, x2, y2)
  }

  // Función helper para agregar rectángulo
  const addRect = (x: number, y: number, width: number, height: number, fill: boolean = false) => {
    if (fill) {
      doc.setFillColor(248, 250, 252)
      doc.rect(x, y, width, height, 'F')
    } else {
      doc.setDrawColor(200, 200, 200)
      doc.rect(x, y, width, height)
    }
  }

  let yPosition = margin

  // Título principal
  addText(title, margin, yPosition, { fontSize: 20, color: primaryColor })
  yPosition += 15

  // Fecha de generación
  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  addText(`Generado el: ${currentDate}`, margin, yPosition, { fontSize: 10, color: secondaryColor })
  yPosition += 20

  // Métricas principales
  addText('Métricas Principales', margin, yPosition, { fontSize: 16, color: primaryColor })
  yPosition += 10

  // Crear tabla de métricas principales
  const mainMetrics = [
    { label: 'Total de Conversaciones', value: analytics.totalThreads || 0 },
    { label: 'Conversaciones Abiertas', value: analytics.openThreads || 0 },
    { label: 'Conversaciones Cerradas', value: analytics.closedThreads || 0 },
    { label: 'Tiempo Promedio de Respuesta (min)', value: analytics.avgResponseTime || 0 }
  ]

  // Agregar métricas avanzadas si están disponibles
  if (analytics.averageFirstResponseTime) {
    mainMetrics.push({
      label: 'Tiempo Promedio Primera Respuesta (min)',
      value: analytics.averageFirstResponseTime
    })
  }

  if (analytics.averageResolutionTime) {
    mainMetrics.push({
      label: 'Tiempo Promedio de Resolución (min)',
      value: analytics.averageResolutionTime
    })
  }

  if (analytics.closeRate) {
    mainMetrics.push({
      label: 'Tasa de Cierre (%)',
      value: analytics.closeRate
    })
  }

  // Dibujar tabla de métricas
  const tableWidth = 170
  const rowHeight = 8
  const col1Width = 120
  const col2Width = 50

  // Encabezados de tabla
  addRect(margin, yPosition, tableWidth, rowHeight, true)
  addText('Métrica', margin + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
  addText('Valor', margin + col1Width + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
  yPosition += rowHeight

  // Filas de datos
  mainMetrics.forEach((metric, index) => {
    addRect(margin, yPosition, tableWidth, rowHeight, index % 2 === 0)
    addText(metric.label, margin + 5, yPosition + 5, { fontSize: 9 })
    addText(metric.value.toString(), margin + col1Width + 5, yPosition + 5, { fontSize: 9, color: accentColor })
    yPosition += rowHeight
  })

  yPosition += 15

  // Datos por canal
  if (analytics.channelData && analytics.channelData.length > 0) {
    addText('Distribución por Canal', margin, yPosition, { fontSize: 16, color: primaryColor })
    yPosition += 10

    // Tabla de canales
    addRect(margin, yPosition, tableWidth, rowHeight, true)
    addText('Canal', margin + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    addText('Conversaciones', margin + col1Width + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    yPosition += rowHeight

    analytics.channelData.forEach((channel: any, index: number) => {
      addRect(margin, yPosition, tableWidth, rowHeight, index % 2 === 0)
      addText(channel.name, margin + 5, yPosition + 5, { fontSize: 9 })
      addText(channel.value.toString(), margin + col1Width + 5, yPosition + 5, { fontSize: 9, color: accentColor })
      yPosition += rowHeight
    })

    yPosition += 15
  }

  // Datos por agente
  if (analytics.agentData && analytics.agentData.length > 0) {
    addText('Distribución por Agente', margin, yPosition, { fontSize: 16, color: primaryColor })
    yPosition += 10

    // Tabla de agentes
    addRect(margin, yPosition, tableWidth, rowHeight, true)
    addText('Agente', margin + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    addText('Conversaciones', margin + col1Width + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    yPosition += rowHeight

    analytics.agentData.forEach((agent: any, index: number) => {
      addRect(margin, yPosition, tableWidth, rowHeight, index % 2 === 0)
      addText(agent.name, margin + 5, yPosition + 5, { fontSize: 9 })
      addText(agent.value.toString(), margin + col1Width + 5, yPosition + 5, { fontSize: 9, color: accentColor })
      yPosition += rowHeight
    })

    yPosition += 15
  }

  // Métricas de funnel si están disponibles
  if (analytics.funnelMetrics) {
    addText('Funnel de Conversaciones', margin, yPosition, { fontSize: 16, color: primaryColor })
    yPosition += 10

    const funnel = analytics.funnelMetrics
    const funnelMetrics = [
      { label: 'Conversaciones Iniciadas', value: funnel.funnel.totalThreads },
      { label: 'Conversaciones Asignadas', value: funnel.funnel.assignedThreads },
      { label: 'Conversaciones con Respuesta', value: funnel.funnel.threadsWithAgentResponse },
      { label: 'Conversaciones Resueltas', value: funnel.funnel.resolvedThreads },
      { label: 'Tasa de Asignación (%)', value: funnel.conversionRates.assignmentRate },
      { label: 'Tasa de Respuesta (%)', value: funnel.conversionRates.responseRate },
      { label: 'Tasa de Resolución (%)', value: funnel.conversionRates.resolutionRate }
    ]

    // Tabla de funnel
    addRect(margin, yPosition, tableWidth, rowHeight, true)
    addText('Etapa del Funnel', margin + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    addText('Valor', margin + col1Width + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    yPosition += rowHeight

    funnelMetrics.forEach((metric, index) => {
      addRect(margin, yPosition, tableWidth, rowHeight, index % 2 === 0)
      addText(metric.label, margin + 5, yPosition + 5, { fontSize: 9 })
      addText(metric.value.toString(), margin + col1Width + 5, yPosition + 5, { fontSize: 9, color: accentColor })
      yPosition += rowHeight
    })

    yPosition += 15
  }

  // Métricas por hora si están disponibles
  if (analytics.hourlyMetrics && analytics.hourlyMetrics.length > 0) {
    addText('Actividad por Hora del Día', margin, yPosition, { fontSize: 16, color: primaryColor })
    yPosition += 10

    // Mostrar solo las horas con mayor actividad
    const topHours = analytics.hourlyMetrics
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10)

    // Tabla de horas
    addRect(margin, yPosition, tableWidth, rowHeight, true)
    addText('Hora', margin + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    addText('Total Mensajes', margin + col1Width + 5, yPosition + 5, { fontSize: 10, color: primaryColor })
    yPosition += rowHeight

    topHours.forEach((hour: any, index: number) => {
      addRect(margin, yPosition, tableWidth, rowHeight, index % 2 === 0)
      addText(`${hour.hour}:00`, margin + 5, yPosition + 5, { fontSize: 9 })
      addText(hour.total.toString(), margin + col1Width + 5, yPosition + 5, { fontSize: 9, color: accentColor })
      yPosition += rowHeight
    })

    yPosition += 15
  }

  // Pie de página
  const pageHeight = doc.internal.pageSize.height
  if (yPosition > pageHeight - 30) {
    doc.addPage()
    yPosition = margin
  }

  addLine(margin, pageHeight - 20, margin + tableWidth, pageHeight - 20)
  addText('Reporte generado por MessageHub Analytics', margin, pageHeight - 10, { fontSize: 8, color: secondaryColor })

  // Convertir a blob
  const pdfBlob = doc.output('blob')
  return pdfBlob
}

/**
 * Captura un elemento HTML como imagen y lo agrega al PDF
 */
export async function captureElementAsImage(
  elementId: string,
  options: { width?: number; height?: number; scale?: number } = {}
): Promise<string> {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`)
  }

  const canvas = await html2canvas(element, {
    scale: options.scale || 2,
    width: options.width,
    height: options.height,
    useCORS: true,
    allowTaint: true
  })

  return canvas.toDataURL('image/png')
}

/**
 * Genera un PDF con gráficos capturados
 */
export async function generateChartsPDF(
  chartElements: Array<{ id: string; title: string }>,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    title = 'Reporte de Gráficos',
    orientation = 'landscape',
    format = 'a4'
  } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format
  })

  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  let yPosition = margin

  // Título
  doc.setFontSize(20)
  doc.setTextColor('#1f2937')
  doc.text(title, margin, yPosition)
  yPosition += 20

  // Capturar y agregar cada gráfico
  for (const chart of chartElements) {
    try {
      const imageDataUrl = await captureElementAsImage(chart.id, { scale: 2 })
      
      // Calcular dimensiones de la imagen
      const maxWidth = pageWidth - (margin * 2)
      const maxHeight = pageHeight - yPosition - 40
      
      // Agregar título del gráfico
      doc.setFontSize(14)
      doc.setTextColor('#374151')
      doc.text(chart.title, margin, yPosition)
      yPosition += 10

      // Agregar imagen
      const imgWidth = Math.min(maxWidth, 200)
      const imgHeight = (imgWidth * 0.6) // Aspect ratio aproximado
      
      doc.addImage(imageDataUrl, 'PNG', margin, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 20

      // Agregar nueva página si es necesario
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = margin
      }
    } catch (error) {
      console.error(`Error capturing chart ${chart.id}:`, error)
      // Continuar con el siguiente gráfico
    }
  }

  // Pie de página
  addLine(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)
  doc.setFontSize(8)
  doc.setTextColor('#6b7280')
  doc.text('Reporte generado por MessageHub Analytics', margin, pageHeight - 10)

  return doc.output('blob')
}

/**
 * Descarga un archivo PDF
 */
export function downloadPDF(pdfBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Genera un nombre de archivo con timestamp
 */
export function generatePDFFilename(prefix: string): string {
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-')
  return `${prefix}_${timestamp}.pdf`
}

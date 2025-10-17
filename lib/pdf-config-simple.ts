// Configuración simplificada para PDF viewer
// Esta versión usa solo iframe para evitar problemas con react-pdf

export const PDF_CONFIG = {
  // Configuración del viewer simple
  simpleViewer: {
    // Parámetros para el iframe del PDF
    iframeParams: 'toolbar=1&navpanes=1&scrollbar=1',
    
    // Altura mínima del iframe
    minHeight: '600px',
    
    // Mostrar controles de navegación
    showControls: true,
    
    // Fallback si el iframe no funciona
    fallbackToDownload: true,
  }
}

// Función para obtener la URL del PDF con parámetros
export function getPdfUrlWithParams(pdfUrl: string): string {
  const separator = pdfUrl.includes('?') ? '&' : '#'
  return `${pdfUrl}${separator}${PDF_CONFIG.simpleViewer.iframeParams}`
}

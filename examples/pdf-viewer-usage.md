# PDF Viewer - Guía de Uso

## Descripción

El PDF Viewer es un componente que permite visualizar archivos PDF directamente en la aplicación usando iframe. Esta implementación es simple y robusta, evitando problemas con react-pdf.

## Componentes

### 1. PdfViewerSimple

Modal completo para visualizar PDFs usando iframe:

```tsx
import { PdfViewerSimple } from "@/components/inbox/pdf-viewer-simple"

function MyComponent() {
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  
  return (
    <PdfViewerSimple
      isOpen={pdfModalOpen}
      onClose={() => setPdfModalOpen(false)}
      pdfUrl="https://example.com/document.pdf"
      fileName="Mi Documento.pdf"
    />
  )
}
```

**Props:**
- `isOpen: boolean` - Controla si el modal está abierto
- `onClose: () => void` - Función para cerrar el modal
- `pdfUrl: string` - URL del archivo PDF
- `fileName?: string` - Nombre del archivo (opcional)

**Funcionalidades:**
- ✅ Visualización de PDF con iframe
- ✅ Botón de descarga
- ✅ Controles nativos del navegador
- ✅ Compatible con todos los navegadores
- ✅ Sin dependencias externas problemáticas

### 2. PdfAttachmentSimple

Componente compacto para mostrar PDFs en listas de mensajes:

```tsx
import { PdfAttachmentSimple } from "@/components/inbox/pdf-viewer-simple"

function MessageList() {
  return (
    <PdfAttachmentSimple
      url="https://example.com/document.pdf"
      fileName="Documento.pdf"
      onOpenModal={() => console.log('Abrir modal')}
    />
  )
}
```

**Props:**
- `url: string` - URL del archivo PDF
- `fileName: string` - Nombre del archivo
- `className?: string` - Clases CSS adicionales
- `showPreview?: boolean` - Mostrar preview de la primera página
- `onOpenModal?: () => void` - Función para abrir el modal completo

## Integración en MessageList

El PDF viewer se integra automáticamente en la lista de mensajes:

```tsx
// En message-list.tsx
{message.attachments.map((att: any, idx: number) => {
  const isPdf = att.filename?.toLowerCase().endsWith('.pdf') || att.type === 'pdf'
  const fileName = att.filename || "Archivo adjunto"
  
  return (
    <div key={idx}>
      {isPdf && (
        <PdfAttachment
          url={att.url}
          fileName={fileName}
          onOpenModal={() => handleOpenPdfModal(att.url, fileName)}
        />
      )}
    </div>
  )
})}
```

## Características Técnicas

### Dependencias
- Sin dependencias externas problemáticas
- Usa iframe nativo del navegador
- Configuración simple y robusta

### Configuración
```tsx
import { getPdfUrlWithParams, PDF_CONFIG } from "@/lib/pdf-config-simple"

// Configuración automática de parámetros del iframe
const pdfUrl = getPdfUrlWithParams("https://example.com/document.pdf")
```

### Optimizaciones
- ✅ Sin dependencias externas
- ✅ Compatible con todos los navegadores
- ✅ Manejo de errores robusto
- ✅ Configuración simple
- ✅ Fallback a descarga automática

### Responsive Design
- ✅ Modal adaptable a diferentes tamaños de pantalla
- ✅ Controles táctiles para móviles
- ✅ Zoom optimizado para touch

## Casos de Uso

### 1. Visualización de Documentos
- Manuales de usuario
- Términos y condiciones
- Reportes generados
- Facturas y comprobantes

### 2. Colaboración
- Documentos compartidos en conversaciones
- Archivos adjuntos en mensajes
- Preview rápido sin descarga

### 3. Accesibilidad
- Navegación por teclado
- Contraste adecuado
- Texto alternativo para imágenes

## Limitaciones

- ✅ Solo soporta archivos PDF
- ✅ Requiere conexión a internet para cargar el worker
- ✅ Archivos muy grandes pueden tardar en cargar
- ✅ No soporta formularios PDF interactivos

## Troubleshooting

### Error: "Error al cargar el PDF"
- Verificar que la URL sea accesible
- Comprobar CORS en el servidor
- Verificar que el archivo sea un PDF válido

### PDF no se muestra
- Verificar configuración del worker
- Comprobar la consola del navegador
- Verificar que react-pdf esté instalado correctamente

### Performance lenta
- Reducir el tamaño del PDF
- Optimizar la resolución de renderizado
- Usar lazy loading cuando sea posible

## Ejemplo Completo

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PdfViewerModal } from "@/components/inbox/pdf-viewer-modal"
import { PdfAttachment } from "@/components/inbox/pdf-attachment"

export function PdfExample() {
  const [modalOpen, setModalOpen] = useState(false)
  
  const pdfUrl = "https://example.com/sample.pdf"
  const fileName = "Documento de Ejemplo.pdf"
  
  return (
    <div className="space-y-4">
      <h2>PDF Viewer Example</h2>
      
      {/* Botón para abrir modal */}
      <Button onClick={() => setModalOpen(true)}>
        Ver PDF Completo
      </Button>
      
      {/* Componente compacto */}
      <PdfAttachment
        url={pdfUrl}
        fileName={fileName}
        onOpenModal={() => setModalOpen(true)}
        showPreview={true}
      />
      
      {/* Modal del viewer */}
      <PdfViewerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pdfUrl={pdfUrl}
        fileName={fileName}
      />
    </div>
  )
}
```

## Próximas Mejoras

- [ ] Soporte para anotaciones
- [ ] Búsqueda de texto en PDF
- [ ] Marcadores/bookmarks
- [ ] Modo de pantalla completa
- [ ] Impresión directa
- [ ] Soporte para PDFs protegidos con contraseña

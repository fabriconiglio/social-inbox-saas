# Soporte de Videos - Guía de Uso

## Descripción
Sistema completo de soporte para videos (MP4, MOV) con reproductor integrado, optimización automática y galería interactiva.

## Tipos de Video Soportados

### Formatos Principales
- **MP4**: Formato estándar, amplia compatibilidad
- **MOV**: Formato Apple QuickTime
- **WebM**: Formato web moderno
- **AVI**: Formato tradicional
- **MKV**: Formato contenedor

### Características por Formato
```typescript
// MP4 - Estándar web
{
  format: 'mp4',
  codec: 'H.264/H.265',
  container: 'MP4',
  compatibility: 'Universal',
  idealFor: 'Web, streaming, móviles'
}

// MOV - Apple
{
  format: 'mov',
  codec: 'H.264/ProRes',
  container: 'QuickTime',
  compatibility: 'Apple ecosystem',
  idealFor: 'Edición, macOS'
}

// WebM - Moderno
{
  format: 'webm',
  codec: 'VP8/VP9',
  container: 'WebM',
  compatibility: 'Navegadores modernos',
  idealFor: 'Web, streaming'
}
```

## Componentes Disponibles

### 1. VideoPreview
```typescript
import { VideoPreview } from '@/components/ui/video-preview'

function MyComponent() {
  return (
    <VideoPreview
      src="/path/to/video.mp4"
      name="video.mp4"
      size={10240000}
      type="video/mp4"
      onRemove={() => console.log('Remover video')}
      onDownload={() => console.log('Descargar video')}
      showMetadata={true}
      showControls={true}
      maxWidth={400}
      maxHeight={300}
      autoplay={false}
      muted={true}
    />
  )
}
```

### 2. VideoGallery
```typescript
import { VideoGallery } from '@/components/ui/video-preview'

function GalleryComponent() {
  const videos = [
    {
      id: '1',
      src: '/video1.mp4',
      name: 'video1.mp4',
      size: 10240000,
      type: 'video/mp4',
      thumbnail: '/thumb1.jpg'
    },
    // ... más videos
  ]

  return (
    <VideoGallery
      videos={videos}
      onRemove={(id) => console.log('Remover:', id)}
      onDownload={(id) => console.log('Descargar:', id)}
      maxVideos={4}
    />
  )
}
```

## Optimización Automática

### Hook useVideoOptimization
```typescript
import { useVideoOptimization } from '@/hooks/use-video-optimization'

function VideoUpload() {
  const { optimizeVideo, batchOptimize, isOptimizing, error } = useVideoOptimization()

  const handleUpload = async (file: File) => {
    const optimized = await optimizeVideo(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      bitrate: 2000000, // 2 Mbps
      fps: 30,
      format: 'mp4',
      maintainAspectRatio: true
    })

    if (optimized) {
      console.log('Reducción de tamaño:', optimized.compressionRatio + '%')
      console.log('Duración:', optimized.duration + 's')
      console.log('Bitrate:', optimized.bitrate)
    }
  }

  return (
    <div>
      {isOptimizing && <div>Optimizando video...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### Opciones de Optimización
```typescript
interface VideoOptimizationOptions {
  maxWidth?: number        // Ancho máximo (default: 1920)
  maxHeight?: number       // Alto máximo (default: 1080)
  quality?: number         // Calidad 0-1 (default: 0.8)
  bitrate?: number         // Bitrate en bps (default: 2000000)
  fps?: number            // Frames por segundo (default: 30)
  format?: 'mp4' | 'webm' // Formato de salida
  maintainAspectRatio?: boolean // Mantener proporción
}
```

## Detección de Videos

### Hook useVideoDetection
```typescript
import { useVideoDetection } from '@/hooks/use-video-optimization'

function VideoHandler() {
  const { 
    isVideoFile, 
    getVideoType, 
    isSupportedVideoType,
    getVideoMetadata 
  } = useVideoDetection()

  const handleFile = async (file: File) => {
    // Verificar si es video
    if (!isVideoFile(file)) {
      console.log('No es un video')
      return
    }

    // Obtener tipo de video
    const videoType = getVideoType(file)
    console.log('Tipo de video:', videoType)

    // Verificar si es soportado
    if (!isSupportedVideoType(file)) {
      console.log('Formato no soportado')
      return
    }

    // Obtener metadatos
    const metadata = await getVideoMetadata(file)
    if (metadata) {
      console.log('Duración:', metadata.duration)
      console.log('Dimensiones:', metadata.width, 'x', metadata.height)
      console.log('Aspect ratio:', metadata.aspectRatio)
    }
  }
}
```

## Funcionalidades Avanzadas

### 1. Reproductor Integrado
```typescript
<VideoPreview
  src={videoUrl}
  name="archivo.mp4"
  size={10240000}
  type="video/mp4"
  showControls={true}        // Controles de reproducción
  showMetadata={true}        // Información del video
  maxWidth={600}            // Tamaño máximo
  maxHeight={400}
  autoplay={false}           // Autoplay
  muted={true}              // Silenciado por defecto
/>
```

### 2. Galería con Navegación
```typescript
<VideoGallery
  videos={videoArray}
  maxVideos={4}             // Máximo de videos visibles
  onRemove={handleRemove}    // Callback para remover
  onDownload={handleDownload} // Callback para descargar
/>
```

### 3. Optimización por Lotes
```typescript
const { batchOptimize } = useVideoOptimization()

const handleMultipleVideos = async (files: File[]) => {
  const optimizedVideos = await batchOptimize(files, {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.7,
    bitrate: 1500000, // 1.5 Mbps
    fps: 24,
    format: 'mp4'
  })

  console.log(`${optimizedVideos.length} videos optimizados`)
}
```

## Controles de Video

### Reproducción
```typescript
// Controles automáticos en VideoPreview
- Play/Pause: Botón central o espacio
- Barra de progreso: Click para saltar
- Volumen: Slider deslizable
- Pantalla completa: Botón o F11
- Reiniciar: Botón de reinicio
```

### Navegación en Galería
```typescript
// Navegación automática en VideoGallery
- Click en video: Abrir reproductor
- Flechas: Navegar entre videos
- Escape: Cerrar reproductor
- Controles: Play, pause, volumen, pantalla completa
```

## Metadatos de Video

### Información Extraída
```typescript
interface VideoMetadata {
  duration: number           // Duración en segundos
  width: number             // Ancho en píxeles
  height: number            // Alto en píxeles
  aspectRatio: string       // Proporción (ej: "1.78")
  fileSize: string          // Tamaño formateado (ej: "10.2 MB")
  format: string            // Formato (ej: "MP4")
  dimensions: string        // Dimensiones (ej: "1920 × 1080")
  bitrate?: number          // Bitrate en bps
  fps?: number             // Frames por segundo
}
```

### Visualización de Metadatos
```typescript
<VideoPreview
  showMetadata={true}  // Mostrar información debajo del video
  // Muestra: nombre, tamaño, formato, dimensiones, duración, aspect ratio
/>
```

## Thumbnails de Video

### Generación Automática
```typescript
import { useVideoThumbnailGeneration } from '@/hooks/use-video-optimization'

function VideoThumbnails() {
  const { generateThumbnail, generateMultipleThumbnails } = useVideoThumbnailGeneration()

  const handleVideo = async (file: File) => {
    // Thumbnail en segundo 1
    const thumbnail = await generateThumbnail(file, 1)
    
    // Múltiples thumbnails
    const thumbnails = await generateMultipleThumbnails(file, 3)
  }
}
```

## Optimización Automática en MessageComposer

### Configuración por Defecto
```typescript
// En MessageComposer, los videos se optimizan automáticamente:
{
  maxWidth: 1920,           // Ancho máximo
  maxHeight: 1080,          // Alto máximo
  quality: 0.8,             // 80% de calidad
  bitrate: 2000000,         // 2 Mbps
  fps: 30,                  // 30 FPS
  format: 'mp4',            // Convertir a MP4
  maintainAspectRatio: true // Mantener proporción
}
```

### Resultados Típicos
- **Videos largos**: 100MB → 25MB (75% reducción)
- **Videos HD**: 50MB → 15MB (70% reducción)
- **Videos 4K**: 200MB → 40MB (80% reducción)

## Separación Inteligente en MessageComposer

- **Sección de Videos**: Galería con thumbnails y controles
- **Sección de Imágenes**: Galería visual con zoom
- **Sección de Otros Archivos**: Lista tradicional con iconos
- **Preview Automático**: Optimización y preview inmediato

## Responsive Design

### Adaptación por Pantalla
```typescript
// Mobile (< 768px)
- Grid de 2 columnas para galería
- Controles táctiles optimizados
- Reproductor adaptativo

// Tablet (768px - 1024px)  
- Grid de 3 columnas para galería
- Controles híbridos
- Reproductor mediano

// Desktop (> 1024px)
- Grid de 4 columnas para galería
- Controles de mouse completos
- Reproductor grande
```

## Accesibilidad

### ARIA Labels
```typescript
<VideoPreview
  // Screen readers pueden describir el video
  // Controles accesibles con teclado
  // Indicadores de estado claros
/>

<VideoGallery
  // Navegación con teclado
  // Indicadores de estado
  // Controles accesibles
/>
```

### Navegación por Teclado
```typescript
// Controles de teclado:
- Tab: Navegar entre controles
- Enter/Space: Play/Pause
- Escape: Cerrar modales
- Flechas: Navegar en galería
- F11: Pantalla completa
```

## Performance

### Optimizaciones Implementadas
```typescript
// Lazy Loading
- Videos se cargan solo cuando son visibles
- Thumbnails se generan bajo demanda

// Memoria
- URLs de objetos se liberan automáticamente
- Canvas se limpia después de uso

// Red
- Optimización reduce tamaño de archivo
- Formato MP4 para máxima compatibilidad
- Compresión inteligente por duración
```

## Casos de Uso

### 1. Videos de Producto
```typescript
// Usuario sube video de 50MB
// Sistema optimiza a 12MB (76% reducción)
// Muestra preview con controles
// Guarda versión optimizada
```

### 2. Tutoriales
```typescript
// Videos educativos largos
// Navegación fluida entre videos
// Controles de reproducción
// Descarga individual
```

### 3. Demostraciones
```typescript
// Videos de demostración
// Optimización mantiene calidad
// Preview con metadatos
// Compresión inteligente
```

## Troubleshooting

### Problemas Comunes
```typescript
// Video no se optimiza
// Verificar que sea formato soportado
if (!isSupportedVideoType(file)) {
  console.log('Formato no soportado')
}

// Error de memoria
// Verificar tamaño de video
if (file.size > 500 * 1024 * 1024) { // 500MB
  console.log('Video muy grande')
}

// Preview no se muestra
// Verificar URL válida
if (!videoUrl || videoUrl === '') {
  console.log('URL de video inválida')
}
```

### Debug
```typescript
// Logs de optimización
console.log('Optimización:', {
  original: optimized.originalSize,
  optimized: optimized.optimizedSize,
  reduction: optimized.compressionRatio,
  duration: optimized.duration,
  bitrate: optimized.bitrate
})

// Logs de metadatos
console.log('Metadatos:', {
  dimensions: metadata.dimensions,
  format: metadata.format,
  duration: metadata.duration,
  aspectRatio: metadata.aspectRatio
})
```

## Mejores Prácticas

### 1. Formatos Recomendados
- **Web**: MP4 con H.264
- **Móvil**: MP4 con H.265
- **Streaming**: WebM con VP9
- **Edición**: MOV con ProRes

### 2. Tamaños Óptimos
- **Thumbnails**: 320x180px
- **Preview**: 640x360px máximo
- **Full size**: 1920x1080px máximo
- **Mobile**: 1280x720px máximo

### 3. Calidad vs Tamaño
- **Alta calidad**: 0.9 (archivos grandes)
- **Media calidad**: 0.8 (balanceado)
- **Baja calidad**: 0.6 (archivos pequeños)

### 4. Bitrate Recomendado
- **4K**: 8-15 Mbps
- **1080p**: 2-5 Mbps
- **720p**: 1-3 Mbps
- **480p**: 0.5-1.5 Mbps

### 5. UX
- Mostrar progreso de optimización
- Indicar reducción de tamaño
- Permitir cancelar optimización
- Preview inmediato
- Controles intuitivos

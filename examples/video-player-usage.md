# Video Player Integrado - Guía de Uso

## Descripción
Sistema completo de reproducción de video con player integrado, controles avanzados, subtítulos, calidad múltiple y modo pantalla completa.

## Características Principales

### 🎬 Reproducción Avanzada
- **Controles Personalizados**: Play/pause, skip, volumen, velocidad
- **Pantalla Completa**: Modo inmersivo con F11
- **Calidad Múltiple**: Selector de calidad automático
- **Subtítulos**: Soporte para múltiples idiomas
- **Velocidad**: Control de velocidad de reproducción
- **Metadatos**: Información completa del video

### 🎮 Controles Interactivos
- **Barra de Progreso**: Click para saltar, hover para preview
- **Volumen**: Slider deslizante con mute/unmute
- **Configuración**: Panel de opciones avanzadas
- **Teclado**: Navegación completa con teclado
- **Táctil**: Controles optimizados para móvil

### 📱 Funcionalidades Móviles
- **Responsive**: Adaptación automática a pantalla
- **Táctil**: Gestos de swipe y tap
- **Auto-play**: Reproducción automática opcional
- **Poster**: Imagen de preview antes de reproducir

## Componentes Disponibles

### 1. VideoPlayer
```typescript
import { VideoPlayer } from '@/components/ui/video-player'

function MyVideoPlayer() {
  return (
    <VideoPlayer
      src="/video.mp4"
      name="video.mp4"
      size={1024000}
      type="video/mp4"
      poster="/poster.jpg"
      onClose={() => console.log('Cerrar video')}
      onDownload={() => console.log('Descargar video')}
      onShare={() => console.log('Compartir video')}
      onFavorite={() => console.log('Favorito')}
      onBookmark={() => console.log('Bookmark')}
      showMetadata={true}
      showControls={true}
      allowFullscreen={true}
      allowDownload={true}
      allowShare={true}
      allowFavorites={true}
      allowBookmarks={true}
      autoPlay={false}
      muted={true}
      loop={false}
      subtitles={[
        {
          src: '/subtitles-en.vtt',
          label: 'English',
          language: 'en',
          default: true
        },
        {
          src: '/subtitles-es.vtt',
          label: 'Español',
          language: 'es'
        }
      ]}
      qualities={[
        {
          src: '/video-720p.mp4',
          label: '720p',
          quality: '720p',
          default: true
        },
        {
          src: '/video-1080p.mp4',
          label: '1080p',
          quality: '1080p'
        }
      ]}
    />
  )
}
```

### 2. VideoPlayerModal
```typescript
import { VideoPlayerModal } from '@/components/inbox/video-player-modal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <VideoPlayerModal
      videos={videos}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      initialIndex={0}
      onDownload={(id) => console.log('Descargar:', id)}
      onShare={(id) => console.log('Compartir:', id)}
      onFavorite={(id) => console.log('Favorito:', id)}
      onBookmark={(id) => console.log('Bookmark:', id)}
    />
  )
}
```

### 3. VideoPlayerTrigger
```typescript
import { VideoPlayerTrigger } from '@/components/inbox/video-player-modal'

function MyComponent() {
  return (
    <VideoPlayerTrigger
      videos={videos}
      onDownload={(id) => console.log('Descargar:', id)}
      onShare={(id) => console.log('Compartir:', id)}
      onFavorite={(id) => console.log('Favorito:', id)}
      onBookmark={(id) => console.log('Bookmark:', id)}
      className="grid grid-cols-4 gap-2"
    />
  )
}
```

## Hook useVideoPlayer

### Funcionalidades Principales
```typescript
import { useVideoPlayer } from '@/hooks/use-video-player'

function MyComponent() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
    // State
    state,
    metadata,
    
    // Playback controls
    play,
    pause,
    togglePlayPause,
    seek,
    skipBack,
    skipForward,
    
    // Volume controls
    setVolume,
    mute,
    unmute,
    toggleMute,
    
    // Playback rate
    setPlaybackRate,
    
    // Fullscreen
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    
    // Quality
    setQuality,
    
    // Subtitles
    setSubtitle,
    
    // UI controls
    toggleVolumeSlider,
    toggleSettings,
    toggleQualityMenu,
    toggleSubtitleMenu,
    togglePlaybackSpeedMenu,
    
    // Progress
    handleProgressClick,
    handleProgressHover,
    handleProgressLeave,
    
    // Formatting
    formatTime,
    formatFileSize,
    
    // Reset
    resetPlayer
  } = useVideoPlayer(videoRef, containerRef, initialSrc, qualities, subtitles)

  return (
    <div>
      {/* Usar las funciones del hook */}
    </div>
  )
}
```

### Controles de Reproducción
```typescript
// Reproducción básica
play()                    // Reproducir
pause()                   // Pausar
togglePlayPause()         // Toggle play/pause
seek(120)                 // Saltar a 2 minutos
skipBack(10)              // Retroceder 10 segundos
skipForward(10)           // Avanzar 10 segundos
```

### Controles de Volumen
```typescript
// Volumen
setVolume(0.8)            // Volumen al 80%
mute()                    // Silenciar
unmute()                  // Activar sonido
toggleMute()              // Toggle mute/unmute
```

### Velocidad de Reproducción
```typescript
// Velocidad
setPlaybackRate(1.5)      // 1.5x velocidad
setPlaybackRate(0.5)      // 0.5x velocidad (lento)
setPlaybackRate(2)        // 2x velocidad (rápido)
```

### Pantalla Completa
```typescript
// Pantalla completa
toggleFullscreen()        // Toggle fullscreen
enterFullscreen()         // Entrar a fullscreen
exitFullscreen()          // Salir de fullscreen
```

### Calidad y Subtítulos
```typescript
// Calidad
setQuality('/video-1080p.mp4')  // Cambiar a 1080p

// Subtítulos
setSubtitle('/subtitles-es.vtt') // Cambiar a español
setSubtitle('')                  // Desactivar subtítulos
```

### Controles de UI
```typescript
// Paneles de configuración
toggleVolumeSlider()      // Toggle slider de volumen
toggleSettings()          // Toggle panel de configuración
toggleQualityMenu()       // Toggle menú de calidad
toggleSubtitleMenu()      // Toggle menú de subtítulos
togglePlaybackSpeedMenu() // Toggle menú de velocidad
```

### Barra de Progreso
```typescript
// Eventos de progreso
handleProgressClick(e)    // Click en barra de progreso
handleProgressHover(e)    // Hover en barra de progreso
handleProgressLeave()     // Salir de hover
```

### Formateo
```typescript
// Formateo de tiempo y tamaño
formatTime(125)           // "2:05"
formatFileSize(1024000)   // "1.0 MB"
```

## Hook useVideoMetadata

### Extracción de Metadatos
```typescript
import { useVideoMetadata } from '@/hooks/use-video-player'

function MyComponent() {
  const {
    metadata,
    extractMetadata,
    updateMetadata
  } = useVideoMetadata()

  // Extraer metadatos de archivo
  const handleFile = async (file: File) => {
    const videoMetadata = await extractMetadata(file)
    console.log('Metadatos:', videoMetadata)
    // Retorna: { duration, bitrate, resolution, frameRate, codec, fileSize, format, title }
  }

  // Actualizar metadatos
  updateMetadata({
    duration: 120,
    bitrate: 2000,
    resolution: '1920x1080',
    frameRate: 30,
    codec: 'H.264',
    fileSize: '50 MB',
    format: 'MP4',
    title: 'Mi Video'
  })
}
```

### Metadatos Extraídos
```typescript
interface VideoMetadata {
  duration: number        // Duración en segundos
  bitrate: number        // Bitrate en kbps
  resolution: string     // Resolución (1920x1080)
  frameRate: number      // FPS (30, 60, etc.)
  codec: string          // Códec (H.264, H.265, etc.)
  fileSize: string       // Tamaño formateado
  format: string         // Formato (MP4, WebM, etc.)
  title?: string         // Título del video
  artist?: string        // Artista/Creador
  album?: string         // Álbum/Serie
  year?: number          // Año de creación
}
```

## Hook useVideoQuality

### Gestión de Calidades
```typescript
import { useVideoQuality } from '@/hooks/use-video-player'

function MyComponent() {
  const {
    qualities,
    addQuality,
    removeQuality,
    setDefaultQuality,
    getDefaultQuality
  } = useVideoQuality()

  // Agregar calidad
  addQuality({
    src: '/video-720p.mp4',
    label: '720p',
    quality: '720p',
    default: true
  })

  // Remover calidad
  removeQuality('/video-720p.mp4')

  // Establecer calidad por defecto
  setDefaultQuality('/video-1080p.mp4')

  // Obtener calidad por defecto
  const defaultQuality = getDefaultQuality()
}
```

## Hook useVideoSubtitles

### Gestión de Subtítulos
```typescript
import { useVideoSubtitles } from '@/hooks/use-video-player'

function MyComponent() {
  const {
    subtitles,
    addSubtitle,
    removeSubtitle,
    setDefaultSubtitle,
    getDefaultSubtitle
  } = useVideoSubtitles()

  // Agregar subtítulo
  addSubtitle({
    src: '/subtitles-en.vtt',
    label: 'English',
    language: 'en',
    default: true
  })

  // Remover subtítulo
  removeSubtitle('/subtitles-en.vtt')

  // Establecer subtítulo por defecto
  setDefaultSubtitle('/subtitles-es.vtt')

  // Obtener subtítulo por defecto
  const defaultSubtitle = getDefaultSubtitle()
}
```

## Controles de Teclado

### Navegación
```typescript
// Controles básicos
'Space'        : Play/pause
'ArrowLeft'    : Retroceder 10 segundos
'ArrowRight'   : Avanzar 10 segundos
'ArrowUp'      : Subir volumen
'ArrowDown'    : Bajar volumen
'm' / 'M'      : Mute/unmute
'f' / 'F'      : Toggle fullscreen
'Escape'       : Cerrar player
```

### Velocidad
```typescript
// Controles de velocidad
'1'            : Velocidad 1x
'2'            : Velocidad 2x
'3'            : Velocidad 3x
'0'            : Velocidad 0.5x
```

### Navegación Avanzada
```typescript
// Controles adicionales
'Tab'          : Navegar entre controles
'Enter'        : Activar control seleccionado
'Shift + ←'    : Retroceder 30 segundos
'Shift + →'    : Avanzar 30 segundos
```

## Responsive Design

### Adaptación por Pantalla
```typescript
// Mobile (< 768px)
- Controles táctiles optimizados
- Gestos de swipe para navegación
- Botones grandes para fácil acceso
- Auto-hide de controles

// Tablet (768px - 1024px)
- Controles híbridos
- Gestos táctiles y mouse
- Paneles laterales deslizables
- Controles de tamaño medio

// Desktop (> 1024px)
- Controles de mouse completos
- Hover effects
- Paneles laterales fijos
- Controles de tamaño pequeño
```

### Breakpoints
```typescript
// Tailwind CSS breakpoints
'sm': '640px'   // Mobile landscape
'md': '768px'   // Tablet
'lg': '1024px'  // Desktop
'xl': '1280px'  // Large desktop
'2xl': '1536px' // Extra large
```

## Accesibilidad

### ARIA Labels
```typescript
// Controles accesibles
<button aria-label="Reproducir video">
  <Play />
</button>

<button aria-label="Pausar video">
  <Pause />
</button>

<button aria-label="Pantalla completa">
  <Maximize2 />
</button>

<button aria-label="Silenciar">
  <VolumeX />
</button>
```

### Navegación por Teclado
```typescript
// Navegación completa
- Tab: Navegar entre controles
- Enter/Space: Activar control
- Escape: Cerrar player
- Flechas: Navegación y volumen
- F11: Pantalla completa
```

### Screen Readers
```typescript
// Descripción de video
<video 
  src={video.src}
  aria-label={`Video: ${video.name}`}
  aria-describedby="video-metadata"
/>

// Metadatos accesibles
<div id="video-metadata" aria-live="polite">
  {video.metadata && (
    <div>
      Duración: {formatTime(video.metadata.duration)}
      Resolución: {video.metadata.resolution}
      Formato: {video.metadata.format}
    </div>
  )}
</div>
```

## Performance

### Optimizaciones Implementadas
```typescript
// Lazy Loading
- Videos se cargan solo cuando son visibles
- Thumbnails se generan bajo demanda
- Metadatos se extraen bajo demanda

// Memoria
- URLs de objetos se liberan automáticamente
- Event listeners se remueven al desmontar
- Canvas se limpia después de uso

// Red
- Calidad adaptativa según conexión
- Buffering inteligente
- Preload de metadatos
```

### Lazy Loading
```typescript
// Cargar video solo cuando es visible
const [isVisible, setIsVisible] = useState(false)

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    },
    { threshold: 0.1 }
  )

  if (videoRef.current) {
    observer.observe(videoRef.current)
  }

  return () => observer.disconnect()
}, [])
```

## Casos de Uso

### 1. Galería de Videos
```typescript
// Galería con múltiples videos
<VideoPlayerTrigger
  videos={videoArray}
  onDownload={(id) => console.log('Descargar:', id)}
  onShare={(id) => console.log('Compartir:', id)}
  onFavorite={(id) => console.log('Favorito:', id)}
  onBookmark={(id) => console.log('Bookmark:', id)}
  className="grid grid-cols-4 gap-2"
/>
```

### 2. Video Tutorial
```typescript
// Tutorial con subtítulos y calidad
<VideoPlayer
  src="/tutorial.mp4"
  name="tutorial.mp4"
  size={50000000}
  type="video/mp4"
  poster="/tutorial-poster.jpg"
  subtitles={[
    { src: '/tutorial-en.vtt', label: 'English', language: 'en', default: true },
    { src: '/tutorial-es.vtt', label: 'Español', language: 'es' }
  ]}
  qualities={[
    { src: '/tutorial-720p.mp4', label: '720p', quality: '720p', default: true },
    { src: '/tutorial-1080p.mp4', label: '1080p', quality: '1080p' }
  ]}
  showMetadata={true}
  allowFullscreen={true}
  allowDownload={true}
  allowShare={true}
/>
```

### 3. Video de Producto
```typescript
// Video de producto con metadatos
<VideoPlayer
  src="/product-demo.mp4"
  name="product-demo.mp4"
  size={25000000}
  type="video/mp4"
  poster="/product-poster.jpg"
  showMetadata={true}
  allowFullscreen={true}
  allowDownload={false}
  allowShare={true}
  autoPlay={false}
  muted={true}
  loop={false}
/>
```

## Troubleshooting

### Problemas Comunes
```typescript
// Video no se reproduce
// Verificar URL válida
if (!video.src || video.src === '') {
  console.log('URL de video inválida')
}

// Error de memoria
// Verificar tamaño de video
if (video.size > 100 * 1024 * 1024) { // 100MB
  console.log('Video muy grande')
}

// Controles no funcionan
// Verificar que showControls esté habilitado
if (!showControls) {
  console.log('Controles deshabilitados')
}
```

### Debug
```typescript
// Logs de reproducción
console.log('Reproducción:', {
  isPlaying: state.isPlaying,
  currentTime: state.currentTime,
  duration: state.duration,
  volume: state.volume,
  playbackRate: state.playbackRate
})

// Logs de metadatos
console.log('Metadatos:', {
  duration: metadata?.duration,
  bitrate: metadata?.bitrate,
  resolution: metadata?.resolution,
  format: metadata?.format
})

// Logs de calidad
console.log('Calidad:', {
  selected: state.selectedQuality,
  available: qualities.length
})
```

## Mejores Prácticas

### 1. Optimización de Videos
- **Poster**: Imagen de preview optimizada
- **Calidad**: Múltiples calidades disponibles
- **Formato**: MP4 para máxima compatibilidad
- **Compresión**: H.264 para mejor rendimiento

### 2. UX
- **Loading**: Mostrar skeleton durante carga
- **Error**: Manejar errores de video gracefully
- **Feedback**: Indicadores de estado claros
- **Controles**: Controles intuitivos y accesibles

### 3. Performance
- **Lazy Loading**: Cargar solo videos visibles
- **Thumbnails**: Generar bajo demanda
- **Cache**: Usar service worker para cache
- **Buffering**: Preload inteligente

### 4. Accesibilidad
- **Alt Text**: Descripción clara de cada video
- **Keyboard**: Navegación completa con teclado
- **Screen Readers**: Metadatos accesibles
- **Contrast**: Controles con suficiente contraste

### 5. Responsive
- **Mobile**: Controles táctiles optimizados
- **Tablet**: Controles híbridos
- **Desktop**: Controles de mouse completos
- **Adaptive**: Calidad según conexión

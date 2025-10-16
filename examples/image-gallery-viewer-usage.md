# Image Gallery Viewer - Guía de Uso

## Descripción
Sistema completo de visualización de imágenes con gallery viewer avanzado, zoom, navegación, filtros y modo pantalla completa.

## Características Principales

### 🖼️ Visualización Avanzada
- **Zoom**: 10% - 500% con controles suaves
- **Pan**: Arrastrar para navegar en zoom alto
- **Rotación**: 90° incrementos con botón
- **Pantalla Completa**: Modo inmersivo con F11
- **Navegación**: Flechas, teclado, thumbnails

### 🎨 Filtros y Efectos
- **Brillo**: 0-200% con slider
- **Contraste**: 0-200% con slider
- **Saturación**: 0-200% con slider
- **Desenfoque**: 0-10px con slider
- **Sepia**: 0-100% con slider
- **Escala de Grises**: 0-100% con slider
- **Inversión**: 0-100% con slider

### 📱 Funcionalidades Interactivas
- **Auto-play**: Reproducción automática de galería
- **Thumbnails**: Navegación lateral con miniaturas
- **Metadatos**: Información completa de la imagen
- **Favoritos**: Sistema de marcado con corazón
- **Bookmarks**: Sistema de marcado con bookmark
- **Descarga**: Descarga individual de imágenes
- **Compartir**: Compartir con API nativa

## Componentes Disponibles

### 1. ImageGalleryViewer
```typescript
import { ImageGalleryViewer } from '@/components/ui/image-gallery-viewer'

function MyGallery() {
  const images = [
    {
      id: '1',
      src: '/image1.jpg',
      name: 'image1.jpg',
      size: 1024000,
      type: 'image/jpeg',
      thumbnail: '/thumb1.jpg',
      metadata: {
        width: 1920,
        height: 1080,
        format: 'JPEG',
        fileSize: '1.2 MB',
        createdAt: '2024-01-01T00:00:00Z',
        camera: {
          make: 'Canon',
          model: 'EOS R5',
          settings: 'f/2.8, 1/125s, ISO 100'
        }
      }
    }
    // ... más imágenes
  ]

  return (
    <ImageGalleryViewer
      images={images}
      initialIndex={0}
      onClose={() => console.log('Cerrar galería')}
      onDownload={(id) => console.log('Descargar:', id)}
      onShare={(id) => console.log('Compartir:', id)}
      onFavorite={(id) => console.log('Favorito:', id)}
      onBookmark={(id) => console.log('Bookmark:', id)}
      showMetadata={true}
      showControls={true}
      allowFullscreen={true}
      allowDownload={true}
      allowShare={true}
      allowFavorites={true}
      allowBookmarks={true}
      autoPlay={false}
      autoPlayInterval={3000}
    />
  )
}
```

### 2. ImageGalleryModal
```typescript
import { ImageGalleryModal } from '@/components/inbox/image-gallery-modal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <ImageGalleryModal
      images={images}
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

### 3. ImageGalleryTrigger
```typescript
import { ImageGalleryTrigger } from '@/components/inbox/image-gallery-modal'

function MyComponent() {
  return (
    <ImageGalleryTrigger
      images={images}
      onDownload={(id) => console.log('Descargar:', id)}
      onShare={(id) => console.log('Compartir:', id)}
      onFavorite={(id) => console.log('Favorito:', id)}
      onBookmark={(id) => console.log('Bookmark:', id)}
      className="grid grid-cols-4 gap-2"
    />
  )
}
```

## Hook useImageGallery

### Funcionalidades Principales
```typescript
import { useImageGallery } from '@/hooks/use-image-gallery'

function MyComponent() {
  const {
    // State
    state,
    currentImage,
    images,
    
    // Navigation
    goToNext,
    goToPrevious,
    goToIndex,
    
    // Zoom & Pan
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    
    // Rotation
    rotate,
    setRotation,
    
    // Pan
    startPan,
    updatePan,
    endPan,
    
    // View modes
    toggleFullscreen,
    toggleThumbnails,
    toggleMetadata,
    toggleFilters,
    setViewMode,
    
    // Auto-play
    toggleAutoPlay,
    setAutoPlay,
    
    // Favorites & Bookmarks
    toggleFavorite,
    toggleBookmark,
    isFavorite,
    isBookmarked,
    
    // Actions
    downloadImage,
    shareImage,
    
    // Reset
    resetView
  } = useImageGallery(images, 0)

  return (
    <div>
      {/* Usar las funciones del hook */}
    </div>
  )
}
```

### Navegación
```typescript
// Navegación básica
goToNext()        // Siguiente imagen
goToPrevious()    // Imagen anterior
goToIndex(2)      // Ir a imagen específica

// Navegación con teclado
// ← → : Navegación
// ↑ ↓ : Zoom
// Space : Auto-play toggle
// F : Fullscreen
// R : Rotar
// 0 : Reset zoom
// Escape : Cerrar
```

### Zoom y Pan
```typescript
// Zoom
zoomIn()          // Zoom in (1.2x)
zoomOut()         // Zoom out (0.8x)
setZoom(2.5)      // Zoom específico
resetZoom()       // Reset a 100%

// Pan (solo cuando zoom > 1)
startPan(x, y)    // Iniciar arrastre
updatePan(x, y)   // Actualizar posición
endPan()          // Finalizar arrastre
```

### Rotación
```typescript
rotate()          // Rotar 90° clockwise
setRotation(180)  // Rotar a ángulo específico
```

### Modos de Vista
```typescript
// Toggle de paneles
toggleFullscreen()    // Pantalla completa
toggleThumbnails()    // Panel de thumbnails
toggleMetadata()      // Panel de metadatos
toggleFilters()       // Panel de filtros

// Modo de vista
setViewMode('grid')   // Vista de cuadrícula
setViewMode('list')   // Vista de lista
```

### Auto-play
```typescript
toggleAutoPlay()      // Toggle auto-play
setAutoPlay(true)     // Activar auto-play
setAutoPlay(false)    // Desactivar auto-play
```

### Favoritos y Bookmarks
```typescript
// Favoritos
toggleFavorite('image1')  // Toggle favorito
isFavorite('image1')      // Verificar si es favorito

// Bookmarks
toggleBookmark('image1')  // Toggle bookmark
isBookmarked('image1')    // Verificar si está marcado
```

### Acciones
```typescript
downloadImage('image1')   // Descargar imagen
shareImage('image1')      // Compartir imagen
resetView()              // Reset vista completa
```

## Hook useImageFilters

### Filtros Disponibles
```typescript
import { useImageFilters } from '@/hooks/use-image-gallery'

function MyComponent() {
  const {
    filters,
    updateFilter,
    resetFilters,
    getFilterStyle
  } = useImageFilters()

  // Aplicar filtro
  updateFilter('brightness', 150)  // 150% brillo
  updateFilter('contrast', 120)    // 120% contraste
  updateFilter('saturation', 80)   // 80% saturación
  updateFilter('blur', 2)          // 2px desenfoque
  updateFilter('sepia', 50)        // 50% sepia
  updateFilter('grayscale', 100)   // 100% escala de grises
  updateFilter('invert', 100)      // 100% inversión

  // Reset todos los filtros
  resetFilters()

  // Obtener estilo CSS
  const filterStyle = getFilterStyle()
  // Retorna: { filter: "brightness(150%) contrast(120%) ..." }
}
```

### Filtros Disponibles
```typescript
interface ImageFilters {
  brightness: number    // 0-200% (default: 100)
  contrast: number     // 0-200% (default: 100)
  saturation: number   // 0-200% (default: 100)
  hue: number          // 0-360° (default: 0)
  blur: number         // 0-10px (default: 0)
  sepia: number        // 0-100% (default: 0)
  grayscale: number     // 0-100% (default: 0)
  invert: number       // 0-100% (default: 0)
}
```

## Hook useImageMetadata

### Extracción de Metadatos
```typescript
import { useImageMetadata } from '@/hooks/use-image-gallery'

function MyComponent() {
  const {
    metadata,
    extractMetadata,
    updateMetadata,
    getMetadata
  } = useImageMetadata()

  // Extraer metadatos de archivo
  const handleFile = async (file: File) => {
    const imageMetadata = await extractMetadata(file)
    console.log('Metadatos:', imageMetadata)
    // Retorna: { width, height, format, fileSize, name, lastModified }
  }

  // Actualizar metadatos
  updateMetadata('image1', {
    width: 1920,
    height: 1080,
    format: 'JPEG',
    fileSize: '1.2 MB'
  })

  // Obtener metadatos
  const imageMetadata = getMetadata('image1')
}
```

### Metadatos Extraídos
```typescript
interface ImageMetadata {
  width: number        // Ancho en píxeles
  height: number       // Alto en píxeles
  format: string       // Formato (JPEG, PNG, etc.)
  fileSize: number     // Tamaño en bytes
  name: string         // Nombre del archivo
  lastModified: string // Fecha de modificación
}
```

## Controles de Teclado

### Navegación
```typescript
// Controles básicos
'ArrowLeft'  : Imagen anterior
'ArrowRight' : Imagen siguiente
'Escape'     : Cerrar galería
'Space'      : Toggle auto-play
'F'          : Toggle fullscreen
'R'          : Rotar imagen
'0'          : Reset zoom
```

### Zoom
```typescript
// Controles de zoom
'+' / '='    : Zoom in
'-'          : Zoom out
'0'          : Reset zoom
'Mouse Wheel': Zoom in/out
```

### Navegación Avanzada
```typescript
// Controles adicionales
'Tab'        : Navegar entre controles
'Enter'       : Activar control seleccionado
'Arrow Up'   : Zoom in
'Arrow Down' : Zoom out
```

## Responsive Design

### Adaptación por Pantalla
```typescript
// Mobile (< 768px)
- Controles táctiles optimizados
- Thumbnails en grid de 2 columnas
- Paneles laterales colapsables
- Zoom con gestos de pellizco

// Tablet (768px - 1024px)
- Controles híbridos
- Thumbnails en grid de 3 columnas
- Paneles laterales deslizables
- Zoom con rueda del mouse

// Desktop (> 1024px)
- Controles de mouse completos
- Thumbnails en grid de 4+ columnas
- Paneles laterales fijos
- Zoom con rueda del mouse
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
<button aria-label="Imagen anterior">
  <ChevronLeft />
</button>

<button aria-label="Zoom in">
  <ZoomIn />
</button>

<button aria-label="Pantalla completa">
  <Maximize2 />
</button>
```

### Navegación por Teclado
```typescript
// Navegación completa
- Tab: Navegar entre controles
- Enter/Space: Activar control
- Escape: Cerrar galería
- Flechas: Navegación y zoom
- F11: Pantalla completa
```

### Screen Readers
```typescript
// Descripción de imagen
<img 
  src={image.src}
  alt={`Imagen ${index + 1} de ${total}: ${image.name}`}
  aria-describedby="image-metadata"
/>

// Metadatos accesibles
<div id="image-metadata" aria-live="polite">
  {image.metadata && (
    <div>
      Dimensiones: {image.metadata.width}×{image.metadata.height}
      Formato: {image.metadata.format}
      Tamaño: {image.metadata.fileSize}
    </div>
  )}
</div>
```

## Performance

### Optimizaciones Implementadas
```typescript
// Lazy Loading
- Imágenes se cargan solo cuando son visibles
- Thumbnails se generan bajo demanda
- Metadatos se extraen bajo demanda

// Memoria
- URLs de objetos se liberan automáticamente
- Canvas se limpia después de uso
- Event listeners se remueven al desmontar

// Red
- Thumbnails optimizados para carga rápida
- Imágenes se cachean en el navegador
- Compresión automática de metadatos
```

### Lazy Loading
```typescript
// Cargar imagen solo cuando es visible
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

  if (imageRef.current) {
    observer.observe(imageRef.current)
  }

  return () => observer.disconnect()
}, [])
```

## Casos de Uso

### 1. Galería de Productos
```typescript
// E-commerce con múltiples imágenes
<ImageGalleryViewer
  images={productImages}
  showMetadata={true}
  allowDownload={true}
  allowShare={true}
  allowFavorites={true}
  autoPlay={false}
/>
```

### 2. Portfolio Fotográfico
```typescript
// Portfolio con metadatos de cámara
<ImageGalleryViewer
  images={portfolioImages}
  showMetadata={true}
  allowDownload={false}
  allowShare={true}
  allowFavorites={true}
  autoPlay={true}
  autoPlayInterval={5000}
/>
```

### 3. Galería de Usuario
```typescript
// Galería personal con favoritos
<ImageGalleryViewer
  images={userImages}
  showMetadata={false}
  allowDownload={true}
  allowShare={true}
  allowFavorites={true}
  allowBookmarks={true}
  autoPlay={false}
/>
```

## Troubleshooting

### Problemas Comunes
```typescript
// Imagen no se carga
// Verificar URL válida
if (!image.src || image.src === '') {
  console.log('URL de imagen inválida')
}

// Error de memoria
// Verificar tamaño de imagen
if (image.size > 50 * 1024 * 1024) { // 50MB
  console.log('Imagen muy grande')
}

// Zoom no funciona
// Verificar que zoom > 1
if (zoom <= 1) {
  console.log('Zoom debe ser mayor a 1')
}
```

### Debug
```typescript
// Logs de navegación
console.log('Navegación:', {
  currentIndex,
  totalImages: images.length,
  currentImage: images[currentIndex]?.name
})

// Logs de zoom
console.log('Zoom:', {
  zoom,
  panX,
  panY,
  rotation
})

// Logs de metadatos
console.log('Metadatos:', {
  width: image.metadata?.width,
  height: image.metadata?.height,
  format: image.metadata?.format,
  fileSize: image.metadata?.fileSize
})
```

## Mejores Prácticas

### 1. Optimización de Imágenes
- **Thumbnails**: 200x200px máximo
- **Preview**: 800x600px máximo
- **Full size**: 1920x1080px máximo
- **Formato**: JPEG para fotos, PNG para gráficos

### 2. Metadatos
- **Extraer**: Dimensiones, formato, tamaño
- **Mostrar**: Solo información relevante
- **Cachear**: Metadatos en localStorage

### 3. UX
- **Loading**: Mostrar skeleton durante carga
- **Error**: Manejar errores de imagen gracefully
- **Feedback**: Indicadores de estado claros
- **Navegación**: Controles intuitivos y accesibles

### 4. Performance
- **Lazy Loading**: Cargar solo imágenes visibles
- **Thumbnails**: Generar bajo demanda
- **Cache**: Usar service worker para cache
- **Compresión**: Optimizar imágenes automáticamente

### 5. Accesibilidad
- **Alt Text**: Descripción clara de cada imagen
- **Keyboard**: Navegación completa con teclado
- **Screen Readers**: Metadatos accesibles
- **Contrast**: Controles con suficiente contraste

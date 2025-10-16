# Soporte de Imágenes - Guía de Uso

## Descripción
Sistema completo de soporte para imágenes (JPG, PNG, GIF) con optimización automática, preview avanzado y galería interactiva.

## Tipos de Imagen Soportados

### Formatos Principales
- **JPEG/JPG**: Imágenes con compresión, ideal para fotos
- **PNG**: Imágenes sin pérdida, ideal para gráficos
- **GIF**: Imágenes animadas y con transparencia
- **WebP**: Formato moderno con mejor compresión

### Características por Formato
```typescript
// JPEG - Compresión con pérdida
{
  format: 'jpeg',
  compression: 'lossy',
  transparency: false,
  animation: false,
  idealFor: 'fotos, imágenes realistas'
}

// PNG - Sin pérdida
{
  format: 'png', 
  compression: 'lossless',
  transparency: true,
  animation: false,
  idealFor: 'gráficos, logos, capturas'
}

// GIF - Animado
{
  format: 'gif',
  compression: 'lossless',
  transparency: true,
  animation: true,
  idealFor: 'animaciones, iconos'
}
```

## Componentes Disponibles

### 1. ImagePreview
```typescript
import { ImagePreview } from '@/components/ui/image-preview'

function MyComponent() {
  return (
    <ImagePreview
      src="/path/to/image.jpg"
      alt="Descripción de la imagen"
      name="imagen.jpg"
      size={1024000}
      type="image/jpeg"
      onRemove={() => console.log('Remover imagen')}
      onDownload={() => console.log('Descargar imagen')}
      showMetadata={true}
      showControls={true}
      maxWidth={300}
      maxHeight={200}
    />
  )
}
```

### 2. ImageGallery
```typescript
import { ImageGallery } from '@/components/ui/image-preview'

function GalleryComponent() {
  const images = [
    {
      id: '1',
      src: '/image1.jpg',
      name: 'imagen1.jpg',
      size: 1024000,
      type: 'image/jpeg'
    },
    // ... más imágenes
  ]

  return (
    <ImageGallery
      images={images}
      onRemove={(id) => console.log('Remover:', id)}
      onDownload={(id) => console.log('Descargar:', id)}
      maxImages={6}
    />
  )
}
```

## Optimización Automática

### Hook useImageOptimization
```typescript
import { useImageOptimization } from '@/hooks/use-image-optimization'

function ImageUpload() {
  const { optimizeImage, batchOptimize, isOptimizing, error } = useImageOptimization()

  const handleUpload = async (file: File) => {
    const optimized = await optimizeImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'jpeg',
      maintainAspectRatio: true
    })

    if (optimized) {
      console.log('Reducción de tamaño:', optimized.compressionRatio + '%')
      console.log('Tamaño original:', optimized.originalSize)
      console.log('Tamaño optimizado:', optimized.optimizedSize)
    }
  }

  return (
    <div>
      {isOptimizing && <div>Optimizando imagen...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### Opciones de Optimización
```typescript
interface ImageOptimizationOptions {
  maxWidth?: number        // Ancho máximo (default: 1920)
  maxHeight?: number       // Alto máximo (default: 1080)
  quality?: number         // Calidad 0-1 (default: 0.8)
  format?: 'jpeg' | 'png' | 'webp'  // Formato de salida
  maintainAspectRatio?: boolean      // Mantener proporción
}
```

## Detección de Imágenes

### Hook useImageDetection
```typescript
import { useImageDetection } from '@/hooks/use-image-optimization'

function ImageHandler() {
  const { 
    isImageFile, 
    getImageType, 
    isSupportedImageType,
    getImageDimensions 
  } = useImageDetection()

  const handleFile = async (file: File) => {
    // Verificar si es imagen
    if (!isImageFile(file)) {
      console.log('No es una imagen')
      return
    }

    // Obtener tipo de imagen
    const imageType = getImageType(file)
    console.log('Tipo de imagen:', imageType)

    // Verificar si es soportado
    if (!isSupportedImageType(file)) {
      console.log('Formato no soportado')
      return
    }

    // Obtener dimensiones
    const dimensions = await getImageDimensions(file)
    if (dimensions) {
      console.log('Dimensiones:', dimensions.width, 'x', dimensions.height)
    }
  }
}
```

## Funcionalidades Avanzadas

### 1. Preview Interactivo
```typescript
<ImagePreview
  src={imageUrl}
  alt="Imagen"
  name="archivo.jpg"
  size={1024000}
  type="image/jpeg"
  showControls={true}        // Controles de zoom, rotación
  showMetadata={true}        // Información de la imagen
  maxWidth={400}            // Tamaño máximo
  maxHeight={300}
/>
```

### 2. Galería con Navegación
```typescript
<ImageGallery
  images={imageArray}
  maxImages={6}             // Máximo de imágenes visibles
  onRemove={handleRemove}    // Callback para remover
  onDownload={handleDownload} // Callback para descargar
/>
```

### 3. Optimización por Lotes
```typescript
const { batchOptimize } = useImageOptimization()

const handleMultipleImages = async (files: File[]) => {
  const optimizedImages = await batchOptimize(files, {
    maxWidth: 1280,
    maxHeight: 720,
    quality: 0.7,
    format: 'webp'
  })

  console.log(`${optimizedImages.length} imágenes optimizadas`)
}
```

## Controles de Imagen

### Zoom y Rotación
```typescript
// Controles automáticos en ImagePreview
- Zoom In/Out: Botones +/- o rueda del mouse
- Rotación: Botón de rotación 90°
- Reset: Volver a estado original
- Pantalla completa: Ver imagen a tamaño completo
```

### Navegación en Galería
```typescript
// Navegación automática en ImageGallery
- Click en imagen: Abrir en pantalla completa
- Flechas: Navegar entre imágenes
- Escape: Cerrar vista
- Botones: Zoom, rotación, descarga
```

## Metadatos de Imagen

### Información Extraída
```typescript
interface ImageMetadata {
  width: number              // Ancho en píxeles
  height: number            // Alto en píxeles
  aspectRatio: string       // Proporción (ej: "1.5")
  fileSize: string          // Tamaño formateado (ej: "1.2 MB")
  format: string            // Formato (ej: "JPEG")
  dimensions: string        // Dimensiones (ej: "1920 × 1080")
}
```

### Visualización de Metadatos
```typescript
<ImagePreview
  showMetadata={true}  // Mostrar información debajo de la imagen
  // Muestra: nombre, tamaño, formato, dimensiones, aspect ratio
/>
```

## Optimización Automática en MessageComposer

### Configuración por Defecto
```typescript
// En MessageComposer, las imágenes se optimizan automáticamente:
{
  maxWidth: 1920,           // Ancho máximo
  maxHeight: 1080,          // Alto máximo  
  quality: 0.8,             // 80% de calidad
  format: 'jpeg',           // Convertir a JPEG
  maintainAspectRatio: true // Mantener proporción
}
```

### Notificaciones de Optimización
```typescript
// Toast automático mostrando reducción de tamaño
toast.success("imagen.jpg optimizado (45% reducción)")
```

## Separación de Contenido

### Imágenes vs Otros Archivos
```typescript
// En MessageComposer, los adjuntos se separan automáticamente:

// Sección de Imágenes
- Galería visual con thumbnails
- Navegación entre imágenes
- Controles de zoom y rotación
- Metadatos de imagen

// Sección de Otros Archivos  
- Lista tradicional con iconos
- Información de archivo
- Botones de acción
```

## Responsive Design

### Adaptación por Pantalla
```typescript
// Mobile (< 768px)
- Grid de 2 columnas para galería
- Controles táctiles optimizados
- Preview de imagen más pequeño

// Tablet (768px - 1024px)  
- Grid de 3 columnas para galería
- Controles de mouse y táctil
- Preview de imagen mediano

// Desktop (> 1024px)
- Grid de 4 columnas para galería
- Controles de mouse completos
- Preview de imagen grande
```

## Accesibilidad

### ARIA Labels
```typescript
<ImagePreview
  alt="Descripción detallada de la imagen"
  // Screen readers pueden describir la imagen
/>

<ImageGallery
  // Navegación con teclado
  // Indicadores de estado
  // Controles accesibles
/>
```

### Navegación por Teclado
```typescript
// Controles de teclado:
- Tab: Navegar entre controles
- Enter/Space: Activar botones
- Escape: Cerrar modales
- Flechas: Navegar en galería
```

## Performance

### Optimizaciones Implementadas
```typescript
// Lazy Loading
- Imágenes se cargan solo cuando son visibles
- Thumbnails se generan bajo demanda

// Memoria
- URLs de objetos se liberan automáticamente
- Canvas se limpia después de uso

// Red
- Optimización reduce tamaño de archivo
- Formato WebP cuando es soportado
- Compresión inteligente por tipo de imagen
```

## Casos de Uso

### 1. Upload de Fotos
```typescript
// Usuario sube foto de 5MB
// Sistema optimiza a 1.2MB (76% reducción)
// Muestra preview con controles
// Guarda versión optimizada
```

### 2. Galería de Productos
```typescript
// Múltiples imágenes de producto
// Navegación fluida entre imágenes
// Zoom para ver detalles
// Descarga individual
```

### 3. Capturas de Pantalla
```typescript
// PNG con transparencia
// Optimización mantiene calidad
// Preview con metadatos
// Compresión inteligente
```

## Troubleshooting

### Problemas Comunes
```typescript
// Imagen no se optimiza
// Verificar que sea formato soportado
if (!isSupportedImageType(file)) {
  console.log('Formato no soportado')
}

// Error de memoria
// Verificar tamaño de imagen
if (file.size > 50 * 1024 * 1024) { // 50MB
  console.log('Imagen muy grande')
}

// Preview no se muestra
// Verificar URL válida
if (!imageUrl || imageUrl === '') {
  console.log('URL de imagen inválida')
}
```

### Debug
```typescript
// Logs de optimización
console.log('Optimización:', {
  original: optimized.originalSize,
  optimized: optimized.optimizedSize,
  reduction: optimized.compressionRatio
})

// Logs de metadatos
console.log('Metadatos:', {
  dimensions: metadata.dimensions,
  format: metadata.format,
  aspectRatio: metadata.aspectRatio
})
```

## Mejores Prácticas

### 1. Formatos Recomendados
- **Fotos**: JPEG con calidad 0.8-0.9
- **Gráficos**: PNG para transparencia
- **Web**: WebP cuando sea posible
- **Animaciones**: GIF para compatibilidad

### 2. Tamaños Óptimos
- **Thumbnails**: 150x150px
- **Preview**: 300x200px máximo
- **Full size**: 1920x1080px máximo
- **Mobile**: 800x600px máximo

### 3. Calidad vs Tamaño
- **Alta calidad**: 0.9 (archivos grandes)
- **Media calidad**: 0.8 (balanceado)
- **Baja calidad**: 0.6 (archivos pequeños)

### 4. UX
- Mostrar progreso de optimización
- Indicar reducción de tamaño
- Permitir cancelar optimización
- Preview inmediato

# Soporte de Audio - Guía de Uso

## Descripción
Sistema completo de soporte para archivos de audio (MP3, WAV, OGG) con reproductor integrado, optimización automática y galería interactiva.

## Tipos de Audio Soportados

### Formatos Principales
- **MP3**: Formato más común, excelente compresión
- **WAV**: Audio sin pérdida, alta calidad
- **OGG**: Formato libre, buena compresión
- **FLAC**: Audio sin pérdida, compresión eficiente
- **AAC**: Formato avanzado, mejor calidad que MP3
- **M4A**: Formato de Apple, alta compatibilidad

### Características por Formato
```typescript
// MP3 - Estándar universal
{
  format: 'mp3',
  bitrate: '128-320 kbps',
  quality: 'Buena a Excelente',
  compatibility: 'Universal',
  idealFor: 'Música, podcasts, audio general'
}

// WAV - Sin pérdida
{
  format: 'wav',
  bitrate: '1411 kbps (CD quality)',
  quality: 'Excelente',
  compatibility: 'Universal',
  idealFor: 'Audio profesional, masterización'
}

// OGG - Libre
{
  format: 'ogg',
  bitrate: 'Variable',
  quality: 'Buena a Excelente',
  compatibility: 'Navegadores modernos',
  idealFor: 'Audio web, streaming'
}
```

## Componentes Disponibles

### 1. AudioPreview
```typescript
import { AudioPreview } from '@/components/ui/audio-preview'

function MyComponent() {
  return (
    <AudioPreview
      src="/path/to/audio.mp3"
      name="audio.mp3"
      size={1024000}
      type="audio/mpeg"
      onRemove={() => console.log('Remover audio')}
      onDownload={() => console.log('Descargar audio')}
      showMetadata={true}
      showControls={true}
      autoplay={false}
      muted={true}
    />
  )
}
```

### 2. AudioGallery
```typescript
import { AudioGallery } from '@/components/ui/audio-preview'

function GalleryComponent() {
  const audios = [
    {
      id: '1',
      src: '/audio1.mp3',
      name: 'audio1.mp3',
      size: 1024000,
      type: 'audio/mpeg'
    },
    // ... más audios
  ]

  return (
    <AudioGallery
      audios={audios}
      onRemove={(id) => console.log('Remover:', id)}
      onDownload={(id) => console.log('Descargar:', id)}
      maxAudios={4}
    />
  )
}
```

## Reproductor Integrado

### Controles Disponibles
```typescript
// Controles principales
- Play/Pause: Reproducir/pausar audio
- Skip Back: Retroceder 10 segundos
- Skip Forward: Avanzar 10 segundos
- Restart: Volver al inicio
- Loop: Reproducir en bucle

// Controles de volumen
- Mute/Unmute: Silenciar/activar
- Volume Slider: Control de volumen 0-100%
- Volume Display: Indicador visual

// Controles de navegación
- Progress Bar: Barra de progreso interactiva
- Time Display: Tiempo actual/duracion
- Seek: Click en barra para saltar a posición
```

### Funcionalidades Avanzadas
```typescript
// Metadatos automáticos
- Duración del audio
- Bitrate y calidad
- Formato y tamaño
- Título y artista (si disponible)

// Estados visuales
- Loading: Indicador de carga
- Error: Manejo de errores
- Playing: Estado de reproducción
- Muted: Estado de silencio
- Looping: Estado de bucle
```

## Optimización Automática

### Hook useAudioOptimization
```typescript
import { useAudioOptimization } from '@/hooks/use-audio-optimization'

function AudioUpload() {
  const { optimizeAudio, batchOptimize, isOptimizing, error } = useAudioOptimization()

  const handleUpload = async (file: File) => {
    const optimized = await optimizeAudio(file, {
      quality: 0.8,
      bitrate: 128, // kbps
      sampleRate: 44100, // Hz
      channels: 2,
      format: 'mp3',
      removeMetadata: true
    })

    if (optimized) {
      console.log('Reducción de tamaño:', optimized.compressionRatio + '%')
      console.log('Duración:', optimized.duration + ' segundos')
      console.log('Bitrate:', optimized.bitrate + ' kbps')
    }
  }

  return (
    <div>
      {isOptimizing && <div>Optimizando audio...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### Opciones de Optimización
```typescript
interface AudioOptimizationOptions {
  quality?: number         // Calidad 0-1 (default: 0.8)
  bitrate?: number         // Bitrate en kbps (default: 128)
  sampleRate?: number      // Frecuencia de muestreo (default: 44100)
  channels?: number        // Canales (default: 2)
  format?: 'mp3' | 'ogg' | 'wav'  // Formato de salida
  removeMetadata?: boolean // Remover metadatos (default: true)
}
```

## Detección de Audio

### Hook useAudioDetection
```typescript
import { useAudioDetection } from '@/hooks/use-audio-optimization'

function AudioHandler() {
  const { 
    isAudioFile, 
    getAudioType, 
    isSupportedAudioType,
    getAudioMetadata 
  } = useAudioDetection()

  const handleFile = async (file: File) => {
    // Verificar si es audio
    if (!isAudioFile(file)) {
      console.log('No es un archivo de audio')
      return
    }

    // Obtener tipo de audio
    const audioType = getAudioType(file)
    console.log('Tipo de audio:', audioType)

    // Verificar si es soportado
    if (!isSupportedAudioType(file)) {
      console.log('Formato de audio no soportado')
      return
    }

    // Obtener metadatos
    const metadata = await getAudioMetadata(file)
    if (metadata) {
      console.log('Duración:', metadata.duration + ' segundos')
      console.log('Bitrate:', metadata.bitrate + ' kbps')
      console.log('Formato:', metadata.format)
    }
  }
}
```

## Análisis de Audio

### Hook useAudioAnalysis
```typescript
import { useAudioAnalysis } from '@/hooks/use-audio-optimization'

function AudioAnalyzer() {
  const { analyzeAudio } = useAudioAnalysis()

  const handleAnalysis = async (file: File) => {
    const analysis = await analyzeAudio(file)
    
    if (analysis) {
      console.log('Duración:', analysis.duration + ' segundos')
      console.log('Bitrate:', analysis.bitrate + ' kbps')
      console.log('Calidad:', analysis.quality) // 'low' | 'medium' | 'high'
      console.log('Formato:', analysis.format)
      console.log('Tamaño:', analysis.size + ' bytes')
    }
  }
}
```

## Waveform Generation

### Hook useAudioWaveformGeneration
```typescript
import { useAudioWaveformGeneration } from '@/hooks/use-audio-optimization'

function WaveformGenerator() {
  const { generateWaveform, generateWaveformImage } = useAudioWaveformGeneration()

  const handleWaveform = async (file: File) => {
    // Generar datos de waveform
    const waveform = await generateWaveform(file, 100) // 100 muestras
    
    if (waveform) {
      console.log('Waveform generado:', waveform.length + ' puntos')
    }

    // Generar imagen de waveform
    const waveformImage = await generateWaveformImage(file, 200, 50)
    
    if (waveformImage) {
      console.log('Imagen de waveform:', waveformImage)
    }
  }
}
```

## Funcionalidades Avanzadas

### 1. Reproductor Completo
```typescript
<AudioPreview
  src={audioUrl}
  name="archivo.mp3"
  size={1024000}
  type="audio/mpeg"
  showControls={true}        // Controles completos
  showMetadata={true}        // Información del audio
  autoplay={false}          // Autoplay (deshabilitado por defecto)
  muted={true}              // Iniciar silenciado
/>
```

### 2. Galería con Navegación
```typescript
<AudioGallery
  audios={audioArray}
  maxAudios={4}             // Máximo de audios visibles
  onRemove={handleRemove}     // Callback para remover
  onDownload={handleDownload} // Callback para descargar
/>
```

### 3. Optimización por Lotes
```typescript
const { batchOptimize } = useAudioOptimization()

const handleMultipleAudios = async (files: File[]) => {
  const optimizedAudios = await batchOptimize(files, {
    quality: 0.7,
    bitrate: 128,
    format: 'mp3',
    removeMetadata: true
  })

  console.log(`${optimizedAudios.length} audios optimizados`)
}
```

## Controles de Audio

### Reproducción
```typescript
// Controles automáticos en AudioPreview
- Play/Pause: Botón principal o barra espaciadora
- Skip Back: Retroceder 10 segundos
- Skip Forward: Avanzar 10 segundos
- Restart: Volver al inicio
- Loop: Reproducir en bucle
```

### Volumen
```typescript
// Control de volumen
- Mute/Unmute: Botón de silencio
- Volume Slider: Control deslizante 0-100%
- Volume Display: Indicador visual
- Keyboard: Flechas arriba/abajo para volumen
```

### Navegación
```typescript
// Navegación en galería
- Click en audio: Abrir reproductor
- Flechas: Navegar entre audios
- Escape: Cerrar reproductor
- Controles: Play, pause, volumen, descarga
```

## Metadatos de Audio

### Información Extraída
```typescript
interface AudioMetadata {
  duration: number           // Duración en segundos
  bitrate?: number          // Bitrate en kbps
  sampleRate?: number       // Frecuencia de muestreo
  channels?: number         // Número de canales
  fileSize: string          // Tamaño formateado
  format: string            // Formato (MP3, WAV, OGG)
  title?: string            // Título (si disponible)
  artist?: string           // Artista (si disponible)
  album?: string            // Álbum (si disponible)
  year?: number             // Año (si disponible)
}
```

### Visualización de Metadatos
```typescript
<AudioPreview
  showMetadata={true}  // Mostrar información debajo del reproductor
  // Muestra: nombre, tamaño, formato, duración, bitrate
/>
```

## Optimización Automática en MessageComposer

### Configuración por Defecto
```typescript
// En MessageComposer, los audios se optimizan automáticamente:
{
  quality: 0.8,             // 80% de calidad
  bitrate: 128,            // 128 kbps
  sampleRate: 44100,       // 44.1 kHz
  channels: 2,             // Estéreo
  format: 'mp3',           // MP3 para máxima compatibilidad
  removeMetadata: true     // Remover metadatos
}
```

### Resultados Típicos
- **WAV a MP3**: 10MB → 1.2MB (88% reducción)
- **FLAC a MP3**: 8MB → 1.5MB (81% reducción)
- **OGG a MP3**: 3MB → 1.8MB (40% reducción)
- **MP3 recompresión**: 5MB → 2.1MB (58% reducción)

## Separación Inteligente en MessageComposer

- **Sección de Audio**: Galería con reproductor integrado
- **Sección de Imágenes**: Galería visual con zoom
- **Sección de Videos**: Galería con controles de reproducción
- **Sección de Documentos**: Galería con iconos y metadatos
- **Sección de Otros Archivos**: Lista tradicional con iconos
- **Preview Automático**: Optimización y preview inmediato

## Responsive Design

### Adaptación por Pantalla
```typescript
// Mobile (< 768px)
- Grid de 1 columna para galería
- Controles táctiles optimizados
- Reproductor adaptativo

// Tablet (768px - 1024px)  
- Grid de 2 columnas para galería
- Controles híbridos
- Reproductor mediano

// Desktop (> 1024px)
- Grid de 3-4 columnas para galería
- Controles de mouse completos
- Reproductor grande
```

## Accesibilidad

### ARIA Labels
```typescript
<AudioPreview
  // Screen readers pueden describir el audio
  // Controles accesibles con teclado
  // Indicadores de estado claros
/>

<AudioGallery
  // Navegación con teclado
  // Indicadores de estado
  // Controles accesibles
/>
```

### Navegación por Teclado
```typescript
// Controles de teclado:
- Tab: Navegar entre controles
- Enter/Space: Play/pause
- Escape: Cerrar modales
- Flechas: Navegar en galería
- ↑/↓: Control de volumen
- ←/→: Skip back/forward
```

## Performance

### Optimizaciones Implementadas
```typescript
// Lazy Loading
- Audios se cargan solo cuando son visibles
- Waveforms se generan bajo demanda
- Metadatos se extraen bajo demanda

// Memoria
- URLs de objetos se liberan automáticamente
- Audio context se cierra después de uso
- Waveforms se cachean temporalmente

// Red
- Optimización reduce tamaño de archivo
- Formato MP3 para máxima compatibilidad
- Compresión inteligente por tipo de audio
```

## Casos de Uso

### 1. Podcasts y Música
```typescript
// Usuario sube podcast de 50MB
// Sistema optimiza a 6MB (88% reducción)
// Muestra reproductor con controles
// Guarda versión optimizada
```

### 2. Notas de Voz
```typescript
// Mensajes de voz cortos
// Optimización mínima para mantener calidad
// Reproductor simple y rápido
// Metadatos básicos
```

### 3. Audio Profesional
```typescript
// Archivos de alta calidad
// Optimización inteligente
// Reproductor con controles avanzados
// Metadatos completos
```

## Troubleshooting

### Problemas Comunes
```typescript
// Audio no se reproduce
// Verificar que sea formato soportado
if (!isSupportedAudioType(file)) {
  console.log('Formato no soportado')
}

// Error de memoria
// Verificar tamaño de archivo
if (file.size > 100 * 1024 * 1024) { // 100MB
  console.log('Audio muy grande')
}

// Reproductor no se muestra
// Verificar URL válida
if (!audioUrl || audioUrl === '') {
  console.log('URL de audio inválida')
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
  format: metadata.format,
  duration: metadata.duration,
  bitrate: metadata.bitrate,
  fileSize: metadata.fileSize
})
```

## Mejores Prácticas

### 1. Formatos Recomendados
- **Web**: MP3 para máxima compatibilidad
- **Alta Calidad**: WAV para audio profesional
- **Streaming**: OGG para navegadores modernos
- **Móvil**: AAC para dispositivos Apple

### 2. Calidad vs Tamaño
- **Alta calidad**: 320 kbps (archivos grandes)
- **Media calidad**: 128 kbps (balanceado)
- **Baja calidad**: 64 kbps (archivos pequeños)

### 3. Optimización Recomendada
- **Música**: 128-192 kbps MP3
- **Voz**: 64-128 kbps MP3
- **Podcasts**: 96-128 kbps MP3
- **Audio profesional**: 256-320 kbps MP3

### 4. UX
- Mostrar progreso de optimización
- Indicar reducción de tamaño
- Permitir cancelar optimización
- Preview inmediato
- Controles intuitivos
- Metadatos claros
- Feedback visual
- Estados de carga
- Manejo de errores

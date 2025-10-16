# Progress Bar de Upload - Guía de Uso

## Descripción
Sistema completo de progress bars para mostrar el progreso de upload de archivos con múltiples variantes y animaciones.

## Componentes Disponibles

### 1. ProgressBar Básico
```typescript
import { ProgressBar } from '@/components/ui/progress-bar'

function MyComponent() {
  const [progress, setProgress] = useState(0)

  return (
    <ProgressBar
      value={progress}
      showPercentage={true}
      size="md"
      variant="default"
      animated={true}
      striped={true}
    />
  )
}
```

### 2. UploadProgress (Específico para archivos)
```typescript
import { UploadProgress } from '@/components/ui/progress-bar'

function FileUpload() {
  const [files, setFiles] = useState([
    {
      id: '1',
      name: 'document.pdf',
      progress: 45,
      status: 'uploading' as const
    },
    {
      id: '2', 
      name: 'image.jpg',
      progress: 100,
      status: 'completed' as const
    }
  ])

  return <UploadProgress files={files} />
}
```

### 3. CircularProgress
```typescript
import { CircularProgress } from '@/components/ui/progress-bar'

function CircularExample() {
  return (
    <CircularProgress
      value={75}
      size={60}
      strokeWidth={4}
      showPercentage={true}
      variant="success"
    />
  )
}
```

## Props y Configuración

### ProgressBar Props
```typescript
interface ProgressBarProps {
  value: number              // 0-100
  max?: number              // Máximo valor (default: 100)
  className?: string        // Clases CSS adicionales
  showPercentage?: boolean // Mostrar porcentaje
  size?: "sm" | "md" | "lg" // Tamaño de la barra
  variant?: "default" | "success" | "warning" | "error" // Color
  animated?: boolean       // Animación de pulso
  striped?: boolean        // Efecto de rayas
}
```

### UploadProgress Props
```typescript
interface UploadProgressProps {
  files: Array<{
    id: string
    name: string
    progress: number
    status: "uploading" | "completed" | "error"
    error?: string
  }>
  className?: string
}
```

### CircularProgress Props
```typescript
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  className?: string
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "error"
}
```

## Uso con useStorage Hook

### Hook Actualizado
```typescript
import { useStorage } from '@/hooks/use-storage'

function MyComponent() {
  const { 
    uploadFile, 
    uploadProgress, 
    clearProgress,
    uploading,
    error 
  } = useStorage()

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, {
      folder: 'uploads',
      public: true
    })
    
    if (result) {
      console.log('Upload completed:', result.url)
    }
  }

  return (
    <div>
      {/* Progress bars automáticos */}
      {uploadProgress.length > 0 && (
        <UploadProgress files={uploadProgress} />
      )}
      
      {/* Botón para limpiar progreso */}
      <button onClick={clearProgress}>
        Limpiar Progreso
      </button>
    </div>
  )
}
```

## Estados y Variantes

### Estados de Upload
```typescript
// Uploading - Barra azul con animación
{
  progress: 45,
  status: "uploading"
}

// Completed - Barra verde
{
  progress: 100,
  status: "completed"
}

// Error - Barra roja
{
  progress: 30,
  status: "error",
  error: "File too large"
}
```

### Variantes de Color
```typescript
// Default - Azul
variant="default"

// Success - Verde
variant="success"

// Warning - Amarillo
variant="warning"

// Error - Rojo
variant="error"
```

## Tamaños Disponibles

### ProgressBar
```typescript
// Pequeño
size="sm"  // h-1 (4px)

// Mediano
size="md"  // h-2 (8px)

// Grande
size="lg"  // h-3 (12px)
```

### CircularProgress
```typescript
// Pequeño
size={20}

// Mediano
size={40}

// Grande
size={60}
```

## Animaciones

### Striped Animation
```typescript
<ProgressBar
  value={progress}
  striped={true}
  animated={true}
/>
```

### Pulse Animation
```typescript
<ProgressBar
  value={progress}
  animated={true}
/>
```

### Circular Animation
```typescript
<CircularProgress
  value={progress}
  animated={true}
/>
```

## Ejemplos de Uso Avanzado

### 1. Upload Múltiple con Progress
```typescript
function MultiFileUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  
  const handleUpload = async (file: File) => {
    const fileId = file.name
    
    // Iniciar progreso
    setProgress(prev => ({ ...prev, [fileId]: 0 }))
    
    // Simular upload
    const interval = setInterval(() => {
      setProgress(prev => ({
        ...prev,
        [fileId]: Math.min(prev[fileId] + 10, 100)
      }))
    }, 200)
    
    try {
      await uploadFile(file)
      clearInterval(interval)
      setProgress(prev => ({ ...prev, [fileId]: 100 }))
    } catch (error) {
      clearInterval(interval)
      // Manejar error
    }
  }

  return (
    <div>
      {files.map(file => (
        <div key={file.name}>
          <p>{file.name}</p>
          <ProgressBar
            value={progress[file.name] || 0}
            variant={progress[file.name] === 100 ? "success" : "default"}
            animated={progress[file.name] < 100}
          />
        </div>
      ))}
    </div>
  )
}
```

### 2. Progress con Cancelación
```typescript
function CancellableUpload() {
  const [progress, setProgress] = useState(0)
  const [cancelled, setCancelled] = useState(false)
  
  const handleCancel = () => {
    setCancelled(true)
    // Cancelar upload real
  }

  return (
    <div>
      <ProgressBar
        value={progress}
        variant={cancelled ? "error" : "default"}
        animated={!cancelled}
      />
      
      {!cancelled && (
        <button onClick={handleCancel}>
          Cancelar
        </button>
      )}
    </div>
  )
}
```

### 3. Progress con Estimación de Tiempo
```typescript
function TimedProgress() {
  const [progress, setProgress] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)
  
  const calculateETA = (progress: number) => {
    if (!startTime) return null
    
    const elapsed = Date.now() - startTime
    const rate = progress / elapsed
    const remaining = (100 - progress) / rate
    
    return Math.round(remaining / 1000) // segundos
  }

  return (
    <div>
      <ProgressBar value={progress} />
      
      {estimatedTime && (
        <p className="text-sm text-muted-foreground">
          Tiempo restante: {estimatedTime}s
        </p>
      )}
    </div>
  )
}
```

## Estilos CSS Personalizados

### Importar estilos
```typescript
// En tu componente
import '@/styles/progress.css'
```

### Clases CSS disponibles
```css
/* Animaciones */
.progress-stripes    /* Rayas animadas */
.pulse-progress      /* Pulso */
.shake-progress      /* Sacudida para errores */

/* Estados */
.upload-progress-item.completed
.upload-progress-item.error
```

### Personalización
```css
/* Barra personalizada */
.my-progress-bar {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Animación personalizada */
@keyframes my-progress {
  0% { width: 0%; }
  100% { width: 100%; }
}
```

## Accesibilidad

### ARIA Labels
```typescript
<ProgressBar
  value={progress}
  aria-label={`Upload progress: ${progress}%`}
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
/>
```

### Screen Reader Support
```typescript
<div role="status" aria-live="polite">
  {progress < 100 ? `Uploading: ${progress}%` : 'Upload completed'}
</div>
```

## Mejores Prácticas

### 1. Feedback Visual
- Usar colores apropiados para cada estado
- Mostrar porcentaje cuando sea relevante
- Incluir animaciones para uploads largos

### 2. Performance
- Limitar número de progress bars simultáneos
- Usar `useCallback` para funciones de progreso
- Limpiar intervalos al desmontar

### 3. UX
- Mostrar nombre del archivo
- Permitir cancelación
- Indicar errores claramente
- Auto-ocultar al completar

### 4. Responsive
- Adaptar tamaño en móviles
- Usar progress circular en espacios pequeños
- Mantener legibilidad en todos los tamaños

## Troubleshooting

### Problemas Comunes
```typescript
// Progress no se actualiza
// Verificar que el estado se esté actualizando correctamente
setProgress(prev => ({ ...prev, [id]: newValue }))

// Animaciones no funcionan
// Verificar que se importen los estilos CSS
import '@/styles/progress.css'

// Progress se queda en 0
// Verificar que el valor sea numérico
value={Number(progress)}
```

### Debug
```typescript
// Logs de progreso
console.log('Progress update:', { id, progress, status })

// Verificar estado del hook
console.log('useStorage state:', { uploadProgress, uploading, error })
```

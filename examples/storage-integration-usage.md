# Integración con Servicios de Storage

## Descripción
Sistema completo de storage que soporta múltiples proveedores (Cloudinary, AWS S3, Local) para manejar archivos adjuntos en mensajes.

## Proveedores Soportados

### 1. Cloudinary (Recomendado para multimedia)
```bash
# Variables de entorno
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Ventajas:**
- Optimización automática de imágenes
- Transformaciones en tiempo real
- CDN global
- Soporte para video y audio

### 2. AWS S3 (Recomendado para documentos)
```bash
# Variables de entorno
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Ventajas:**
- Escalabilidad ilimitada
- Seguridad empresarial
- Integración con otros servicios AWS
- Costo por uso

### 3. Local Storage (Desarrollo)
```bash
# Variables de entorno
STORAGE_PROVIDER=local
LOCAL_UPLOAD_PATH=./uploads
LOCAL_PUBLIC_URL=http://localhost:3000/uploads
```

**Ventajas:**
- Sin dependencias externas
- Ideal para desarrollo
- Control total del almacenamiento

## Configuración

### 1. Instalar dependencias
```bash
# Para Cloudinary
npm install cloudinary

# Para AWS S3
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp env.storage.example .env.local

# Editar con tus credenciales
nano .env.local
```

### 3. Crear directorio de uploads (solo para local)
```bash
mkdir -p uploads/messagehub
```

## Uso en el Frontend

### Hook useStorage
```typescript
import { useStorage } from '@/hooks/use-storage'

function MyComponent() {
  const { uploadFile, deleteFile, getFileUrl, uploading, error } = useStorage()

  const handleUpload = async (file: File) => {
    const result = await uploadFile(file, {
      folder: 'my-folder',
      public: true,
      transformation: {
        width: 800,
        height: 600,
        quality: 80
      }
    })

    if (result) {
      console.log('File uploaded:', result.url)
    }
  }

  return (
    <div>
      {uploading && <div>Subiendo archivo...</div>}
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### Opciones de Upload
```typescript
interface UploadOptions {
  folder?: string          // Carpeta de destino
  public?: boolean        // Archivo público
  transformation?: {      // Transformaciones (Cloudinary)
    width?: number
    height?: number
    quality?: number
    format?: string
  }
  metadata?: Record<string, any>  // Metadatos adicionales
}
```

## API Endpoints

### Upload File
```typescript
POST /api/storage/upload
Content-Type: multipart/form-data

// FormData
file: File
options: string (JSON)

// Response
{
  success: true,
  file: {
    id: string,
    name: string,
    size: number,
    type: string,
    url: string,
    publicId?: string,
    key?: string,
    uploadedAt: Date
  }
}
```

### Delete File
```typescript
DELETE /api/storage/delete/[fileId]

// Response
{
  success: boolean,
  message: string
}
```

### Get File URL
```typescript
GET /api/storage/url/[fileId]

// Response
{
  success: true,
  url: string
}
```

## Integración con MessageComposer

El `MessageComposer` ahora incluye:

1. **Upload Automático**: Los archivos se suben al storage al seleccionarlos
2. **Preview Mejorado**: Muestra URLs del storage en lugar de URLs locales
3. **Gestión de Estado**: Estados de carga para upload y envío
4. **Error Handling**: Manejo de errores de upload

### Flujo de Trabajo
1. Usuario selecciona archivos
2. Archivos se validan (tipo, tamaño)
3. Archivos se suben al storage
4. Se muestra preview con URLs del storage
5. Al enviar mensaje, se incluye información del storage
6. Backend guarda URLs del storage en la BD

## Estructura de Datos

### En la Base de Datos
```json
{
  "attachments": [
    {
      "name": "document.pdf",
      "size": 1024000,
      "type": "application/pdf",
      "url": "https://res.cloudinary.com/.../document.pdf",
      "storageId": "messagehub/tenant_123/1234567890_document.pdf",
      "publicId": "messagehub/tenant_123/1234567890_document",
      "key": "messagehub/tenant_123/1234567890_document.pdf",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### En el Frontend
```typescript
interface Attachment {
  id: string
  file: File
  name: string
  size: number
  type: string
  url?: string
  storageFile?: {
    id: string
    url: string
    publicId?: string
    key?: string
  }
}
```

## Transformaciones (Cloudinary)

### Imágenes
```typescript
await uploadFile(file, {
  transformation: {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp'
  }
})
```

### Videos
```typescript
await uploadFile(file, {
  transformation: {
    width: 1280,
    height: 720,
    quality: 70
  }
})
```

## Seguridad

### Validaciones
- **Tamaño**: Máximo 10MB por archivo
- **Tipos**: Solo tipos permitidos
- **Autenticación**: Usuario debe estar autenticado
- **Permisos**: Verificación de tenant

### Tipos Permitidos
```typescript
const allowedTypes = [
  // Imágenes
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  // Videos
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  // Documentos
  'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
```

## Monitoreo y Logs

### Logs de Upload
```typescript
console.log('[StorageService] Upload error:', error)
console.log('[CloudinaryProvider] Delete error:', error)
console.log('[S3Provider] Get URL error:', error)
```

### Métricas
- Tiempo de upload
- Tasa de éxito
- Errores por tipo
- Uso de storage

## Migración

### De Local a Cloud
1. Configurar credenciales del proveedor
2. Cambiar `STORAGE_PROVIDER` en `.env`
3. Migrar archivos existentes (opcional)
4. Actualizar URLs en la BD

### Backup y Restauración
- **Cloudinary**: Backup automático
- **S3**: Versionado y replicación
- **Local**: Copia manual de directorio

## Costos Estimados

### Cloudinary
- **Plan Gratuito**: 25GB, 25GB bandwidth
- **Plan Básico**: $89/mes por 100GB

### AWS S3
- **Storage**: $0.023/GB/mes
- **Requests**: $0.0004/1000 requests
- **Transfer**: $0.09/GB

### Local
- **Costo**: $0 (solo almacenamiento local)

## Mejores Prácticas

1. **Optimización**: Usar transformaciones para reducir tamaño
2. **CDN**: Cloudinary incluye CDN automático
3. **Backup**: Configurar backup automático
4. **Monitoreo**: Implementar alertas de uso
5. **Limpieza**: Eliminar archivos huérfanos periódicamente

## Troubleshooting

### Errores Comunes
```typescript
// Error de credenciales
"Invalid credentials"

// Error de permisos
"Access denied"

// Error de tamaño
"File too large"

// Error de tipo
"File type not allowed"
```

### Debug
```typescript
// Habilitar logs detallados
console.log('[StorageService] Config:', config)
console.log('[StorageService] Upload result:', result)
```

## Futuras Mejoras

- [ ] Compresión automática
- [ ] Thumbnails automáticos
- [ ] Análisis de contenido
- [ ] Detección de duplicados
- [ ] Integración con IA

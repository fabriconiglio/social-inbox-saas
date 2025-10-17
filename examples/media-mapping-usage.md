# Mapeo de URLs de Media - Guía de Uso

## Descripción

El sistema de mapeo de URLs de media convierte IDs de media de plataformas externas en URLs accesibles. Las plataformas como WhatsApp, Instagram, Facebook y TikTok a menudo devuelven IDs únicos en lugar de URLs directas, y este servicio los convierte automáticamente.

## Problema que Resuelve

### Antes del Mapeo
```typescript
// WhatsApp devuelve IDs como "1234567890" en lugar de URLs
{
  type: "image",
  url: "1234567890", // ❌ No es una URL accesible
  mimeType: "image/jpeg"
}
```

### Después del Mapeo
```typescript
// El servicio convierte el ID a una URL accesible
{
  type: "image",
  url: "https://mmg.whatsapp.net/v/t62.7-24/...", // ✅ URL accesible
  mimeType: "image/jpeg",
  filename: "imagen.jpg"
}
```

## Servicios Implementados

### 1. MediaMappingService

Servicio principal para mapear URLs de media:

```typescript
import { MediaMappingService } from "@/lib/media-mapping"

// Mapear un attachment individual
const attachment: Attachment = {
  type: "image",
  url: "1234567890", // ID de WhatsApp
  mimeType: "image/jpeg"
}

const mappedAttachment = await MediaMappingService.mapAttachmentUrl(
  attachment,
  'whatsapp',
  { accessToken: 'your_token' }
)

console.log(mappedAttachment.url) // "https://mmg.whatsapp.net/v/t62.7-24/..."

// Mapear múltiples attachments
const attachments: Attachment[] = [
  { type: "image", url: "1234567890", mimeType: "image/jpeg" },
  { type: "video", url: "0987654321", mimeType: "video/mp4" }
]

const mappedAttachments = await MediaMappingService.mapAttachments(
  attachments,
  'whatsapp',
  { accessToken: 'your_token' }
)
```

### 2. ChannelCredentialsService

Servicio para obtener credenciales de canales desde la base de datos:

```typescript
import { ChannelCredentialsService } from "@/lib/channel-credentials"

// Obtener credenciales genéricas
const credentials = await ChannelCredentialsService.getChannelCredentials('channel_123')

// Obtener credenciales específicas por plataforma
const whatsappCredentials = await ChannelCredentialsService.getWhatsAppCredentials('channel_123')
const metaCredentials = await ChannelCredentialsService.getMetaCredentials('channel_123')
const tiktokCredentials = await ChannelCredentialsService.getTikTokCredentials('channel_123')

// Obtener credenciales con cache
const cachedCredentials = await ChannelCredentialsService.getCachedChannelCredentials('channel_123')
```

## Implementación por Plataforma

### WhatsApp Cloud API

```typescript
// El webhook de WhatsApp devuelve IDs de media
{
  "image": {
    "id": "1234567890", // ❌ ID que necesita mapeo
    "mime_type": "image/jpeg",
    "caption": "Mira esta imagen"
  }
}

// El servicio hace una llamada a la API para obtener la URL
GET https://graph.facebook.com/v18.0/1234567890
Authorization: Bearer {access_token}

// Respuesta de la API
{
  "url": "https://mmg.whatsapp.net/v/t62.7-24/...", // ✅ URL accesible
  "mime_type": "image/jpeg",
  "filename": "imagen.jpg"
}
```

### Instagram/Facebook Messenger API

```typescript
// El webhook de Meta puede devolver IDs o URLs directas
{
  "attachments": [
    {
      "type": "image",
      "payload": {
        "url": "1234567890" // Puede ser ID o URL directa
      }
    }
  ]
}

// El servicio verifica si es una URL o ID y mapea según sea necesario
```

### TikTok Business API

```typescript
// TikTok (implementación preparada para API real)
{
  "media": {
    "type": "video",
    "url": "tiktok_media_id_123" // ID que necesita mapeo
  }
}

// Implementación pendiente de TikTok Business API real
```

## Características Avanzadas

### Cache de URLs

```typescript
// El servicio incluye cache para evitar llamadas repetidas
const attachment1 = await MediaMappingService.mapAttachmentUrl(attachment, 'whatsapp', credentials)
// Llamada a la API

const attachment2 = await MediaMappingService.mapAttachmentUrl(attachment, 'whatsapp', credentials)
// Usa cache, no hace llamada a la API

// Limpiar cache expirado
MediaMappingService.cleanExpiredCache()
```

### Validación de URLs

```typescript
// Validar que una URL sea accesible
const isValid = await MediaMappingService.validateMediaUrl('https://example.com/image.jpg')

// Obtener información del archivo
const mediaInfo = await MediaMappingService.getMediaInfo('https://example.com/image.jpg')
console.log(mediaInfo) // { size: 1024, mimeType: "image/jpeg", lastModified: Date }
```

### Manejo de Errores

```typescript
try {
  const mappedAttachment = await MediaMappingService.mapAttachmentUrl(
    attachment,
    'whatsapp',
    credentials
  )
} catch (error) {
  // Si falla el mapeo, retorna el attachment original
  console.warn('Error mapeando URL, usando attachment original:', error)
  // El attachment original se mantiene para no romper la funcionalidad
}
```

## Integración en Adapters

### Ejemplo: WhatsApp Adapter

```typescript
export class WhatsAppCloudAdapter implements ChannelAdapter {
  async ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null> {
    // ... procesar webhook ...
    
    const attachments: Attachment[] = []
    
    // Crear attachments con IDs de media
    if (message.type === "image") {
      attachments.push({
        type: "image",
        url: message.image?.id || "", // ID de WhatsApp
        mimeType: message.image?.mime_type,
      })
    }

    // Mapear IDs a URLs accesibles
    let mappedAttachments: Attachment[] | undefined
    if (attachments.length > 0) {
      const credentials = await this.getChannelCredentials(channelId)
      
      if (credentials) {
        mappedAttachments = await MediaMappingService.mapAttachments(
          attachments,
          'whatsapp',
          credentials
        )
      }
    }

    return {
      externalId: message.id,
      body: message.text || "",
      attachments: mappedAttachments, // URLs mapeadas
      // ... resto de campos ...
    }
  }
}
```

## Configuración de Credenciales

### Estructura en Base de Datos

```typescript
// Tabla Channel con campo meta (JSON)
{
  "id": "channel_123",
  "type": "whatsapp",
  "meta": {
    "phoneId": "123456789012345",
    "accessToken": "EAAxxxxxxxxxxxx",
    "businessId": "987654321098765"
  },
  "isActive": true
}
```

### Validación de Credenciales

```typescript
// El servicio valida que existan los campos requeridos
const whatsappCredentials = await ChannelCredentialsService.getWhatsAppCredentials('channel_123')
// Valida que existan: phoneId, accessToken

const metaCredentials = await ChannelCredentialsService.getMetaCredentials('channel_123')
// Valida que existan: pageId, accessToken

const tiktokCredentials = await ChannelCredentialsService.getTikTokCredentials('channel_123')
// Valida que exista: accessToken
```

## Mejores Prácticas

### 1. Manejo de Errores Graceful

```typescript
// Siempre retornar el attachment original si falla el mapeo
const mappedAttachment = await MediaMappingService.mapAttachmentUrl(
  attachment,
  platform,
  credentials
).catch(() => attachment) // Fallback al original
```

### 2. Cache Inteligente

```typescript
// Usar cache para evitar llamadas repetidas
const credentials = await ChannelCredentialsService.getCachedChannelCredentials(channelId)

// Invalidar cache cuando se actualicen credenciales
ChannelCredentialsService.invalidateChannelCache(channelId)
```

### 3. Logging Detallado

```typescript
// El servicio incluye logging detallado para debugging
console.log(`[MediaMapping] Mapeando ${platform} media: ${attachment.url}`)
console.log(`[MediaMapping] URL mapeada: ${mappedAttachment.url}`)
```

### 4. Validación de URLs

```typescript
// Validar URLs antes de usarlas
const isValid = await MediaMappingService.validateMediaUrl(mappedAttachment.url)
if (!isValid) {
  console.warn('URL de media no accesible:', mappedAttachment.url)
}
```

## Testing

### Test Unitario

```typescript
describe('MediaMappingService', () => {
  it('should map WhatsApp media ID to URL', async () => {
    const attachment: Attachment = {
      type: "image",
      url: "1234567890",
      mimeType: "image/jpeg"
    }

    const credentials = {
      accessToken: "test_token"
    }

    // Mock de la API de WhatsApp
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        url: "https://mmg.whatsapp.net/v/t62.7-24/...",
        mime_type: "image/jpeg"
      })
    })

    const result = await MediaMappingService.mapAttachmentUrl(
      attachment,
      'whatsapp',
      credentials
    )

    expect(result.url).toMatch(/^https:\/\//)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('1234567890'),
      expect.any(Object)
    )
  })
})
```

## Troubleshooting

### Problemas Comunes

1. **Error 401 - Unauthorized**
   - Verificar que el access token sea válido
   - Comprobar que el token tenga permisos para acceder al media

2. **Error 404 - Not Found**
   - El ID de media puede haber expirado
   - Verificar que el media ID sea correcto

3. **URL no accesible**
   - Usar `MediaMappingService.validateMediaUrl()` para verificar
   - Implementar retry logic para URLs temporales

### Logs Útiles

```typescript
// Habilitar logs detallados
console.log('[MediaMapping] Mapeando media:', {
  platform,
  originalUrl: attachment.url,
  hasCredentials: !!credentials.accessToken
})
```

## Próximas Mejoras

- [ ] **Rate Limiting**: Implementar límites de llamadas a APIs externas
- [ ] **Retry Logic**: Reintentar mapeo en caso de fallo temporal
- [ ] **Batch Processing**: Mapear múltiples IDs en una sola llamada
- [ ] **CDN Integration**: Cachear media en CDN propio
- [ ] **Compression**: Comprimir imágenes grandes automáticamente
- [ ] **Format Conversion**: Convertir formatos no soportados

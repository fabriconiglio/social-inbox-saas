# Envío de Adjuntos en Adapters - Guía de Uso

## Descripción

Todos los adapters de canales ahora soportan el envío de adjuntos (imágenes, videos, audio, documentos) además de mensajes de texto. Cada adapter maneja los adjuntos de manera específica según las capacidades de la plataforma.

## Tipos de Adjuntos Soportados

### Interface Attachment
```typescript
interface Attachment {
  type: "image" | "video" | "audio" | "file"
  url: string
  mimeType?: string
  filename?: string
}
```

### Tipos Soportados por Plataforma

| Tipo | WhatsApp | Instagram | Facebook | TikTok |
|------|----------|-----------|----------|--------|
| **Imagen** | ✅ | ✅ | ✅ | ✅ |
| **Video** | ✅ | ✅ | ✅ | ✅ |
| **Audio** | ✅ | ✅ | ✅ | ✅ |
| **Documento** | ✅ | ✅ | ✅ | ✅ |

## Implementación por Adapter

### 1. WhatsApp Cloud Adapter

```typescript
// Ejemplo de envío con adjunto
const message: SendMessageDTO = {
  threadExternalId: "573001234567",
  body: "Aquí tienes el documento solicitado",
  attachments: [
    {
      type: "file",
      url: "https://example.com/documento.pdf",
      filename: "documento.pdf",
      mimeType: "application/pdf"
    }
  ]
}

const result = await whatsappAdapter.sendMessage(channelId, message, credentials)
```

**Características específicas:**
- ✅ Soporta imágenes con caption
- ✅ Soporta videos con caption
- ✅ Soporta documentos con filename
- ✅ Soporta audio sin caption
- ✅ Límite de 4096 caracteres en caption

### 2. Instagram Messenger Adapter

```typescript
// Ejemplo de envío con imagen
const message: SendMessageDTO = {
  threadExternalId: "instagram_user_id",
  body: "Mira esta imagen",
  attachments: [
    {
      type: "image",
      url: "https://example.com/imagen.jpg",
      mimeType: "image/jpeg"
    }
  ]
}

const result = await instagramAdapter.sendMessage(channelId, message, credentials)
```

**Características específicas:**
- ✅ Soporta attachments con text adicional
- ✅ Usa estructura `attachment.type` y `attachment.payload.url`
- ✅ Límite de 2000 caracteres en texto
- ✅ Compatible con Instagram Business API

### 3. Facebook Messenger Adapter

```typescript
// Ejemplo de envío con video
const message: SendMessageDTO = {
  threadExternalId: "facebook_user_id",
  body: "Aquí está el video que pediste",
  attachments: [
    {
      type: "video",
      url: "https://example.com/video.mp4",
      mimeType: "video/mp4"
    }
  ]
}

const result = await facebookAdapter.sendMessage(channelId, message, credentials)
```

**Características específicas:**
- ✅ Misma estructura que Instagram (comparten API)
- ✅ Soporta todos los tipos de media
- ✅ Límite de 2000 caracteres en texto
- ✅ Compatible con Facebook Messenger API

### 4. TikTok Adapter

```typescript
// Ejemplo de envío con audio
const message: SendMessageDTO = {
  threadExternalId: "tiktok_user_id",
  body: "Escucha este audio",
  attachments: [
    {
      type: "audio",
      url: "https://example.com/audio.mp3",
      mimeType: "audio/mpeg"
    }
  ]
}

const result = await tiktokAdapter.sendMessage(channelId, message, credentials)
```

**Características específicas:**
- ✅ Estructura `message.media` personalizada
- ✅ Soporta filename en archivos
- ✅ Implementación preparada para TikTok Business API
- ✅ Actualmente simula respuesta (pendiente API real)

## Estructura de Payloads

### WhatsApp Cloud API
```json
{
  "messaging_product": "whatsapp",
  "to": "573001234567",
  "type": "document",
  "document": {
    "link": "https://example.com/documento.pdf",
    "filename": "documento.pdf",
    "caption": "Aquí tienes el documento"
  }
}
```

### Instagram/Facebook Messenger API
```json
{
  "recipient": { "id": "user_id" },
  "message": {
    "attachment": {
      "type": "image",
      "payload": {
        "url": "https://example.com/imagen.jpg"
      }
    },
    "text": "Mira esta imagen"
  },
  "access_token": "access_token"
}
```

### TikTok Business API (Estructura propuesta)
```json
{
  "recipient": { "user_id": "tiktok_user_id" },
  "message": {
    "text": "Escucha este audio",
    "media": {
      "type": "audio",
      "url": "https://example.com/audio.mp3"
    }
  },
  "access_token": "access_token"
}
```

## Manejo de Errores

### Validaciones Comunes
- ✅ Verificar que las credenciales estén presentes
- ✅ Validar longitud de mensaje según plataforma
- ✅ Verificar que la URL del adjunto sea accesible
- ✅ Validar tipos de archivo soportados

### Códigos de Error Específicos
```typescript
// Ejemplo de manejo de errores
const result = await adapter.sendMessage(channelId, message, credentials)

if (!result.success) {
  switch (result.error.type) {
    case "VALIDATION":
      console.error("Error de validación:", result.error.message)
      break
    case "MESSAGE_TOO_LONG":
      console.error("Mensaje muy largo:", result.error.message)
      break
    case "API":
      console.error("Error de API:", result.error.message)
      break
    default:
      console.error("Error desconocido:", result.error.message)
  }
}
```

## Mejores Prácticas

### 1. Validación de URLs
```typescript
// Validar que la URL sea accesible antes de enviar
async function validateAttachmentUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}
```

### 2. Límites de Tamaño
```typescript
// Verificar límites por plataforma
const PLATFORM_LIMITS = {
  whatsapp: { image: '5MB', video: '16MB', document: '100MB' },
  instagram: { image: '25MB', video: '25MB', file: '25MB' },
  facebook: { image: '25MB', video: '25MB', file: '25MB' },
  tiktok: { image: '10MB', video: '50MB', file: '10MB' }
}
```

### 3. Fallback para Adjuntos
```typescript
// Si falla el envío con adjunto, intentar solo texto
async function sendMessageWithFallback(adapter: ChannelAdapter, message: SendMessageDTO) {
  const result = await adapter.sendMessage(channelId, message, credentials)
  
  if (!result.success && message.attachments) {
    console.warn("Envío con adjunto falló, intentando solo texto")
    const textOnlyMessage = { ...message, attachments: undefined }
    return await adapter.sendMessage(channelId, textOnlyMessage, credentials)
  }
  
  return result
}
```

## Testing

### Ejemplo de Test Unitario
```typescript
describe('WhatsApp Adapter - Attachments', () => {
  it('should send image with caption', async () => {
    const message: SendMessageDTO = {
      threadExternalId: "test_user",
      body: "Mira esta imagen",
      attachments: [{
        type: "image",
        url: "https://example.com/test.jpg"
      }]
    }

    const result = await whatsappAdapter.sendMessage("channel_123", message, {
      phoneId: "test_phone",
      accessToken: "test_token"
    })

    expect(result.success).toBe(true)
    expect(result.data?.externalId).toBeDefined()
  })
})
```

## Próximas Mejoras

- [ ] **Validación de tipos MIME**: Verificar que el tipo MIME coincida con la extensión
- [ ] **Compresión automática**: Reducir tamaño de imágenes grandes
- [ ] **Múltiples adjuntos**: Soporte para enviar varios archivos en un mensaje
- [ ] **Progreso de upload**: Mostrar progreso al subir archivos grandes
- [ ] **Cache de URLs**: Cachear URLs de archivos para evitar re-uploads
- [ ] **Thumbnails**: Generar miniaturas para videos y documentos

## Troubleshooting

### Problemas Comunes

1. **Error 400 - Bad Request**
   - Verificar formato del payload
   - Comprobar que la URL sea accesible
   - Validar límites de tamaño

2. **Error 403 - Forbidden**
   - Verificar permisos del token
   - Comprobar que el canal esté conectado
   - Validar credenciales

3. **Error 429 - Rate Limit**
   - Implementar backoff exponencial
   - Reducir frecuencia de envío
   - Usar queue para mensajes masivos

### Logs Útiles
```typescript
// Habilitar logs detallados
console.log("[Adapter] Sending message:", {
  channelId,
  threadExternalId: message.threadExternalId,
  hasAttachments: !!message.attachments,
  attachmentTypes: message.attachments?.map(a => a.type)
})
```

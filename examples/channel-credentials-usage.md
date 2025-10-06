# Ejemplo de Uso: Guardar Tokens de Acceso en channel.meta

Este documento muestra cómo usar el nuevo sistema de almacenamiento de credenciales en `channel.meta`.

## Funcionalidades Implementadas

### 1. Tipos de Credenciales

Se crearon tipos específicos para cada plataforma:

```typescript
// Instagram/Facebook (Meta)
interface MetaCredentials {
  pageAccessToken: string
  pageId: string
  appId?: string
  permissions?: string[]
  expiresAt?: string
  refreshToken?: string
}

// WhatsApp Cloud API
interface WhatsAppCredentials {
  accessToken: string
  phoneNumberId: string
  businessAccountId: string
  webhookVerifyToken?: string
  expiresAt?: string
}

// TikTok
interface TikTokCredentials {
  accessToken: string
  refreshToken?: string
  scope?: string[]
  expiresAt?: string
}

// Mock (desarrollo/testing)
interface MockCredentials {
  mockToken: string
  mockConfig?: Record<string, any>
  expiresAt?: string
}
```

### 2. Server Actions Disponibles

#### Guardar Credenciales
```typescript
import { saveCredentials } from "@/app/actions/channels"

const result = await saveCredentials({
  channelId: "channel_123",
  tenantId: "tenant_456",
  credentials: {
    // Para Instagram/Facebook
    pageAccessToken: "EAABwzLixnjYBO...",
    pageId: "123456789",
    appId: "987654321",
    permissions: ["pages_manage_metadata", "pages_read_engagement"],
    expiresAt: "2024-12-31T23:59:59Z"
  }
})

if (result.success) {
  console.log("Credenciales guardadas:", result.credentials)
  console.log("Expira:", result.expiresAt)
}
```

#### Obtener Credenciales
```typescript
import { getCredentials } from "@/app/actions/channels"

const result = await getCredentials({
  channelId: "channel_123",
  tenantId: "tenant_456"
})

if (result.success) {
  console.log("Token de acceso:", result.accessToken)
  console.log("Estado:", result.status)
  console.log("Expira:", result.expiresAt)
}
```

#### Validar Credenciales Almacenadas
```typescript
import { validateStoredChannelCredentials } from "@/app/actions/channels"

const result = await validateStoredChannelCredentials({
  channelId: "channel_123",
  tenantId: "tenant_456"
})

if (result.success) {
  console.log("Credenciales válidas:", result.valid)
  console.log("Estado actualizado:", result.status)
}
```

#### Obtener Canales con Credenciales Expiradas
```typescript
import { getChannelsWithExpiredCredentials } from "@/app/actions/channels"

const result = await getChannelsWithExpiredCredentials("tenant_456")

if (result.success) {
  result.expiredChannels.forEach(channel => {
    console.log(`Canal ${channel.displayName} expira: ${channel.expiresAt}`)
  })
}
```

### 3. Ejemplos de Uso por Plataforma

#### Instagram/Facebook
```typescript
// Guardar credenciales de Instagram
await saveCredentials({
  channelId: "instagram_channel_123",
  tenantId: "tenant_456",
  credentials: {
    pageAccessToken: "EAABwzLixnjYBO...",
    pageId: "123456789012345",
    appId: "987654321098765",
    permissions: [
      "pages_manage_metadata",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_manage_comments"
    ],
    expiresAt: "2024-12-31T23:59:59Z"
  }
})
```

#### WhatsApp Cloud API
```typescript
// Guardar credenciales de WhatsApp
await saveCredentials({
  channelId: "whatsapp_channel_123",
  tenantId: "tenant_456",
  credentials: {
    accessToken: "EAA...",
    phoneNumberId: "123456789012345",
    businessAccountId: "987654321098765",
    webhookVerifyToken: "mi_token_verificacion",
    expiresAt: "2024-12-31T23:59:59Z"
  }
})
```

#### TikTok
```typescript
// Guardar credenciales de TikTok
await saveCredentials({
  channelId: "tiktok_channel_123",
  tenantId: "tenant_456",
  credentials: {
    accessToken: "act.1234567890abcdef...",
    refreshToken: "refresh_token_here",
    scope: ["user.info.basic", "video.list"],
    expiresAt: "2024-12-31T23:59:59Z"
  }
})
```

### 4. Validación Automática

El sistema incluye validación automática:

1. **Validación de Estructura**: Verifica que las credenciales tengan los campos requeridos
2. **Validación con Adapter**: Usa el adapter correspondiente para validar con la API externa
3. **Detección de Expiración**: Marca automáticamente credenciales expiradas
4. **Actualización de Estado**: Actualiza el estado del canal según la validez de las credenciales

### 5. Estructura en channel.meta

Las credenciales se almacenan en `channel.meta` con esta estructura:

```json
{
  "type": "INSTAGRAM",
  "credentials": {
    "pageAccessToken": "EAABwzLixnjYBO...",
    "pageId": "123456789",
    "appId": "987654321",
    "permissions": ["pages_manage_metadata"],
    "expiresAt": "2024-12-31T23:59:59Z",
    "savedAt": "2024-01-15T10:30:00Z",
    "version": "1.0",
    "status": "active"
  },
  "config": {
    "webhookUrl": "https://mi-dominio.com/api/webhooks/instagram",
    "notifications": {
      "enabled": true,
      "types": ["new_message", "message_reaction"]
    }
  }
}
```

### 6. Manejo de Errores

El sistema maneja varios tipos de errores:

- **Credenciales inválidas**: Campos faltantes o mal formateados
- **Credenciales expiradas**: Tokens que han superado su fecha de expiración
- **API externa no disponible**: Error de red o API externa
- **Permisos insuficientes**: Usuario sin permisos para realizar la operación

### 7. Próximos Pasos

Con esta implementación, los adapters pueden ahora:

1. **Obtener tokens dinámicamente** desde `channel.meta` en lugar de variables de entorno
2. **Validar credenciales** antes de hacer llamadas a APIs externas
3. **Manejar expiración** de tokens automáticamente
4. **Actualizar tokens** cuando sea necesario

El sistema está listo para la siguiente fase: implementar refresh automático de tokens OAuth.

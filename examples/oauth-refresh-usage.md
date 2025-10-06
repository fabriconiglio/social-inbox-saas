# Ejemplo de Uso: Refresh de Tokens OAuth

Este documento muestra cómo usar el sistema de refresh automático de tokens OAuth implementado.

## Funcionalidades Implementadas

### 1. Tipos de Refresh

Se crearon tipos específicos para manejar refresh de tokens:

```typescript
// Resultado de un refresh
interface RefreshResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  error?: string
  details?: Record<string, any>
}

// Información de tokens próximos a expirar
interface TokenExpirationInfo {
  channelId: string
  channelType: string
  displayName: string
  localName: string
  expiresAt: string
  minutesUntilExpiration: number
  hasRefreshToken: boolean
}
```

### 2. Server Actions Disponibles

#### Refresh Manual de un Canal
```typescript
import { refreshChannelToken } from "@/app/actions/oauth-refresh"

const result = await refreshChannelToken({
  channelId: "channel_123",
  tenantId: "tenant_456"
})

if (result.success) {
  console.log("Token refrescado:", result.newExpiresAt)
}
```

#### Refresh en Batch
```typescript
import { refreshMultipleChannelTokens } from "@/app/actions/oauth-refresh"

// Refresh todos los canales que lo necesiten
const result = await refreshMultipleChannelTokens({
  tenantId: "tenant_456"
})

// O refresh canales específicos
const result = await refreshMultipleChannelTokens({
  tenantId: "tenant_456",
  channelIds: ["channel_123", "channel_456"]
})

console.log(`${result.succeeded}/${result.processed} canales refrescados exitosamente`)
```

#### Obtener Canales que Necesitan Refresh
```typescript
import { getChannelsNeedingTokenRefresh } from "@/app/actions/oauth-refresh"

const result = await getChannelsNeedingTokenRefresh({
  tenantId: "tenant_456",
  refreshBeforeMinutes: 60 // Canales que expiran en menos de 60 minutos
})

if (result.success) {
  result.channels.forEach(channel => {
    console.log(`${channel.displayName} expira en ${channel.minutesUntilExpiration} minutos`)
  })
}
```

### 3. Sistema de Cola Automático

#### Programar Refresh para un Canal
```typescript
import { scheduleChannelTokenRefresh } from "@/app/actions/oauth-refresh"

const result = await scheduleChannelTokenRefresh({
  channelId: "channel_123",
  tenantId: "tenant_456",
  delayMinutes: 30 // Ejecutar en 30 minutos
})

console.log("Job programado:", result.jobId)
```

#### Programar Refresh Recurrente
```typescript
import { scheduleRecurringTokenRefresh } from "@/app/actions/oauth-refresh"

const result = await scheduleRecurringTokenRefresh({
  tenantId: "tenant_456",
  intervalMinutes: 120 // Cada 2 horas
})

console.log("Refresh recurrente programado:", result.jobId)
```

#### Cancelar Refresh Recurrente
```typescript
import { cancelRecurringTokenRefresh } from "@/app/actions/oauth-refresh"

const result = await cancelRecurringTokenRefresh({
  tenantId: "tenant_456"
})

console.log("Cancelado:", result.cancelled)
```

### 4. Monitoreo y Estadísticas

#### Obtener Estado de Jobs
```typescript
import { getTokenRefreshJobsStatus } from "@/app/actions/oauth-refresh"

const result = await getTokenRefreshJobsStatus({
  tenantId: "tenant_456"
})

console.log(`Jobs: ${result.jobsActive} activos, ${result.jobsWaiting} esperando`)
console.log(`Completados: ${result.jobsCompleted}, Fallidos: ${result.jobsFailed}`)
```

#### Obtener Estadísticas de Refresh
```typescript
import { getRefreshStatistics } from "@/app/actions/oauth-refresh"

const result = await getRefreshStatistics({
  tenantId: "tenant_456"
})

const stats = result.statistics
console.log(`Total canales: ${stats.totalChannels}`)
console.log(`Necesitan refresh: ${stats.channelsNeedingRefresh}`)
console.log(`Con refresh token: ${stats.channelsWithRefreshToken}`)
console.log(`Urgentes (< 60 min): ${stats.urgentChannels}`)
```

### 5. Configuración por Plataforma

#### Meta (Instagram/Facebook)
```typescript
// El sistema usa la API de Meta para refresh
// Requiere: client_id, client_secret, refresh_token
const metaRefresh = {
  url: "https://graph.facebook.com/oauth/access_token",
  grant_type: "fb_exchange_token",
  // Retorna: access_token, refresh_token, expires_in
}
```

#### TikTok
```typescript
// El sistema usa la API de TikTok para refresh
// Requiere: client_key, client_secret, refresh_token
const tiktokRefresh = {
  url: "https://open-api.tiktok.com/oauth/refresh_token/",
  grant_type: "refresh_token",
  // Retorna: access_token, refresh_token, expires_in
}
```

#### WhatsApp (Meta API)
```typescript
// WhatsApp usa la misma API que Meta para refresh
// Reutiliza la lógica de Meta con parámetros específicos
```

### 6. Variables de Entorno Requeridas

```bash
# Meta (Instagram/Facebook/WhatsApp)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
# O alternativamente:
TIKTOK_APP_ID=your_app_id
TIKTOK_APP_SECRET=your_app_secret

# Redis (para la cola)
REDIS_URL=redis://localhost:6379
```

### 7. Flujo de Refresh Automático

1. **Detección**: El sistema detecta canales con tokens próximos a expirar
2. **Programación**: Crea jobs en la cola BullMQ para refresh
3. **Ejecución**: Los workers procesan los jobs en paralelo
4. **Actualización**: Actualiza las credenciales en `channel.meta`
5. **Monitoreo**: Registra éxitos y fallos para debugging

### 8. Manejo de Errores

El sistema maneja varios tipos de errores:

- **Sin refresh token**: Canal no configurado para refresh automático
- **API externa no disponible**: Error de red o API externa
- **Credenciales inválidas**: Refresh token expirado o revocado
- **Rate limiting**: Demasiadas requests a la API externa

### 9. Configuración de Workers

Los workers están configurados con:

- **Concurrencia**: 3 jobs en paralelo para refresh individual
- **Reintentos**: Hasta 3 intentos con backoff exponencial
- **Limpieza**: Mantiene 10 jobs completados y 50 fallidos
- **Logging**: Logs detallados para debugging

### 10. Ejemplo de Uso Completo

```typescript
// 1. Configurar refresh recurrente para un tenant
await scheduleRecurringTokenRefresh({
  tenantId: "tenant_456",
  intervalMinutes: 60
})

// 2. Verificar canales que necesitan refresh
const channels = await getChannelsNeedingTokenRefresh({
  tenantId: "tenant_456"
})

// 3. Refresh manual de canales urgentes
const urgentChannels = channels.channels.filter(c => c.minutesUntilExpiration < 30)
if (urgentChannels.length > 0) {
  await refreshMultipleChannelTokens({
    tenantId: "tenant_456",
    channelIds: urgentChannels.map(c => c.channelId)
  })
}

// 4. Monitorear progreso
const status = await getTokenRefreshJobsStatus({
  tenantId: "tenant_456"
})

console.log(`Estado: ${status.jobsActive} activos, ${status.jobsCompleted} completados`)
```

### 11. Próximos Pasos

Con esta implementación, el sistema puede:

1. **Mantener tokens activos** automáticamente sin intervención manual
2. **Detectar problemas** con tokens próximos a expirar
3. **Escalar** el refresh para múltiples tenants y canales
4. **Monitorear** el estado de refresh en tiempo real
5. **Recuperarse** de errores con reintentos automáticos

El sistema está listo para la siguiente fase: encriptar credenciales sensibles para mayor seguridad.

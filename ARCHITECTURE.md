# Arquitectura del Sistema

## Visión General

Social Inbox es una plataforma SaaS multi-tenant diseñada para centralizar la gestión de mensajes de múltiples canales de redes sociales (Instagram, Facebook, WhatsApp, TikTok) para empresas con múltiples sucursales.

## Principios de Diseño

1. **Multi-tenancy**: Aislamiento completo de datos entre empresas
2. **Escalabilidad**: Arquitectura preparada para crecer horizontalmente
3. **Extensibilidad**: Fácil agregar nuevos canales mediante adapters
4. **Confiabilidad**: Sistema de colas para garantizar entrega de mensajes
5. **Seguridad**: Autenticación robusta y validación de webhooks

## Capas de la Aplicación

### 1. Presentación (Frontend)

**Tecnologías**: Next.js 15 App Router, React 19, TailwindCSS v4, shadcn/ui

**Componentes principales**:
- `InboxLayout`: Layout de 3 paneles (sidebar, lista, detalle)
- `ThreadList`: Lista de conversaciones con filtros
- `MessageList`: Timeline de mensajes con polling
- `MessageComposer`: Editor de mensajes con respuestas rápidas
- `AnalyticsDashboard`: Dashboard con KPIs y gráficos

**Patrones**:
- Server Components para data fetching
- Client Components para interactividad
- SWR para polling y cache
- Server Actions para mutaciones

### 2. Lógica de Negocio (Backend)

**Tecnologías**: Next.js API Routes, Server Actions, TypeScript

**Módulos principales**:

#### Auth Module
- NextAuth v5 con estrategia JWT
- Roles: OWNER, ADMIN, AGENT, VIEWER
- Middleware para protección de rutas
- Utilidades para verificar permisos

#### Tenant Module
- Gestión de empresas y locales
- Invitación de usuarios
- Asignación de roles por tenant

#### Channel Module
- Conexión de canales por local
- Gestión de credenciales
- Estado de canales (ACTIVE, INACTIVE, ERROR)

#### Message Module
- Ingesta de mensajes entrantes
- Envío de mensajes salientes
- Gestión de adjuntos
- Tracking de estado (enviado, entregado, leído, fallido)

#### Thread Module
- Agrupación de mensajes por conversación
- Asignación a agentes
- Estados (OPEN, PENDING, CLOSED)
- Búsqueda y filtrado

#### Contact Module
- Enriquecimiento de contactos
- Notas internas
- Historial de conversaciones

#### Analytics Module
- Cálculo de métricas
- Agregaciones por canal, agente, fecha
- Exportación de reportes

#### SLA Module
- Configuración de SLAs
- Cálculo de tiempos de respuesta
- Alertas de vencimiento

### 3. Capa de Integración

**Channel Adapters**: Abstracción para diferentes plataformas

\`\`\`typescript
interface ChannelAdapter {
  type: string
  subscribeWebhooks(channelId: string, webhookUrl: string): Promise<void>
  ingestWebhook(payload: any, channelId: string): Promise<MessageDTO | null>
  sendMessage(channelId: string, message: SendMessageDTO): Promise<Result>
  listThreads(channelId: string): Promise<ThreadDTO[]>
  verifyWebhook(payload: any, signature: string): boolean
}
\`\`\`

**Adapters implementados**:
- `MetaInstagramAdapter`: Instagram DM via Graph API
- `MetaFacebookAdapter`: Facebook Messenger via Graph API
- `WhatsAppCloudAdapter`: WhatsApp Business Cloud API
- `TikTokAdapter`: TikTok Direct Messages
- `MockAdapter`: Adapter de prueba para desarrollo

**Webhook Handlers**:
- `/api/webhooks/meta`: Instagram + Facebook
- `/api/webhooks/whatsapp`: WhatsApp
- `/api/webhooks/tiktok`: TikTok

Cada handler:
1. Verifica la firma del webhook
2. Identifica el canal correspondiente
3. Llama al adapter para parsear el payload
4. Crea/actualiza thread y contact
5. Guarda el mensaje en la base de datos
6. Dispara notificaciones si es necesario

### 4. Capa de Persistencia

**Tecnologías**: PostgreSQL, Prisma ORM

**Modelos principales**:

\`\`\`
Tenant (1) ──< (N) Local (1) ──< (N) Channel
   │                                      │
   │                                      │
   └──< (N) Membership (N) ──> (1) User  │
   │                                      │
   │                                      │
   └──< (N) Thread (N) ──> (1) Channel ──┘
         │
         └──< (N) Message
\`\`\`

**Índices optimizados**:
- `threads`: `tenantId`, `localId`, `channelId`, `assigneeId`, `status`, `lastMessageAt`
- `messages`: `threadId`, `channelId`, `sentAt`
- `contacts`: `tenantId_platform_handle` (unique)

### 5. Capa de Procesamiento Asíncrono

**Tecnologías**: BullMQ, Redis

**Queues**:

#### Message Queue
- **Job**: `send-message`
- **Payload**: `{ channelId, messageId, message }`
- **Worker**: Procesa mensajes salientes
- **Retry**: 3 intentos con backoff exponencial
- **Concurrency**: 5 workers

**Flujo de envío**:
1. Usuario envía mensaje desde composer
2. Se guarda en DB con estado "pending"
3. Se encola job en Redis
4. Worker toma el job
5. Llama al adapter correspondiente
6. Actualiza estado del mensaje (delivered/failed)
7. Si falla, reintenta según configuración

### 6. Capa de Tiempo Real

**Implementación actual**: SWR polling (3 segundos)

**Implementación futura**: Socket.IO

\`\`\`typescript
// Server
io.on('connection', (socket) => {
  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant:${tenantId}`)
  })
})

// Emit on new message
io.to(`tenant:${tenantId}`).emit('new-message', message)

// Client
socket.on('new-message', (message) => {
  mutate(`/api/tenants/${tenantId}/threads/${threadId}/messages`)
})
\`\`\`

## Flujos Principales

### Flujo de Mensaje Entrante

\`\`\`
1. Plataforma (IG/FB/WA/TT) → Webhook
2. Webhook Handler → Verifica firma
3. Webhook Handler → Identifica canal
4. Channel Adapter → Parsea payload
5. Webhook Handler → Busca/crea contact
6. Webhook Handler → Busca/crea thread
7. Webhook Handler → Guarda message
8. Webhook Handler → Actualiza thread.lastMessageAt
9. [Opcional] → Crea notificación
10. [Opcional] → Emite evento real-time
\`\`\`

### Flujo de Mensaje Saliente

\`\`\`
1. Usuario → Escribe mensaje en composer
2. Client → Llama server action
3. Server Action → Verifica permisos
4. Server Action → Guarda message en DB
5. Server Action → Encola job en Redis
6. BullMQ Worker → Toma job
7. Worker → Llama channel adapter
8. Adapter → Llama API de plataforma
9. Worker → Actualiza estado del message
10. [Si falla] → Reintenta según config
\`\`\`

### Flujo de Autenticación

\`\`\`
1. Usuario → Ingresa credenciales
2. NextAuth → Valida con Prisma
3. NextAuth → Genera JWT
4. NextAuth → Crea session
5. Middleware → Verifica JWT en cada request
6. Middleware → Redirige si no autenticado
\`\`\`

### Flujo de Multi-tenancy

\`\`\`
1. Usuario autenticado → /app/select-tenant
2. Sistema → Busca memberships del usuario
3. Usuario → Selecciona tenant
4. Sistema → Redirige a /app/[tenantId]/inbox
5. Middleware → Verifica acceso al tenant
6. Todas las queries → Filtran por tenantId
\`\`\`

## Seguridad

### Autenticación
- JWT con secret de 32+ caracteres
- Contraseñas hasheadas con bcrypt (10 rounds)
- Session expiration configurable
- Refresh token rotation (OAuth)

### Autorización
- Roles jerárquicos: VIEWER < AGENT < ADMIN < OWNER
- Verificación de permisos en cada endpoint
- Aislamiento de datos por tenant
- Validación de acceso a recursos

### Webhooks
- Verificación de firmas HMAC
- Tokens de verificación
- Rate limiting (futuro)
- Idempotencia con externalId

### Datos
- Validación con Zod
- Sanitización de inputs
- Prepared statements (Prisma)
- Encriptación en tránsito (HTTPS)

## Escalabilidad

### Horizontal Scaling

**App Servers**:
- Stateless (JWT, no sessions en memoria)
- Load balancer (Vercel, AWS ALB)
- Auto-scaling basado en CPU/memoria

**Workers**:
- Múltiples instancias de BullMQ
- Concurrency configurable
- Distribución automática de jobs

**Database**:
- Read replicas para queries
- Connection pooling (Prisma)
- Índices optimizados

**Redis**:
- Redis Cluster para alta disponibilidad
- Persistencia AOF/RDB

### Vertical Scaling

- Aumentar recursos de DB (CPU, RAM, IOPS)
- Aumentar workers de BullMQ
- Optimizar queries con EXPLAIN ANALYZE

### Caching

**Niveles de cache**:
1. **Browser**: SWR cache en cliente
2. **CDN**: Static assets (Vercel Edge)
3. **Application**: Redis para datos frecuentes
4. **Database**: Query cache de PostgreSQL

## Monitoreo y Observabilidad

### Logs
- Structured logging con contexto
- Niveles: error, warn, info, debug
- Agregación con servicio externo (Datadog, Sentry)

### Métricas
- Tiempo de respuesta de endpoints
- Tasa de éxito/fallo de webhooks
- Latencia de envío de mensajes
- Uso de recursos (CPU, memoria, DB connections)

### Alertas
- SLA breaches
- Errores de webhooks
- Queue backlog alto
- Database connection pool exhausted

## Testing

### Unit Tests
- Adapters: Parseo de payloads
- Utilidades: Cálculo de SLA
- Validaciones: Schemas de Zod

### Integration Tests
- API endpoints
- Server actions
- Webhook handlers

### E2E Tests (Playwright)
- Login flow
- Inbox navigation
- Send message
- Assign thread
- Close thread

## Deployment

### Environments

**Development**:
- Local PostgreSQL + Redis
- ngrok para webhooks
- Hot reload

**Staging**:
- Vercel Preview
- Neon PostgreSQL
- Upstash Redis
- Webhooks de prueba

**Production**:
- Vercel Production
- Neon PostgreSQL (HA)
- Upstash Redis (HA)
- Webhooks reales

### CI/CD

\`\`\`yaml
# .github/workflows/ci.yml
- Lint
- Type check
- Unit tests
- Build
- Deploy to Vercel
\`\`\`

## Futuras Mejoras

1. **Real-time bidireccional**: Socket.IO
2. **Chatbots**: Integración con LLMs
3. **Sentiment analysis**: Clasificación automática
4. **CRM integrations**: Salesforce, HubSpot
5. **Mobile app**: React Native
6. **Voice messages**: Transcripción automática
7. **File storage**: S3 para adjuntos
8. **Advanced analytics**: Data warehouse

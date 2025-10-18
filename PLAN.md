# 📋 Plan de Desarrollo - MessageHub

> Estado actual del proyecto y roadmap de funcionalidades pendientes

**Última actualización**: 1 de Octubre, 2025

---

## 🎯 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas

#### Autenticación y Usuarios
- ✅ NextAuth v5 configurado con Credentials provider
- ✅ Registro y login de usuarios
- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT con secret configurado
- ✅ Middleware de protección de rutas
- ✅ Sistema de roles (OWNER, ADMIN, AGENT, VIEWER)
- ✅ Memberships para multi-tenancy

#### Multi-Tenancy
- ✅ Modelo de datos Tenant → Local → Channel
- ✅ Selector de tenant funcional
- ✅ Aislamiento de datos por tenant
- ✅ Verificación de permisos por tenant

#### Base de Datos
- ✅ Schema Prisma completo y bien estructurado
- ✅ Migraciones configuradas
- ✅ Seed con datos de prueba funcional
- ✅ Modelos: User, Tenant, Local, Channel, Thread, Message, Contact, SLA, CannedResponse, etc.
- ✅ Índices optimizados

#### Webhooks
- ✅ Endpoint `/api/webhooks/meta` (Instagram + Facebook)
- ✅ Endpoint `/api/webhooks/whatsapp`
- ✅ Endpoint `/api/webhooks/tiktok`
- ✅ Procesamiento de mensajes entrantes
- ✅ Creación automática de contacts y threads
- ✅ Verificación de webhooks implementada

#### Adapters de Canales
- ✅ `MetaInstagramAdapter` - Estructura básica
- ✅ `MetaFacebookAdapter` - Estructura básica
- ✅ `WhatsAppCloudAdapter` - Implementación completa
- ✅ `TikTokAdapter` - Estructura básica
- ✅ `MockAdapter` - Para desarrollo y testing
- ✅ Interface `ChannelAdapter` bien definida

#### Cola de Mensajes
- ✅ BullMQ configurado con Redis
- ✅ Queue para mensajes salientes
- ✅ Worker funcional con retry logic
- ✅ Integración con adapters

#### Interfaz de Usuario
- ✅ Design system con shadcn/ui
- ✅ Tema claro/oscuro funcional
- ✅ Layout responsivo
- ✅ Página de login elegante
- ✅ Página de registro
- ✅ Selector de tenant
- ✅ Dashboard de inbox (layout de 3 paneles)
- ✅ Lista de threads
- ✅ Vista de mensajes
- ✅ Message composer básico
- ✅ SLA badge visual
- ✅ Analytics dashboard básico
- ✅ Sidebar de navegación

#### Server Actions
- ✅ `sendMessage` - Enviar mensajes
- ✅ `createTenant` - Crear empresas
- ✅ Validación de permisos en actions

#### Configuración
- ✅ Variables de entorno con validación Zod
- ✅ TypeScript configurado
- ✅ ESLint y Prettier
- ✅ Tailwind CSS v4
- ✅ Next.js 15 con App Router

---

## 🚧 Funcionalidades Pendientes

### 🔴 PRIORIDAD ALTA (Críticas para MVP)

#### 1. Completar Funcionalidad de Canales
**Estado**: 🟢 UI 100% Completa - Faltan solo adapters reales

**Tareas**:
- [x] **Gestión de Canales UI** ✅ COMPLETADO
  - [x] Página `/app/[tenantId]/channels` para listar canales conectados
  - [x] Componente `ChannelCard` con estado (activo/inactivo/error)
  - [x] Formulario para conectar nuevos canales
  - [x] Formulario para editar configuración de canales
  - [x] Botón para desconectar/eliminar canales
  - [x] Validación de credenciales en tiempo real ✅ COMPLETADO

- [x] **Completar Adapters** ✅ COMPLETADO
  - [x] Obtener PAGE_ACCESS_TOKEN desde `channel.meta` en Instagram/Facebook ✅ COMPLETADO
  - [x] Implementar `listThreads()` para Instagram/Facebook ✅ COMPLETADO
  - [x] Implementar `sendMessage()` con credenciales desde meta ✅ COMPLETADO
  - [x] Mejorar manejo de errores en adapters ✅ COMPLETADO
  - [x] Implementar verificación de webhook con HMAC ✅ COMPLETADO
  - [x] Testing de cada adapter con datos reales ✅ COMPLETADO

- [ ] **Almacenamiento de Credenciales**
  - [x] Guardar tokens de acceso en `channel.meta` (JSON) ✅ COMPLETADO
  - [x] Implementar refresh de tokens OAuth ✅ COMPLETADO
  - [x] Encriptar credenciales sensibles ✅ COMPLETADO
  - [x] Validar credenciales antes de guardar ✅ COMPLETADO

**Estimación**: 3-4 días

---

#### 1.1. Configuración de Apps y Credenciales
**Estado**: 🟡 Configuración manual requerida

**Tareas**:
- [ ] **Meta (Facebook/Instagram)**
  - [ ] Crear app en Meta for Developers (entrar a business facebook para ver la revision)
  - [ ] Configurar productos: Facebook Login, Instagram Basic Display
  - [ ] Obtener App ID y App Secret
  - [ ] Configurar OAuth redirect URIs
  - [ ] Generar Page Access Tokens
  - [ ] Configurar webhooks con HMAC verification

- [ ] **WhatsApp Business API**
  - [ ] Configurar WhatsApp Business Platform en Meta
  - [ ] Obtener Phone Number ID y Access Token
  - [ ] Configurar Business Account ID
  - [ ] Configurar webhook de WhatsApp
  - [ ] Verificar número de teléfono

- [ ] **TikTok for Business**
  - [ ] Crear aplicación en TikTok for Business
  - [ ] Solicitar acceso a TikTok Business API
  - [ ] Obtener App ID, App Secret y Access Token
  - [ ] Configurar webhooks de TikTok

- [ ] **Variables de Entorno**
  - [ ] Configurar META_APP_ID y META_APP_SECRET
  - [ ] Configurar WHATSAPP_WEBHOOK_SECRET
  - [ ] Configurar TIKTOK_CLIENT_KEY y TIKTOK_CLIENT_SECRET
  - [ ] Configurar ENCRYPTION_MASTER_KEY
  - [ ] Documentar proceso de configuración

**Estimación**: 2-3 días (configuración manual)

---

#### 2. Respuestas Rápidas (Canned Responses)
**Estado**: ✅ COMPLETADO

**Tareas**:
- [x] **UI de Gestión** ✅ COMPLETADO
  - [x] Página `/app/[tenantId]/settings/quick-replies`
  - [x] Lista de respuestas rápidas
  - [x] Formulario de creación/edición
  - [x] Botón de eliminación con confirmación
  - [ ] Sistema de carpetas/categorías (opcional - futuro)

- [x] **Integración en Composer** ✅ COMPLETADO
  - [x] Botón en `MessageComposer` para abrir selector
  - [x] Popover/Dialog con lista de respuestas rápidas
  - [x] Búsqueda/filtro de respuestas
  - [x] Insertar respuesta en textarea
  - [x] Sistema de variables: `{{nombre}}`, `{{local}}`, etc.
  - [ ] Preview de respuesta con variables reemplazadas (futuro)

- [x] **Server Actions** ✅ COMPLETADO
  - [x] `createCannedResponse`
  - [x] `updateCannedResponse`
  - [x] `deleteCannedResponse`
  - [x] `listCannedResponses`

**Estimación**: 2-3 días (Completado en 1 sesión)

---

#### 3. Asignación de Conversaciones
**Estado**: ✅ COMPLETADO

**Tareas**:
- [x] **UI de Asignación** ✅ COMPLETADO
  - [x] Dropdown en `ThreadHeader` para asignar agente
  - [x] Lista de agentes disponibles del tenant
  - [x] Mostrar avatar y nombre del agente asignado
  - [x] Botón "Asignarme" para auto-asignarse
  - [x] Botón "Desasignar" para liberar thread

- [x] **Filtros por Asignación** ✅ COMPLETADO
  - [x] Filtro "Mis conversaciones" en inbox
  - [x] Filtro "Sin asignar"
  - [x] Filtro por agente específico

- [x] **Server Actions** ✅ COMPLETADO
  - [x] `assignThread(threadId, userId)`
  - [x] `unassignThread(threadId)`
  - [x] Validar permisos (solo ADMIN+ puede asignar a otros)

- [x] **Notificaciones** ✅ COMPLETADO
  - [x] Notificar al agente cuando se le asigna un thread
  - [x] Mostrar badge con cantidad de threads asignados

**Estimación**: 2 días (Completado en 1 sesión - Incluye notificaciones)

---

#### 4. Estados de Conversaciones
**Estado**: ✅ COMPLETADO

**Tareas**:
- [x] **UI de Estados** ✅ COMPLETADO
  - [x] Dropdown en `ThreadHeader` para cambiar estado
  - [x] Opciones: Abierto, Pendiente, Cerrado
  - [x] Badge visual del estado actual
  - [x] Colores distintivos por estado

- [x] **Filtros por Estado** ✅ COMPLETADO
  - [x] Filtro "Abiertas" (por defecto)
  - [x] Filtro "Pendientes"
  - [x] Filtro "Cerradas"
  - [x] Filtro "Todas"

- [x] **Lógica de Negocio** ✅ COMPLETADO
  - [x] Reabrir thread cerrado al recibir mensaje nuevo ✅ YA IMPLEMENTADO
  - [x] Confirmar antes de cerrar thread ✅ COMPLETADO
  - [x] Historial de cambios de estado (AuditLog) ✅ COMPLETADO

- [x] **Server Actions** ✅ COMPLETADO
  - [x] `updateThreadStatus(threadId, status)`
  - [x] Validar permisos por rol

**Estimación**: 1-2 días (Completado en 1 sesión - Incluye AuditLog completo)

---

#### 5. Gestión de Contactos
**Estado**: 🔴 Modelo implementado, falta UI

**Tareas**:
- [x] **Página de Contactos** ✅ COMPLETADO
  - [x] Lista de contactos con búsqueda
  - [x] Tarjeta de contacto con información básica
  - [x] Click para ver detalle completo

- [x] **Detalle de Contacto** ✅ COMPLETADO
  - [x] Modal/Página con información completa
  - [x] Nombre, handle, plataforma, teléfono, email
  - [x] Campo de notas editable
  - [x] Historial de conversaciones con el contacto ✅ COMPLETADO
  - [x] Botón para iniciar nueva conversación

- [x] **Enriquecimiento de Datos** ✅ COMPLETADO
  - [x] Formulario para agregar/editar información
  - [x] Validación de datos
  - [x] Auto-guardar notas

- [x] **Server Actions** ✅ COMPLETADO
  - [x] `updateContact(contactId, data)`
  - [x] `getContactThreads(contactId)`
  - [x] `searchContacts(query)`

**Estimación**: 2-3 días

---

### 🟡 PRIORIDAD MEDIA (Importantes pero no bloqueantes)

#### 6. Adjuntos y Multimedia
**Estado**: 🟡 Funcionalidad básica implementada

**Tareas**:
- [x] **Upload de Archivos** ✅ COMPLETADO
  - [x] Botón de adjuntar en `MessageComposer`
  - [x] Preview de archivos antes de enviar
  - [x] Validación de tamaño y tipo de archivo
  - [x] Integración con función de envío
  - [x] Integración con servicio de storage (S3, Cloudinary, etc.)
  - [x] Progress bar de upload

- [x] **Tipos Soportados** ✅ COMPLETADO
  - [x] Imágenes (jpg, png, gif)
  - [x] Videos (mp4, mov)
  - [x] Documentos (pdf, doc, xlsx)
  - [x] Audio (mp3, wav, ogg)

- [x] **Visualización** ✅ COMPLETADO
  - [x] Gallery viewer para imágenes
  - [x] Video player integrado
  - [x] PDF viewer ✅ COMPLETADO
  - [x] Botón de descarga ✅ COMPLETADO

- [x] **Adapters** ✅ COMPLETADO
  - [x] Implementar envío de adjuntos en cada adapter ✅ COMPLETADO
  - [x] Mapear URLs de media de plataformas externas ✅ COMPLETADO

**Estimación**: 3-4 días (Completado en 1 sesión - Incluye PDF viewer)

---

#### 7. Búsqueda Avanzada
**Estado**: ✅ COMPLETADO

**Tareas**:
- [ ] **UI de Búsqueda**
  - [x] Barra de búsqueda en inbox
  - ✅ Filtros avanzados (canal, fecha, estado, agente)
  - ✅ Búsqueda en tiempo real con debounce
  - ✅ Destacar resultados de búsqueda

- [x] **Búsqueda Backend**
  - [x] Full-text search en PostgreSQL
  - [x] Índice de búsqueda en mensajes
  - [x] Búsqueda por nombre de contacto
  - [x] Búsqueda por handle/teléfono

- [x] **Server Actions**
  - [x] `searchThreads(query, filters)`
  - [x] `searchMessages(query, filters)`

**Estimación**: 2-3 días (Completado en 1 sesión - Búsqueda completa con filtros y highlighting)

---

#### 8. Notificaciones
**Estado**: 🟡 Modelo implementado, falta lógica

**Tareas**:
- [ ] **Notificaciones In-App**
  - [ ] Bell icon en header con badge de contador
  - [ ] Dropdown con lista de notificaciones
  - [ ] Marcar como leído
  - [ ] Click para ir al thread

- [ ] **Tipos de Notificaciones**
  - [ ] Nuevo mensaje en thread asignado
  - [ ] Thread asignado a ti
  - [ ] SLA próximo a vencer
  - [ ] SLA vencido
  - [ ] Mención en mensaje (futuro)

- [ ] **Lógica de Creación**
  - [ ] Crear notificación al recibir mensaje (solo para agente asignado)
  - [ ] Crear notificación al asignar thread
  - [ ] Crear notificación en SLA warnings

- [ ] **Server Actions**
  - [ ] `markNotificationAsRead(notificationId)`
  - [ ] `markAllAsRead()`
  - [ ] `getUnreadCount()`

**Estimación**: 2-3 días

---

#### 9. Analytics Avanzado
**Estado**: 🟡 Dashboard básico, faltan métricas

**Tareas**:
- [ ] **Métricas Adicionales**
  - [ ] Tiempo promedio de primera respuesta
  - [ ] Tiempo promedio de resolución
  - [ ] Tasa de cierre de conversaciones
  - [ ] Mensajes por hora del día
  - [ ] Picos de volumen

- [ ] **Gráficos Mejorados**
  - [ ] Línea de tiempo de volumen
  - [ ] Comparación periodo anterior
  - [ ] Heatmap de horarios
  - [ ] Funnel de conversaciones

- [ ] **Exportación de Reportes**
  - [ ] Botón "Exportar a CSV"
  - [ ] Botón "Exportar a PDF"
  - [ ] Selector de rango de fechas
  - [ ] Filtros personalizables

- [ ] **Métricas por Agente**
  - [ ] Ranking de agentes
  - [ ] Tiempo promedio de respuesta por agente
  - [ ] Cantidad de conversaciones manejadas
  - [ ] Satisfacción del cliente (futuro)

**Estimación**: 3-4 días

---

#### 10. Configuración de SLA
**Estado**: 🟡 Modelo y cálculo implementados, falta UI completa

**Tareas**:
- [ ] **UI de Configuración**
  - [ ] Formulario para editar SLA existente
  - [ ] Configurar tiempo de primera respuesta
  - [ ] Configurar horarios de atención por día
  - [ ] Toggle para horarios 24/7
  - [ ] Preview de cómo afecta el SLA

- [ ] **SLA por Canal/Local**
  - [ ] Permitir SLAs diferentes por tipo de canal
  - [ ] Permitir SLAs diferentes por local
  - [ ] Jerarquía: Local > Canal > Tenant

- [ ] **Alertas de SLA**
  - [ ] Notificación cuando SLA está por vencer (75%)
  - [ ] Notificación cuando SLA vence
  - [ ] Destacar visualmente threads con SLA vencido

**Estimación**: 2 días

---

### 🟢 PRIORIDAD BAJA (Nice to have)

#### 11. Plantillas de WhatsApp
**Estado**: 🟡 Modelo implementado, falta UI

**Tareas**:
- [ ] Página de gestión de plantillas
- [ ] Sincronización con plantillas aprobadas de Meta
- [ ] Selector de plantillas en composer
- [ ] Validación de variables en plantillas
- [ ] Preview de plantilla con variables

**Estimación**: 2-3 días

---

#### 12. Audit Log y Tracking
**Estado**: 🟡 Modelo implementado, falta lógica

**Tareas**:
- [ ] Registrar acciones importantes en AuditLog
- [ ] UI para ver historial de cambios
- [ ] Filtrar por entidad/usuario/fecha
- [ ] Exportar audit logs

**Estimación**: 2 días

---

#### 13. Invitación de Usuarios
**Estado**: 🔴 No implementado

**Tareas**:
- [ ] Formulario para invitar usuarios por email
- [ ] Envío de email con link de invitación
- [ ] Página de aceptar invitación
- [ ] Asignar rol al aceptar
- [ ] Gestión de invitaciones pendientes

**Estimación**: 2-3 días

---

#### 14. Real-time con Socket.IO
**Estado**: 🔴 No implementado (usa polling)

**Tareas**:
- [ ] Instalar y configurar Socket.IO
- [ ] Implementar eventos: `new-message`, `thread-updated`, `typing`
- [ ] Conectar cliente al socket
- [ ] Mostrar indicador de "escribiendo..."
- [ ] Actualizar UI en tiempo real sin polling

**Estimación**: 2-3 días

---

#### 15. Chatbots con IA
**Estado**: 🔴 No implementado

**Tareas**:
- [ ] Integración con OpenAI/Claude API
- [ ] Configuración de chatbot por tenant
- [ ] Respuestas automáticas fuera de horario
- [ ] Clasificación automática de mensajes
- [ ] Análisis de sentiment
- [ ] Resumen automático de conversaciones

**Estimación**: 5-7 días

---

#### 16. Integraciones CRM
**Estado**: 🔴 No implementado

**Tareas**:
- [ ] Integración con Salesforce
- [ ] Integración con HubSpot
- [ ] Integración con Pipedrive
- [ ] Sincronización bidireccional de contactos
- [ ] Crear leads/oportunidades desde conversaciones

**Estimación**: 10+ días (por integración)

---

## 🛠️ Mejoras Técnicas Pendientes

### Infraestructura

- [ ] **Testing**
  - [ ] Setup de Jest + React Testing Library
  - [ ] Tests unitarios para adapters
  - [ ] Tests de integración para server actions
  - [ ] Tests E2E con Playwright
  - [ ] Coverage mínimo del 70%

- [ ] **CI/CD**
  - [ ] GitHub Actions para lint y test
  - [ ] Auto-deploy a staging en PR
  - [ ] Auto-deploy a producción en merge a main
  - [ ] Health checks automatizados

- [ ] **Monitoreo**
  - [ ] Integración con Sentry para error tracking
  - [ ] Logs estructurados con Winston/Pino
  - [ ] Métricas de performance (Datadog/New Relic)
  - [ ] Alertas en Slack/Discord

- [ ] **Base de Datos**
  - [ ] Connection pooling optimizado
  - [ ] Read replicas para consultas pesadas
  - [ ] Índices adicionales según uso real
  - [ ] Cleanup de datos viejos (archiving)

- [ ] **Seguridad**
  - [ ] Rate limiting en webhooks
  - [ ] CORS configurado correctamente
  - [ ] Sanitización de inputs en todos los forms
  - [ ] Auditoría de dependencias (npm audit)
  - [ ] Encriptación de credenciales en BD

**Estimación**: 5-7 días

---

### Performance

- [ ] **Optimizaciones Frontend**
  - [ ] Lazy loading de componentes pesados
  - [ ] Virtualización de listas largas
  - [ ] Memoización de componentes
  - [ ] Image optimization automática
  - [ ] Bundle size analysis y reducción

- [ ] **Optimizaciones Backend**
  - [ ] Caching con Redis para queries frecuentes
  - [ ] Batching de queries con DataLoader
  - [ ] Paginación en todos los listados
  - [ ] Índices de base de datos optimizados

**Estimación**: 3-4 días

---

### Developer Experience

- [ ] **Documentación**
  - [ ] API documentation con Swagger/OpenAPI
  - [ ] Componentes documentados con Storybook
  - [ ] Guía de contribución (CONTRIBUTING.md)
  - [ ] Changelog automatizado

- [ ] **Tooling**
  - [ ] Scripts de setup automatizado
  - [ ] Docker Compose para desarrollo local
  - [ ] Seeders adicionales para diferentes escenarios
  - [ ] Scripts de migración de datos

**Estimación**: 2-3 días

---

## 📊 Estimación de Tiempos

### Por Prioridad

| Prioridad | Tareas | Estimación Total |
|-----------|--------|------------------|
| 🔴 Alta   | 5 tareas | 12-16 días |
| 🟡 Media  | 5 tareas | 14-19 días |
| 🟢 Baja   | 6 tareas | 21+ días |
| 🛠️ Técnicas | Mejoras | 10-14 días |

### MVP Funcional (Solo prioridad ALTA)
**Tiempo estimado**: 2.5-3 semanas (1 desarrollador)

### Producto Completo (Todo el plan)
**Tiempo estimado**: 9-12 semanas (1 desarrollador)

---

## 🎯 Roadmap Sugerido

### Fase 1: MVP (Semanas 1-3)
- ✅ Completar funcionalidad de canales
- ✅ Respuestas rápidas
- ✅ Asignación de conversaciones
- ✅ Estados de conversaciones
- ✅ Gestión de contactos

### Fase 2: Mejoras (Semanas 4-6)
- ✅ Adjuntos y multimedia
- ✅ Búsqueda avanzada
- ✅ Notificaciones completas
- ✅ Analytics avanzado
- ✅ Configuración de SLA

### Fase 3: Features Avanzados (Semanas 7-9)
- ✅ Plantillas de WhatsApp
- ✅ Audit log completo
- ✅ Invitación de usuarios
- ✅ Real-time con Socket.IO
- ✅ Testing completo

### Fase 4: Escalabilidad (Semanas 10-12)
- ✅ Mejoras de performance
- ✅ Monitoreo y alertas
- ✅ CI/CD completo
- ✅ Documentación completa
- ✅ (Opcional) Chatbots con IA

---

## 📝 Notas Importantes

### Decisiones de Arquitectura Pendientes

1. **Storage de Archivos**: ¿AWS S3, Cloudinary, o Supabase Storage?
2. **Real-time**: ¿Socket.IO o mantener polling con SWR?
3. **Email Service**: ¿Resend, SendGrid, o AWS SES?
4. **Hosting**: ¿Vercel, AWS, o Railway?
5. **Database**: ¿Neon, Supabase, o RDS?

### Dependencias Externas a Configurar

- [ ] Credenciales de Meta (App ID, App Secret)
- [ ] Credenciales de WhatsApp Business API
- [ ] Credenciales de TikTok for Business
- [ ] Servicio de email (para invitaciones)
- [ ] Servicio de storage (para adjuntos)
- [ ] Redis en producción (Upstash recomendado)
- [ ] Base de datos PostgreSQL en producción

### Consideraciones de Costos

- **Vercel**: Gratis para hobby, $20/mes Pro
- **Neon/Supabase**: Gratis para proyectos pequeños
- **Upstash Redis**: Gratis hasta 10K comandos/día
- **Cloudinary**: Gratis hasta 25GB/mes
- **OpenAI** (si se usa): ~$0.002 por 1K tokens

---

## 🚀 Próximos Pasos Inmediatos

### Esta Semana
1. ✅ Terminar configuración de modo oscuro
2. ✅ Actualizar branding a MessageHub
3. ⏳ Implementar gestión de canales UI
4. ⏳ Completar adapters con credenciales reales

### Próxima Semana
1. Implementar respuestas rápidas
2. Implementar asignación de conversaciones
3. Implementar cambio de estados
4. Testing básico de flujo completo

---

## 📞 Contacto y Soporte

Para preguntas sobre el plan o priorización:
- **Developer**: Fabri
- **Proyecto**: MessageHub
- **Fecha inicio**: Octubre 2025

---

**¡Manos a la obra! 🚀**


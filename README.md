# Social Inbox SaaS

Plataforma multi-tenant para centralizar y responder mensajes de Instagram, Facebook, WhatsApp Business y TikTok de múltiples sucursales de una cadena.

## 🚀 Características

### Core Features
- **Bandeja de entrada unificada** - Gestiona todos tus mensajes de redes sociales en un solo lugar
- **Multi-tenant** - Soporte para múltiples empresas y locales
- **Canales soportados** - Instagram DM, Facebook Messenger, WhatsApp Business, TikTok
- **Tiempo real** - Actualización automática de mensajes sin recargar
- **Asignación de conversaciones** - Asigna hilos a agentes específicos
- **SLA tracking** - Seguimiento de tiempos de primera respuesta
- **Analytics** - Dashboard con métricas de volumen, canales y agentes
- **Respuestas rápidas** - Plantillas de mensajes con variables
- **Roles y permisos** - Owner, Admin, Agent, Viewer

### Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: TailwindCSS v4 + shadcn/ui
- **Auth**: NextAuth v5 (Credentials + OAuth ready)
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: SWR polling (Socket.IO ready)
- **Queue**: BullMQ + Redis
- **i18n**: Español (es-AR) por defecto

## 📋 Requisitos previos

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm o yarn

## 🛠️ Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone <repository-url>
cd social-inbox-saas
\`\`\`

### 2. Instalar dependencias

\`\`\`bash
npm install
\`\`\`

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa las variables:

\`\`\`bash
cp .env.example .env
\`\`\`

Edita `.env` con tus credenciales:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/social_inbox"
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="genera-un-secret-de-32-chars-minimo"
NEXTAUTH_URL="http://localhost:3000"

# Meta (Facebook & Instagram)
META_APP_ID="tu-app-id"
META_APP_SECRET="tu-app-secret"
META_VERIFY_TOKEN="tu-verify-token"

# WhatsApp Business Cloud API
WHATSAPP_TOKEN="tu-whatsapp-token"
WHATSAPP_PHONE_ID="tu-phone-id"
WHATSAPP_BUSINESS_ID="tu-business-id"

# TikTok Business
TIKTOK_APP_ID="tu-tiktok-app-id"
TIKTOK_APP_SECRET="tu-tiktok-app-secret"

# Webhook Security
WEBHOOK_SECRET="tu-webhook-secret"
\`\`\`

### 4. Configurar la base de datos

\`\`\`bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de prueba
npm run db:seed
\`\`\`

### 5. Iniciar Redis

\`\`\`bash
# Con Docker
docker run -d -p 6379:6379 redis:7-alpine

# O con Redis instalado localmente
redis-server
\`\`\`

### 6. Iniciar el servidor de desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:3000`

## 👤 Credenciales de prueba

Después de ejecutar el seed, puedes usar estas credenciales:

- **Admin**: `admin@demo.com` / `admin123`
- **Agent**: `agent@demo.com` / `agent123`
- **Viewer**: `viewer@demo.com` / `viewer123`

## 🔗 Configurar Webhooks

Para recibir mensajes de las plataformas, necesitas exponer tu servidor local:

### Usando ngrok

\`\`\`bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto 3000
ngrok http 3000
\`\`\`

Copia la URL de ngrok (ej: `https://abc123.ngrok.io`) y configura los webhooks:

### Instagram & Facebook

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu app
3. Ve a Webhooks → Configurar
4. URL de callback: `https://tu-url.ngrok.io/api/webhooks/meta`
5. Token de verificación: el valor de `META_VERIFY_TOKEN` en tu `.env`
6. Suscríbete a los eventos: `messages`, `messaging_postbacks`

### WhatsApp Business

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Selecciona tu app de WhatsApp
3. Ve a Configuración → Webhooks
4. URL de callback: `https://tu-url.ngrok.io/api/webhooks/whatsapp`
5. Token de verificación: el valor de `META_VERIFY_TOKEN` en tu `.env`
6. Suscríbete a los eventos: `messages`

### TikTok

1. Ve a [TikTok for Developers](https://developers.tiktok.com/)
2. Configura el webhook en tu app
3. URL de callback: `https://tu-url.ngrok.io/api/webhooks/tiktok`

## 📁 Estructura del proyecto

\`\`\`
social-inbox-saas/
├── app/
│   ├── (auth)/              # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── app/                 # Aplicación principal
│   │   ├── [tenantId]/
│   │   │   ├── inbox/       # Bandeja de entrada
│   │   │   ├── analytics/   # Dashboard de analytics
│   │   │   ├── contacts/    # Gestión de contactos
│   │   │   ├── locals/      # Gestión de locales
│   │   │   └── settings/    # Configuración
│   │   └── select-tenant/   # Selector de empresa
│   ├── actions/             # Server actions
│   └── api/                 # API routes
│       └── webhooks/        # Endpoints de webhooks
├── components/
│   ├── auth/                # Componentes de autenticación
│   ├── inbox/               # Componentes de inbox
│   ├── analytics/           # Componentes de analytics
│   ├── layout/              # Layout components
│   ├── settings/            # Componentes de configuración
│   ├── tenant/              # Componentes de tenant
│   └── ui/                  # Componentes UI (shadcn)
├── lib/
│   ├── adapters/            # Adapters de canales
│   │   ├── meta-instagram-adapter.ts
│   │   ├── meta-facebook-adapter.ts
│   │   ├── whatsapp-cloud-adapter.ts
│   │   ├── tiktok-adapter.ts
│   │   └── mock-adapter.ts
│   ├── auth-utils.ts        # Utilidades de autenticación
│   ├── env.ts               # Validación de variables de entorno
│   ├── prisma.ts            # Cliente Prisma
│   ├── queue.ts             # BullMQ queue
│   ├── sla.ts               # Cálculo de SLA
│   └── utils.ts             # Utilidades generales
├── prisma/
│   ├── schema.prisma        # Schema de base de datos
│   └── seed.ts              # Script de seed
├── auth.ts                  # Configuración de NextAuth
├── auth.config.ts           # Config de NextAuth
├── middleware.ts            # Middleware de autenticación
└── package.json
\`\`\`

## 🔧 Scripts disponibles

\`\`\`bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Ejecutar linter

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Push schema a DB (dev)
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Poblar con datos de prueba
npm run db:studio        # Abrir Prisma Studio
\`\`\`

## 🏗️ Arquitectura

### Multi-tenancy

El sistema implementa multi-tenancy a nivel de base de datos:

- **Tenant**: Representa una empresa
- **Local**: Representa una sucursal de la empresa
- **Membership**: Relaciona usuarios con tenants y define roles

Todas las consultas incluyen filtros por `tenantId` para garantizar aislamiento de datos.

### Channel Adapters

Cada plataforma tiene su propio adapter que implementa:

- `subscribeWebhooks()`: Suscribirse a webhooks
- `ingestWebhook()`: Procesar webhooks entrantes
- `sendMessage()`: Enviar mensajes salientes
- `listThreads()`: Listar conversaciones
- `verifyWebhook()`: Verificar firma de webhook

### Message Queue

Los mensajes salientes se procesan mediante BullMQ:

1. El mensaje se guarda en la base de datos
2. Se encola un job en Redis
3. Un worker procesa el job y llama al adapter
4. Se actualiza el estado del mensaje (entregado/fallido)

### SLA Tracking

El sistema calcula automáticamente:

- Tiempo de primera respuesta
- Estado del SLA (ok/warning/breached)
- Tiempo restante/vencido

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Validación de webhooks con firmas
- Separación de datos por tenant
- Roles y permisos por usuario
- Variables de entorno para secretos
- Sanitización de inputs con Zod

## 📊 Analytics

El dashboard de analytics muestra:

- Total de conversaciones
- Conversaciones abiertas/cerradas
- Tasa de respuesta
- Volumen de mensajes
- Distribución por canal
- Distribución por agente
- Filtros por fecha, local y canal

## 🚀 Deployment

### Vercel (Recomendado)

1. Push tu código a GitHub
2. Importa el proyecto en Vercel
3. Configura las variables de entorno
4. Conecta una base de datos PostgreSQL (Vercel Postgres, Neon, Supabase)
5. Conecta Redis (Upstash Redis)
6. Deploy

### Docker

\`\`\`bash
# Build
docker build -t social-inbox .

# Run
docker run -p 3000:3000 --env-file .env social-inbox
\`\`\`

## 🐛 Troubleshooting

### Error: "Invalid environment variables"

Verifica que todas las variables requeridas en `.env` estén configuradas correctamente.

### Webhooks no funcionan

1. Verifica que ngrok esté corriendo
2. Verifica que la URL de webhook esté correctamente configurada en las plataformas
3. Revisa los logs del servidor para ver errores
4. Verifica que el `VERIFY_TOKEN` coincida

### Mensajes no se envían

1. Verifica que Redis esté corriendo
2. Revisa los logs de BullMQ
3. Verifica las credenciales de las APIs
4. Revisa la tabla `messages` para ver el `failedReason`

## 📝 Roadmap

- [ ] Socket.IO para real-time bidireccional
- [ ] Chatbots con IA
- [ ] Flujos de aprobación de plantillas de WhatsApp
- [ ] Integraciones CRM (Salesforce, HubSpot)
- [ ] Análisis de sentiment
- [ ] Exportación de reportes
- [ ] Notificaciones push
- [ ] App móvil

## 📄 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Soporte

Para soporte, abre un issue en GitHub o contacta a [tu-email@example.com]

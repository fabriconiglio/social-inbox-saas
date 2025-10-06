# 🎨 Modo Preview - Datos Mock

Esta aplicación está configurada en **modo preview** para que puedas ver el diseño y la interfaz sin necesidad de configurar la base de datos ni las integraciones.

## ¿Qué está mockeado?

Todos los datos que ves en la aplicación son datos de ejemplo (mock data) que simulan una empresa real con:

- **2 sucursales**: Sucursal Centro y Sucursal Norte
- **4 canales**: Instagram, WhatsApp, Facebook, TikTok
- **3 usuarios**: Admin, María García (agente), Carlos López (agente)
- **5 conversaciones activas** con mensajes reales en español
- **5 contactos** con información completa
- **Métricas de analytics** con datos realistas
- **Configuración de SLA** con políticas de ejemplo

## Páginas disponibles

Puedes navegar por todas las páginas de la aplicación:

- **📥 Inbox** (`/app/tenant-1/inbox`) - Bandeja de entrada unificada con conversaciones
- **📊 Analytics** (`/app/tenant-1/analytics`) - Dashboard con métricas y gráficos
- **👥 Contactos** (`/app/tenant-1/contacts`) - Lista de contactos con información
- **🏢 Locales** (`/app/tenant-1/locals`) - Gestión de sucursales y canales
- **⚙️ Configuración SLA** (`/app/tenant-1/settings/sla`) - Políticas de nivel de servicio

## Características visibles

✅ **Interfaz completa** - Todos los componentes UI están funcionales
✅ **Diseño responsive** - Optimizado para desktop y móvil
✅ **Datos realistas** - Conversaciones y métricas en español
✅ **Navegación fluida** - Sidebar, filtros, y transiciones
✅ **Mensajes en tiempo real** - Simulación de polling con SWR
✅ **Gráficos interactivos** - Charts con Recharts

## ⚠️ Limitaciones del modo preview

❌ **No hay autenticación** - No puedes iniciar sesión
❌ **No se guardan cambios** - Los datos son estáticos
❌ **No hay webhooks reales** - No se reciben mensajes de redes sociales
❌ **No se envían mensajes** - El composer es solo visual

## 🚀 Para usar en producción

Para activar la funcionalidad completa:

1. **Configura la base de datos**:
   \`\`\`bash
   # Edita .env con tu DATABASE_URL
   npx prisma db push
   npx prisma db seed
   \`\`\`

2. **Descomenta el código original** en cada archivo:
   - Busca los comentarios `// Original database code`
   - Elimina el código mock y descomenta el código de producción

3. **Configura las integraciones**:
   - Agrega tokens de Meta, WhatsApp, TikTok en `.env`
   - Configura Redis para BullMQ
   - Configura NextAuth con tu secret

4. **Despliega en Vercel**:
   - Haz clic en "Publish" en la esquina superior derecha
   - Configura las variables de entorno en Vercel
   - Conecta tu base de datos PostgreSQL

---

**Nota**: Este modo preview está diseñado para que puedas evaluar el diseño y la arquitectura de la aplicación antes de configurar todos los servicios externos.

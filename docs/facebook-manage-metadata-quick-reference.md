# Referencia Rápida - Formulario pages_manage_metadata

Este es un resumen rápido del contenido necesario para completar el formulario de Facebook para `pages_manage_metadata`.

---

## Información Necesaria Antes de Comenzar

Completa estos campos antes de llenar el formulario:

- [ ] **URL de la aplicación**: `_________________________`
- [ ] **Nombre exacto de la app en Facebook Developers**: `_________________________`
- [ ] **Email de contacto para soporte**: `_________________________`
- [ ] **Página de Facebook para pruebas**: `_________________________`
- [ ] **Credenciales de prueba** (si aplica): `_________________________`

---

## Sección 1: Descripción Detallada

**Ubicación en formulario**: Campo de texto grande "Proporciona una descripción detallada..."

**Fuente**: Ver `facebook-pages-manage-metadata-request.md` - Sección 1

**Longitud**: ~1,200 palabras

**Puntos clave a incluir**:
- Propósito de la aplicación (SaaS multi-tenant para gestión de mensajes)
- Uso específico de pages_manage_metadata:
  - Suscripción y recepción de webhooks
  - Gestión de configuraciones de página
  - Procesamiento de eventos de mensajería
  - Gestión de metadatos de página
- Valor para usuarios (tiempo real, confiabilidad, sincronización automática)
- Por qué es necesario (esencial para webhooks y gestión de configuraciones)

---

## Sección 2: Grabación de Pantalla

**Ubicación en formulario**: Área de arrastrar y soltar archivo

**Requisitos**:
- Duración: 2-3 minutos
- Calidad: Mínimo 720p (1080p recomendado)
- Formato: MP4 o MOV
- Audio: Opcional pero recomendado

**Secuencias a mostrar**:
1. Pantalla inicial (0:00-0:15)
2. Conexión de canal ingresando Page ID y Access Token manualmente (0:15-0:50)
3. Verificación de webhooks en Facebook Developers (0:50-1:10)
4. Recepción de mensaje entrante vía webhook (1:10-1:40)
5. Procesamiento automático de eventos (1:40-2:00)
6. Gestión de configuraciones (2:00-2:30)

**Guía completa**: Ver `facebook-pages-manage-metadata-request.md` - Sección 2

**IMPORTANTE**: La grabación debe demostrar claramente:
- Que los webhooks funcionan en tiempo real
- La configuración de webhooks en Facebook Developers
- Que los mensajes aparecen automáticamente sin refrescar

---

## Sección 3: Checkbox de Confirmación

**Ubicación en formulario**: Checkbox al final del formulario

**Texto**: "Si se aprueba, confirmo que cualquier información que reciba a través de pages_manage_metadata se usará de acuerdo con el uso permitido."

**Acción**: ✅ MARCAR antes de enviar

---

## Checklist Final

Antes de hacer clic en "Guardar":

- [ ] Descripción detallada copiada y revisada
- [ ] Grabación de pantalla lista (MP4/MOV, 720p+, 2-3 min)
  - [ ] Muestra configuración de webhooks
  - [ ] Demuestra recepción en tiempo real
  - [ ] Muestra gestión de configuraciones
- [ ] Checkbox de confirmación marcado
- [ ] Todo revisado para errores ortográficos
- [ ] Información de contacto completada (si se solicita)

---

## Documentos de Referencia

1. **`facebook-pages-manage-metadata-request.md`**: Contenido completo formateado para copiar y pegar
2. **`facebook-manage-metadata-quick-reference.md`**: Este documento (referencia rápida)

---

## Tips Importantes

1. **Enfócate en webhooks**: Este permiso se usa principalmente para webhooks, así que asegúrate de demostrarlo claramente en el video
2. **Muestra Facebook Developers**: Incluye una sección mostrando la configuración de webhooks en Facebook Developers para demostrar el uso del permiso
3. **Tiempo real es clave**: Demuestra que los mensajes aparecen automáticamente sin necesidad de refrescar la página
4. **No uses test users** para recibir mensajes - Facebook no permite que bots envíen mensajes a test users
5. **Usa una cuenta real** con rol de "evaluator" asignado en la app
6. **Prepara la grabación ANTES** de comenzar a llenar el formulario
7. **Guarda progreso frecuentemente** - el formulario puede tener auto-guardado, pero no confíes en ello

---

## Diferencia con pages_messaging

**pages_messaging**:
- Permite enviar y recibir mensajes directamente
- Enfoque: Comunicación bidireccional

**pages_manage_metadata**:
- Permite suscribirse a webhooks y gestionar configuraciones
- Enfoque: Infraestructura y gestión de integración

**Ambos son necesarios** para una integración completa de Facebook Messenger.

---

## Tiempo Estimado

- Leer documentos: 10 minutos
- Preparar grabación (con demostración de webhooks): 45-60 minutos
- Completar formulario: 15-20 minutos
- **Total**: ~1.5 horas

---

## Próximos Pasos Después del Envío

1. Facebook revisará la solicitud (puede tardar varios días)
2. Pueden solicitar información adicional sobre cómo se gestionan los webhooks
3. Si se aprueba, recibirás notificación por email
4. Si se rechaza, revisa los comentarios y corrige los problemas

---

**Última actualización**: `[COMPLETAR: Fecha]`


# Referencia Rápida - Formulario pages_read_engagement

Este es un resumen rápido del contenido necesario para completar el formulario de Facebook para `pages_read_engagement`.

**IMPORTANTE**: El formulario indica que "La solicitud debe contener pages_show_list para usar pages_read_engagement". Asegúrate de que tu app también solicite ese permiso.

---

## Información Necesaria Antes de Comenzar

Completa estos campos antes de llenar el formulario:

- [ ] **URL de la aplicación**: `_________________________`
- [ ] **Nombre exacto de la app en Facebook Developers**: `_________________________`
- [ ] **Email de contacto para soporte**: `_________________________`
- [ ] **Página de Facebook para pruebas**: `_________________________`
- [ ] **Credenciales de prueba** (si aplica): `_________________________`
- [ ] **Verificar que la app también solicita `pages_show_list`**: `[ ]`

---

## Sección 1: Descripción Detallada

**Ubicación en formulario**: Campo de texto grande "Proporciona una descripción detallada..."

**Fuente**: Ver `facebook-pages-read-engagement-request.md` - Sección 1

**Longitud**: ~1,200 palabras

**Puntos clave a incluir**:
- Propósito de la aplicación (SaaS multi-tenant para gestión de mensajes)
- Uso específico de pages_read_engagement:
  - Lectura de metadatos de página (validación de credenciales)
  - Lectura de datos de seguidores/contactos (nombre, PSID, foto de perfil)
  - Analytics y estadísticas de página
  - Validación y verificación de credenciales
- Valor para usuarios (identificación mejorada, experiencia visual, analytics completos)
- Por qué es necesario (esencial para mostrar información de contactos y validar credenciales)

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
2. Conexión de canal y validación usando pages_read_engagement (0:15-0:45)
3. Recepción de mensaje y lectura de datos de contacto (0:45-1:20)
4. Visualización de información de contacto (1:20-1:45)
5. Analytics y estadísticas (1:45-2:15)
6. Resumen (2:15-2:30)

**Guía completa**: Ver `facebook-pages-read-engagement-request.md` - Sección 2

**IMPORTANTE**: La grabación debe demostrar claramente:
- Que se lee información de contactos/seguidores (nombre, foto de perfil)
- Que se usa para validar credenciales leyendo metadatos de la página
- Que se accede a estadísticas agregadas de la página

---

## Sección 3: Checkbox de Confirmación

**Ubicación en formulario**: Checkbox al final del formulario

**Texto**: "Si se aprueba, confirmo que cualquier información que reciba a través de pages_read_engagement se usará de acuerdo con el uso permitido."

**Acción**: ✅ MARCAR antes de enviar

---

## Checklist Final

Antes de hacer clic en "Guardar":

- [ ] Descripción detallada copiada y revisada
- [ ] Grabación de pantalla lista (MP4/MOV, 720p+, 2-3 min)
  - [ ] Muestra lectura de información de contactos (nombre, foto)
  - [ ] Demuestra validación de credenciales
  - [ ] Muestra acceso a estadísticas
- [ ] Checkbox de confirmación marcado
- [ ] Verificado que la app también solicita `pages_show_list` (requisito mencionado en el formulario)
- [ ] Todo revisado para errores ortográficos
- [ ] Información de contacto completada (si se solicita)

---

## Documentos de Referencia

1. **`facebook-pages-read-engagement-request.md`**: Contenido completo formateado para copiar y pegar
2. **`facebook-read-engagement-quick-reference.md`**: Este documento (referencia rápida)

---

## Tips Importantes

1. **Enfócate en información de contactos**: Este permiso se usa principalmente para leer información de seguidores/contactos, así que asegúrate de demostrarlo claramente en el video
2. **Muestra nombres y fotos de perfil**: La grabación debe mostrar claramente cómo se obtienen y muestran nombres completos y fotos de perfil de los usuarios
3. **Validación de credenciales**: Muestra cómo se usa para validar que las credenciales son correctas leyendo metadatos básicos de la página
4. **No uses test users** para recibir mensajes - Facebook no permite que bots envíen mensajes a test users
5. **Usa una cuenta real** con rol de "evaluator" asignado en la app
6. **Prepara la grabación ANTES** de comenzar a llenar el formulario
7. **Verifica pages_show_list**: Asegúrate de que tu app también solicita `pages_show_list` si es necesario según el formulario

---

## Diferencia con otros permisos

**pages_messaging**:
- Permite enviar y recibir mensajes directamente
- Enfoque: Comunicación bidireccional

**pages_manage_metadata**:
- Permite suscribirse a webhooks y gestionar configuraciones
- Enfoque: Infraestructura y gestión de integración

**pages_read_engagement**:
- Permite leer información de la página, seguidores y estadísticas
- Enfoque: Información de contactos y analytics

**pages_show_list**:
- Requerido para usar pages_read_engagement según el formulario
- Permite listar las páginas del usuario

**Todos son necesarios** para una integración completa de Facebook Messenger.

---

## Tiempo Estimado

- Leer documentos: 10 minutos
- Preparar grabación (con demostración de lectura de información de contactos): 45-60 minutos
- Completar formulario: 15-20 minutos
- **Total**: ~1.5 horas

---

## Próximos Pasos Después del Envío

1. Facebook revisará la solicitud (puede tardar varios días)
2. Pueden solicitar información adicional sobre cómo se usa la información de seguidores
3. Si se aprueba, recibirás notificación por email
4. Si se rechaza, revisa los comentarios y corrige los problemas

---

**Última actualización**: `[COMPLETAR: Fecha]`


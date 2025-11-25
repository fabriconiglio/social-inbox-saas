# Referencia Rápida - Formulario pages_messaging

Este es un resumen rápido del contenido necesario para completar el formulario de Facebook.

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

**Fuente**: Ver `facebook-pages-messaging-request.md` - Sección 1

**Longitud**: ~1,500 palabras

**Puntos clave a incluir**:
- Propósito de la aplicación (SaaS multi-tenant para gestión de mensajes)
- Uso específico de pages_messaging (recepción, envío, gestión, analytics)
- Valor para usuarios (centralización, eficiencia, escalabilidad)
- Por qué es necesario (esencial para funcionalidad core)

---

## Sección 2: Instrucciones de Prueba

**Ubicación en formulario**: Campo de texto "Prueba y reproduce la funcionalidad..."

**Fuente**: Ver `facebook-pages-messaging-request.md` - Sección 2

**Formato**: Lista numerada paso a paso

**Pasos principales**:
1. Acceder a la aplicación
2. Conectar página de Facebook ingresando Page ID y Access Token manualmente
3. Verificar recepción de mensajes
4. Enviar mensaje de respuesta
5. Verificar en Messenger
6. Probar funcionalidades adicionales

**IMPORTANTE**: 
- Incluir nota sobre usar cuenta real con rol "evaluator", NO test users
- El usuario debe obtener el Page Access Token desde Facebook Developers antes de conectarlo
- El token debe tener los permisos pages_messaging y pages_manage_metadata

---

## Sección 3: Grabación de Pantalla

**Ubicación en formulario**: Área de arrastrar y soltar archivo

**Requisitos**:
- Duración: 2-3 minutos
- Calidad: Mínimo 720p (1080p recomendado)
- Formato: MP4 o MOV
- Audio: Opcional pero recomendado

**Secuencias a mostrar**:
1. Pantalla inicial (0:00-0:15)
2. Conexión de canal (0:15-0:45)
3. Recepción de mensaje (0:45-1:15)
4. Envío de respuesta (1:15-1:45)
5. Verificación en Messenger (1:45-2:15)
6. Funcionalidades adicionales (2:15-2:30)

**Guía completa**: Ver `facebook-pages-messaging-request.md` - Sección 3

---

## Sección 4: Dropdown de Página

**Ubicación en formulario**: "Selecciona una página ▾"

**Acción**: Seleccionar la página de Facebook que usarás para las pruebas

**Requisito**: La página debe estar conectada a tu app y tener permisos necesarios

---

## Sección 5: Checkbox de Confirmación

**Ubicación en formulario**: Checkbox al final del formulario

**Texto**: "Si se aprueba, confirmo que cualquier información que reciba a través de pages_messaging se usará de acuerdo con el uso permitido."

**Acción**: ✅ MARCAR antes de enviar

---

## Checklist Final

Antes de hacer clic en "Guardar":

- [ ] Descripción detallada copiada y revisada
- [ ] Instrucciones de prueba completadas con URL real
- [ ] Grabación de pantalla lista (MP4/MOV, 720p+, 2-3 min)
- [ ] Página seleccionada en el dropdown
- [ ] Checkbox de confirmación marcado
- [ ] Todo revisado para errores ortográficos
- [ ] Información de contacto completada (si se solicita)

---

## Documentos de Referencia

1. **`facebook-pages-messaging-request.md`**: Contenido completo formateado para copiar y pegar
2. **`facebook-test-instructions.md`**: Instrucciones detalladas para el evaluador
3. **`facebook-form-quick-reference.md`**: Este documento (referencia rápida)

---

## Tips Importantes

1. **No uses test users** para recibir mensajes - Facebook no permite que bots envíen mensajes a test users
2. **Usa una cuenta real** con rol de "evaluator" asignado en la app
3. **Prepara la grabación ANTES** de comenzar a llenar el formulario
4. **Guarda progreso frecuentemente** - el formulario puede tener auto-guardado, pero no confíes en ello
5. **Revisa todo dos veces** antes de enviar - los cambios después del envío pueden ser complicados

---

## Tiempo Estimado

- Leer documentos: 10-15 minutos
- Preparar grabación: 30-45 minutos
- Completar formulario: 20-30 minutos
- **Total**: ~1.5 horas

---

## Próximos Pasos Después del Envío

1. Facebook revisará la solicitud (puede tardar varios días)
2. Pueden solicitar información adicional
3. Si se aprueba, recibirás notificación por email
4. Si se rechaza, revisa los comentarios y corrige los problemas

---

**Última actualización**: `[COMPLETAR: Fecha]`


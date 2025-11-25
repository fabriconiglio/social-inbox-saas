# Instrucciones Detalladas para Evaluador - Facebook Messenger Integration

Este documento proporciona instrucciones detalladas paso a paso para que **el evaluador de Facebook** pueda probar la integración de `pages_messaging` en MessageHub.

**NOTA IMPORTANTE**: Estas instrucciones son para el evaluador de Facebook que revisará tu solicitud. Tú (como desarrollador) puedes hacer las pruebas desde tu cuenta de administrador normal. El evaluador necesitará una cuenta con rol de "evaluator" asignado en tu app.

---

## Información de Acceso

**URL de la aplicación**: `[COMPLETAR: URL de producción o staging]`

**Credenciales de prueba** (si aplica):
- Email: `[COMPLETAR]`
- Contraseña: `[COMPLETAR]`

**Página de Facebook para pruebas**: `[COMPLETAR: Nombre de la página]`

**Contacto para soporte**: `[COMPLETAR: Email]`

---

## Requisitos Previos para el Evaluador

1. **Cuenta de Facebook con rol de evaluator**: 
   - El evaluador de Facebook necesitará una cuenta de Facebook que tenga el rol de "evaluator" asignado en la sección "Roles de la app" del panel de Facebook Developers
   - **IMPORTANTE**: Como desarrollador, debes asignar el rol de "evaluator" a la cuenta de Facebook del evaluador antes de que comience las pruebas
   - NO usar test users creados en "Roles de la app" para recibir mensajes (los test users no pueden recibir mensajes de bots)

2. **Página de Facebook**:
   - El evaluador debe tener acceso a una página de Facebook para realizar las pruebas
   - Debe conocer el Page ID de la página
   - Debe tener acceso a Facebook Developers para generar un Page Access Token

3. **Page Access Token**:
   - El evaluador necesitará generar un Page Access Token con permisos `pages_messaging` y `pages_manage_metadata`
   - Se puede obtener desde Facebook Developers > Graph API Explorer
   - O desde la configuración de la app en Facebook Developers

4. **Navegador**:
   - Usar Chrome, Firefox o Safari actualizado

---

## Paso 1: Acceder a la Aplicación

1. Abrir el navegador web
2. Navegar a: `[COMPLETAR: URL de la aplicación]`
3. Si es necesario, iniciar sesión con las credenciales proporcionadas
4. Si la aplicación requiere seleccionar un tenant/empresa:
   - Seleccionar un tenant existente o crear uno nuevo
   - Continuar al dashboard principal

**Resultado esperado**: Deberías ver el dashboard principal de MessageHub con la bandeja de entrada o menú de navegación.

---

## Paso 2: Conectar Página de Facebook Messenger

1. **Navegar a la sección de Canales**:
   - Buscar en el menú lateral o superior la opción "Canales", "Channels", o "Configuración" > "Canales"
   - Hacer clic en la opción correspondiente

2. **Iniciar conexión**:
   - Buscar el botón "Conectar Canal", "Agregar Canal", "+ Nuevo Canal" o similar
   - Hacer clic en el botón

3. **Seleccionar tipo de canal**:
   - Deberías ver una lista o modal con opciones de canales (Facebook, Instagram, WhatsApp, TikTok)
   - Seleccionar "Facebook Messenger" o "Facebook"

4. **Seleccionar local/sucursal** (si aplica):
   - Si la aplicación requiere seleccionar un local/sucursal, elegir uno de la lista
   - Si no hay locales, crear uno nuevo o usar el predeterminado

5. **Ingresar credenciales manualmente**:
   - **Page ID**: Ingresar el ID de la página de Facebook
     - Se puede obtener desde: Configuración de la página > Información de la página > ID de la página
     - O desde la URL de la página: facebook.com/[PAGE_ID]
   - **Access Token**: Ingresar el Page Access Token
     - Se puede obtener desde Facebook Developers > Graph API Explorer
     - Seleccionar la app y la página
     - Generar token con permisos: `pages_messaging` y `pages_manage_metadata`
     - Copiar el token generado y pegarlo en el campo correspondiente
   - **Nombre del canal**: Ingresar un nombre descriptivo para identificar este canal

6. **Validar credenciales** (opcional pero recomendado):
   - Hacer clic en el botón "Validar" si está disponible
   - Verificar que aparezca un mensaje de éxito indicando que las credenciales son válidas
   - Si hay errores, corregir las credenciales antes de continuar

7. **Completar conexión**:
   - Hacer clic en "Conectar", "Guardar" o botón similar
   - Deberías ver un mensaje de éxito
   - La página debe aparecer en la lista de canales conectados

**Resultado esperado**: La página de Facebook debe aparecer en la lista de canales con estado "Conectado", "Activo", o similar. Debe mostrar el nombre del canal y posiblemente el Page ID.

---

## Paso 3: Verificar Recepción de Mensajes Entrantes

### Preparación:
1. Abrir otra ventana del navegador o usar un dispositivo móvil
2. Acceder a Facebook Messenger (messenger.com o app móvil)
3. Buscar la página de Facebook que acabas de conectar
4. Iniciar una conversación con la página

### Enviar mensaje de prueba:
1. Escribir un mensaje de prueba, por ejemplo: "Hola, quisiera información sobre sus productos"
2. Enviar el mensaje
3. Esperar 5-10 segundos para que el webhook procese el mensaje

### Verificar en MessageHub:
1. Volver a la ventana de MessageHub
2. Navegar a la "Bandeja de Entrada" o "Inbox"
3. Buscar el mensaje que acabas de enviar
4. El mensaje debería aparecer automáticamente (puede requerir refrescar la página si no hay actualización en tiempo real)

**Verificaciones específicas**:
- [ ] El mensaje aparece en la lista de conversaciones
- [ ] El contenido del mensaje es correcto
- [ ] Se muestra el remitente (nombre o ID)
- [ ] Se muestra la fecha y hora de recepción
- [ ] El estado de la conversación es "Nueva" o "Abierta"

**Resultado esperado**: El mensaje enviado desde Messenger debe aparecer en MessageHub con todos los detalles correctos.

---

## Paso 4: Enviar Mensaje de Respuesta

1. **Seleccionar la conversación**:
   - En la bandeja de entrada, hacer clic en la conversación que contiene el mensaje entrante
   - Se abrirá el panel de detalles de la conversación

2. **Verificar vista de mensajes**:
   - Deberías ver el mensaje entrante en el historial de mensajes
   - Debe haber un área de composición de mensajes (textarea o editor)

3. **Escribir respuesta**:
   - En el área de composición, escribir una respuesta de prueba, por ejemplo: "¡Hola! Gracias por contactarnos. Estaremos encantados de ayudarte."
   - Opcionalmente, si hay opción de adjuntar archivos, adjuntar una imagen de prueba

4. **Enviar mensaje**:
   - Hacer clic en el botón "Enviar" o presionar Enter
   - El mensaje debería aparecer en el historial de la conversación
   - Debería mostrar un estado como "Enviado", "Entregado", o un indicador de estado

5. **Verificar en Messenger**:
   - Volver a la ventana/dispositivo donde está abierto Messenger
   - Refrescar la conversación si es necesario
   - El mensaje enviado desde MessageHub debe aparecer en la conversación

**Verificaciones específicas**:
- [ ] El mensaje se envía sin errores
- [ ] El mensaje aparece en el historial de MessageHub
- [ ] El mensaje se entrega correctamente en Messenger
- [ ] El formato del mensaje es correcto (texto, imágenes si se adjuntaron)
- [ ] El estado del mensaje se actualiza correctamente

**Resultado esperado**: El mensaje enviado desde MessageHub debe aparecer en Messenger y viceversa, demostrando comunicación bidireccional.

---

## Paso 5: Probar Funcionalidades Adicionales

### 5.1 Asignación de Conversaciones

1. En la vista de la conversación, buscar la opción de "Asignar" o "Assign"
2. Seleccionar un agente de la lista (o tu propio usuario si está disponible)
3. Verificar que la conversación aparece asignada al agente seleccionado
4. Verificar que la conversación aparece en la lista de conversaciones asignadas del agente

**Resultado esperado**: La conversación debe poder asignarse a agentes específicos.

### 5.2 Cambio de Estados

1. En la vista de la conversación, buscar opciones de estado (Abierta, Pendiente, Cerrada, etc.)
2. Cambiar el estado de la conversación
3. Verificar que el estado se actualiza en la interfaz
4. Verificar que la conversación aparece filtrada correctamente según su estado

**Resultado esperado**: Los estados de conversación deben poder cambiarse y filtrarse.

### 5.3 Filtros y Búsqueda

1. En la bandeja de entrada, buscar opciones de filtro
2. Probar filtrar por:
   - Canal (Facebook Messenger)
   - Estado (Abierta, Cerrada, etc.)
   - Agente asignado
   - Fecha
3. Probar la función de búsqueda si está disponible
4. Verificar que los resultados se filtran correctamente

**Resultado esperado**: Los filtros y búsqueda deben funcionar correctamente.

### 5.4 Analytics (si está disponible)

1. Navegar a la sección de "Analytics" o "Dashboard"
2. Verificar que se muestran métricas relacionadas con:
   - Mensajes de Facebook Messenger
   - Tiempos de respuesta
   - Volumen de conversaciones
3. Verificar que los datos son consistentes con las acciones realizadas

**Resultado esperado**: Los analytics deben mostrar datos relevantes sobre el uso de Messenger.

---

## Problemas Comunes y Soluciones

### El mensaje no aparece en MessageHub después de enviarlo desde Messenger

**Posibles causas**:
- El webhook no está configurado correctamente en Facebook Developers
- El webhook no está suscrito a los eventos necesarios
- Hay un error en el procesamiento del webhook

**Solución**:
- Verificar en Facebook Developers que el webhook está configurado y activo
- Verificar que está suscrito a los eventos "messages" y "messaging_postbacks"
- Revisar los logs del servidor si están disponibles

### No puedo enviar mensajes desde MessageHub

**Posibles causas**:
- El Page Access Token no tiene los permisos necesarios
- El token ha expirado
- Hay un error en la API de Facebook

**Solución**:
- Verificar que el token tiene el permiso `pages_messaging`
- Intentar reconectar el canal para obtener un nuevo token
- Verificar los logs de error si están disponibles

### El flujo OAuth no funciona

**Posibles causas**:
- La app no está configurada correctamente en Facebook Developers
- Los permisos solicitados no están aprobados
- Hay un problema con la URL de redirección

**Solución**:
- Verificar la configuración de OAuth en Facebook Developers
- Verificar que la URL de redirección es correcta
- Asegurarse de que los permisos están solicitados correctamente

---

## Checklist de Verificación Final

Antes de completar la evaluación, verifica:

- [ ] Puedo acceder a la aplicación sin problemas
- [ ] Puedo conectar una página de Facebook mediante OAuth
- [ ] Los mensajes entrantes de Messenger aparecen en MessageHub
- [ ] Puedo enviar mensajes desde MessageHub que llegan a Messenger
- [ ] La comunicación bidireccional funciona correctamente
- [ ] Las funcionalidades adicionales (asignación, estados, filtros) funcionan
- [ ] No hay errores visibles en la interfaz
- [ ] La experiencia de usuario es fluida y clara

---

## Notas Adicionales

- Si encuentras algún problema durante las pruebas, documenta el error específico y los pasos para reproducirlo
- Toma capturas de pantalla de cualquier error o comportamiento inesperado
- Si la aplicación tiene modo de prueba o sandbox, úsalo si está disponible
- Si hay documentación adicional disponible, consúltala para entender mejor la funcionalidad

---

## Contacto para Soporte

Si tienes preguntas o problemas durante la evaluación, contacta a:

**Email**: `[COMPLETAR: Email de contacto]`

**Horario de atención**: `[COMPLETAR si aplica]`

---

## Nota para el Desarrollador

**Estas instrucciones son para el evaluador de Facebook, no para ti como desarrollador.**

Como desarrollador:
- Puedes hacer todas las pruebas desde tu cuenta de administrador normal
- No necesitas el rol de "evaluator" para tus propias pruebas
- Solo necesitas asignar el rol de "evaluator" a la cuenta del evaluador de Facebook cuando te lo soliciten

El rol de "evaluator" es necesario únicamente para que Facebook pueda revisar tu solicitud de permiso de forma independiente.

**Para asignar el rol de evaluator**: Consulta la guía `facebook-assign-evaluator-role.md` que explica paso a paso cómo hacerlo en Facebook Developers.

---

**Última actualización**: `[COMPLETAR: Fecha]`


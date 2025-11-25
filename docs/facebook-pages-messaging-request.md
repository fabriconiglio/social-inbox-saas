# Formulario de Solicitud pages_messaging - Contenido Completo

Este documento contiene todo el contenido necesario para completar el formulario de solicitud del permiso `pages_messaging` de Facebook.

---

## 1. Descripción Detallada del Uso del Permiso

**Sección**: "Proporciona una descripción detallada del modo en que la app usa el permiso o la función solicitados..."

### Contenido para copiar y pegar:

```
MessageHub es una plataforma SaaS multi-tenant diseñada para centralizar y gestionar mensajes de atención al cliente provenientes de múltiples canales de redes sociales, incluyendo Facebook Messenger, Instagram Direct Messages, WhatsApp Business y TikTok.

USO ESPECÍFICO DEL PERMISO pages_messaging:

El permiso pages_messaging es fundamental para el funcionamiento de nuestra aplicación, ya que lo utilizamos para:

1. RECEPCIÓN DE MENSAJES ENTRANTES:
   - Recibir mensajes de clientes en tiempo real a través de webhooks de Facebook Messenger
   - Procesar y almacenar automáticamente todos los mensajes entrantes en nuestra base de datos
   - Notificar a los agentes asignados cuando llegan nuevos mensajes que requieren atención

2. ENVÍO DE MENSAJES SALIENTES:
   - Permitir a los agentes de atención al cliente responder mensajes de Facebook Messenger directamente desde nuestra plataforma unificada
   - Enviar respuestas a través de la Graph API de Facebook (endpoint: /{page-id}/messages)
   - Soportar envío de mensajes de texto, imágenes y archivos adjuntos
   - Gestionar el estado de entrega de los mensajes (enviado, entregado, leído)

3. GESTIÓN DE CONVERSACIONES:
   - Agrupar mensajes en conversaciones (threads) para facilitar el seguimiento
   - Asignar conversaciones a agentes específicos del equipo de atención al cliente
   - Gestionar estados de conversación (abierta, pendiente, cerrada)
   - Mantener un historial completo de todas las interacciones con cada cliente

4. TRACKING Y ANALYTICS:
   - Calcular tiempos de primera respuesta y cumplimiento de SLA (Service Level Agreement)
   - Generar métricas de rendimiento del equipo de atención al cliente
   - Proporcionar analytics sobre volumen de mensajes, tiempos de respuesta y satisfacción

VALOR PARA LOS USUARIOS:

Nuestra aplicación proporciona un valor significativo a las empresas que gestionan atención al cliente:

- CENTRALIZACIÓN: Permite gestionar mensajes de Facebook Messenger junto con otros canales (Instagram, WhatsApp, TikTok) desde una única interfaz, eliminando la necesidad de cambiar entre múltiples plataformas

- EFICIENCIA OPERATIVA: Los equipos de atención al cliente pueden responder más rápido y gestionar más conversaciones simultáneamente gracias a la interfaz unificada y las herramientas de asignación

- VISIBILIDAD Y CONTROL: Los administradores pueden monitorear el rendimiento del equipo, asignar conversaciones según la carga de trabajo y asegurar que se cumplan los tiempos de respuesta acordados

- ESCALABILIDAD: Soporta empresas con múltiples sucursales (locales), permitiendo que cada sucursal gestione sus propios canales de Messenger mientras mantiene visibilidad centralizada

- MEJORA CONTINUA: Los analytics y métricas ayudan a identificar áreas de mejora en el servicio al cliente

POR QUÉ ES NECESARIO:

El permiso pages_messaging es absolutamente esencial para nuestra aplicación porque:

- Sin este permiso, nuestra aplicación no puede recibir mensajes entrantes de Facebook Messenger, lo que impediría completamente la funcionalidad de recepción de mensajes

- Sin este permiso, nuestra aplicación no puede enviar respuestas a los clientes, lo que haría imposible que los agentes respondan desde nuestra plataforma

- Este permiso es el único mecanismo oficial proporcionado por Facebook para integrar Messenger en aplicaciones de terceros para gestión de atención al cliente

- Es necesario para cumplir con las expectativas de los usuarios de nuestra plataforma, que requieren poder gestionar todos sus canales de mensajería desde un solo lugar

- Permite a las empresas cumplir con sus compromisos de tiempo de respuesta (SLA) con los clientes que contactan a través de Messenger

USO DE DATOS:

Toda la información recibida a través de pages_messaging se utiliza exclusivamente para:
- Proporcionar el servicio de gestión de mensajes a nuestros clientes (empresas)
- Mejorar la experiencia de atención al cliente
- Generar analytics agregados y anónimos para nuestros clientes
- NO se utiliza para publicidad dirigida ni se comparte con terceros para fines publicitarios
- Se almacena de forma segura y se respeta la privacidad de los usuarios finales según las políticas de Facebook
```

---

## 2. Instrucciones Paso a Paso para Pruebas

**Sección**: "Prueba y reproduce la funcionalidad de tu integración"

### Contenido para copiar y pegar:

```
INSTRUCCIONES PARA PROBAR LA INTEGRACIÓN DE FACEBOOK MESSENGER

IMPORTANTE PARA EL EVALUADOR: Para probar esta integración, es necesario usar una cuenta real de Facebook (no un test user) que tenga el rol de "evaluator" asignado en la sección "Roles de la app" del panel de Facebook Developers. El desarrollador debe asignar este rol antes de que comiences las pruebas. NO se deben enviar mensajes a test users creados en "Roles de la app", ya que estos usuarios no pueden recibir mensajes de bots.

NOTA PARA EL DESARROLLADOR: Estas instrucciones son para el evaluador de Facebook. Tú puedes hacer las pruebas desde tu cuenta de administrador normal. Solo el evaluador necesita el rol de "evaluator".

PASO 1: Acceder a la aplicación
- Abrir el navegador y acceder a: [COMPLETAR: URL de tu aplicación en producción o staging]
- Iniciar sesión con las credenciales de prueba proporcionadas (o crear una cuenta de prueba)
- Si es necesario, seleccionar o crear un tenant (empresa) para las pruebas

PASO 2: Conectar una página de Facebook
- Navegar a la sección "Canales" o "Configuración" > "Canales"
- Hacer clic en el botón "Conectar Canal" o "Agregar Canal"
- Seleccionar "Facebook Messenger" como tipo de canal
- Seleccionar el local/sucursal donde se conectará el canal
- Ingresar el Page ID de la página de Facebook (se puede obtener desde la configuración de la página en Facebook)
- Ingresar el Access Token de la página (Page Access Token) que debe tener los permisos: pages_messaging y pages_manage_metadata
  - El token se puede obtener desde Facebook Developers > Graph API Explorer o desde la configuración de la app
  - Asegurarse de que el token tenga los permisos necesarios antes de ingresarlo
- Opcionalmente, hacer clic en "Validar" para verificar que las credenciales son correctas antes de conectar
- Hacer clic en "Conectar" o "Guardar" para completar la conexión
- Verificar que la página aparece como "Conectada" o "Activa" en la lista de canales

PASO 3: Verificar recepción de mensajes entrantes
- Desde otra cuenta de Facebook (o desde Messenger en móvil), enviar un mensaje a la página de Facebook conectada
- El mensaje debe aparecer automáticamente en la bandeja de entrada de MessageHub
- Verificar que el mensaje muestra:
  * El contenido del mensaje
  * El nombre o ID del remitente
  * La fecha y hora de recepción
  * El estado de la conversación (nueva, abierta, etc.)

PASO 4: Enviar un mensaje de respuesta
- Seleccionar la conversación que contiene el mensaje entrante
- En el área de composición de mensajes, escribir una respuesta de prueba
- Opcionalmente, adjuntar una imagen o archivo si la funcionalidad está disponible
- Hacer clic en "Enviar" o presionar Enter
- Verificar que el mensaje aparece en la interfaz como "enviado" o "entregado"
- Verificar en Messenger (desde la cuenta que envió el mensaje original) que la respuesta fue recibida correctamente

PASO 5: Probar funcionalidades adicionales
- ASIGNACIÓN: Asignar la conversación a un agente específico y verificar que aparece en su lista
- ESTADOS: Cambiar el estado de la conversación (abierta, pendiente, cerrada) y verificar que se actualiza
- FILTROS: Usar los filtros disponibles para buscar conversaciones por estado, agente, fecha, etc.
- ANALYTICS: Navegar a la sección de Analytics y verificar que se muestran métricas relacionadas con los mensajes de Messenger

PASO 6: Verificar en Facebook Messenger
- Abrir Messenger desde la cuenta que envió el mensaje original
- Confirmar que la respuesta enviada desde MessageHub aparece correctamente en la conversación
- Verificar que el formato del mensaje es correcto (texto, imágenes, etc.)

NOTAS ADICIONALES:
- Si hay problemas con la recepción de mensajes, verificar que el webhook está configurado correctamente en Facebook Developers
- Si hay problemas con el envío, verificar que el Page Access Token tiene los permisos necesarios
- Los mensajes pueden tardar unos segundos en aparecer debido al procesamiento asíncrono
```

**IMPORTANTE**: Reemplaza `[COMPLETAR: URL de tu aplicación...]` con la URL real de tu aplicación.

---

## 3. Guía para Grabación de Pantalla

**Sección**: "Sube una grabación de pantalla que muestre cómo la app usará el permiso o la función..."

### Contenido para referencia:

```
GUÍA PARA GRABACIÓN DE PANTALLA - pages_messaging

DURACIÓN RECOMENDADA: 2-3 minutos
CALIDAD MÍNIMA: 720p (1080p recomendado)
FORMATO: MP4 o MOV
AUDIO: Opcional pero recomendado (explicación en voz ayuda a entender el flujo)

SECUENCIAS A MOSTRAR (en orden):

1. INTRODUCCIÓN (0:00 - 0:15)
   - Mostrar la pantalla inicial de MessageHub
   - Explicar brevemente qué es la aplicación
   - Mostrar el dashboard o bandeja de entrada principal

2. CONEXIÓN DE CANAL (0:15 - 0:45)
   - Navegar a la sección de Canales
   - Mostrar la lista de canales disponibles
   - Hacer clic en "Conectar Canal" > "Facebook Messenger"
   - Mostrar el flujo OAuth de Facebook
   - Mostrar la selección de página de Facebook
   - Confirmar que la página aparece como conectada

3. RECEPCIÓN DE MENSAJE ENTRANTE (0:45 - 1:15)
   - Cambiar a otra ventana/navegador o dispositivo móvil
   - Mostrar cómo se envía un mensaje desde Messenger a la página conectada
   - Volver a MessageHub y mostrar cómo el mensaje aparece automáticamente en la bandeja de entrada
   - Mostrar los detalles del mensaje (remitente, contenido, timestamp)

4. ENVÍO DE RESPUESTA (1:15 - 1:45)
   - Seleccionar la conversación con el mensaje entrante
   - Mostrar el área de composición de mensajes
   - Escribir una respuesta de prueba
   - Hacer clic en "Enviar"
   - Mostrar el estado del mensaje (enviado/entregado)

5. VERIFICACIÓN EN MESSENGER (1:45 - 2:15)
   - Cambiar nuevamente a Messenger
   - Mostrar que la respuesta enviada desde MessageHub aparece correctamente en la conversación
   - Verificar que el formato es correcto

6. FUNCIONALIDADES ADICIONALES (2:15 - 2:30)
   - Mostrar rápidamente otras funcionalidades relevantes:
     * Asignación de conversaciones
     * Cambio de estados
     * Filtros y búsqueda
     * Analytics (si aplica)

CONSEJOS PARA LA GRABACIÓN:

- Usar un cursor visible y moverlo de forma clara y pausada
- Hacer zoom en áreas importantes si es necesario (especialmente durante el flujo OAuth)
- Asegurarse de que el texto es legible (tamaño de fuente adecuado)
- Evitar movimientos bruscos del mouse o cambios rápidos de ventana
- Si hay errores durante la grabación, es mejor reiniciar que intentar editarlos
- Considerar usar herramientas como OBS Studio, Loom, o la herramienta de grabación nativa del sistema operativo
- Probar la grabación antes de subirla para asegurarse de que el audio y video son claros
```

---

## 4. Información Adicional

### Campos a completar en el formulario:

- **URL de la aplicación**: `[COMPLETAR: URL de producción o staging]`
- **Credenciales de prueba** (si aplica):
  - Usuario: `[COMPLETAR si es necesario]`
  - Contraseña: `[COMPLETAR si es necesario]`
- **Contacto para soporte**: `[COMPLETAR: Email de contacto]`
- **Página de prueba**: Seleccionar la página de Facebook que se usará para las pruebas

---

## 5. Checkbox de Confirmación

**Texto del checkbox**: "Si se aprueba, confirmo que cualquier información que reciba a través de pages_messaging se usará de acuerdo con el uso permitido."

**IMPORTANTE**: Asegúrate de marcar este checkbox antes de enviar el formulario.

---

## Notas Finales

1. **Revisa todo el contenido** antes de copiarlo al formulario
2. **Completa los campos marcados con [COMPLETAR]** con tu información específica
3. **Asegúrate de tener la grabación de pantalla lista** antes de comenzar a completar el formulario
4. **Guarda una copia** de este documento para referencia futura
5. **Verifica que la página de Facebook** que usarás para pruebas tiene el rol de "evaluator" asignado en la app

---

## Checklist Pre-Envío

- [ ] Descripción detallada completada y revisada
- [ ] Instrucciones de prueba completadas con URL real
- [ ] Grabación de pantalla creada y lista para subir
- [ ] Checkbox de confirmación marcado
- [ ] Página de prueba seleccionada en el dropdown
- [ ] Información de contacto completada
- [ ] Todo el contenido revisado para errores ortográficos


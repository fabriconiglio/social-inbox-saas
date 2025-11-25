# Formulario de Solicitud pages_manage_metadata - Contenido Completo

Este documento contiene todo el contenido necesario para completar el formulario de solicitud del permiso `pages_manage_metadata` de Facebook.

---

## 1. Descripción Detallada del Uso del Permiso

**Sección**: "Proporciona una descripción detallada del modo en que la app usa el permiso o la función solicitados..."

### Contenido para copiar y pegar:

```
MessageHub es una plataforma SaaS multi-tenant diseñada para centralizar y gestionar mensajes de atención al cliente provenientes de múltiples canales de redes sociales, incluyendo Facebook Messenger, Instagram Direct Messages, WhatsApp Business y TikTok.

USO ESPECÍFICO DEL PERMISO pages_manage_metadata:

El permiso pages_manage_metadata es esencial para el funcionamiento de nuestra aplicación, ya que lo utilizamos para:

1. SUSCRIPCIÓN Y RECEPCIÓN DE WEBHOOKS:
   - Suscribirnos a webhooks de Facebook para recibir notificaciones en tiempo real sobre actividades de la página, específicamente eventos de mensajería (mensajes entrantes, entregas, lecturas)
   - Configurar y mantener la suscripción a webhooks mediante la Graph API de Facebook
   - Recibir y procesar eventos de webhook relacionados con mensajes de Messenger que requieren atención inmediata del equipo de atención al cliente
   - Gestionar la configuración de webhooks para asegurar que nuestra aplicación recibe todas las notificaciones necesarias de forma confiable

2. GESTIÓN DE CONFIGURACIONES DE PÁGINA:
   - Actualizar configuraciones relacionadas con la página cuando es necesario para mantener la integración funcionando correctamente
   - Gestionar la configuración de webhooks de la página para asegurar que los eventos de mensajería se enrutan correctamente a nuestra aplicación
   - Mantener sincronización entre el estado de la página en Facebook y el estado del canal en nuestra plataforma
   - Verificar y actualizar permisos y configuraciones cuando los usuarios reconectan sus páginas

3. PROCESAMIENTO DE EVENTOS DE MENSAJERÍA:
   - Recibir eventos de mensajes entrantes a través de webhooks suscritos usando pages_manage_metadata
   - Procesar automáticamente estos eventos para crear o actualizar conversaciones en nuestra plataforma
   - Gestionar el estado de los mensajes (entregado, leído) basándose en los eventos recibidos
   - Mantener un registro preciso y actualizado de todas las interacciones de mensajería

4. GESTIÓN DE METADATOS DE PÁGINA:
   - Acceder a información de metadatos de la página necesaria para identificar correctamente los canales conectados
   - Verificar el estado y la configuración de la página para validar que la integración está funcionando correctamente
   - Mantener información actualizada sobre las páginas conectadas para proporcionar una experiencia de usuario precisa

VALOR PARA LOS USUARIOS:

Nuestra aplicación proporciona un valor significativo a las empresas que gestionan atención al cliente:

- RECEPCIÓN EN TIEMPO REAL: El permiso pages_manage_metadata permite que nuestra aplicación reciba mensajes de clientes instantáneamente a través de webhooks, asegurando que ningún mensaje se pierda y que los equipos de atención al cliente puedan responder rápidamente

- CONFIABILIDAD: Al gestionar correctamente las suscripciones a webhooks y las configuraciones de página, garantizamos que la integración con Facebook Messenger funcione de forma confiable y continua, sin interrupciones en el servicio

- SINCRONIZACIÓN AUTOMÁTICA: La capacidad de gestionar metadatos y configuraciones de página permite mantener automáticamente la sincronización entre Facebook y nuestra plataforma, reduciendo la necesidad de intervención manual

- GESTIÓN CENTRALIZADA: Los administradores de páginas pueden gestionar sus configuraciones de mensajería desde nuestra plataforma unificada, sin necesidad de acceder directamente a múltiples interfaces de Facebook

- ESCALABILIDAD: Para empresas con múltiples páginas o sucursales, la gestión automatizada de metadatos permite escalar la integración sin aumentar la complejidad operativa

POR QUÉ ES NECESARIO:

El permiso pages_manage_metadata es absolutamente esencial para nuestra aplicación porque:

- Sin este permiso, nuestra aplicación no puede suscribirse a webhooks de Facebook, lo que significa que no podemos recibir notificaciones en tiempo real sobre mensajes entrantes. Esto haría imposible que los mensajes aparezcan automáticamente en nuestra plataforma

- Sin este permiso, no podemos gestionar las configuraciones de webhook de la página, lo que impediría mantener una integración estable y confiable con Facebook Messenger

- Este permiso es el único mecanismo oficial proporcionado por Facebook para que aplicaciones de terceros gestionen webhooks y configuraciones de página relacionadas con mensajería

- Es necesario para cumplir con las expectativas de tiempo real de nuestros usuarios, que requieren recibir mensajes instantáneamente sin necesidad de polling manual

- Permite a las empresas cumplir con sus compromisos de tiempo de respuesta (SLA) al asegurar que todos los mensajes se reciben y procesan inmediatamente

- Es complementario y necesario junto con pages_messaging para proporcionar una solución completa de gestión de mensajería

USO DE DATOS:

Toda la información recibida a través de pages_manage_metadata se utiliza exclusivamente para:
- Gestionar la suscripción y recepción de webhooks de mensajería
- Mantener la configuración de integración entre Facebook y nuestra plataforma
- Procesar eventos de mensajería para proporcionar el servicio de gestión de mensajes
- Generar analytics agregados y anónimos sobre el uso de la plataforma
- NO se utiliza para publicidad dirigida ni se comparte con terceros para fines publicitarios
- Se almacena de forma segura y se respeta la privacidad de los usuarios finales según las políticas de Facebook
- Los metadatos se usan únicamente para el funcionamiento técnico de la integración y no se exponen a usuarios finales
```

---

## 2. Guía para Grabación de Pantalla

**Sección**: "Sube una grabación de pantalla que muestre cómo la app usará el permiso o la función..."

### Contenido para referencia:

```
GUÍA PARA GRABACIÓN DE PANTALLA - pages_manage_metadata

DURACIÓN RECOMENDADA: 2-3 minutos
CALIDAD MÍNIMA: 720p (1080p recomendado)
FORMATO: MP4 o MOV
AUDIO: Opcional pero recomendado (explicación en voz ayuda a entender el flujo)

SECUENCIAS A MOSTRAR (en orden):

1. INTRODUCCIÓN (0:00 - 0:15)
   - Mostrar la pantalla inicial de MessageHub
   - Explicar brevemente qué es la aplicación
   - Mostrar el dashboard o bandeja de entrada principal

2. CONEXIÓN DE CANAL Y CONFIGURACIÓN DE WEBHOOKS (0:15 - 0:50)
   - Navegar a la sección de Canales
   - Mostrar la lista de canales disponibles
   - Hacer clic en "Conectar Canal" > "Facebook Messenger"
   - Mostrar el formulario donde se ingresan las credenciales manualmente:
     * Campo "Page ID": Ingresar el ID de la página
     * Campo "Access Token": Ingresar el Page Access Token (con permisos pages_messaging y pages_manage_metadata)
   - Explicar que el token debe tener los permisos necesarios, incluyendo pages_manage_metadata para gestionar webhooks
   - Opcionalmente, mostrar la validación de credenciales antes de conectar
   - Hacer clic en "Conectar" y confirmar que la página aparece como conectada

3. VERIFICACIÓN DE WEBHOOKS EN FACEBOOK DEVELOPERS (0:50 - 1:10)
   - Abrir Facebook Developers en otra pestaña o ventana
   - Mostrar la configuración de Webhooks de la app
   - Demostrar que los webhooks están suscritos correctamente a los eventos de mensajería
   - Explicar que esto fue posible gracias a pages_manage_metadata

4. RECEPCIÓN DE MENSAJE ENTRANTE VÍA WEBHOOK (1:10 - 1:40)
   - Cambiar a otra ventana/navegador o dispositivo móvil
   - Mostrar cómo se envía un mensaje desde Messenger a la página conectada
   - Volver a MessageHub y mostrar cómo el mensaje aparece automáticamente en la bandeja de entrada (sin necesidad de refrescar)
   - Explicar que esto es posible porque pages_manage_metadata permite recibir webhooks en tiempo real
   - Mostrar los detalles del mensaje (remitente, contenido, timestamp)

5. PROCESAMIENTO AUTOMÁTICO DE EVENTOS (1:40 - 2:00)
   - Mostrar cómo el sistema procesa automáticamente el webhook recibido
   - Explicar que pages_manage_metadata permite gestionar estos eventos
   - Mostrar que se crea automáticamente la conversación y se actualiza el estado

6. GESTIÓN DE CONFIGURACIONES (2:00 - 2:30)
   - Mostrar la sección de configuración del canal
   - Explicar que pages_manage_metadata permite gestionar estas configuraciones
   - Mostrar cómo se puede verificar el estado de los webhooks
   - Opcionalmente, mostrar cómo se puede reconectar el canal y cómo se actualizan las configuraciones

CONSEJOS PARA LA GRABACIÓN:

- Enfocarse en demostrar que los webhooks funcionan en tiempo real (sin necesidad de refrescar la página)
- Mostrar claramente la configuración de webhooks en Facebook Developers para demostrar el uso de pages_manage_metadata
- Explicar verbalmente cómo pages_manage_metadata permite suscribirse a webhooks y gestionar configuraciones
- Usar un cursor visible y moverlo de forma clara y pausada
- Hacer zoom en áreas importantes si es necesario (especialmente durante la configuración de webhooks)
- Asegurarse de que el texto es legible (tamaño de fuente adecuado)
- Evitar movimientos bruscos del mouse o cambios rápidos de ventana
- Si hay errores durante la grabación, es mejor reiniciar que intentar editarlos
- Considerar usar herramientas como OBS Studio, Loom, o la herramienta de grabación nativa del sistema operativo
- Probar la grabación antes de subirla para asegurarse de que el audio y video son claros

PUNTOS CLAVE A DESTACAR:

1. Los webhooks se configuran automáticamente cuando se conecta una página
2. Los mensajes aparecen en tiempo real sin necesidad de refrescar
3. La gestión de configuraciones es automática y transparente para el usuario
4. El permiso es necesario para mantener la integración funcionando correctamente
```

---

## 3. Información Adicional

### Campos a completar en el formulario:

- **URL de la aplicación**: `[COMPLETAR: URL de producción o staging]`
- **Credenciales de prueba** (si aplica):
  - Usuario: `[COMPLETAR si es necesario]`
  - Contraseña: `[COMPLETAR si es necesario]`
- **Contacto para soporte**: `[COMPLETAR: Email de contacto]`
- **Página de prueba**: Seleccionar la página de Facebook que se usará para las pruebas

---

## 4. Checkbox de Confirmación

**Texto del checkbox**: "Si se aprueba, confirmo que cualquier información que reciba a través de pages_manage_metadata se usará de acuerdo con el uso permitido."

**IMPORTANTE**: Asegúrate de marcar este checkbox antes de enviar el formulario.

---

## Notas Finales

1. **Revisa todo el contenido** antes de copiarlo al formulario
2. **Completa los campos marcados con [COMPLETAR]** con tu información específica
3. **Asegúrate de tener la grabación de pantalla lista** antes de comenzar a completar el formulario
4. **Enfócate en demostrar webhooks** en la grabación, ya que ese es el uso principal de este permiso
5. **Guarda una copia** de este documento para referencia futura
6. **Verifica que la página de Facebook** que usarás para pruebas tiene el rol de "evaluator" asignado en la app

---

## Checklist Pre-Envío

- [ ] Descripción detallada completada y revisada
- [ ] Grabación de pantalla creada y lista para subir (debe mostrar webhooks funcionando)
- [ ] Checkbox de confirmación marcado
- [ ] Página de prueba seleccionada en el dropdown (si aplica)
- [ ] Información de contacto completada
- [ ] Todo el contenido revisado para errores ortográficos
- [ ] La grabación demuestra claramente el uso de webhooks y gestión de configuraciones

---

## Diferencia con pages_messaging

Es importante entender que `pages_manage_metadata` y `pages_messaging` son permisos complementarios:

- **pages_messaging**: Permite enviar y recibir mensajes directamente
- **pages_manage_metadata**: Permite suscribirse a webhooks y gestionar configuraciones de página

Ambos son necesarios para una integración completa. Este formulario se enfoca específicamente en el uso de webhooks y gestión de configuraciones que requiere `pages_manage_metadata`.


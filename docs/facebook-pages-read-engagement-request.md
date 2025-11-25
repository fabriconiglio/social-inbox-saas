# Formulario de Solicitud pages_read_engagement - Contenido Completo

Este documento contiene todo el contenido necesario para completar el formulario de solicitud del permiso `pages_read_engagement` de Facebook.

**IMPORTANTE**: Según el formulario, la solicitud debe contener `pages_show_list` para usar `pages_read_engagement`. Asegúrate de que tu app también solicite ese permiso.

---

## 1. Descripción Detallada del Uso del Permiso

**Sección**: "Proporciona una descripción detallada del modo en que la app usa el permiso o la función solicitados..."

### Contenido para copiar y pegar:

```
MessageHub es una plataforma SaaS multi-tenant diseñada para centralizar y gestionar mensajes de atención al cliente provenientes de múltiples canales de redes sociales, incluyendo Facebook Messenger, Instagram Direct Messages, WhatsApp Business y TikTok.

USO ESPECÍFICO DEL PERMISO pages_read_engagement:

El permiso pages_read_engagement es esencial para nuestra aplicación, ya que lo utilizamos para:

1. LECTURA DE METADATOS DE PÁGINA:
   - Obtener información básica de la página de Facebook (nombre, categoría, descripción) para mostrar correctamente el canal conectado en nuestra plataforma
   - Leer metadatos de la página necesarios para validar que las credenciales proporcionadas por el usuario corresponden a una página válida y accesible
   - Verificar el estado y la configuración de la página para asegurar que la integración funciona correctamente
   - Mostrar información relevante de la página a los administradores y agentes que gestionan los canales

2. LECTURA DE DATOS DE SEGUIDORES Y CONTACTOS:
   - Leer información básica de los seguidores que interactúan con la página a través de Messenger (nombre y PSID - Page-Scoped User ID)
   - Obtener fotos de perfil de los usuarios que envían mensajes para mejorar la experiencia visual en la interfaz de atención al cliente
   - Enriquecer los perfiles de contacto en nuestra plataforma con información disponible de Facebook para facilitar la identificación y personalización de las respuestas
   - Mantener un registro completo de las interacciones con cada contacto, incluyendo su identidad en Facebook

3. ANALYTICS Y ESTADÍSTICAS DE PÁGINA:
   - Acceder a estadísticas agregadas de la página para proporcionar métricas de rendimiento a nuestros usuarios
   - Leer métricas de engagement de la página (cuando están disponibles) para enriquecer los dashboards de analytics
   - Proporcionar información contextual sobre el rendimiento general de la página junto con las métricas específicas de mensajería
   - Generar reportes que combinen datos de mensajería con estadísticas generales de la página

4. VALIDACIÓN Y VERIFICACIÓN DE CREDENCIALES:
   - Verificar que el Page Access Token proporcionado por el usuario tiene los permisos necesarios, incluyendo pages_read_engagement
   - Validar que el token puede acceder a la información básica de la página antes de permitir la conexión del canal
   - Comprobar que la página existe y es accesible antes de almacenar las credenciales en nuestra plataforma
   - Detectar problemas de permisos o configuración que puedan afectar el funcionamiento de la integración

VALOR PARA LOS USUARIOS:

Nuestra aplicación proporciona un valor significativo a las empresas que gestionan atención al cliente:

- IDENTIFICACIÓN MEJORADA DE CONTACTOS: Al leer información básica de los seguidores (nombre y foto de perfil), los agentes pueden identificar más fácilmente a los clientes que contactan, mejorando la personalización y la eficiencia del servicio

- EXPERIENCIA VISUAL MEJORADA: Las fotos de perfil y nombres completos de los contactos hacen que la interfaz sea más amigable y profesional, facilitando la gestión de múltiples conversaciones simultáneas

- ANALYTICS COMPLETOS: Al combinar datos de mensajería con estadísticas generales de la página, proporcionamos una visión más completa del rendimiento y engagement, ayudando a las empresas a tomar decisiones informadas

- VALIDACIÓN CONFIABLE: La capacidad de verificar credenciales y permisos antes de conectar canales reduce errores y problemas de configuración, ahorrando tiempo a los usuarios

- GESTIÓN CENTRALIZADA: Los administradores pueden ver información relevante de todas sus páginas conectadas desde una única plataforma, sin necesidad de acceder a múltiples interfaces

POR QUÉ ES NECESARIO:

El permiso pages_read_engagement es absolutamente esencial para nuestra aplicación porque:

- Sin este permiso, nuestra aplicación no puede leer información básica de los seguidores que envían mensajes, lo que impediría mostrar nombres completos y fotos de perfil en la interfaz, degradando significativamente la experiencia del usuario

- Sin este permiso, no podemos validar correctamente las credenciales proporcionadas por el usuario, lo que podría resultar en conexiones de canales que no funcionan correctamente

- Sin este permiso, no podemos acceder a metadatos básicos de la página necesarios para mostrar información relevante a los administradores y agentes

- Este permiso es necesario para proporcionar analytics completos que combinen datos de mensajería con estadísticas generales de engagement de la página

- Es complementario y necesario junto con pages_messaging y pages_manage_metadata para proporcionar una solución completa de gestión de mensajería

- Permite a las empresas tener una visión completa de sus interacciones con clientes, no solo limitada a los mensajes sino también al contexto de la página

USO DE DATOS:

Toda la información recibida a través de pages_read_engagement se utiliza exclusivamente para:
- Mejorar la experiencia de usuario en nuestra plataforma mostrando información relevante de contactos
- Validar y verificar credenciales y configuraciones de canales
- Proporcionar analytics agregados y anónimos sobre el uso de la plataforma
- Enriquecer los perfiles de contacto con información básica disponible públicamente
- NO se utiliza para publicidad dirigida ni se comparte con terceros para fines publicitarios
- Se almacena de forma segura y se respeta la privacidad de los usuarios finales según las políticas de Facebook
- Los datos de seguidores se usan únicamente en el contexto de las conversaciones de mensajería y no se exponen fuera de ese contexto
- Las estadísticas se presentan de forma agregada y anónima para análisis generales
```

---

## 2. Guía para Grabación de Pantalla

**Sección**: "Sube una grabación de pantalla que muestre cómo la app usará el permiso o la función..."

### Contenido para referencia:

```
GUÍA PARA GRABACIÓN DE PANTALLA - pages_read_engagement

DURACIÓN RECOMENDADA: 2-3 minutos
CALIDAD MÍNIMA: 720p (1080p recomendado)
FORMATO: MP4 o MOV
AUDIO: Opcional pero recomendado (explicación en voz ayuda a entender el flujo)

SECUENCIAS A MOSTRAR (en orden):

1. INTRODUCCIÓN (0:00 - 0:15)
   - Mostrar la pantalla inicial de MessageHub
   - Explicar brevemente qué es la aplicación
   - Mostrar el dashboard o bandeja de entrada principal

2. CONEXIÓN DE CANAL Y VALIDACIÓN (0:15 - 0:45)
   - Navegar a la sección de Canales
   - Mostrar la lista de canales disponibles
   - Hacer clic en "Conectar Canal" > "Facebook Messenger"
   - Mostrar el formulario donde se ingresan las credenciales manualmente:
     * Campo "Page ID": Ingresar el ID de la página
     * Campo "Access Token": Ingresar el Page Access Token (con permisos pages_messaging, pages_manage_metadata y pages_read_engagement)
   - Hacer clic en "Validar" para verificar las credenciales
   - Mostrar cómo la validación usa pages_read_engagement para leer información básica de la página (nombre, categoría)
   - Explicar que esto verifica que el token tiene los permisos correctos
   - Hacer clic en "Conectar" y confirmar que la página aparece como conectada

3. RECEPCIÓN DE MENSAJE Y LECTURA DE DATOS DE CONTACTO (0:45 - 1:20)
   - Enviar un mensaje desde Messenger a la página conectada
   - Volver a MessageHub y mostrar cómo el mensaje aparece en la bandeja de entrada
   - Mostrar que el contacto muestra:
     * Nombre completo del usuario (obtenido usando pages_read_engagement)
     * Foto de perfil del usuario (obtenida usando pages_read_engagement)
     * PSID del usuario
   - Explicar que esta información se lee usando pages_read_engagement para mejorar la experiencia del agente

4. VISUALIZACIÓN DE INFORMACIÓN DE CONTACTO (1:20 - 1:45)
   - Seleccionar la conversación para abrir el panel de detalles
   - Mostrar el perfil completo del contacto con:
     * Nombre completo
     * Foto de perfil
     * Información básica disponible
   - Explicar que toda esta información se obtiene usando pages_read_engagement

5. ANALYTICS Y ESTADÍSTICAS (1:45 - 2:15)
   - Navegar a la sección de Analytics o Dashboard
   - Mostrar métricas que incluyen información de la página
   - Explicar que pages_read_engagement permite acceder a estadísticas agregadas de la página
   - Mostrar cómo estas métricas ayudan a los administradores a entender el rendimiento

6. RESUMEN (2:15 - 2:30)
   - Explicar brevemente los tres usos principales demostrados:
     * Validación de credenciales
     * Lectura de información de contactos/seguidores
     * Acceso a estadísticas de la página

CONSEJOS PARA LA GRABACIÓN:

- Enfocarse en demostrar cómo se lee y muestra información de contactos/seguidores
- Mostrar claramente las fotos de perfil y nombres completos obtenidos usando pages_read_engagement
- Explicar verbalmente cómo pages_read_engagement mejora la experiencia del usuario
- Usar un cursor visible y moverlo de forma clara y pausada
- Hacer zoom en áreas importantes si es necesario (especialmente cuando se muestran perfiles de contacto)
- Asegurarse de que el texto es legible (tamaño de fuente adecuado)
- Evitar movimientos bruscos del mouse o cambios rápidos de ventana
- Si hay errores durante la grabación, es mejor reiniciar que intentar editarlos
- Considerar usar herramientas como OBS Studio, Loom, o la herramienta de grabación nativa del sistema operativo
- Probar la grabación antes de subirla para asegurarse de que el audio y video son claros

PUNTOS CLAVE A DESTACAR:

1. La información de contactos/seguidores (nombre, foto de perfil) se lee usando pages_read_engagement
2. La validación de credenciales lee metadatos básicos de la página usando pages_read_engagement
3. Las estadísticas agregadas de la página se acceden usando pages_read_engagement
4. Toda la información se usa exclusivamente para mejorar la experiencia de atención al cliente
5. No se usa para publicidad dirigida ni se comparte con terceros
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

**Texto del checkbox**: "Si se aprueba, confirmo que cualquier información que reciba a través de pages_read_engagement se usará de acuerdo con el uso permitido."

**IMPORTANTE**: Asegúrate de marcar este checkbox antes de enviar el formulario.

---

## Notas Finales

1. **Revisa todo el contenido** antes de copiarlo al formulario
2. **Completa los campos marcados con [COMPLETAR]** con tu información específica
3. **Asegúrate de tener la grabación de pantalla lista** antes de comenzar a completar el formulario
4. **Enfócate en demostrar la lectura de información de contactos** en la grabación, ya que ese es el uso principal de este permiso
5. **Guarda una copia** de este documento para referencia futura
6. **Verifica que la página de Facebook** que usarás para pruebas tiene el rol de "evaluator" asignado en la app
7. **IMPORTANTE**: Asegúrate de que tu app también solicite `pages_show_list` si es necesario, ya que el formulario indica que es un requisito

---

## Checklist Pre-Envío

- [ ] Descripción detallada completada y revisada
- [ ] Grabación de pantalla creada y lista para subir (debe mostrar lectura de información de contactos)
- [ ] Checkbox de confirmación marcado
- [ ] Página de prueba seleccionada en el dropdown (si aplica)
- [ ] Información de contacto completada
- [ ] Todo el contenido revisado para errores ortográficos
- [ ] La grabación demuestra claramente el uso de pages_read_engagement para leer información de contactos
- [ ] Verificado que la app también solicita `pages_show_list` si es necesario

---

## Diferencia con otros permisos

Es importante entender cómo `pages_read_engagement` se relaciona con otros permisos:

- **pages_messaging**: Permite enviar y recibir mensajes directamente
- **pages_manage_metadata**: Permite suscribirse a webhooks y gestionar configuraciones
- **pages_read_engagement**: Permite leer información de la página, seguidores y estadísticas

Todos son necesarios para una integración completa. Este formulario se enfoca específicamente en el uso de `pages_read_engagement` para leer información de contactos/seguidores y estadísticas de la página.


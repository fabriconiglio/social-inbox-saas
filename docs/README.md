# Documentación - Solicitud de Permisos de Facebook

Esta carpeta contiene toda la documentación necesaria para completar los formularios de solicitud de permisos de Facebook para MessageHub.

---

## Permisos Disponibles

Esta carpeta contiene documentación para tres permisos esenciales de Facebook:

1. **`pages_messaging`**: Permite enviar y recibir mensajes de Facebook Messenger
2. **`pages_manage_metadata`**: Permite suscribirse a webhooks y gestionar configuraciones de página
3. **`pages_read_engagement`**: Permite leer información de la página, seguidores y estadísticas

**Nota**: Todos estos permisos son necesarios para una integración completa de Facebook Messenger.

**IMPORTANTE**: Para usar `pages_read_engagement`, tu app también debe solicitar `pages_show_list` según los requisitos de Facebook.

---

## Archivos para pages_messaging

### 1. `facebook-pages-messaging-request.md`
**Propósito**: Documento principal con todo el contenido formateado listo para copiar y pegar en el formulario de Facebook.

**Contiene**:
- Descripción detallada del uso del permiso `pages_messaging`
- Instrucciones paso a paso para pruebas
- Guía completa para la grabación de pantalla
- Información adicional y checklist

**Cuándo usar**: Cuando estés completando el formulario de Facebook para `pages_messaging`, usa este documento como referencia principal.

---

### 2. `facebook-test-instructions.md`
**Propósito**: Instrucciones detalladas y exhaustivas para el evaluador de Facebook.

**Contiene**:
- Requisitos previos
- Instrucciones paso a paso muy detalladas
- Verificaciones específicas para cada paso
- Solución de problemas comunes
- Checklist de verificación final

**Cuándo usar**: 
- Como referencia al escribir las instrucciones de prueba en el formulario
- Para proporcionar al evaluador si Facebook lo solicita
- Para asegurarte de que cubres todos los aspectos necesarios

---

### 3. `facebook-form-quick-reference.md`
**Propósito**: Referencia rápida con resumen ejecutivo y checklist para `pages_messaging`.

**Contiene**:
- Información necesaria antes de comenzar
- Resumen de cada sección del formulario
- Checklist final
- Tips importantes
- Tiempo estimado

**Cuándo usar**: 
- Antes de comenzar a completar el formulario de `pages_messaging`
- Como checklist rápido durante el proceso
- Para verificar que no olvidaste nada

---

## Archivos para pages_manage_metadata

### 4. `facebook-pages-manage-metadata-request.md`
**Propósito**: Documento principal con todo el contenido formateado listo para copiar y pegar en el formulario de Facebook.

**Contiene**:
- Descripción detallada del uso del permiso `pages_manage_metadata`
- Guía completa para la grabación de pantalla (enfocada en webhooks)
- Información adicional y checklist

**Cuándo usar**: Cuando estés completando el formulario de Facebook para `pages_manage_metadata`, usa este documento como referencia principal.

---

### 5. `facebook-manage-metadata-quick-reference.md`
**Propósito**: Referencia rápida con resumen ejecutivo y checklist para `pages_manage_metadata`.

**Contiene**:
- Información necesaria antes de comenzar
- Resumen de cada sección del formulario
- Checklist final
- Tips importantes (especialmente sobre webhooks)
- Diferencia con `pages_messaging`
- Tiempo estimado

**Cuándo usar**: 
- Antes de comenzar a completar el formulario de `pages_manage_metadata`
- Como checklist rápido durante el proceso
- Para entender la diferencia entre los permisos

---

## Archivos para pages_read_engagement

### 6. `facebook-pages-read-engagement-request.md`
**Propósito**: Documento principal con todo el contenido formateado listo para copiar y pegar en el formulario de Facebook.

**Contiene**:
- Descripción detallada del uso del permiso `pages_read_engagement`
- Guía completa para la grabación de pantalla (enfocada en lectura de información de contactos)
- Información adicional y checklist
- Nota sobre el requisito de `pages_show_list`

**Cuándo usar**: Cuando estés completando el formulario de Facebook para `pages_read_engagement`, usa este documento como referencia principal.

---

### 7. `facebook-read-engagement-quick-reference.md`
**Propósito**: Referencia rápida con resumen ejecutivo y checklist para `pages_read_engagement`.

**Contiene**:
- Información necesaria antes de comenzar
- Resumen de cada sección del formulario
- Checklist final
- Tips importantes (especialmente sobre lectura de información de contactos)
- Diferencia con otros permisos
- Nota sobre `pages_show_list`
- Tiempo estimado

**Cuándo usar**: 
- Antes de comenzar a completar el formulario de `pages_read_engagement`
- Como checklist rápido durante el proceso
- Para entender la diferencia entre los permisos

---

## Cómo Usar Estos Documentos

### Para pages_messaging

#### Paso 1: Preparación
1. Lee `facebook-form-quick-reference.md` para entender el proceso completo
2. Completa la información necesaria marcada con `[COMPLETAR]` en todos los documentos
3. Prepara la grabación de pantalla siguiendo la guía en `facebook-pages-messaging-request.md`

#### Paso 2: Completar el Formulario
1. Abre `facebook-pages-messaging-request.md`
2. Copia la descripción detallada (Sección 1) al campo correspondiente del formulario
3. Copia las instrucciones de prueba (Sección 2) al campo correspondiente
4. Sube la grabación de pantalla preparada
5. Selecciona la página de Facebook en el dropdown
6. Marca el checkbox de confirmación

#### Paso 3: Revisión
1. Usa el checklist en `facebook-form-quick-reference.md` para verificar todo
2. Revisa el contenido copiado para asegurarte de que no hay errores
3. Verifica que todos los campos `[COMPLETAR]` fueron reemplazados con información real

---

### Para pages_manage_metadata

#### Paso 1: Preparación
1. Lee `facebook-manage-metadata-quick-reference.md` para entender el proceso completo
2. Completa la información necesaria marcada con `[COMPLETAR]` en todos los documentos
3. Prepara la grabación de pantalla siguiendo la guía en `facebook-pages-manage-metadata-request.md`
4. **IMPORTANTE**: Asegúrate de que la grabación muestre claramente la configuración de webhooks en Facebook Developers

#### Paso 2: Completar el Formulario
1. Abre `facebook-pages-manage-metadata-request.md`
2. Copia la descripción detallada (Sección 1) al campo correspondiente del formulario
3. Sube la grabación de pantalla preparada (debe mostrar webhooks funcionando)
4. Marca el checkbox de confirmación

#### Paso 3: Revisión
1. Usa el checklist en `facebook-manage-metadata-quick-reference.md` para verificar todo
2. Revisa el contenido copiado para asegurarte de que no hay errores
3. Verifica que la grabación demuestra claramente el uso de webhooks
4. Verifica que todos los campos `[COMPLETAR]` fueron reemplazados con información real

---

### Para pages_read_engagement

#### Paso 1: Preparación
1. Lee `facebook-read-engagement-quick-reference.md` para entender el proceso completo
2. Completa la información necesaria marcada con `[COMPLETAR]` en todos los documentos
3. Prepara la grabación de pantalla siguiendo la guía en `facebook-pages-read-engagement-request.md`
4. **IMPORTANTE**: Asegúrate de que la grabación muestre claramente la lectura de información de contactos (nombres, fotos de perfil)
5. **IMPORTANTE**: Verifica que tu app también solicita `pages_show_list` si es necesario según el formulario

#### Paso 2: Completar el Formulario
1. Abre `facebook-pages-read-engagement-request.md`
2. Copia la descripción detallada (Sección 1) al campo correspondiente del formulario
3. Sube la grabación de pantalla preparada (debe mostrar lectura de información de contactos)
4. Marca el checkbox de confirmación

#### Paso 3: Revisión
1. Usa el checklist en `facebook-read-engagement-quick-reference.md` para verificar todo
2. Revisa el contenido copiado para asegurarte de que no hay errores
3. Verifica que la grabación demuestra claramente la lectura de información de contactos/seguidores
4. Verifica que todos los campos `[COMPLETAR]` fueron reemplazados con información real
5. Verifica que tu app también solicita `pages_show_list` si es necesario

---

## Información que Necesitas Completar

Antes de usar estos documentos, asegúrate de tener:

- [ ] URL de la aplicación (producción o staging)
- [ ] Nombre exacto de la app en Facebook Developers
- [ ] Email de contacto para soporte
- [ ] Página de Facebook que usarás para pruebas
- [ ] Credenciales de prueba (si aplica)
- [ ] Grabación de pantalla lista (MP4/MOV, 720p+, 2-3 minutos)

---

## Notas Importantes

1. **Test Users**: NO uses test users creados en "Roles de la app" para recibir mensajes. Facebook no permite que bots envíen mensajes a test users. Usa una cuenta real con rol de "evaluator".

2. **Idioma**: El contenido está en español porque el formulario que compartiste está en español. Si Facebook requiere inglés, puedes traducir el contenido o pedirme que lo traduzca.

3. **Personalización**: Aunque el contenido está basado en la funcionalidad real de tu aplicación, asegúrate de revisarlo y personalizarlo según tus necesidades específicas.

4. **Actualización**: Si cambias algo en la aplicación después de crear estos documentos, actualiza el contenido correspondiente antes de enviar el formulario.

---

## Estructura de la Aplicación Referenciada

Los documentos hacen referencia a las siguientes características de MessageHub:

- **Multi-tenancy**: Soporte para múltiples empresas y locales
- **Bandeja de entrada unificada**: Gestión de mensajes de múltiples canales
- **Asignación de conversaciones**: Asignar hilos a agentes específicos
- **Estados de conversación**: Abierta, pendiente, cerrada
- **Analytics**: Métricas y dashboards
- **SLA tracking**: Seguimiento de tiempos de respuesta

---

## Diferencia Entre Los Permisos

### pages_messaging
- **Propósito**: Enviar y recibir mensajes directamente
- **Enfoque**: Comunicación bidireccional con clientes
- **Uso principal**: Envío y recepción de mensajes de Messenger

### pages_manage_metadata
- **Propósito**: Suscribirse a webhooks y gestionar configuraciones de página
- **Enfoque**: Infraestructura y gestión de integración
- **Uso principal**: Configuración de webhooks y gestión de metadatos

### pages_read_engagement
- **Propósito**: Leer información de la página, seguidores y estadísticas
- **Enfoque**: Información de contactos y analytics
- **Uso principal**: Lectura de datos de seguidores (nombre, PSID, foto de perfil) y estadísticas de página

**Todos son necesarios** para una integración completa de Facebook Messenger.

**Nota**: Para usar `pages_read_engagement`, tu app también debe solicitar `pages_show_list`.

---

## Soporte

Si tienes preguntas sobre cómo usar estos documentos o necesitas ayuda para completar el formulario:

**Para pages_messaging**:
1. Revisa primero `facebook-form-quick-reference.md` para respuestas rápidas
2. Consulta `facebook-test-instructions.md` para detalles técnicos
3. Si necesitas modificar el contenido, edita `facebook-pages-messaging-request.md`

**Para pages_manage_metadata**:
1. Revisa primero `facebook-manage-metadata-quick-reference.md` para respuestas rápidas
2. Consulta `facebook-pages-manage-metadata-request.md` para el contenido completo
3. Asegúrate de entender cómo demostrar webhooks en la grabación

**Para pages_read_engagement**:
1. Revisa primero `facebook-read-engagement-quick-reference.md` para respuestas rápidas
2. Consulta `facebook-pages-read-engagement-request.md` para el contenido completo
3. Asegúrate de entender cómo demostrar la lectura de información de contactos en la grabación
4. Verifica que tu app también solicita `pages_show_list` si es necesario

---

## Guías Adicionales

### `facebook-assign-evaluator-role.md`
**Propósito**: Guía paso a paso para asignar el rol de "evaluator" a una cuenta de Facebook.

**Contiene**:
- Cuándo necesitas asignar el rol de evaluator
- Pasos detallados para asignar el rol en Facebook Developers
- Ubicación exacta en la interfaz
- Notas importantes y troubleshooting

**Cuándo usar**: 
- Cuando Facebook te solicite asignar el rol de evaluator durante la revisión de tu solicitud
- Para entender cómo funciona el proceso de asignación de roles

---

**Última actualización**: `[COMPLETAR: Fecha]`


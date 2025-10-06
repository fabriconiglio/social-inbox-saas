# 🧪 Guía de Testing - MessageHub

Esta guía explica cómo ejecutar tests para los adapters de canales y asegurar que todo funcione correctamente.

## 📋 Tabla de Contenidos

- [Configuración](#configuración)
- [Tests Unitarios](#tests-unitarios)
- [Tests de Integración](#tests-de-integración)
- [Testing Manual](#testing-manual)
- [Variables de Entorno](#variables-de-entorno)
- [Troubleshooting](#troubleshooting)

---

## ⚙️ Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.test` con las credenciales de prueba:

```bash
# Meta (Facebook/Instagram)
TEST_INSTAGRAM_PAGE_ID=tu_page_id
TEST_INSTAGRAM_ACCESS_TOKEN=tu_access_token
TEST_INSTAGRAM_THREAD_ID=thread_id_para_pruebas

TEST_FACEBOOK_PAGE_ID=tu_page_id
TEST_FACEBOOK_ACCESS_TOKEN=tu_access_token
TEST_FACEBOOK_THREAD_ID=thread_id_para_pruebas

# WhatsApp Cloud API
TEST_WHATSAPP_PHONE_ID=tu_phone_id
TEST_WHATSAPP_ACCESS_TOKEN=tu_access_token
TEST_WHATSAPP_PHONE_NUMBER=+1234567890  # Número de prueba

# TikTok
TEST_TIKTOK_APP_ID=tu_app_id
TEST_TIKTOK_APP_SECRET=tu_app_secret
TEST_TIKTOK_ACCESS_TOKEN=tu_access_token

# Webhook Secrets
META_WEBHOOK_SECRET=tu_webhook_secret
WHATSAPP_WEBHOOK_SECRET=tu_webhook_secret
TIKTOK_WEBHOOK_SECRET=tu_webhook_secret
```

---

## 🧪 Tests Unitarios

Los tests unitarios verifican la lógica interna de cada adapter sin hacer llamadas a APIs reales.

### Ejecutar Todos los Tests

```bash
npm test
```

### Ejecutar Tests Específicos

```bash
# Solo MockAdapter
npm test -- mock-adapter

# Solo Instagram
npm test -- meta-instagram-adapter

# Solo WhatsApp
npm test -- whatsapp-cloud-adapter

# Solo Error Handler
npm test -- error-handler
```

### Ejecutar con Coverage

```bash
npm test -- --coverage
```

### Ejemplo de Test Unitario

```typescript
it("debe fallar si el mensaje es muy largo", async () => {
  const longMessage = "a".repeat(2001)
  const message: SendMessageDTO = {
    threadExternalId: "thread-123",
    body: longMessage
  }

  const result = await adapter.sendMessage("channel-123", message, credentials)
  
  expect(result.success).toBe(false)
  expect(result.error?.type).toBe(ErrorType.MESSAGE_TOO_LONG)
})
```

---

## 🔗 Tests de Integración

Los tests de integración hacen llamadas reales a las APIs de las plataformas. **Requieren credenciales válidas.**

### Habilitar Tests de Integración

Los tests de integración están marcados con `.skip` por defecto. Para habilitarlos:

1. Configura las variables de entorno de prueba
2. Quita el `.skip` del test que quieras ejecutar

```typescript
// Antes (deshabilitado)
it.skip("debe enviar un mensaje real a Instagram", async () => {
  // ...
})

// Después (habilitado)
it("debe enviar un mensaje real a Instagram", async () => {
  // ...
})
```

### ⚠️ Advertencias

- **Usa cuentas de prueba**: No uses cuentas de producción
- **Rate limits**: Las APIs tienen límites de solicitudes
- **Costos**: Algunos servicios pueden tener costos asociados
- **Mensajes reales**: Los mensajes se enviarán de verdad

---

## 🖐️ Testing Manual

Para testing manual rápido, usa el script interactivo:

### Ejecutar Script de Testing

```bash
# Testear todos los adapters
npm run test:adapters

# Testear adapter específico
npm run test:adapters -- --adapter=instagram
npm run test:adapters -- --adapter=facebook
npm run test:adapters -- --adapter=whatsapp
npm run test:adapters -- --adapter=mock
```

### Ejemplo de Salida

```
🚀 Iniciando tests de adapters...

============================================================
Testing Instagram Adapter
============================================================

ℹ️  Test 1: Validar credenciales
✅ Credenciales válidas - Página: Mi Página de Instagram
ℹ️  Instagram Account ID: 123456789

ℹ️  Test 2: Listar threads
✅ Threads listados: 5
ℹ️  Primer thread: thread_abc123

ℹ️  Test 3: Enviar mensaje
✅ Mensaje enviado con ID: msg_xyz789

Resultados: 3 ✅ | 0 ❌
```

---

## 🔑 Variables de Entorno

### Obtener Credenciales de Meta (Facebook/Instagram/WhatsApp)

1. **Crear App en Meta for Developers**
   - Ve a https://developers.facebook.com/apps/
   - Crea una nueva app o usa una existente
   - Agrega los productos: Messenger, Instagram, WhatsApp

2. **Obtener Access Token**
   - Ve a Graph API Explorer
   - Selecciona tu app
   - Genera un token con los permisos necesarios:
     - `pages_messaging`
     - `instagram_manage_messages`
     - `pages_manage_metadata`
     - `whatsapp_business_messaging`

3. **Obtener Page ID**
   - Ve a tu página de Facebook
   - Settings > About > Page ID

4. **Obtener Phone ID (WhatsApp)**
   - Ve a WhatsApp Business Manager
   - Selecciona tu número de teléfono
   - Copia el Phone Number ID

### Obtener Credenciales de TikTok

1. **Crear App en TikTok for Business**
   - Ve a https://developers.tiktok.com/
   - Crea una nueva app
   - Habilita TikTok Messaging API

2. **Obtener Credenciales**
   - App ID y App Secret están en tu dashboard
   - Genera un Access Token siguiendo el flujo OAuth

### Webhook Secrets

Los webhook secrets se usan para verificar que los webhooks vienen de las plataformas oficiales:

- **Meta**: Configura en App Dashboard > Webhooks > Edit Subscription
- **TikTok**: Configura en Developer Portal > Webhooks

---

## 🐛 Troubleshooting

### Error: "Invalid OAuth access token"

**Causa**: Token expirado o inválido

**Solución**:
1. Genera un nuevo token en Graph API Explorer
2. Asegúrate de tener los permisos correctos
3. Verifica que el token sea para la página correcta

### Error: "Rate limit exceeded"

**Causa**: Demasiadas solicitudes en poco tiempo

**Solución**:
1. Espera unos minutos antes de reintentar
2. Reduce la frecuencia de tests
3. Usa diferentes cuentas de prueba

### Error: "Webhook verification failed"

**Causa**: Firma HMAC incorrecta

**Solución**:
1. Verifica que el webhook secret sea correcto
2. Asegúrate de usar el mismo secret en la plataforma y en tu app
3. Revisa los logs para ver detalles del error

### Tests Fallan con "fetch failed"

**Causa**: Problemas de red o firewall

**Solución**:
1. Verifica tu conexión a internet
2. Revisa si hay proxies o firewalls bloqueando
3. Intenta con VPN si es necesario

### Error: "Phone number not verified"

**Causa**: Número de WhatsApp no verificado

**Solución**:
1. Ve a WhatsApp Business Manager
2. Verifica tu número de teléfono
3. Completa el proceso de verificación

---

## 📊 Coverage Esperado

### Mínimo Recomendado

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Áreas Críticas (100% coverage)

- Validación de credenciales
- Manejo de errores
- Verificación de webhooks
- Parsing de mensajes

---

## 🔄 CI/CD

### GitHub Actions

Los tests se ejecutan automáticamente en cada push y PR:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

### Pre-commit Hook

Ejecuta tests antes de cada commit:

```bash
# .husky/pre-commit
npm test
```

---

## 📝 Escribir Nuevos Tests

### Template para Adapter Test

```typescript
describe("MyNewAdapter", () => {
  let adapter: MyNewAdapter

  beforeEach(() => {
    adapter = new MyNewAdapter()
  })

  describe("validateCredentials", () => {
    it("debe validar credenciales correctas", async () => {
      // Arrange
      const credentials = { /* ... */ }

      // Act
      const result = await adapter.validateCredentials(credentials)

      // Assert
      expect(result.valid).toBe(true)
    })

    it("debe rechazar credenciales inválidas", async () => {
      // ...
    })
  })

  describe("sendMessage", () => {
    it("debe enviar mensaje exitosamente", async () => {
      // ...
    })

    it("debe manejar errores de API", async () => {
      // ...
    })
  })
})
```

---

## 🎯 Checklist de Testing

Antes de marcar un adapter como "listo para producción":

- [ ] Tests unitarios pasando (> 80% coverage)
- [ ] Tests de integración pasando con datos reales
- [ ] Validación de credenciales funcionando
- [ ] Envío de mensajes funcionando
- [ ] Listado de threads funcionando (si aplica)
- [ ] Verificación de webhooks funcionando
- [ ] Manejo de errores probado
- [ ] Rate limiting manejado correctamente
- [ ] Documentación actualizada
- [ ] Logging implementado

---

## 📚 Recursos Adicionales

### Documentación de APIs

- [Meta Graph API](https://developers.facebook.com/docs/graph-api/)
- [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [TikTok for Business](https://developers.tiktok.com/)

### Herramientas Útiles

- [Graph API Explorer](https://developers.facebook.com/tools/explorer/) - Testear llamadas a Meta APIs
- [Postman](https://www.postman.com/) - Testear APIs manualmente
- [ngrok](https://ngrok.com/) - Exponer webhooks localmente

---

## 🤝 Contribuir

Si encuentras bugs o quieres agregar tests:

1. Crea un issue describiendo el problema
2. Escribe un test que reproduzca el bug
3. Implementa el fix
4. Asegúrate de que todos los tests pasen
5. Crea un PR

---

**¿Preguntas?** Abre un issue en el repositorio.

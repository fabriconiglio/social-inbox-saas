/**
 * Script para testing manual de adapters con datos reales
 * 
 * Uso:
 *   npm run test:adapters -- --adapter=instagram
 *   npm run test:adapters -- --adapter=facebook
 *   npm run test:adapters -- --adapter=whatsapp
 *   npm run test:adapters -- --adapter=all
 */

import { MetaInstagramAdapter } from "@/lib/adapters/meta-instagram-adapter"
import { MetaFacebookAdapter } from "@/lib/adapters/meta-facebook-adapter"
import { WhatsAppCloudAdapter } from "@/lib/adapters/whatsapp-cloud-adapter"
import { MockAdapter } from "@/lib/adapters/mock-adapter"
import type { SendMessageDTO } from "@/lib/adapters/types"

// Colores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60))
  log(title, "cyan")
  console.log("=".repeat(60) + "\n")
}

function logSuccess(message: string) {
  log(`✅ ${message}`, "green")
}

function logError(message: string) {
  log(`❌ ${message}`, "red")
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, "yellow")
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, "blue")
}

// Test de MockAdapter
async function testMockAdapter() {
  logSection("Testing MockAdapter")
  
  const adapter = new MockAdapter()
  let passed = 0
  let failed = 0

  try {
    // Test 1: Validar credenciales
    logInfo("Test 1: Validar credenciales")
    const validation = await adapter.validateCredentials({})
    if (validation.valid) {
      logSuccess("Validación de credenciales exitosa")
      passed++
    } else {
      logError("Validación de credenciales falló")
      failed++
    }

    // Test 2: Enviar mensaje
    logInfo("Test 2: Enviar mensaje")
    const message: SendMessageDTO = {
      threadExternalId: "test-thread",
      body: "Mensaje de prueba desde script de testing"
    }
    const sendResult = await adapter.sendMessage("test-channel", message, {})
    if (sendResult.success && sendResult.data?.externalId) {
      logSuccess(`Mensaje enviado con ID: ${sendResult.data.externalId}`)
      passed++
    } else {
      logError(`Error al enviar mensaje: ${sendResult.error?.message}`)
      failed++
    }

    // Test 3: Listar threads
    logInfo("Test 3: Listar threads")
    const threadsResult = await adapter.listThreads("test-channel", {})
    if (threadsResult.success && threadsResult.data) {
      logSuccess(`Threads listados: ${threadsResult.data.length}`)
      passed++
    } else {
      logError(`Error al listar threads: ${threadsResult.error?.message}`)
      failed++
    }

    // Test 4: Verificar webhook
    logInfo("Test 4: Verificar webhook")
    const webhookValid = adapter.verifyWebhook('{"test": "data"}', "signature")
    if (webhookValid) {
      logSuccess("Webhook verificado correctamente")
      passed++
    } else {
      logError("Webhook no verificado")
      failed++
    }

  } catch (error) {
    logError(`Error inesperado: ${error}`)
    failed++
  }

  log(`\nResultados: ${passed} ✅ | ${failed} ❌`, failed === 0 ? "green" : "red")
  return { passed, failed }
}

// Test de Instagram
async function testInstagramAdapter() {
  logSection("Testing Instagram Adapter")
  
  const adapter = new MetaInstagramAdapter()
  let passed = 0
  let failed = 0

  const pageId = process.env.TEST_INSTAGRAM_PAGE_ID
  const accessToken = process.env.TEST_INSTAGRAM_ACCESS_TOKEN
  const threadId = process.env.TEST_INSTAGRAM_THREAD_ID

  if (!pageId || !accessToken) {
    logWarning("Credenciales de Instagram no configuradas")
    logInfo("Configura TEST_INSTAGRAM_PAGE_ID y TEST_INSTAGRAM_ACCESS_TOKEN en .env")
    return { passed: 0, failed: 0, skipped: true }
  }

  try {
    // Test 1: Validar credenciales
    logInfo("Test 1: Validar credenciales")
    const validation = await adapter.validateCredentials({ pageId, accessToken })
    if (validation.valid) {
      logSuccess(`Credenciales válidas - Página: ${validation.details?.pageName}`)
      logInfo(`Instagram Account ID: ${validation.details?.instagramAccountId}`)
      passed++
    } else {
      logError(`Validación falló: ${validation.error}`)
      failed++
    }

    // Test 2: Listar threads
    logInfo("Test 2: Listar threads")
    const threadsResult = await adapter.listThreads("test-channel", { pageId, accessToken })
    if (threadsResult.success) {
      logSuccess(`Threads listados: ${threadsResult.data?.length || 0}`)
      if (threadsResult.data && threadsResult.data.length > 0) {
        logInfo(`Primer thread: ${threadsResult.data[0].externalId}`)
      }
      passed++
    } else {
      logError(`Error al listar threads: ${threadsResult.error?.message}`)
      failed++
    }

    // Test 3: Enviar mensaje (solo si hay threadId configurado)
    if (threadId) {
      logInfo("Test 3: Enviar mensaje")
      const message: SendMessageDTO = {
        threadExternalId: threadId,
        body: `🤖 Test automático - ${new Date().toLocaleString()}`
      }
      const sendResult = await adapter.sendMessage("test-channel", message, { pageId, accessToken })
      if (sendResult.success && sendResult.data?.externalId) {
        logSuccess(`Mensaje enviado con ID: ${sendResult.data.externalId}`)
        passed++
      } else {
        logError(`Error al enviar mensaje: ${sendResult.error?.message}`)
        failed++
      }
    } else {
      logWarning("TEST_INSTAGRAM_THREAD_ID no configurado, saltando test de envío")
    }

  } catch (error) {
    logError(`Error inesperado: ${error}`)
    failed++
  }

  log(`\nResultados: ${passed} ✅ | ${failed} ❌`, failed === 0 ? "green" : "red")
  return { passed, failed }
}

// Test de Facebook
async function testFacebookAdapter() {
  logSection("Testing Facebook Adapter")
  
  const adapter = new MetaFacebookAdapter()
  let passed = 0
  let failed = 0

  const pageId = process.env.TEST_FACEBOOK_PAGE_ID
  const accessToken = process.env.TEST_FACEBOOK_ACCESS_TOKEN
  const threadId = process.env.TEST_FACEBOOK_THREAD_ID

  if (!pageId || !accessToken) {
    logWarning("Credenciales de Facebook no configuradas")
    logInfo("Configura TEST_FACEBOOK_PAGE_ID y TEST_FACEBOOK_ACCESS_TOKEN en .env")
    return { passed: 0, failed: 0, skipped: true }
  }

  try {
    // Test 1: Validar credenciales
    logInfo("Test 1: Validar credenciales")
    const validation = await adapter.validateCredentials({ pageId, accessToken })
    if (validation.valid) {
      logSuccess(`Credenciales válidas - Página: ${validation.details?.pageName}`)
      passed++
    } else {
      logError(`Validación falló: ${validation.error}`)
      failed++
    }

    // Test 2: Listar threads
    logInfo("Test 2: Listar threads")
    const threadsResult = await adapter.listThreads("test-channel", { pageId, accessToken })
    if (threadsResult.success) {
      logSuccess(`Threads listados: ${threadsResult.data?.length || 0}`)
      if (threadsResult.data && threadsResult.data.length > 0) {
        logInfo(`Primer thread: ${threadsResult.data[0].externalId}`)
      }
      passed++
    } else {
      logError(`Error al listar threads: ${threadsResult.error?.message}`)
      failed++
    }

    // Test 3: Enviar mensaje (solo si hay threadId configurado)
    if (threadId) {
      logInfo("Test 3: Enviar mensaje")
      const message: SendMessageDTO = {
        threadExternalId: threadId,
        body: `🤖 Test automático - ${new Date().toLocaleString()}`
      }
      const sendResult = await adapter.sendMessage("test-channel", message, { pageId, accessToken })
      if (sendResult.success && sendResult.data?.externalId) {
        logSuccess(`Mensaje enviado con ID: ${sendResult.data.externalId}`)
        passed++
      } else {
        logError(`Error al enviar mensaje: ${sendResult.error?.message}`)
        failed++
      }
    } else {
      logWarning("TEST_FACEBOOK_THREAD_ID no configurado, saltando test de envío")
    }

  } catch (error) {
    logError(`Error inesperado: ${error}`)
    failed++
  }

  log(`\nResultados: ${passed} ✅ | ${failed} ❌`, failed === 0 ? "green" : "red")
  return { passed, failed }
}

// Test de WhatsApp
async function testWhatsAppAdapter() {
  logSection("Testing WhatsApp Adapter")
  
  const adapter = new WhatsAppCloudAdapter()
  let passed = 0
  let failed = 0

  const phoneId = process.env.TEST_WHATSAPP_PHONE_ID
  const accessToken = process.env.TEST_WHATSAPP_ACCESS_TOKEN
  const testPhoneNumber = process.env.TEST_WHATSAPP_PHONE_NUMBER

  if (!phoneId || !accessToken) {
    logWarning("Credenciales de WhatsApp no configuradas")
    logInfo("Configura TEST_WHATSAPP_PHONE_ID y TEST_WHATSAPP_ACCESS_TOKEN en .env")
    return { passed: 0, failed: 0, skipped: true }
  }

  try {
    // Test 1: Validar credenciales
    logInfo("Test 1: Validar credenciales")
    const validation = await adapter.validateCredentials({ phoneId, accessToken })
    if (validation.valid) {
      logSuccess(`Credenciales válidas - Teléfono: ${validation.details?.phoneNumber}`)
      logInfo(`Nombre verificado: ${validation.details?.verifiedName}`)
      passed++
    } else {
      logError(`Validación falló: ${validation.error}`)
      failed++
    }

    // Test 2: Enviar mensaje (solo si hay número de prueba configurado)
    if (testPhoneNumber) {
      logInfo("Test 2: Enviar mensaje")
      const message: SendMessageDTO = {
        threadExternalId: testPhoneNumber,
        body: `🤖 Test automático - ${new Date().toLocaleString()}`
      }
      const sendResult = await adapter.sendMessage("test-channel", message, { phoneId, accessToken })
      if (sendResult.success && sendResult.data?.externalId) {
        logSuccess(`Mensaje enviado con ID: ${sendResult.data.externalId}`)
        passed++
      } else {
        logError(`Error al enviar mensaje: ${sendResult.error?.message}`)
        failed++
      }
    } else {
      logWarning("TEST_WHATSAPP_PHONE_NUMBER no configurado, saltando test de envío")
    }

  } catch (error) {
    logError(`Error inesperado: ${error}`)
    failed++
  }

  log(`\nResultados: ${passed} ✅ | ${failed} ❌`, failed === 0 ? "green" : "red")
  return { passed, failed }
}

// Main
async function main() {
  const args = process.argv.slice(2)
  const adapterArg = args.find(arg => arg.startsWith("--adapter="))
  const adapter = adapterArg?.split("=")[1] || "all"

  log("🚀 Iniciando tests de adapters...\n", "cyan")

  const results: Record<string, any> = {}

  if (adapter === "mock" || adapter === "all") {
    results.mock = await testMockAdapter()
  }

  if (adapter === "instagram" || adapter === "all") {
    results.instagram = await testInstagramAdapter()
  }

  if (adapter === "facebook" || adapter === "all") {
    results.facebook = await testFacebookAdapter()
  }

  if (adapter === "whatsapp" || adapter === "all") {
    results.whatsapp = await testWhatsAppAdapter()
  }

  // Resumen final
  logSection("Resumen Final")
  
  let totalPassed = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (const [name, result] of Object.entries(results)) {
    if (result.skipped) {
      log(`${name}: SALTADO`, "yellow")
      totalSkipped++
    } else {
      const status = result.failed === 0 ? "✅ PASSED" : "❌ FAILED"
      const color = result.failed === 0 ? "green" : "red"
      log(`${name}: ${status} (${result.passed} passed, ${result.failed} failed)`, color)
      totalPassed += result.passed
      totalFailed += result.failed
    }
  }

  console.log("\n" + "=".repeat(60))
  log(`Total: ${totalPassed} ✅ | ${totalFailed} ❌ | ${totalSkipped} ⏭️`, 
      totalFailed === 0 ? "green" : "red")
  console.log("=".repeat(60) + "\n")

  process.exit(totalFailed > 0 ? 1 : 0)
}

main().catch(console.error)

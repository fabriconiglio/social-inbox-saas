/**
 * Worker separado para BullMQ
 * Este archivo se ejecuta como proceso independiente con PM2
 * para procesar jobs de mensajes y SLA en producción
 */

// Cargar variables de entorno desde .env antes de importar cualquier módulo
import { config } from "dotenv"
import { resolve } from "path"
import { existsSync } from "fs"

// Cargar .env desde la raíz del proyecto (donde está package.json)
const envPath = resolve(process.cwd(), ".env")
console.log(`[Queue Worker] Buscando .env en: ${envPath}`)
console.log(`[Queue Worker] process.cwd(): ${process.cwd()}`)

if (existsSync(envPath)) {
  const result = config({ path: envPath })
  if (result.error) {
    console.error(`[Queue Worker] ❌ Error cargando .env:`, result.error)
  } else {
    console.log(`[Queue Worker] ✅ Variables de entorno cargadas desde: ${envPath}`)
    // Verificar que las variables críticas estén cargadas
    const requiredVars = ["DATABASE_URL", "REDIS_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]
    const missing = requiredVars.filter(v => !process.env[v])
    if (missing.length > 0) {
      console.warn(`[Queue Worker] ⚠️ Variables faltantes: ${missing.join(", ")}`)
    } else {
      console.log(`[Queue Worker] ✅ Todas las variables requeridas están presentes`)
    }
  }
} else {
  console.error(`[Queue Worker] ❌ No se encontró archivo .env en: ${envPath}`)
}

import { messageWorker, slaWorker } from "./queue"

console.log("[Queue Worker] Iniciando workers de BullMQ...")
console.log("[Queue Worker] Message worker iniciado")
console.log("[Queue Worker] SLA worker iniciado")

// Mantener el proceso vivo
process.on("SIGTERM", async () => {
  console.log("[Queue Worker] Recibido SIGTERM, cerrando workers...")
  await messageWorker.close()
  await slaWorker.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("[Queue Worker] Recibido SIGINT, cerrando workers...")
  await messageWorker.close()
  await slaWorker.close()
  process.exit(0)
})

// Manejar errores no capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Queue Worker] Unhandled Rejection at:", promise, "reason:", reason)
})

process.on("uncaughtException", (error) => {
  console.error("[Queue Worker] Uncaught Exception:", error)
  process.exit(1)
})



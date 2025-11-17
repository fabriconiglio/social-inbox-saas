#!/usr/bin/env node

/**
 * Script wrapper para iniciar el worker con variables de entorno cargadas
 * Este script asegura que el .env se cargue antes de ejecutar el worker
 */

const { config } = require("dotenv")
const { resolve } = require("path")
const { spawn } = require("child_process")

// Obtener la ruta absoluta del directorio del proyecto
const projectRoot = resolve(__dirname, "..")
const envPath = resolve(projectRoot, ".env")

console.log(`[Worker Wrapper] Cargando .env desde: ${envPath}`)

// Cargar variables de entorno
const result = config({ path: envPath })

if (result.error) {
  console.error(`[Worker Wrapper] ❌ Error cargando .env:`, result.error)
  process.exit(1)
}

console.log(`[Worker Wrapper] ✅ Variables de entorno cargadas`)

// Verificar variables críticas
const requiredVars = ["DATABASE_URL", "REDIS_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]
const missing = requiredVars.filter(v => !process.env[v])

if (missing.length > 0) {
  console.error(`[Worker Wrapper] ❌ Variables faltantes: ${missing.join(", ")}`)
  process.exit(1)
}

console.log(`[Worker Wrapper] ✅ Todas las variables requeridas están presentes`)
console.log(`[Worker Wrapper] Iniciando worker...`)

// Ejecutar tsx con el worker
const tsxPath = resolve(projectRoot, "node_modules", ".bin", "tsx")
const workerPath = resolve(projectRoot, "lib", "queue-worker.ts")

const worker = spawn("node", [tsxPath, workerPath], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env
})

worker.on("error", (error) => {
  console.error(`[Worker Wrapper] Error ejecutando worker:`, error)
  process.exit(1)
})

worker.on("exit", (code) => {
  console.log(`[Worker Wrapper] Worker terminó con código: ${code}`)
  process.exit(code || 0)
})

// Manejar señales
process.on("SIGTERM", () => {
  console.log(`[Worker Wrapper] Recibido SIGTERM, terminando worker...`)
  worker.kill("SIGTERM")
})

process.on("SIGINT", () => {
  console.log(`[Worker Wrapper] Recibido SIGINT, terminando worker...`)
  worker.kill("SIGINT")
})


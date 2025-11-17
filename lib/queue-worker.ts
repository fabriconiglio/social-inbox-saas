/**
 * Worker separado para BullMQ
 * Este archivo se ejecuta como proceso independiente con PM2
 * para procesar jobs de mensajes y SLA en producción
 */

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



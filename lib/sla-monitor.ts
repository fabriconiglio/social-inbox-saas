import { prisma } from "@/lib/prisma"

/**
 * Monitorea SLAs y crea notificaciones cuando sea necesario
 */
export async function monitorSLAs() {
  try {
    console.log("[SLA Monitor] Iniciando monitoreo de SLAs...")

    // Obtener todos los threads abiertos con SLA configurado
    const threads = await prisma.thread.findMany({
      where: {
        status: {
          in: ["OPEN", "PENDING"]
        }
      },
      include: {
        contact: true,
        channel: {
          include: {
            local: {
              include: {
                tenant: {
                  include: {
                    slas: true
                  }
                }
              }
            }
          }
        },
        assignee: true
      }
    })

    for (const thread of threads) {
      const tenant = thread.channel.local.tenant
      const sla = tenant.slas[0] // Usar el primer SLA activo

      if (!sla || !thread.assigneeId) {
        continue
      }

      const now = new Date()
      const threadAge = now.getTime() - thread.lastMessageAt.getTime()
      const threadAgeMinutes = Math.floor(threadAge / (1000 * 60))

      // Verificar si el SLA está próximo a vencer (75% del tiempo)
      const warningThreshold = Math.floor(sla.firstResponseMins * 0.75)
      const expiredThreshold = sla.firstResponseMins

      // Verificar si ya existe una notificación de SLA para este thread
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: thread.assigneeId,
          type: {
            in: ["sla_warning", "sla_expired"]
          },
          payloadJSON: {
            path: ["threadId"],
            equals: thread.id
          }
        }
      })

      if (threadAgeMinutes >= expiredThreshold && !existingNotification) {
        // SLA expirado
        await prisma.notification.create({
          data: {
            userId: thread.assigneeId,
            type: "sla_expired",
            payloadJSON: {
              threadId: thread.id,
              threadContact: thread.contact?.name || thread.contact?.handle || "Desconocido",
              timeExceeded: `${threadAgeMinutes - sla.firstResponseMins} minutos`,
              slaMinutes: sla.firstResponseMins,
            },
          },
        })

        console.log(`[SLA Monitor] SLA expirado para thread ${thread.id}`)
      } else if (threadAgeMinutes >= warningThreshold && threadAgeMinutes < expiredThreshold && !existingNotification) {
        // SLA próximo a vencer
        await prisma.notification.create({
          data: {
            userId: thread.assigneeId,
            type: "sla_warning",
            payloadJSON: {
              threadId: thread.id,
              threadContact: thread.contact?.name || thread.contact?.handle || "Desconocido",
              timeRemaining: `${sla.firstResponseMins - threadAgeMinutes} minutos`,
              slaMinutes: sla.firstResponseMins,
            },
          },
        })

        console.log(`[SLA Monitor] SLA próximo a vencer para thread ${thread.id}`)
      }
    }

    console.log(`[SLA Monitor] Monitoreo completado. ${threads.length} threads revisados.`)
  } catch (error) {
    console.error("[SLA Monitor] Error:", error)
  }
}

/**
 * Ejecuta el monitoreo de SLA para un tenant específico
 */
export async function monitorSLAsForTenant(tenantId: string) {
  try {
    console.log(`[SLA Monitor] Monitoreando SLAs para tenant ${tenantId}...`)

    const threads = await prisma.thread.findMany({
      where: {
        tenantId,
        status: {
          in: ["OPEN", "PENDING"]
        }
      },
      include: {
        contact: true,
        channel: {
          include: {
            local: {
              include: {
                tenant: {
                  include: {
                    slas: true
                  }
                }
              }
            }
          }
        },
        assignee: true
      }
    })

    for (const thread of threads) {
      const tenant = thread.channel.local.tenant
      const sla = tenant.slas[0]

      if (!sla || !thread.assigneeId) {
        continue
      }

      const now = new Date()
      const threadAge = now.getTime() - thread.lastMessageAt.getTime()
      const threadAgeMinutes = Math.floor(threadAge / (1000 * 60))

      const warningThreshold = Math.floor(sla.firstResponseMins * 0.75)
      const expiredThreshold = sla.firstResponseMins

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: thread.assigneeId,
          type: {
            in: ["sla_warning", "sla_expired"]
          },
          payloadJSON: {
            path: ["threadId"],
            equals: thread.id
          }
        }
      })

      if (threadAgeMinutes >= expiredThreshold && !existingNotification) {
        await prisma.notification.create({
          data: {
            userId: thread.assigneeId,
            type: "sla_expired",
            payloadJSON: {
              threadId: thread.id,
              threadContact: thread.contact?.name || thread.contact?.handle || "Desconocido",
              timeExceeded: `${threadAgeMinutes - sla.firstResponseMins} minutos`,
              slaMinutes: sla.firstResponseMins,
            },
          },
        })

        console.log(`[SLA Monitor] SLA expirado para thread ${thread.id}`)
      } else if (threadAgeMinutes >= warningThreshold && threadAgeMinutes < expiredThreshold && !existingNotification) {
        await prisma.notification.create({
          data: {
            userId: thread.assigneeId,
            type: "sla_warning",
            payloadJSON: {
              threadId: thread.id,
              threadContact: thread.contact?.name || thread.contact?.handle || "Desconocido",
              timeRemaining: `${sla.firstResponseMins - threadAgeMinutes} minutos`,
              slaMinutes: sla.firstResponseMins,
            },
          },
        })

        console.log(`[SLA Monitor] SLA próximo a vencer para thread ${thread.id}`)
      }
    }

    console.log(`[SLA Monitor] Monitoreo completado para tenant ${tenantId}. ${threads.length} threads revisados.`)
  } catch (error) {
    console.error(`[SLA Monitor] Error para tenant ${tenantId}:`, error)
  }
}

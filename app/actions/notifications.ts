"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

// Crear notificación
export async function createNotification(
  userId: string,
  type: string,
  payload: Record<string, any>
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        payloadJSON: payload,
      },
    })

    return { success: true, data: notification }
  } catch (error) {
    console.error("[createNotification] Error:", error)
    return { error: "Error al crear notificación" }
  }
}

// Listar notificaciones del usuario
export async function listNotifications(userId: string, limit: number = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return { success: true, data: notifications }
  } catch (error) {
    console.error("[listNotifications] Error:", error)
    return { error: "Error al obtener notificaciones" }
  }
}

// Obtener cantidad de notificaciones no leídas
export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    })

    return { success: true, count }
  } catch (error) {
    console.error("[getUnreadCount] Error:", error)
    return { error: "Error al obtener contador de notificaciones" }
  }
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId: string) {
  try {
    const user = await requireAuth()

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id!,
      },
    })

    if (!notification) {
      return { error: "Notificación no encontrada" }
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        readAt: new Date(),
      },
    })

    revalidatePath("/app")

    return { success: true }
  } catch (error) {
    console.error("[markNotificationAsRead] Error:", error)
    return { error: "Error al marcar notificación como leída" }
  }
}

// Marcar todas las notificaciones como leídas
export async function markAllAsRead() {
  try {
    const user = await requireAuth()

    await prisma.notification.updateMany({
      where: {
        userId: user.id!,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    revalidatePath("/app")

    return { success: true }
  } catch (error) {
    console.error("[markAllAsRead] Error:", error)
    return { error: "Error al marcar todas como leídas" }
  }
}

// Eliminar notificación
export async function deleteNotification(notificationId: string) {
  try {
    const user = await requireAuth()

    // Verificar que la notificación pertenece al usuario
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id!,
      },
    })

    if (!notification) {
      return { error: "Notificación no encontrada" }
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    })

    revalidatePath("/app")

    return { success: true }
  } catch (error) {
    console.error("[deleteNotification] Error:", error)
    return { error: "Error al eliminar notificación" }
  }
}


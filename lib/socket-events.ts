import { getSocketServer } from './socket'

// Tipos para los eventos
export interface NewMessageEvent {
  threadId: string
  messageId: string
  content: string
  sender: string
  senderName: string
  timestamp: string
  channelType: string
  channelId: string
  tenantId: string
}

export interface ThreadUpdatedEvent {
  threadId: string
  changes: {
    status?: string
    assigneeId?: string
    assigneeName?: string
    priority?: string
    tags?: string[]
    notes?: string
  }
  updatedBy: string
  updatedByName: string
  timestamp: string
  tenantId: string
}

export interface TypingEvent {
  threadId: string
  userId: string
  userName: string
  isTyping: boolean
  tenantId: string
}

export interface MessageReadEvent {
  threadId: string
  messageId: string
  readBy: string
  readByName: string
  readAt: string
  tenantId: string
}

// Funciones para emitir eventos
export class SocketEventEmitter {
  private static getIO() {
    return getSocketServer()
  }

  // Emitir nuevo mensaje
  static emitNewMessage(event: NewMessageEvent) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    // Emitir a todos los usuarios del tenant
    io.to(`tenant-${event.tenantId}`).emit('new-message', {
      threadId: event.threadId,
      messageId: event.messageId,
      content: event.content,
      sender: event.sender,
      timestamp: event.timestamp,
      channelType: event.channelType
    })

    // Emitir específicamente a los usuarios del thread
    io.to(`thread-${event.threadId}`).emit('new-message', {
      threadId: event.threadId,
      messageId: event.messageId,
      content: event.content,
      sender: event.sender,
      timestamp: event.timestamp,
      channelType: event.channelType
    })

    console.log(`[SocketEventEmitter] Nuevo mensaje emitido: ${event.messageId} en thread ${event.threadId}`)
  }

  // Emitir actualización de thread
  static emitThreadUpdated(event: ThreadUpdatedEvent) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    // Emitir a todos los usuarios del tenant
    io.to(`tenant-${event.tenantId}`).emit('thread-updated', {
      threadId: event.threadId,
      changes: event.changes,
      updatedBy: event.updatedBy,
      updatedByName: event.updatedByName,
      timestamp: event.timestamp
    })

    // Emitir específicamente a los usuarios del thread
    io.to(`thread-${event.threadId}`).emit('thread-updated', {
      threadId: event.threadId,
      changes: event.changes,
      updatedBy: event.updatedBy,
      updatedByName: event.updatedByName,
      timestamp: event.timestamp
    })

    console.log(`[SocketEventEmitter] Thread actualizado emitido: ${event.threadId}`)
  }

  // Emitir indicador de escritura
  static emitTyping(event: TypingEvent) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    // Emitir solo a los usuarios del thread (no a todo el tenant)
    io.to(`thread-${event.threadId}`).emit('user-typing', {
      threadId: event.threadId,
      userId: event.userId,
      userName: event.userName,
      isTyping: event.isTyping
    })

    console.log(`[SocketEventEmitter] Indicador de escritura emitido: ${event.userName} en thread ${event.threadId}`)
  }

  // Emitir mensaje leído
  static emitMessageRead(event: MessageReadEvent) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    // Emitir a los usuarios del thread
    io.to(`thread-${event.threadId}`).emit('message-read', {
      threadId: event.threadId,
      messageId: event.messageId,
      readBy: event.readBy,
      readAt: event.readAt
    })

    console.log(`[SocketEventEmitter] Mensaje leído emitido: ${event.messageId} por ${event.readByName}`)
  }

  // Emitir notificación general
  static emitNotification(tenantId: string, notification: {
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    actionUrl?: string
  }) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    io.to(`tenant-${tenantId}`).emit('notification', {
      id: `notif_${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: new Date().toISOString(),
      actionUrl: notification.actionUrl
    })

    console.log(`[SocketEventEmitter] Notificación emitida: ${notification.title}`)
  }

  // Emitir alerta de SLA
  static emitSLAWarning(tenantId: string, alert: {
    threadId: string
    slaTime: number
    remainingTime: number
    priority: 'low' | 'medium' | 'high'
  }) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    io.to(`tenant-${tenantId}`).emit('sla-warning', {
      threadId: alert.threadId,
      slaTime: alert.slaTime,
      remainingTime: alert.remainingTime,
      priority: alert.priority
    })

    console.log(`[SocketEventEmitter] Alerta SLA emitida: Thread ${alert.threadId}`)
  }

  // Emitir SLA expirado
  static emitSLAExpired(tenantId: string, alert: {
    threadId: string
    slaTime: number
    expiredAt: string
  }) {
    const io = this.getIO()
    if (!io) {
      console.warn('[SocketEventEmitter] Socket.IO no está inicializado')
      return
    }

    io.to(`tenant-${tenantId}`).emit('sla-expired', {
      threadId: alert.threadId,
      slaTime: alert.slaTime,
      expiredAt: alert.expiredAt,
      priority: 'critical'
    })

    console.log(`[SocketEventEmitter] SLA expirado emitido: Thread ${alert.threadId}`)
  }
}

// Funciones de conveniencia para casos comunes
export const emitNewMessage = SocketEventEmitter.emitNewMessage
export const emitThreadUpdated = SocketEventEmitter.emitThreadUpdated
export const emitTyping = SocketEventEmitter.emitTyping
export const emitMessageRead = SocketEventEmitter.emitMessageRead
export const emitNotification = SocketEventEmitter.emitNotification
export const emitSLAWarning = SocketEventEmitter.emitSLAWarning
export const emitSLAExpired = SocketEventEmitter.emitSLAExpired

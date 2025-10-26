import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { Socket } from 'socket.io'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/auth'

// Tipos para Socket.IO
export interface ServerToClientEvents {
  // Notificaciones de mensajes
  'new-message': (data: {
    threadId: string
    messageId: string
    content: string
    sender: string
    timestamp: string
    channelType: string
  }) => void
  
  'message-read': (data: {
    threadId: string
    messageId: string
    readBy: string
    readAt: string
  }) => void
  
  // Notificaciones de threads
  'thread-assigned': (data: {
    threadId: string
    assigneeId: string
    assigneeName: string
    assignedAt: string
  }) => void
  
  'thread-status-changed': (data: {
    threadId: string
    status: string
    changedBy: string
    changedAt: string
  }) => void
  
  'thread-updated': (data: {
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
  }) => void
  
  // Indicadores de actividad
  'user-typing': (data: {
    threadId: string
    userId: string
    userName: string
    isTyping: boolean
  }) => void
  
  'user-online': (data: {
    userId: string
    userName: string
    tenantId: string
  }) => void
  
  'user-offline': (data: {
    userId: string
    userName: string
    tenantId: string
  }) => void
  
  // Notificaciones del sistema
  'sla-warning': (data: {
    threadId: string
    slaTime: number
    remainingTime: number
    priority: 'low' | 'medium' | 'high'
  }) => void
  
  'sla-expired': (data: {
    threadId: string
    slaTime: number
    expiredAt: string
    priority: 'critical'
  }) => void
  
  'channel-disconnected': (data: {
    channelId: string
    channelName: string
    reason: string
    disconnectedAt: string
  }) => void
  
  // Notificaciones generales
  'notification': (data: {
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
    actionUrl?: string
  }) => void
}

export interface ClientToServerEvents {
  // Unirse a rooms
  'join-tenant': (tenantId: string) => void
  'join-thread': (threadId: string) => void
  'leave-thread': (threadId: string) => void
  
  // Indicadores de actividad
  'typing': (data: {
    threadId: string
    isTyping: boolean
  }) => void
  
  'mark-message-read': (data: {
    threadId: string
    messageId: string
  }) => void
  
  // Estado de usuario
  'set-status': (data: {
    status: 'online' | 'away' | 'busy' | 'offline'
  }) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  userId: string
  tenantId: string
  userRole: string
  userName: string
  status?: 'online' | 'away' | 'busy' | 'offline'
}

// Instancia global del servidor Socket.IO
let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null

export const getSocketServer = (): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null => {
  return io
}

export const initializeSocket = (httpServer: NetServer) => {
  if (io) {
    return io
  }

  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXTAUTH_URL 
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/api/socketio'
  })

  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      // En un entorno real, necesitarías obtener la sesión de manera diferente
      // ya que getServerSession no funciona directamente en middleware de Socket.IO
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('No token provided'))
      }

      // Aquí validarías el token JWT o la sesión
      // Por ahora, simulamos la autenticación
      const userData = {
        userId: 'user_123', // En producción, extraer del token
        tenantId: 'tenant_123', // En producción, extraer del token
        userRole: 'ADMIN', // En producción, extraer del token
        userName: 'Usuario Demo' // En producción, extraer del token
      }

      socket.data = userData
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  // Manejo de conexiones
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    console.log(`[Socket.IO] Usuario conectado: ${socket.data.userName} (${socket.data.userId})`)

    // Unirse al tenant del usuario
    socket.join(`tenant-${socket.data.tenantId}`)
    socket.join(`user-${socket.data.userId}`)

    // Notificar que el usuario está online
    socket.to(`tenant-${socket.data.tenantId}`).emit('user-online', {
      userId: socket.data.userId,
      userName: socket.data.userName,
      tenantId: socket.data.tenantId
    })

    // Eventos del cliente
    socket.on('join-thread', (threadId: string) => {
      socket.join(`thread-${threadId}`)
      console.log(`[Socket.IO] Usuario ${socket.data.userName} se unió al thread ${threadId}`)
    })

    socket.on('leave-thread', (threadId: string) => {
      socket.leave(`thread-${threadId}`)
      console.log(`[Socket.IO] Usuario ${socket.data.userName} salió del thread ${threadId}`)
    })

    socket.on('typing', (data) => {
      socket.to(`thread-${data.threadId}`).emit('user-typing', {
        threadId: data.threadId,
        userId: socket.data.userId,
        userName: socket.data.userName,
        isTyping: data.isTyping
      })
    })

    socket.on('mark-message-read', (data) => {
      socket.to(`thread-${data.threadId}`).emit('message-read', {
        threadId: data.threadId,
        messageId: data.messageId,
        readBy: socket.data.userId,
        readAt: new Date().toISOString()
      })
    })

    socket.on('set-status', (data) => {
      // Actualizar estado del usuario
      socket.data.status = data.status
      
      // Notificar a otros usuarios del tenant
      socket.to(`tenant-${socket.data.tenantId}`).emit('notification', {
        id: `status_${Date.now()}`,
        type: 'info',
        title: 'Estado de usuario actualizado',
        message: `${socket.data.userName} cambió su estado a ${data.status}`,
        timestamp: new Date().toISOString()
      })
    })

    // Manejo de desconexión
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Usuario desconectado: ${socket.data.userName} - Razón: ${reason}`)
      
      // Notificar que el usuario está offline
      socket.to(`tenant-${socket.data.tenantId}`).emit('user-offline', {
        userId: socket.data.userId,
        userName: socket.data.userName,
        tenantId: socket.data.tenantId
      })
    })
  })

  return io
}

// Funciones de utilidad para emitir eventos
export const emitToTenant = (tenantId: string, event: keyof ServerToClientEvents, data: any) => {
  if (io) {
    io.to(`tenant-${tenantId}`).emit(event, data)
  }
}

export const emitToThread = (threadId: string, event: keyof ServerToClientEvents, data: any) => {
  if (io) {
    io.to(`thread-${threadId}`).emit(event, data)
  }
}

export const emitToUser = (userId: string, event: keyof ServerToClientEvents, data: any) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data)
  }
}

export const emitNotification = (tenantId: string, notification: {
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  actionUrl?: string
}) => {
  emitToTenant(tenantId, 'notification', {
    id: `notif_${Date.now()}`,
    ...notification,
    timestamp: new Date().toISOString()
  })
}

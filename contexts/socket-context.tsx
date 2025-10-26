"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

// Tipos para el contexto
interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionError: string | null
}

// Eventos que el cliente puede escuchar
interface ServerToClientEvents {
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
  
  'notification': (data: {
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
    actionUrl?: string
  }) => void
}

// Eventos que el cliente puede emitir
interface ClientToServerEvents {
  'join-tenant': (tenantId: string) => void
  'join-thread': (threadId: string) => void
  'leave-thread': (threadId: string) => void
  'typing': (data: { threadId: string; isTyping: boolean }) => void
  'mark-message-read': (data: { threadId: string; messageId: string }) => void
  'set-status': (data: { status: 'online' | 'away' | 'busy' | 'offline' }) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null
})

interface SocketProviderProps {
  children: ReactNode
  tenantId?: string
}

export function SocketProvider({ children, tenantId }: SocketProviderProps) {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Esperar a que la sesión se cargue
    
    if (!session?.user) {
      // Si no hay sesión, desconectar el socket
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

    // Crear nueva conexión Socket.IO
    const newSocket = io(process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || ''
      : 'http://localhost:3000', {
      path: '/api/socketio',
      auth: {
        token: 'demo-token' // En producción, usar el token real de la sesión
      },
      autoConnect: true
    })

    // Eventos de conexión
    newSocket.on('connect', () => {
      console.log('[Socket.IO] Conectado al servidor')
      setIsConnected(true)
      setConnectionError(null)
      
      // Unirse al tenant si está disponible
      if (tenantId) {
        newSocket.emit('join-tenant', tenantId)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Desconectado del servidor:', reason)
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('[Socket.IO] Error de conexión:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    setSocket(newSocket)

    // Cleanup al desmontar
    return () => {
      newSocket.close()
    }
  }, [session, tenantId])

  // Unirse al tenant cuando cambie
  useEffect(() => {
    if (socket && tenantId && isConnected) {
      socket.emit('join-tenant', tenantId)
    }
  }, [socket, tenantId, isConnected])

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider')
  }
  return context
}

// Hook específico para eventos de mensajes
export function useMessageEvents() {
  const { socket } = useSocket()

  const onNewMessage = (callback: (data: {
    threadId: string
    messageId: string
    content: string
    sender: string
    timestamp: string
    channelType: string
  }) => void) => {
    if (socket) {
      socket.on('new-message', callback)
      return () => socket.off('new-message', callback)
    }
    return () => {}
  }

  const onMessageRead = (callback: (data: {
    threadId: string
    messageId: string
    readBy: string
    readAt: string
  }) => void) => {
    if (socket) {
      socket.on('message-read', callback)
      return () => socket.off('message-read', callback)
    }
    return () => {}
  }

  const onUserTyping = (callback: (data: {
    threadId: string
    userId: string
    userName: string
    isTyping: boolean
  }) => void) => {
    if (socket) {
      socket.on('user-typing', callback)
      return () => socket.off('user-typing', callback)
    }
    return () => {}
  }

  return {
    onNewMessage,
    onMessageRead,
    onUserTyping
  }
}

// Hook específico para eventos de threads
export function useThreadEvents() {
  const { socket } = useSocket()

  const onThreadAssigned = (callback: (data: {
    threadId: string
    assigneeId: string
    assigneeName: string
    assignedAt: string
  }) => void) => {
    if (socket) {
      socket.on('thread-assigned', callback)
      return () => socket.off('thread-assigned', callback)
    }
    return () => {}
  }

  const onThreadStatusChanged = (callback: (data: {
    threadId: string
    status: string
    changedBy: string
    changedAt: string
  }) => void) => {
    if (socket) {
      socket.on('thread-status-changed', callback)
      return () => socket.off('thread-status-changed', callback)
    }
    return () => {}
  }

  const onThreadUpdated = (callback: (data: {
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
  }) => void) => {
    if (socket) {
      socket.on('thread-updated', callback)
      return () => socket.off('thread-updated', callback)
    }
    return () => {}
  }

  const joinThread = (threadId: string) => {
    if (socket) {
      socket.emit('join-thread', threadId)
    }
  }

  const leaveThread = (threadId: string) => {
    if (socket) {
      socket.emit('leave-thread', threadId)
    }
  }

  return {
    onThreadAssigned,
    onThreadStatusChanged,
    onThreadUpdated,
    joinThread,
    leaveThread
  }
}

// Hook específico para notificaciones
export function useNotifications() {
  const { socket } = useSocket()

  const onNotification = (callback: (data: {
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
    actionUrl?: string
  }) => void) => {
    if (socket) {
      socket.on('notification', callback)
      return () => socket.off('notification', callback)
    }
    return () => {}
  }

  const onSLAWarning = (callback: (data: {
    threadId: string
    slaTime: number
    remainingTime: number
    priority: 'low' | 'medium' | 'high'
  }) => void) => {
    if (socket) {
      socket.on('sla-warning', callback)
      return () => socket.off('sla-warning', callback)
    }
    return () => {}
  }

  const onSLAExpired = (callback: (data: {
    threadId: string
    slaTime: number
    expiredAt: string
    priority: 'critical'
  }) => void) => {
    if (socket) {
      socket.on('sla-expired', callback)
      return () => socket.off('sla-expired', callback)
    }
    return () => {}
  }

  return {
    onNotification,
    onSLAWarning,
    onSLAExpired
  }
}

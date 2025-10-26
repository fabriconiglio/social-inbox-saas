"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '@/contexts/socket-context'
import { useRouter } from 'next/navigation'

interface UseSocketConnectionOptions {
  tenantId: string
  autoConnect?: boolean
  reconnectOnFocus?: boolean
  reconnectOnOnline?: boolean
}

export function useSocketConnection({
  tenantId,
  autoConnect = true,
  reconnectOnFocus = true,
  reconnectOnOnline = true
}: UseSocketConnectionOptions) {
  const { socket, isConnected, connectionError } = useSocket()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  // Conectar automáticamente al montar el componente
  useEffect(() => {
    if (autoConnect && socket && !isConnected && !isInitialized) {
      console.log('[Socket Connection] Conectando automáticamente...')
      socket.connect()
      setIsInitialized(true)
    }
  }, [socket, isConnected, autoConnect, isInitialized])

  // Reconectar cuando la ventana vuelve a tener foco
  useEffect(() => {
    if (!reconnectOnFocus) return

    const handleFocus = () => {
      if (socket && !isConnected) {
        console.log('[Socket Connection] Reconectando por foco de ventana...')
        socket.connect()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [socket, isConnected, reconnectOnFocus])

  // Reconectar cuando la conexión de red vuelve
  useEffect(() => {
    if (!reconnectOnOnline) return

    const handleOnline = () => {
      if (socket && !isConnected) {
        console.log('[Socket Connection] Reconectando por conexión de red...')
        socket.connect()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [socket, isConnected, reconnectOnOnline])

  // Manejar cambios de conexión
  useEffect(() => {
    if (isConnected) {
      console.log('[Socket Connection] Conectado al servidor')
    } else if (connectionError) {
      console.error('[Socket Connection] Error de conexión:', connectionError)
    }
  }, [isConnected, connectionError])

  // Función para conectar manualmente
  const connect = useCallback(() => {
    if (socket) {
      socket.connect()
    }
  }, [socket])

  // Función para desconectar manualmente
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }
  }, [socket])

  // Función para reconectar
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setTimeout(() => {
        socket.connect()
      }, 1000)
    }
  }, [socket])

  // Función para unirse a un thread específico
  const joinThread = useCallback((threadId: string) => {
    if (socket && isConnected) {
      socket.emit('join-thread', threadId)
      console.log(`[Socket Connection] Unido al thread: ${threadId}`)
    }
  }, [socket, isConnected])

  // Función para salir de un thread específico
  const leaveThread = useCallback((threadId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-thread', threadId)
      console.log(`[Socket Connection] Salido del thread: ${threadId}`)
    }
  }, [socket, isConnected])

  // Función para unirse al tenant
  const joinTenant = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('join-tenant', tenantId)
      console.log(`[Socket Connection] Unido al tenant: ${tenantId}`)
    }
  }, [socket, isConnected, tenantId])

  // Unirse al tenant cuando se conecte
  useEffect(() => {
    if (isConnected) {
      joinTenant()
    }
  }, [isConnected, joinTenant])

  return {
    isConnected,
    connectionError,
    isInitialized,
    connect,
    disconnect,
    reconnect,
    joinThread,
    leaveThread,
    joinTenant
  }
}

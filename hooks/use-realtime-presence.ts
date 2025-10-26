"use client"

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '@/contexts/socket-context'

interface OnlineUser {
  userId: string
  userName: string
  tenantId: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen?: string
}

export function useRealtimePresence() {
  const { socket } = useSocket()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [userStatus, setUserStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online')

  // Manejar usuarios que se conectan
  useEffect(() => {
    if (!socket) return

    const handleUserOnline = (data: { userId: string; userName: string; tenantId: string }) => {
      setOnlineUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId)
        if (exists) {
          return prev.map(user => 
            user.userId === data.userId 
              ? { ...user, status: 'online' as const }
              : user
          )
        }
        return [...prev, { ...data, status: 'online' as const }]
      })
    }

    const handleUserOffline = (data: { userId: string; userName: string; tenantId: string }) => {
      setOnlineUsers(prev => 
        prev.map(user => 
          user.userId === data.userId 
            ? { ...user, status: 'offline' as const, lastSeen: new Date().toISOString() }
            : user
        )
      )
    }

    const handleUserStatusChanged = (data: { 
      userId: string; 
      userName: string; 
      status: 'online' | 'away' | 'busy' | 'offline';
      changedAt: string;
    }) => {
      setOnlineUsers(prev => 
        prev.map(user => 
          user.userId === data.userId 
            ? { ...user, status: data.status }
            : user
        )
      )
    }

    socket.on('user-online', handleUserOnline)
    socket.on('user-offline', handleUserOffline)
    socket.on('user-status-changed', handleUserStatusChanged)

    return () => {
      socket.off('user-online', handleUserOnline)
      socket.off('user-offline', handleUserOffline)
      socket.off('user-status-changed', handleUserStatusChanged)
    }
  }, [socket])

  // Cambiar estado del usuario
  const setStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    if (socket) {
      socket.emit('set-status', { status })
      setUserStatus(status)
    }
  }, [socket])

  // Obtener usuarios online
  const getOnlineUsers = useCallback(() => {
    return onlineUsers.filter(user => user.status === 'online')
  }, [onlineUsers])

  // Obtener usuarios por estado
  const getUsersByStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    return onlineUsers.filter(user => user.status === status)
  }, [onlineUsers])

  // Obtener conteo de usuarios online
  const onlineCount = onlineUsers.filter(user => user.status === 'online').length

  return {
    onlineUsers,
    userStatus,
    setStatus,
    getOnlineUsers,
    getUsersByStatus,
    onlineCount
  }
}

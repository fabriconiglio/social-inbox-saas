"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRealtimeThreadUpdates } from '@/hooks/use-realtime-thread-updates'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { useSocketConnection } from '@/hooks/use-socket-connection'

interface Thread {
  id: string
  subject: string
  status: string
  priority: string
  assigneeId: string | null
  assignee?: {
    id: string
    name: string
    email: string
  }
  lastMessageAt: Date | null
  lastMessageId?: string
  unreadCount: number
  contact: {
    id: string
    name: string
    handle: string
  }
  channel: {
    id: string
    type: string
    displayName: string
  }
  local: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
}

interface UseRealtimeThreadListProps {
  initialThreads: Thread[]
  tenantId: string
}

export function useRealtimeThreadList({ initialThreads, tenantId }: UseRealtimeThreadListProps) {
  const [threads, setThreads] = useState<Thread[]>(initialThreads)
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map())
  const [typingThreads, setTypingThreads] = useState<Set<string>>(new Set())
  
  const { isConnected } = useSocketConnection({ tenantId })
  const { threadUpdates } = useRealtimeThreadUpdates()

  // Actualizar threads cuando llegan actualizaciones
  useEffect(() => {
    if (threadUpdates.length > 0) {
      const latestUpdate = threadUpdates[0]
      
      setThreads(prev => 
        prev.map(thread => 
          thread.id === latestUpdate.threadId 
            ? { 
                ...thread, 
                ...latestUpdate.changes,
                updatedAt: new Date(latestUpdate.timestamp)
              }
            : thread
        )
      )
    }
  }, [threadUpdates])

  // Manejar nuevos mensajes para actualizar lastMessageAt y unreadCount
  const handleNewMessage = useCallback((threadId: string, messageData: {
    messageId: string
    content: string
    sender: string
    timestamp: string
  }) => {
    setThreads(prev => 
      prev.map(thread => 
        thread.id === threadId 
          ? {
              ...thread,
              lastMessageAt: new Date(messageData.timestamp),
              lastMessageId: messageData.messageId,
              unreadCount: thread.unreadCount + 1
            }
          : thread
      )
    )

    // Actualizar contador de no leídos
    setUnreadCounts(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(threadId) || 0
      newMap.set(threadId, current + 1)
      return newMap
    })
  }, [])

  // Manejar mensajes leídos
  const handleMessageRead = useCallback((threadId: string, messageId: string) => {
    setThreads(prev => 
      prev.map(thread => 
        thread.id === threadId 
          ? {
              ...thread,
              unreadCount: Math.max(0, thread.unreadCount - 1)
            }
          : thread
      )
    )

    // Actualizar contador de no leídos
    setUnreadCounts(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(threadId) || 0
      newMap.set(threadId, Math.max(0, current - 1))
      return newMap
    })
  }, [])

  // Manejar indicadores de escritura
  const handleTyping = useCallback((threadId: string, isTyping: boolean) => {
    setTypingThreads(prev => {
      const newSet = new Set(prev)
      if (isTyping) {
        newSet.add(threadId)
      } else {
        newSet.delete(threadId)
      }
      return newSet
    })
  }, [])

  // Obtener thread por ID
  const getThread = useCallback((threadId: string) => {
    return threads.find(t => t.id === threadId)
  }, [threads])

  // Obtener threads ordenados por última actividad
  const getSortedThreads = useCallback(() => {
    return [...threads].sort((a, b) => {
      const aTime = a.lastMessageAt || a.updatedAt
      const bTime = b.lastMessageAt || b.updatedAt
      return bTime.getTime() - aTime.getTime()
    })
  }, [threads])

  // Obtener threads con indicador de escritura
  const getTypingThreads = useCallback(() => {
    return threads.filter(thread => typingThreads.has(thread.id))
  }, [threads, typingThreads])

  // Obtener threads con mensajes no leídos
  const getUnreadThreads = useCallback(() => {
    return threads.filter(thread => thread.unreadCount > 0)
  }, [threads])

  // Obtener contador total de mensajes no leídos
  const getTotalUnreadCount = useCallback(() => {
    return threads.reduce((total, thread) => total + thread.unreadCount, 0)
  }, [threads])

  // Marcar thread como leído
  const markThreadAsRead = useCallback((threadId: string) => {
    setThreads(prev => 
      prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, unreadCount: 0 }
          : thread
      )
    )
    setUnreadCounts(prev => {
      const newMap = new Map(prev)
      newMap.set(threadId, 0)
      return newMap
    })
  }, [])

  // Actualizar thread específico
  const updateThread = useCallback((threadId: string, updates: Partial<Thread>) => {
    setThreads(prev => 
      prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, ...updates, updatedAt: new Date() }
          : thread
      )
    )
  }, [])

  // Agregar nuevo thread
  const addThread = useCallback((newThread: Thread) => {
    setThreads(prev => [newThread, ...prev])
  }, [])

  // Eliminar thread
  const removeThread = useCallback((threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId))
  }, [])

  return {
    threads,
    unreadCounts,
    typingThreads,
    isConnected,
    getThread,
    getSortedThreads,
    getTypingThreads,
    getUnreadThreads,
    getTotalUnreadCount,
    markThreadAsRead,
    updateThread,
    addThread,
    removeThread,
    handleNewMessage,
    handleMessageRead,
    handleTyping
  }
}

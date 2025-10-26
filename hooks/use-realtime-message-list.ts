"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { useSocketConnection } from '@/hooks/use-socket-connection'

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderType: 'AGENT' | 'CUSTOMER'
  messageType: 'text' | 'image' | 'video' | 'document' | 'audio'
  attachments?: Array<{
    type: string
    url: string
    filename?: string
    size?: number
  }>
  sentAt: Date
  deliveredAt?: Date
  readAt?: Date
  readBy?: string
  threadId: string
}

interface UseRealtimeMessageListProps {
  initialMessages: Message[]
  threadId: string
  tenantId: string
}

export function useRealtimeMessageList({ 
  initialMessages, 
  threadId, 
  tenantId 
}: UseRealtimeMessageListProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [typingUsers, setTypingUsers] = useState<Array<{
    userId: string
    userName: string
    isTyping: boolean
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const { isConnected } = useSocketConnection({ tenantId })
  const { onNewMessage, onMessageRead, onUserTyping } = useRealtimeMessages(threadId)
  
  // Ref para evitar re-renders innecesarios
  const lastMessageIdRef = useRef<string | null>(null)

  // Manejar nuevos mensajes
  useEffect(() => {
    const cleanup = onNewMessage((data) => {
      if (data.threadId !== threadId) return

      const newMessage: Message = {
        id: data.messageId,
        content: data.content,
        senderId: data.sender,
        senderName: data.sender, // En producción, obtener nombre real
        senderType: 'CUSTOMER', // Determinar basado en el sender
        messageType: 'text',
        sentAt: new Date(data.timestamp),
        deliveredAt: new Date(data.timestamp),
        threadId: data.threadId
      }

      setMessages(prev => {
        // Evitar duplicados
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })

      // Incrementar contador de no leídos si no es del usuario actual
      setUnreadCount(prev => prev + 1)
    })

    return cleanup
  }, [threadId, onNewMessage])

  // Manejar mensajes leídos
  useEffect(() => {
    const cleanup = onMessageRead((data) => {
      if (data.threadId !== threadId) return

      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId 
            ? { 
                ...msg, 
                readAt: new Date(data.readAt),
                readBy: data.readBy
              }
            : msg
        )
      )
    })

    return cleanup
  }, [threadId, onMessageRead])

  // Manejar indicadores de escritura
  useEffect(() => {
    const cleanup = onUserTyping((data) => {
      if (data.threadId !== threadId) return

      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId)
        if (data.isTyping) {
          return [...filtered, {
            userId: data.userId,
            userName: data.userName,
            isTyping: true
          }]
        }
        return filtered
      })
    })

    return cleanup
  }, [threadId, onUserTyping])

  // Limpiar indicadores de escritura después de 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setTypingUsers(prev => prev.filter(user => !user.isTyping))
    }, 3000)

    return () => clearTimeout(timer)
  }, [typingUsers])

  // Agregar nuevo mensaje (para cuando el usuario envía)
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Actualizar mensaje existente
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    )
  }, [])

  // Eliminar mensaje
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // Marcar mensaje como leído
  const markMessageAsRead = useCallback((messageId: string, readBy: string) => {
    updateMessage(messageId, {
      readAt: new Date(),
      readBy
    })
  }, [updateMessage])

  // Marcar todos los mensajes como leídos
  const markAllAsRead = useCallback((readBy: string) => {
    setMessages(prev => 
      prev.map(msg => ({
        ...msg,
        readAt: msg.readAt || new Date(),
        readBy: msg.readBy || readBy
      }))
    )
    setUnreadCount(0)
  }, [])

  // Cargar más mensajes (para paginación)
  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      // Aquí implementarías la lógica para cargar más mensajes
      // Por ahora, simulamos que no hay más mensajes
      setHasMore(false)
    } catch (error) {
      console.error('Error loading more messages:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore])

  // Obtener mensajes ordenados por fecha
  const getSortedMessages = useCallback(() => {
    return [...messages].sort((a, b) => 
      a.sentAt.getTime() - b.sentAt.getTime()
    )
  }, [messages])

  // Obtener mensajes no leídos
  const getUnreadMessages = useCallback(() => {
    return messages.filter(msg => !msg.readAt)
  }, [messages])

  // Obtener mensajes por tipo
  const getMessagesByType = useCallback((type: Message['messageType']) => {
    return messages.filter(msg => msg.messageType === type)
  }, [messages])

  // Obtener mensajes con adjuntos
  const getMessagesWithAttachments = useCallback(() => {
    return messages.filter(msg => msg.attachments && msg.attachments.length > 0)
  }, [messages])

  // Obtener estadísticas de mensajes
  const getMessageStats = useCallback(() => {
    const total = messages.length
    const unread = messages.filter(msg => !msg.readAt).length
    const withAttachments = messages.filter(msg => msg.attachments && msg.attachments.length > 0).length
    const byType = messages.reduce((acc, msg) => {
      acc[msg.messageType] = (acc[msg.messageType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total,
      unread,
      withAttachments,
      byType
    }
  }, [messages])

  return {
    messages,
    typingUsers,
    isLoading,
    hasMore,
    unreadCount,
    isConnected,
    addMessage,
    updateMessage,
    removeMessage,
    markMessageAsRead,
    markAllAsRead,
    loadMoreMessages,
    getSortedMessages,
    getUnreadMessages,
    getMessagesByType,
    getMessagesWithAttachments,
    getMessageStats
  }
}

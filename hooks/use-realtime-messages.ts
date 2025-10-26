"use client"

import { useEffect, useState, useCallback } from 'react'
import { useMessageEvents } from '@/contexts/socket-context'
import { useSocket } from '@/contexts/socket-context'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
  channelType: string
  isRead?: boolean
}

interface TypingUser {
  userId: string
  userName: string
  isTyping: boolean
}

export function useRealtimeMessages(threadId: string) {
  const { socket } = useSocket()
  const { onNewMessage, onMessageRead, onUserTyping } = useMessageEvents()
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)

  // Manejar nuevos mensajes
  useEffect(() => {
    const cleanup = onNewMessage((data) => {
      if (data.threadId === threadId) {
        const newMessage: Message = {
          id: data.messageId,
          content: data.content,
          sender: data.sender,
          timestamp: data.timestamp,
          channelType: data.channelType,
          isRead: false
        }
        
        setMessages(prev => [...prev, newMessage])
        
        // Mostrar notificación si no es el usuario actual
        toast.info(`Nuevo mensaje de ${data.sender}`)
      }
    })

    return cleanup
  }, [threadId, onNewMessage])

  // Manejar mensajes leídos
  useEffect(() => {
    const cleanup = onMessageRead((data) => {
      if (data.threadId === threadId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === data.messageId 
              ? { ...msg, isRead: true }
              : msg
          )
        )
      }
    })

    return cleanup
  }, [threadId, onMessageRead])

  // Manejar indicadores de escritura
  useEffect(() => {
    const cleanup = onUserTyping((data) => {
      if (data.threadId === threadId) {
        setTypingUsers(prev => {
          const filtered = prev.filter(user => user.userId !== data.userId)
          if (data.isTyping) {
            return [...filtered, { userId: data.userId, userName: data.userName, isTyping: true }]
          }
          return filtered
        })
      }
    })

    return cleanup
  }, [threadId, onUserTyping])

  // Enviar indicador de escritura
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socket && threadId) {
      socket.emit('typing', { threadId, isTyping })
      setIsTyping(isTyping)
    }
  }, [socket, threadId])

  // Marcar mensaje como leído
  const markMessageAsRead = useCallback((messageId: string) => {
    if (socket && threadId) {
      socket.emit('mark-message-read', { threadId, messageId })
    }
  }, [socket, threadId])

  // Limpiar indicadores de escritura después de un tiempo
  useEffect(() => {
    const timer = setTimeout(() => {
      setTypingUsers(prev => prev.filter(user => !user.isTyping))
    }, 3000)

    return () => clearTimeout(timer)
  }, [typingUsers])

  return {
    messages,
    typingUsers,
    isTyping,
    sendTypingIndicator,
    markMessageAsRead
  }
}

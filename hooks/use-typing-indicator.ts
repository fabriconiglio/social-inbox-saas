"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSocket } from '@/contexts/socket-context'
import { sendTypingIndicator } from '@/app/actions/messages'

interface TypingUser {
  userId: string
  userName: string
  isTyping: boolean
  lastTyping: number
}

export function useTypingIndicator(threadId: string, tenantId: string) {
  const { socket } = useSocket()
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingRef = useRef<number>(0)

  // Manejar indicadores de escritura de otros usuarios
  useEffect(() => {
    if (!socket) return

    const handleUserTyping = (data: {
      threadId: string
      userId: string
      userName: string
      isTyping: boolean
    }) => {
      if (data.threadId !== threadId) return

      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId)
        
        if (data.isTyping) {
          return [...filtered, {
            userId: data.userId,
            userName: data.userName,
            isTyping: true,
            lastTyping: Date.now()
          }]
        }
        
        return filtered
      })
    }

    socket.on('user-typing', handleUserTyping)

    return () => {
      socket.off('user-typing', handleUserTyping)
    }
  }, [socket, threadId])

  // Limpiar indicadores de escritura después de 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => 
        prev.filter(user => now - user.lastTyping < 3000)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Enviar indicador de escritura
  const sendTyping = useCallback(async (isTyping: boolean) => {
    const now = Date.now()
    
    // Evitar spam - solo enviar si han pasado al menos 500ms desde el último envío
    if (isTyping && now - lastTypingRef.current < 500) {
      return
    }
    
    lastTypingRef.current = now

    try {
      await sendTypingIndicator({
        threadId,
        isTyping,
        tenantId
      })
      
      setIsTyping(isTyping)
    } catch (error) {
      console.error('Error enviando indicador de escritura:', error)
    }
  }, [threadId, tenantId])

  // Manejar cambio en el input de texto
  const handleInputChange = useCallback((value: string) => {
    if (value.length > 0 && !isTyping) {
      sendTyping(true)
    } else if (value.length === 0 && isTyping) {
      sendTyping(false)
    }
  }, [isTyping, sendTyping])

  // Manejar cuando el usuario deja de escribir
  const handleInputBlur = useCallback(() => {
    if (isTyping) {
      sendTyping(false)
    }
  }, [isTyping, sendTyping])

  // Limpiar indicador de escritura cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (isTyping) {
        sendTyping(false)
      }
    }
  }, [isTyping, sendTyping])

  // Obtener texto de usuarios escribiendo
  const getTypingText = useCallback(() => {
    const activeTyping = typingUsers.filter(user => user.isTyping)
    
    if (activeTyping.length === 0) return ''
    if (activeTyping.length === 1) {
      return `${activeTyping[0].userName} está escribiendo...`
    }
    if (activeTyping.length === 2) {
      return `${activeTyping[0].userName} y ${activeTyping[1].userName} están escribiendo...`
    }
    return `${activeTyping.length} personas están escribiendo...`
  }, [typingUsers])

  return {
    typingUsers,
    isTyping,
    typingText: getTypingText(),
    sendTyping,
    handleInputChange,
    handleInputBlur
  }
}

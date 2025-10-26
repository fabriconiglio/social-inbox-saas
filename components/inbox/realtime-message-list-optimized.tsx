"use client"

import React, { memo, useMemo, useRef, useEffect } from 'react'
import { useRealtimeMessageList } from '@/hooks/use-realtime-message-list'
import { TypingIndicator } from '@/components/ui/typing-indicator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface RealtimeMessageListOptimizedProps {
  initialMessages: Message[]
  threadId: string
  tenantId: string
  currentUserId: string
  className?: string
}

// Componente memoizado para cada mensaje individual
const MessageItem = memo(({ 
  message, 
  isFromCurrentUser,
  showAvatar = true 
}: {
  message: Message
  isFromCurrentUser: boolean
  showAvatar?: boolean
}) => {
  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusIcon = (message: Message) => {
    if (!isFromCurrentUser) return null

    if (message.readAt) {
      return <CheckCheck className="h-3 w-3 text-blue-600" />
    } else if (message.deliveredAt) {
      return <CheckCheck className="h-3 w-3 text-gray-400" />
    } else {
      return <Check className="h-3 w-3 text-gray-400" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isFromCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {showAvatar && !isFromCurrentUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-xs">
            {message.senderName?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Contenido del mensaje */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isFromCurrentUser ? "items-end" : "items-start"
      )}>
        {/* Nombre del remitente (solo para mensajes de otros) */}
        {!isFromCurrentUser && (
          <span className="text-xs text-muted-foreground mb-1">
            {message.senderName}
          </span>
        )}

        {/* Burbuja del mensaje */}
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isFromCurrentUser 
            ? "bg-blue-600 text-white" 
            : "bg-muted text-foreground"
        )}>
          {/* Contenido del mensaje */}
          {message.messageType === 'text' ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getMessageIcon(message.messageType)}
                <span className="font-medium">
                  {message.messageType === 'image' && 'Imagen'}
                  {message.messageType === 'video' && 'Video'}
                  {message.messageType === 'document' && 'Documento'}
                  {message.messageType === 'audio' && 'Audio'}
                </span>
              </div>
              
              {/* Adjuntos */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-1">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-black/10 rounded">
                      <div className="flex items-center gap-2 min-w-0">
                        {getMessageIcon(attachment.type)}
                        <span className="text-xs truncate">
                          {attachment.filename || `Archivo ${index + 1}`}
                        </span>
                        {attachment.size && (
                          <span className="text-xs opacity-70">
                            ({formatFileSize(attachment.size)})
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(attachment.url, '_blank')}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp y estado */}
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
          isFromCurrentUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span>
            {formatDistanceToNow(message.sentAt, { 
              addSuffix: true, 
              locale: es 
            })}
          </span>
          {getStatusIcon(message)}
        </div>
      </div>

      {/* Avatar para mensajes del usuario actual (más pequeño) */}
      {showAvatar && isFromCurrentUser && (
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-xs">
            {message.senderName?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
})

MessageItem.displayName = 'MessageItem'

export function RealtimeMessageListOptimized({ 
  initialMessages, 
  threadId, 
  tenantId, 
  currentUserId,
  className 
}: RealtimeMessageListOptimizedProps) {
  const {
    messages,
    typingUsers,
    isLoading,
    hasMore,
    unreadCount,
    isConnected,
    getSortedMessages,
    markAllAsRead
  } = useRealtimeMessageList({ initialMessages, threadId, tenantId })

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Memoizar mensajes ordenados
  const sortedMessages = useMemo(() => getSortedMessages(), [getSortedMessages])

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages.length])

  // Marcar mensajes como leídos cuando se ve el thread
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead(currentUserId)
    }
  }, [unreadCount, markAllAsRead, currentUserId])

  // Agrupar mensajes consecutivos del mismo remitente
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      senderId: string
      senderName: string
      senderType: 'AGENT' | 'CUSTOMER'
      messages: Message[]
    }> = []

    sortedMessages.forEach((message, index) => {
      const prevMessage = sortedMessages[index - 1]
      
      if (
        prevMessage && 
        prevMessage.senderId === message.senderId &&
        prevMessage.senderType === message.senderType
      ) {
        // Agregar al grupo existente
        groups[groups.length - 1].messages.push(message)
      } else {
        // Crear nuevo grupo
        groups.push({
          senderId: message.senderId,
          senderName: message.senderName,
          senderType: message.senderType,
          messages: [message]
        })
      }
    })

    return groups
  }, [sortedMessages])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header con estadísticas */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Tiempo real' : 'Desconectado'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{messages.length} mensajes</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} no leídos
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Lista de mensajes */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-1">
          {groupedMessages.map((group, groupIndex) => 
            group.messages.map((message, messageIndex) => (
              <MessageItem
                key={message.id}
                message={message}
                isFromCurrentUser={message.senderId === currentUserId}
                showAvatar={messageIndex === 0} // Solo mostrar avatar en el primer mensaje del grupo
              />
            ))
          )}
          
          {/* Indicador de escritura */}
          <TypingIndicator 
            users={typingUsers}
            className="mb-4"
          />
          
          {/* Referencia para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Footer con controles */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isConnected ? 'Conectado en tiempo real' : 'Modo offline'}
          </span>
          {isLoading && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              <span>Cargando más mensajes...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

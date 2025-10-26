"use client"

import React, { memo, useMemo } from 'react'
import { useRealtimeThreadList } from '@/hooks/use-realtime-thread-list'
import { ThreadTypingIndicator } from '@/components/ui/typing-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertTriangle,
  Users,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface RealtimeThreadListOptimizedProps {
  initialThreads: Thread[]
  tenantId: string
  onThreadSelect?: (threadId: string) => void
  selectedThreadId?: string
  className?: string
}

// Componente memoizado para cada thread individual
const ThreadItem = memo(({ 
  thread, 
  isSelected, 
  isTyping, 
  onSelect 
}: {
  thread: Thread
  isSelected: boolean
  isTyping: boolean
  onSelect: (threadId: string) => void
}) => {
  const handleClick = () => {
    onSelect(thread.id)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Circle className="h-3 w-3" />
      case 'PENDING':
        return <Clock className="h-3 w-3" />
      case 'CLOSED':
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return <Circle className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getChannelIcon = (channelType: string) => {
    switch (channelType.toLowerCase()) {
      case 'whatsapp':
        return '📱'
      case 'instagram':
        return '📸'
      case 'facebook':
        return '👥'
      case 'tiktok':
        return '🎵'
      case 'telegram':
        return '✈️'
      default:
        return '💬'
    }
  }

  return (
    <div
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50",
        isSelected && "bg-blue-50 border-blue-200 shadow-sm",
        thread.unreadCount > 0 && "border-l-4 border-l-blue-500"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header con avatar y info básica */}
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={thread.contact.image || undefined} />
              <AvatarFallback className="text-xs">
                {thread.contact.name?.[0]?.toUpperCase() || thread.contact.handle?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{thread.subject}</h3>
                {thread.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                    {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                  </Badge>
                )}
                {isTyping && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    Escribiendo...
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{thread.contact.name || thread.contact.handle}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span>{getChannelIcon(thread.channel.type)}</span>
                  <span>{thread.channel.displayName}</span>
                </span>
                <span>•</span>
                <span>{thread.local.name}</span>
              </div>
            </div>
          </div>

          {/* Timestamp y última actividad */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>
              {thread.lastMessageAt 
                ? formatDistanceToNow(thread.lastMessageAt, { 
                    addSuffix: true, 
                    locale: es 
                  })
                : formatDistanceToNow(thread.createdAt, { 
                    addSuffix: true, 
                    locale: es 
                  })
              }
            </span>
            {isTyping && (
              <ThreadTypingIndicator 
                threadId={thread.id}
                typingUsers={[{ userId: '1', userName: 'Usuario', isTyping: true }]}
                className="text-blue-600"
              />
            )}
          </div>

          {/* Badges de estado y prioridad */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn("text-xs", getStatusColor(thread.status))}
            >
              {getStatusIcon(thread.status)}
              <span className="ml-1">{thread.status}</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className={cn("text-xs", getPriorityColor(thread.priority))}
            >
              {thread.priority}
            </Badge>

            {thread.assigneeId && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Asignado
              </Badge>
            )}

            {thread.priority === 'HIGH' && (
              <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgente
              </Badge>
            )}
          </div>
        </div>

        {/* Botón de acciones */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})

ThreadItem.displayName = 'ThreadItem'

export function RealtimeThreadListOptimized({ 
  initialThreads, 
  tenantId, 
  onThreadSelect,
  selectedThreadId,
  className 
}: RealtimeThreadListOptimizedProps) {
  const {
    threads,
    typingThreads,
    isConnected,
    getSortedThreads,
    getTotalUnreadCount,
    markThreadAsRead
  } = useRealtimeThreadList({ initialThreads, tenantId })

  // Memoizar threads ordenados para evitar re-renders innecesarios
  const sortedThreads = useMemo(() => getSortedThreads(), [getSortedThreads])
  
  // Memoizar contador total de no leídos
  const totalUnreadCount = useMemo(() => getTotalUnreadCount(), [getTotalUnreadCount])

  // Memoizar threads con indicador de escritura
  const threadsWithTyping = useMemo(() => {
    return sortedThreads.map(thread => ({
      ...thread,
      isTyping: typingThreads.has(thread.id)
    }))
  }, [sortedThreads, typingThreads])

  const handleThreadSelect = (threadId: string) => {
    markThreadAsRead(threadId)
    onThreadSelect?.(threadId)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header con estadísticas */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Tiempo real activo' : 'Desconectado'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{threads.length} threads</span>
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {totalUnreadCount} no leídos
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Lista de threads */}
      <div className="space-y-2">
        {threadsWithTyping.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isSelected={selectedThreadId === thread.id}
            isTyping={thread.isTyping}
            onSelect={handleThreadSelect}
          />
        ))}
      </div>

      {/* Mensaje si no hay threads */}
      {threads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay threads disponibles</p>
          {!isConnected && (
            <p className="text-xs mt-1">Conecta para recibir actualizaciones en tiempo real</p>
          )}
        </div>
      )}
    </div>
  )
}

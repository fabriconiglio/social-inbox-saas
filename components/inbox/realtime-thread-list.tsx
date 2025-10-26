"use client"

import React, { useEffect, useState } from 'react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { useRealtimeThreadUpdates } from '@/hooks/use-realtime-thread-updates'
import { useSocketConnection } from '@/hooks/use-socket-connection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle, Users, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Thread {
  id: string
  subject: string
  status: string
  priority: string
  assigneeId: string | null
  lastMessageAt: Date | null
  unreadCount: number
  contact: {
    name: string
    handle: string
  }
  channel: {
    type: string
    displayName: string
  }
}

interface RealtimeThreadListProps {
  threads: Thread[]
  tenantId: string
  onThreadUpdate?: (threadId: string, updates: Partial<Thread>) => void
  className?: string
}

export function RealtimeThreadList({ 
  threads, 
  tenantId, 
  onThreadUpdate,
  className 
}: RealtimeThreadListProps) {
  const [updatedThreads, setUpdatedThreads] = useState<Thread[]>(threads)
  const [typingThreads, setTypingThreads] = useState<Set<string>>(new Set())
  const [newMessages, setNewMessages] = useState<Map<string, number>>(new Map())

  // Hook para conexión Socket.IO
  const { isConnected } = useSocketConnection({ tenantId })

  // Hook para actualizaciones de threads
  const { threadUpdates } = useRealtimeThreadUpdates()

  // Actualizar threads cuando llegan actualizaciones
  useEffect(() => {
    if (threadUpdates.length > 0) {
      const latestUpdate = threadUpdates[0]
      
      setUpdatedThreads(prev => 
        prev.map(thread => 
          thread.id === latestUpdate.threadId 
            ? { 
                ...thread, 
                ...latestUpdate.changes,
                lastMessageAt: new Date(latestUpdate.timestamp)
              }
            : thread
        )
      )

      // Notificar al componente padre
      if (onThreadUpdate) {
        onThreadUpdate(latestUpdate.threadId, latestUpdate.changes)
      }

      // Mostrar notificación
      if (latestUpdate.changes.status) {
        toast.info(`Thread actualizado`, {
          description: `Estado cambiado a: ${latestUpdate.changes.status}`
        })
      }
    }
  }, [threadUpdates, onThreadUpdate])

  // Manejar nuevos mensajes para cada thread
  const handleNewMessage = (threadId: string) => {
    setNewMessages(prev => {
      const current = prev.get(threadId) || 0
      return new Map(prev).set(threadId, current + 1)
    })
  }

  // Manejar indicadores de escritura
  const handleTyping = (threadId: string, isTyping: boolean) => {
    setTypingThreads(prev => {
      const newSet = new Set(prev)
      if (isTyping) {
        newSet.add(threadId)
      } else {
        newSet.delete(threadId)
      }
      return newSet
    })
  }

  // Obtener thread por ID
  const getThread = (threadId: string) => {
    return updatedThreads.find(t => t.id === threadId)
  }

  // Obtener contador de mensajes no leídos
  const getUnreadCount = (threadId: string) => {
    return newMessages.get(threadId) || 0
  }

  // Verificar si hay alguien escribiendo
  const isTyping = (threadId: string) => {
    return typingThreads.has(threadId)
  }

  // Obtener color del badge según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Obtener color del badge según la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={className}>
      {/* Indicador de conexión */}
      <div className="mb-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
            </span>
          </div>
          <Badge variant="outline">
            {updatedThreads.length} threads
          </Badge>
        </div>
      </div>

      {/* Lista de threads */}
      <div className="space-y-2">
        {updatedThreads.map((thread) => (
          <div
            key={thread.id}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium truncate">{thread.subject}</h3>
                  {getUnreadCount(thread.id) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {getUnreadCount(thread.id)}
                    </Badge>
                  )}
                  {isTyping(thread.id) && (
                    <Badge variant="outline" className="text-xs animate-pulse">
                      Escribiendo...
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>{thread.contact.name}</span>
                  <span>•</span>
                  <span>{thread.channel.displayName}</span>
                  {thread.lastMessageAt && (
                    <>
                      <span>•</span>
                      <span>{thread.lastMessageAt.toLocaleTimeString()}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(thread.status)}`}
                  >
                    {thread.status}
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriorityColor(thread.priority)}`}
                  >
                    {thread.priority}
                  </Badge>

                  {thread.assigneeId && (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Asignado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje si no hay threads */}
      {updatedThreads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay threads disponibles</p>
        </div>
      )}
    </div>
  )
}

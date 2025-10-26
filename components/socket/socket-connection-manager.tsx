"use client"

import { useEffect, useState } from 'react'
import { useSocket } from '@/contexts/socket-context'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { useRealtimePresence } from '@/hooks/use-realtime-presence'
import { useRealtimeThreadUpdates } from '@/hooks/use-realtime-thread-updates'
import { ConnectionIndicator } from '@/components/layout/connection-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'

interface SocketConnectionManagerProps {
  tenantId: string
  currentThreadId?: string
  className?: string
}

export function SocketConnectionManager({ 
  tenantId, 
  currentThreadId,
  className 
}: SocketConnectionManagerProps) {
  const { socket, isConnected, connectionError } = useSocket()
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastConnected, setLastConnected] = useState<Date | null>(null)

  // Hooks para funcionalidades de tiempo real
  useRealtimeMessages(currentThreadId || '')
  useRealtimeNotifications()
  useRealtimePresence()
  useRealtimeThreadUpdates(currentThreadId)

  // Manejar cambios de estado de conexión
  useEffect(() => {
    if (isConnected) {
      setReconnectAttempts(0)
      setIsReconnecting(false)
      setLastConnected(new Date())
      
      if (reconnectAttempts > 0) {
        toast.success('Reconectado al servidor', {
          description: 'La conexión en tiempo real se ha restaurado'
        })
      }
    } else if (connectionError) {
      setIsReconnecting(false)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar al servidor en tiempo real'
      })
    }
  }, [isConnected, connectionError, reconnectAttempts])

  // Manejar reconexión automática
  useEffect(() => {
    if (!isConnected && !connectionError && !isReconnecting) {
      const timer = setTimeout(() => {
        setIsReconnecting(true)
        setReconnectAttempts(prev => prev + 1)
        
        // Intentar reconectar
        if (socket) {
          socket.connect()
        }
      }, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)) // Backoff exponencial, máximo 30s

      return () => clearTimeout(timer)
    }
  }, [isConnected, connectionError, isReconnecting, reconnectAttempts, socket])

  // Función para reconectar manualmente
  const handleManualReconnect = () => {
    if (socket && !isReconnecting) {
      setIsReconnecting(true)
      setReconnectAttempts(0)
      socket.connect()
    }
  }

  // Función para desconectar manualmente
  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect()
    }
  }

  // Función para conectar manualmente
  const handleConnect = () => {
    if (socket) {
      socket.connect()
    }
  }

  // Obtener estado de conexión
  const getConnectionStatus = () => {
    if (isConnected) {
      return {
        status: 'connected',
        text: 'Conectado',
        icon: Wifi,
        color: 'bg-green-100 text-green-800 border-green-200'
      }
    }
    
    if (isReconnecting) {
      return {
        status: 'reconnecting',
        text: 'Reconectando...',
        icon: RefreshCw,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    }
    
    if (connectionError) {
      return {
        status: 'error',
        text: 'Desconectado',
        icon: WifiOff,
        color: 'bg-red-100 text-red-800 border-red-200'
      }
    }
    
    return {
      status: 'disconnected',
      text: 'Desconectado',
      icon: WifiOff,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const connectionStatus = getConnectionStatus()
  const StatusIcon = connectionStatus.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Indicador de estado */}
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${connectionStatus.color}`}
      >
        <StatusIcon 
          className={`h-3 w-3 ${
            isReconnecting ? 'animate-spin' : ''
          }`} 
        />
        {connectionStatus.text}
      </Badge>

      {/* Información adicional */}
      {lastConnected && isConnected && (
        <span className="text-xs text-muted-foreground">
          Conectado desde {lastConnected.toLocaleTimeString()}
        </span>
      )}

      {/* Botones de control */}
      <div className="flex items-center gap-1">
        {!isConnected && !isReconnecting && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleConnect}
            className="h-6 px-2 text-xs"
          >
            Conectar
          </Button>
        )}
        
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="h-6 px-2 text-xs"
          >
            Desconectar
          </Button>
        )}
        
        {connectionError && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualReconnect}
            disabled={isReconnecting}
            className="h-6 px-2 text-xs"
          >
            {isReconnecting ? 'Reconectando...' : 'Reintentar'}
          </Button>
        )}
      </div>

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-muted-foreground">
          Intentos: {reconnectAttempts}
        </div>
      )}
    </div>
  )
}

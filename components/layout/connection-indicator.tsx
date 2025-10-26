"use client"

import { useSocket } from '@/contexts/socket-context'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export function ConnectionIndicator() {
  const { isConnected, connectionError } = useSocket()

  if (connectionError) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Error de conexión
      </Badge>
    )
  }

  if (isConnected) {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
        <Wifi className="h-3 w-3" />
        Conectado
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <WifiOff className="h-3 w-3" />
      Desconectado
    </Badge>
  )
}

"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocketConnection } from '@/hooks/use-socket-connection'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

interface UseRealtimeDataOptions {
  tenantId: string
  enableNotifications?: boolean
  enablePresence?: boolean
  refreshInterval?: number // Solo como fallback, no debería usarse
}

export function useRealtimeData({
  tenantId,
  enableNotifications = true,
  enablePresence = true,
  refreshInterval = 0 // 0 = deshabilitado por defecto
}: UseRealtimeDataOptions) {
  const { isConnected } = useSocketConnection({ tenantId })
  const { 
    notifications, 
    unreadCount, 
    criticalAlerts 
  } = useRealtimeNotifications()
  
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Función para actualizar timestamp de última actualización
  const updateLastActivity = useCallback(() => {
    setLastUpdate(new Date())
  }, [])

  // Función para simular actualización de datos (reemplaza polling)
  const refreshData = useCallback(async () => {
    if (!isConnected) return

    try {
      setIsPolling(true)
      // Aquí normalmente harías fetch de datos
      // Pero con Socket.IO, esto no debería ser necesario
      updateLastActivity()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsPolling(false)
    }
  }, [isConnected, updateLastActivity])

  // Polling de fallback solo si está desconectado y se especifica intervalo
  useEffect(() => {
    if (isConnected || refreshInterval === 0) {
      // Limpiar polling si está conectado o no se especifica intervalo
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Solo usar polling como fallback cuando esté desconectado
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refreshData()
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [isConnected, refreshInterval, refreshData])

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Función para forzar actualización manual
  const forceRefresh = useCallback(() => {
    refreshData()
  }, [refreshData])

  // Función para verificar si los datos están actualizados
  const isDataFresh = useCallback((maxAgeMinutes: number = 5) => {
    const now = new Date()
    const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)
    return ageMinutes <= maxAgeMinutes
  }, [lastUpdate])

  // Función para obtener estadísticas de actualización
  const getUpdateStats = useCallback(() => {
    const now = new Date()
    const ageSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000)
    
    return {
      lastUpdate,
      ageSeconds,
      isConnected,
      isPolling,
      hasNotifications: notifications.length > 0,
      unreadCount,
      criticalAlerts: criticalAlerts.length
    }
  }, [lastUpdate, isConnected, isPolling, notifications.length, unreadCount, criticalAlerts.length])

  return {
    // Estado de conexión
    isConnected,
    isPolling,
    
    // Datos en tiempo real
    notifications,
    unreadCount,
    criticalAlerts,
    
    // Control de actualizaciones
    lastUpdate,
    updateLastActivity,
    forceRefresh,
    isDataFresh,
    getUpdateStats,
    
    // Configuración
    tenantId
  }
}

// Hook específico para reemplazar polling en listas
export function useRealtimeListData<T>({
  initialData,
  tenantId,
  dataKey,
  refreshInterval = 0
}: {
  initialData: T[]
  tenantId: string
  dataKey: string
  refreshInterval?: number
}) {
  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date>(new Date())
  
  const { isConnected, forceRefresh } = useRealtimeData({ 
    tenantId, 
    refreshInterval 
  })

  // Función para actualizar datos (llamada por eventos Socket.IO)
  const updateData = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
    setData(prev => typeof newData === 'function' ? newData(prev) : newData)
    setLastFetch(new Date())
  }, [])

  // Función para agregar un elemento
  const addItem = useCallback((item: T) => {
    setData(prev => [item, ...prev])
    setLastFetch(new Date())
  }, [])

  // Función para actualizar un elemento
  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setData(prev => prev.map(item => 
      (item as any).id === id ? { ...item, ...updates } : item
    ))
    setLastFetch(new Date())
  }, [])

  // Función para eliminar un elemento
  const removeItem = useCallback((id: string) => {
    setData(prev => prev.filter(item => (item as any).id !== id))
    setLastFetch(new Date())
  }, [])

  // Función para refrescar manualmente
  const refresh = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await forceRefresh()
      // Aquí normalmente harías fetch de datos
      // Pero con Socket.IO, esto no debería ser necesario
    } catch (error) {
      console.error(`Error refreshing ${dataKey}:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, forceRefresh, dataKey])

  return {
    data,
    isLoading,
    lastFetch,
    isConnected,
    updateData,
    addItem,
    updateItem,
    removeItem,
    refresh
  }
}

// Hook para reemplazar polling en contadores
export function useRealtimeCounter({
  initialValue = 0,
  tenantId,
  counterKey
}: {
  initialValue?: number
  tenantId: string
  counterKey: string
}) {
  const [count, setCount] = useState(initialValue)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const { isConnected } = useSocketConnection({ tenantId })

  // Función para incrementar contador
  const increment = useCallback((amount: number = 1) => {
    setCount(prev => prev + amount)
    setLastUpdate(new Date())
  }, [])

  // Función para decrementar contador
  const decrement = useCallback((amount: number = 1) => {
    setCount(prev => Math.max(0, prev - amount))
    setLastUpdate(new Date())
  }, [])

  // Función para establecer contador
  const setCounter = useCallback((value: number) => {
    setCount(value)
    setLastUpdate(new Date())
  }, [])

  // Función para resetear contador
  const reset = useCallback(() => {
    setCount(initialValue)
    setLastUpdate(new Date())
  }, [initialValue])

  return {
    count,
    lastUpdate,
    isConnected,
    increment,
    decrement,
    setCounter,
    reset
  }
}

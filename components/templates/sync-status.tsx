"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  Settings,
  ExternalLink
} from "lucide-react"

interface SyncStatusProps {
  tenantId: string
  channelType: string
  onSync: () => void
  onConfigure: () => void
}

interface SyncStats {
  lastSync?: Date
  totalTemplates: number
  approvedTemplates: number
  pendingTemplates: number
  rejectedTemplates: number
  needsSync: boolean
}

export function SyncStatus({ tenantId, channelType, onSync, onConfigure }: SyncStatusProps) {
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadSyncStats()
  }, [tenantId, channelType])

  const loadSyncStats = async () => {
    try {
      setLoading(true)
      // TODO: Implementar carga real de estadísticas
      // Por ahora simulamos datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        totalTemplates: 15,
        approvedTemplates: 12,
        pendingTemplates: 2,
        rejectedTemplates: 1,
        needsSync: true
      })
    } catch (error) {
      console.error("[Sync Status] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    try {
      setSyncing(true)
      await onSync()
      await loadSyncStats()
    } catch (error) {
      console.error("[Sync] Error:", error)
    } finally {
      setSyncing(false)
    }
  }

  const getLastSyncText = () => {
    if (!stats?.lastSync) return "Nunca sincronizado"
    
    const now = new Date()
    const diff = now.getTime() - stats.lastSync.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `Hace ${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `Hace ${minutes}m`
    } else {
      return "Hace menos de 1 minuto"
    }
  }

  const getSyncStatus = () => {
    if (!stats) return "unknown"
    if (stats.needsSync) return "needs-sync"
    if (stats.lastSync) {
      const hoursSinceSync = (Date.now() - stats.lastSync.getTime()) / (1000 * 60 * 60)
      if (hoursSinceSync > 24) return "outdated"
      return "up-to-date"
    }
    return "never-synced"
  }

  const getStatusBadge = () => {
    const status = getSyncStatus()
    
    switch (status) {
      case "up-to-date":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Actualizado
          </Badge>
        )
      case "needs-sync":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Necesita sincronización
          </Badge>
        )
      case "outdated":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Desactualizado
          </Badge>
        )
      case "never-synced":
        return (
          <Badge variant="outline">
            <Download className="h-3 w-3 mr-1" />
            Sin sincronizar
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Desconocido
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Estado de Sincronización
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Última sincronización: {getLastSyncText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <>
            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalTemplates}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.approvedTemplates}</div>
                <div className="text-xs text-muted-foreground">Aprobadas</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingTemplates}</div>
                <div className="text-xs text-muted-foreground">Pendientes</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.rejectedTemplates}</div>
                <div className="text-xs text-muted-foreground">Rechazadas</div>
              </div>
            </div>

            {/* Progreso de aprobación */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Plantillas aprobadas</span>
                <span>{stats.approvedTemplates}/{stats.totalTemplates}</span>
              </div>
              <Progress 
                value={(stats.approvedTemplates / stats.totalTemplates) * 100} 
                className="h-2"
              />
            </div>
          </>
        )}

        {/* Alertas */}
        {getSyncStatus() === "never-synced" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se ha realizado ninguna sincronización. Configura las credenciales y sincroniza las plantillas.
            </AlertDescription>
          </Alert>
        )}

        {getSyncStatus() === "outdated" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              La última sincronización fue hace más de 24 horas. Se recomienda sincronizar para obtener las plantillas más recientes.
            </AlertDescription>
          </Alert>
        )}

        {getSyncStatus() === "needs-sync" && (
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              Hay cambios pendientes en Meta Business. Sincroniza para obtener las plantillas actualizadas.
            </AlertDescription>
          </Alert>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? "Sincronizando..." : "Sincronizar Ahora"}
          </Button>
          <Button
            variant="outline"
            onClick={onConfigure}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Canal:</strong> {channelType}</p>
          <p><strong>Tenant:</strong> {tenantId}</p>
          <div className="flex items-center gap-1">
            <span>Documentación:</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => window.open("https://developers.facebook.com/docs/whatsapp/business-management-api", "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Meta Business API
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}









"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Activity, 
  User, 
  Clock, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  Filter,
  Search,
  RefreshCw
} from "lucide-react"
import { getAuditHistory } from "@/app/actions/audit-log"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId: string
  diffJSON: Record<string, any>
  createdAt: string
  actor: {
    id: string
    name: string
    email: string
    image?: string
  } | null
}

interface AuditLogHistoryProps {
  tenantId: string
  entity?: string
  entityId?: string
  limit?: number
  className?: string
  compact?: boolean
  showFilters?: boolean
  onFiltersChange?: (filters: AuditLogFilters) => void
}

interface AuditLogFilters {
  entity?: string
  entityId?: string
  action?: string
  actor?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}

export function AuditLogHistory({ 
  tenantId, 
  entity = "all", 
  entityId = "all", 
  limit = 20,
  className,
  compact = false,
  showFilters = false,
  onFiltersChange
}: AuditLogHistoryProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>("")

  useEffect(() => {
    loadAuditHistory()
  }, [tenantId, entity, entityId, limit])

  const loadAuditHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getAuditHistory(tenantId, entity, entityId, limit)
      
      if (result.success) {
        setLogs(result.data)
      } else {
        setError(result.error || "Error al cargar historial")
      }
    } catch (err) {
      console.error("[AuditLogHistory] Error:", err)
      setError("Error al cargar historial de auditoría")
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getActionIcon = (action: string) => {
    if (action.includes("created")) return "➕"
    if (action.includes("updated")) return "✏️"
    if (action.includes("deleted")) return "🗑️"
    if (action.includes("assigned")) return "👤"
    if (action.includes("status")) return "📊"
    if (action.includes("credentials")) return "🔐"
    if (action.includes("approved")) return "✅"
    if (action.includes("rejected")) return "❌"
    if (action.includes("synced")) return "🔄"
    if (action.includes("used")) return "🎯"
    return "📝"
  }

  const getActionColor = (action: string) => {
    if (action.includes("created")) return "bg-green-100 text-green-800"
    if (action.includes("updated")) return "bg-blue-100 text-blue-800"
    if (action.includes("deleted")) return "bg-red-100 text-red-800"
    if (action.includes("assigned")) return "bg-purple-100 text-purple-800"
    if (action.includes("status")) return "bg-orange-100 text-orange-800"
    if (action.includes("credentials")) return "bg-yellow-100 text-yellow-800"
    if (action.includes("approved")) return "bg-green-100 text-green-800"
    if (action.includes("rejected")) return "bg-red-100 text-red-800"
    if (action.includes("synced")) return "bg-blue-100 text-blue-800"
    if (action.includes("used")) return "bg-indigo-100 text-indigo-800"
    return "bg-gray-100 text-gray-800"
  }

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      "channel.created": "Canal creado",
      "channel.updated": "Canal actualizado",
      "channel.deleted": "Canal eliminado",
      "channel.connected": "Canal conectado",
      "channel.disconnected": "Canal desconectado",
      "channel.credentials.updated": "Credenciales actualizadas",
      "channel.credentials.validated": "Credenciales validadas",
      "channel.credentials.expired": "Credenciales expiradas",
      "thread.created": "Thread creado",
      "thread.updated": "Thread actualizado",
      "thread.assigned": "Thread asignado",
      "thread.unassigned": "Thread desasignado",
      "thread.status.changed": "Estado cambiado",
      "thread.priority.changed": "Prioridad cambiada",
      "thread.sla.updated": "SLA actualizado",
      "thread.sla.breached": "SLA incumplido",
      "thread.sla.warning": "Advertencia SLA",
      "template.created": "Plantilla creada",
      "template.updated": "Plantilla actualizada",
      "template.deleted": "Plantilla eliminada",
      "template.approved": "Plantilla aprobada",
      "template.rejected": "Plantilla rechazada",
      "template.synced": "Plantilla sincronizada",
      "template.used": "Plantilla utilizada",
      "contact.created": "Contacto creado",
      "contact.updated": "Contacto actualizado",
      "contact.merged": "Contactos fusionados",
      "contact.deleted": "Contacto eliminado",
      "contact.blocked": "Contacto bloqueado",
      "contact.unblocked": "Contacto desbloqueado",
      "sla.created": "SLA creado",
      "sla.updated": "SLA actualizado",
      "sla.deleted": "SLA eliminado",
      "sla.activated": "SLA activado",
      "sla.deactivated": "SLA desactivado",
      "canned_response.created": "Respuesta creada",
      "canned_response.updated": "Respuesta actualizada",
      "canned_response.deleted": "Respuesta eliminada",
      "canned_response.used": "Respuesta utilizada",
      "user.created": "Usuario creado",
      "user.updated": "Usuario actualizado",
      "user.deleted": "Usuario eliminado",
      "user.invited": "Usuario invitado",
      "user.role.changed": "Rol cambiado",
      "user.activated": "Usuario activado",
      "user.deactivated": "Usuario desactivado",
      "tenant.created": "Tenant creado",
      "tenant.updated": "Tenant actualizado",
      "tenant.deleted": "Tenant eliminado",
      "tenant.settings.updated": "Configuración actualizada",
      "local.created": "Local creado",
      "local.updated": "Local actualizado",
      "local.deleted": "Local eliminado"
    }
    
    return actionMap[action] || action
  }

  const filteredLogs = logs.filter(log => 
    filter === "" || 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.actor?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    getActionLabel(log.action).toLowerCase().includes(filter.toLowerCase())
  )

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historial de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historial de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadAuditHistory} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Historial de Auditoría</CardTitle>
            <Badge variant="outline">{filteredLogs.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border rounded-md w-48"
              />
            </div>
            <Button onClick={loadAuditHistory} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Registro de acciones realizadas en {entity}:{entityId}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin actividad</h3>
            <p className="text-muted-foreground">
              No hay registros de auditoría para esta entidad
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div key={log.id}>
                  <div 
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleExpanded(log.id)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg">{getActionIcon(log.action)}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          {log.actor ? `${log.actor.name} (${log.actor.email})` : "Sistema"}
                        </span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>
                          {new Date(log.createdAt).toLocaleString("es-ES")}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {expandedLogs.has(log.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {expandedLogs.has(log.id) && (
                    <div className="ml-8 mt-2 p-3 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>Entidad:</strong> {log.entity}
                        </div>
                        <div className="text-sm">
                          <strong>ID:</strong> {log.entityId}
                        </div>
                        {log.diffJSON && Object.keys(log.diffJSON).length > 0 && (
                          <div className="text-sm">
                            <strong>Cambios:</strong>
                            <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.diffJSON, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {index < filteredLogs.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

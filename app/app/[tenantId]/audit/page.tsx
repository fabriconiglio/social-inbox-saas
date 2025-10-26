import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-picker"
import { 
  Activity, 
  Filter, 
  Download, 
  RefreshCw,
  Search,
  Calendar,
  User,
  Database
} from "lucide-react"
import { AuditPageClient } from "@/components/audit/audit-page-client"
import { requireAuth, checkTenantAccess } from "@/lib/auth-utils"

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

interface AuditPageProps {
  params: Promise<{
    tenantId: string
  }>
  searchParams: Promise<{
    entity?: string
    entityId?: string
    action?: string
    actor?: string
    dateFrom?: string
    dateTo?: string
    limit?: string
  }>
}

async function AuditLogStats({ tenantId }: { tenantId: string }) {
  // Mock data para estadísticas - en producción esto vendría de la API
  const stats = {
    totalActions: 150,
    uniqueEntities: 8,
    activeUsers: 12,
    lastActivity: new Date().toISOString()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Total de Acciones</p>
              <p className="text-2xl font-bold">{stats.totalActions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">Entidades Únicas</p>
              <p className="text-2xl font-bold">{stats.uniqueEntities}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-sm font-medium">Usuarios Activos</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm font-medium">Última Actividad</p>
              <p className="text-sm text-muted-foreground">
                {new Date(stats.lastActivity).toLocaleDateString("es-ES")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function AuditPage({ params, searchParams }: AuditPageProps) {
  const { tenantId } = await params
  const resolvedSearchParams = await searchParams
  
  const user = await requireAuth()
  const membership = await checkTenantAccess(user.id!, tenantId)

  if (!membership) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">No tienes acceso a este tenant</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">No tienes permisos para ver el historial de auditoría</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Historial de Auditoría</h1>
          <p className="text-muted-foreground">
            Registro completo de todas las acciones realizadas en el sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {membership.role}
          </Badge>
        </div>
      </div>

      {/* Estadísticas */}
      <AuditLogStats tenantId={tenantId} />

      {/* Componente Cliente con Filtros */}
      <AuditPageClient 
        tenantId={tenantId}
        initialFilters={{
          entity: resolvedSearchParams.entity,
          entityId: resolvedSearchParams.entityId,
          action: resolvedSearchParams.action,
          actor: resolvedSearchParams.actor,
          dateFrom: resolvedSearchParams.dateFrom,
          dateTo: resolvedSearchParams.dateTo,
          limit: parseInt(resolvedSearchParams.limit || "50")
        }}
      />
    </div>
  )
}

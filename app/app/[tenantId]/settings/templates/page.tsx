import { Suspense } from "react"
import { requireAuth } from "@/lib/auth-utils"
import { checkTenantAccess } from "@/lib/auth-utils"
import { getTemplates, getTemplateStats } from "@/app/actions/templates"
import { TemplatesManager } from "@/components/templates/templates-manager"
import { MetaCredentialsConfig } from "@/components/templates/meta-credentials-config"
import { SyncStatus } from "@/components/templates/sync-status"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, BarChart3, History } from "lucide-react"
import Link from "next/link"

interface TemplatesPageProps {
  params: {
    tenantId: string
  }
  searchParams: {
    channel?: string
  }
}

async function TemplatesStats({ tenantId }: { tenantId: string }) {
  const statsResult = await getTemplateStats(tenantId)
  
  if (!statsResult.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Error al cargar estadísticas
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const stats = statsResult.data
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Plantillas creadas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <p className="text-xs text-muted-foreground">
            Listas para usar
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            En revisión
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Canal</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(stats.byChannel).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between text-sm">
                <Badge variant="outline" className="text-xs">
                  {channel}
                </Badge>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TemplatesStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function TemplatesPage({ params, searchParams }: TemplatesPageProps) {
  const user = await requireAuth()
  
  const membership = await checkTenantAccess(user.id!, params.tenantId)
  if (!membership) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">No autorizado</h1>
          <p className="text-muted-foreground">No tienes acceso a este tenant.</p>
        </div>
      </div>
    )
  }
  
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Permisos insuficientes</h1>
          <p className="text-muted-foreground">Necesitas permisos de administrador para gestionar plantillas.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Plantillas</h1>
          <p className="text-muted-foreground">
            Administra las plantillas de mensajes para WhatsApp, Instagram y otros canales.
          </p>
        </div>
        <Link href={`/app/${params.tenantId}/audit?entity=Template`}>
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Historial
          </Button>
        </Link>
      </div>
      
      <Suspense fallback={<TemplatesStatsSkeleton />}>
        <TemplatesStats tenantId={params.tenantId} />
      </Suspense>
      
      {/* Configuración de Meta API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<TemplatesManagerSkeleton />}>
          <SyncStatus 
            tenantId={params.tenantId}
            channelType={searchParams.channel || "whatsapp"}
            onSync={() => {}}
            onConfigure={() => {}}
          />
        </Suspense>
        
        <Suspense fallback={<TemplatesManagerSkeleton />}>
          <MetaCredentialsConfig 
            tenantId={params.tenantId}
            onCredentialsSaved={() => {}}
          />
        </Suspense>
      </div>
      
      <Suspense fallback={<TemplatesManagerSkeleton />}>
        <TemplatesManager 
          tenantId={params.tenantId} 
          initialChannel={searchParams.channel}
        />
      </Suspense>
    </div>
  )
}

function TemplatesManagerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

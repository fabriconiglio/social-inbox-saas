import { Suspense } from "react"
import { listCannedResponses } from "@/app/actions/canned-responses"
import { QuickRepliesList } from "@/components/settings/quick-replies-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateQuickReplyDialog } from "@/components/settings/create-quick-reply-dialog"
import { requireAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function QuickRepliesPage({
  params,
}: {
  params: { tenantId: string }
}) {
  const user = await requireAuth()
  
  // Verificar acceso al tenant
  const { prisma } = await import("@/lib/prisma")
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id!,
      tenantId: params.tenantId,
    },
  })

  if (!membership) {
    redirect("/app/select-tenant")
  }

  // Solo ADMIN y OWNER pueden acceder
  if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
    redirect(`/app/${params.tenantId}/inbox`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Respuestas Rápidas</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona plantillas de respuestas para agilizar la atención
            </p>
          </div>
          <CreateQuickReplyDialog tenantId={params.tenantId}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Respuesta
            </Button>
          </CreateQuickReplyDialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<QuickRepliesListSkeleton />}>
          <QuickRepliesContent tenantId={params.tenantId} />
        </Suspense>
      </div>
    </div>
  )
}

async function QuickRepliesContent({ tenantId }: { tenantId: string }) {
  const result = await listCannedResponses(tenantId)

  if (result.error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{result.error}</p>
        </div>
      </div>
    )
  }

  return <QuickRepliesList tenantId={tenantId} responses={result.data || []} />
}

function QuickRepliesListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="mb-2 h-5 w-1/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}


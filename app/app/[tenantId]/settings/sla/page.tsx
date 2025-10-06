import { SLASettings } from "@/components/settings/sla-settings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configuración SLA | MessageHub",
}

interface SLASettingsPageProps {
  params: Promise<{ tenantId: string }>
}

export default async function SLASettingsPage({ params }: SLASettingsPageProps) {
  const { tenantId } = await params

  const { mockSLAs } = await import("@/lib/mock-data")

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de SLA</h1>
        <p className="text-muted-foreground">Gestiona los acuerdos de nivel de servicio</p>
      </div>

      <SLASettings tenantId={tenantId} slas={mockSLAs as any} />
    </div>
  )

  // Original database code (commented for preview)
  /*
  const user = await requireAuth()
  await requireTenantAccess(user.id!, tenantId, "ADMIN")

  const slas = await prisma.sLA.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de SLA</h1>
        <p className="text-muted-foreground">Gestiona los acuerdos de nivel de servicio</p>
      </div>

      <SLASettings tenantId={tenantId} slas={slas} />
    </div>
  )
  */
}

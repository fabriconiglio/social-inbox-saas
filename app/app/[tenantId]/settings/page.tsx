import { redirect } from "next/navigation"

interface SettingsPageProps {
  params: Promise<{ tenantId: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { tenantId } = await params

  redirect(`/app/${tenantId}/settings/sla`)

  // Original auth code (commented for preview)
  /*
  const user = await requireAuth()
  await requireTenantAccess(user.id!, tenantId, "ADMIN")

  redirect(`/app/${tenantId}/settings/sla`)
  */
}

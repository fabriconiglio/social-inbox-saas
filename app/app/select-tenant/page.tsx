import { requireAuth, getUserMemberships } from "@/lib/auth-utils"
import { TenantSelector } from "@/components/tenant/tenant-selector"
import { CreateTenantDialog } from "@/components/tenant/create-tenant-dialog"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Seleccionar Empresa | MessageHub",
}

export default async function SelectTenantPage() {
  const user = await requireAuth()
  const memberships = await getUserMemberships(user.id!)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Selecciona una empresa</h1>
          <p className="mt-2 text-muted-foreground">Elige la empresa con la que deseas trabajar</p>
        </div>

        {memberships.length > 0 ? (
          <TenantSelector memberships={memberships} />
        ) : (
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">No tienes acceso a ninguna empresa aún</p>
            <CreateTenantDialog />
          </div>
        )}

        {memberships.length > 0 && (
          <div className="text-center">
            <CreateTenantDialog />
          </div>
        )}
      </div>
    </div>
  )
}

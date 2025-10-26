import type React from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AppLayout as SocketAppLayout } from "@/components/layout/app-layout"

interface AppLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantId: string }>
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { tenantId } = await params

  const { mockUser } = await import("@/lib/mock-data")

  return (
    <SocketAppLayout tenantId={tenantId}>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar tenantId={tenantId} userRole={mockUser.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader user={mockUser as any} tenantId={tenantId} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SocketAppLayout>
  )

  // Original auth code (commented for preview)
  /*
  const user = await requireAuth()
  const membership = await requireTenantAccess(user.id!, tenantId)

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar tenantId={tenantId} userRole={membership.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={user} tenantId={tenantId} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
  */
}

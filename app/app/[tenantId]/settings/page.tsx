import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Zap, Bell } from "lucide-react"
import { requireAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

interface SettingsPageProps {
  params: Promise<{ tenantId: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { tenantId } = await params
  const user = await requireAuth()

  // Verificar acceso al tenant
  const { prisma } = await import("@/lib/prisma")
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id!,
      tenantId,
    },
  })

  if (!membership) {
    redirect("/app/select-tenant")
  }

  // Solo ADMIN y OWNER pueden acceder a settings
  if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
    redirect(`/app/${tenantId}/inbox`)
  }

  const settingsOptions = [
    {
      title: "Respuestas Rápidas",
      description: "Gestiona plantillas de respuestas para agilizar la atención",
      href: `/app/${tenantId}/settings/quick-replies`,
      icon: Zap,
    },
    {
      title: "Configuración de SLA",
      description: "Define tiempos de respuesta y horarios de atención",
      href: `/app/${tenantId}/settings/sla`,
      icon: Clock,
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la configuración de tu tenant
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsOptions.map((option) => {
            const Icon = option.icon
            return (
              <Link key={option.href} href={option.href}>
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                    </div>
                    <CardDescription>{option.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

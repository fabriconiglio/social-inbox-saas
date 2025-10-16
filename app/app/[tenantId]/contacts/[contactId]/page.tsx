import type { Metadata } from "next"
import { Suspense } from "react"
import { ContactDetail } from "@/components/contacts/contact-detail"
import { getContact } from "@/app/actions/contacts"
import { requireAuth } from "@/lib/auth-utils"
import { redirect, notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Detalle de Contacto | MessageHub",
}

interface ContactDetailPageProps {
  params: Promise<{ tenantId: string; contactId: string }>
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { tenantId, contactId } = await params

  // Verificar autenticación y acceso al tenant
  const user = await requireAuth()
  
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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Detalle de Contacto</h1>
            <p className="text-sm text-muted-foreground">
              Información completa y historial de conversaciones
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<ContactDetailSkeleton />}>
          <ContactDetailContent 
            tenantId={tenantId} 
            contactId={contactId}
          />
        </Suspense>
      </div>
    </div>
  )
}

async function ContactDetailContent({ 
  tenantId, 
  contactId 
}: { 
  tenantId: string
  contactId: string
}) {
  try {
    const result = await getContact(contactId, tenantId)

    if (result.error) {
      if (result.error === "Contacto no encontrado") {
        notFound()
      }
      
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </div>
        </div>
      )
    }

    return <ContactDetail contact={result.data} tenantId={tenantId} />
  } catch (error) {
    // En caso de error (como en modo mock), mostrar error
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Error al cargar el contacto. Verifica que el contacto existe.
          </p>
        </div>
      </div>
    )
  }
}

function ContactDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 bg-muted animate-pulse rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-8 w-12 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <div className="flex gap-4 border-b">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

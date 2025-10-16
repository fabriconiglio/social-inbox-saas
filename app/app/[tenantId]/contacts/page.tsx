import type { Metadata } from "next"
import { Suspense } from "react"
import { ContactsList } from "@/components/contacts/contacts-list"
import { listContacts } from "@/app/actions/contacts"
import { requireAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Contactos | MessageHub",
}

interface ContactsPageProps {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<{ search?: string; platform?: string }>
}

export default async function ContactsPage({ params, searchParams }: ContactsPageProps) {
  const { tenantId } = await params
  const { search, platform } = await searchParams

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
            <h1 className="text-2xl font-semibold">Contactos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona la información de tus contactos y sus conversaciones
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<ContactsListSkeleton />}>
          <ContactsContent 
            tenantId={tenantId} 
            search={search}
            platform={platform}
          />
        </Suspense>
      </div>
    </div>
  )
}

async function ContactsContent({ 
  tenantId, 
  search, 
  platform 
}: { 
  tenantId: string
  search?: string
  platform?: string
}) {
  try {
    const result = await listContacts(tenantId, {
      search,
      platform: platform === "all" ? undefined : platform,
      limit: 20,
      offset: 0,
    })

    if (result.error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </div>
        </div>
      )
    }

    return (
      <ContactsList 
        tenantId={tenantId}
        initialContacts={result.data?.contacts || []}
        initialPagination={result.data?.pagination}
      />
    )
  } catch (error) {
    // En caso de error (como en modo mock), usar datos mock
    const { mockContacts } = await import("@/lib/mock-data")
    
    return (
      <ContactsList 
        tenantId={tenantId}
        initialContacts={mockContacts.map(contact => ({
          ...contact,
          updatedAt: contact.createdAt,
          _count: { threads: contact.threads.length },
          threads: contact.threads.map(thread => ({
            ...thread,
            status: "OPEN",
            lastMessageAt: new Date()
          }))
        }))}
        initialPagination={{
          total: mockContacts.length,
          limit: 20,
          offset: 0,
          hasMore: false,
        }}
      />
    )
  }
}

function ContactsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted animate-pulse rounded" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex justify-between pt-2 border-t">
              <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

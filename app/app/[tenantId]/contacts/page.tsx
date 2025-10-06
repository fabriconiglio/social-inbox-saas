import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contactos | MessageHub",
}

interface ContactsPageProps {
  params: Promise<{ tenantId: string }>
}

export default async function ContactsPage({ params }: ContactsPageProps) {
  const { tenantId } = await params

  const { mockContacts } = await import("@/lib/mock-data")

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Contactos</h1>
        <p className="text-muted-foreground">Gestiona la información de tus contactos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockContacts.map((contact) => (
          <div key={contact.id} className="rounded-lg border p-4">
            <h3 className="font-semibold">{contact.name || contact.handle}</h3>
            <p className="text-sm text-muted-foreground">{contact.platform}</p>
            {contact.phone && <p className="text-sm">{contact.phone}</p>}
            {contact.email && <p className="text-sm">{contact.email}</p>}
            {contact.notes && <p className="mt-2 text-sm text-muted-foreground">{contact.notes}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{contact.threads.length} conversación(es)</p>
          </div>
        ))}
      </div>
    </div>
  )

  // Original database code (commented for preview)
  /*
  const user = await requireAuth()
  await requireTenantAccess(user.id!, tenantId)

  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    include: {
      threads: {
        take: 1,
        orderBy: { lastMessageAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Contactos</h1>
        <p className="text-muted-foreground">Gestiona la información de tus contactos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="rounded-lg border p-4">
            <h3 className="font-semibold">{contact.name || contact.handle}</h3>
            <p className="text-sm text-muted-foreground">{contact.platform}</p>
            {contact.phone && <p className="text-sm">{contact.phone}</p>}
            {contact.email && <p className="text-sm">{contact.email}</p>}
            {contact.notes && <p className="mt-2 text-sm text-muted-foreground">{contact.notes}</p>}
            <p className="mt-2 text-xs text-muted-foreground">{contact.threads.length} conversación(es)</p>
          </div>
        ))}
      </div>
    </div>
  )
  */
}

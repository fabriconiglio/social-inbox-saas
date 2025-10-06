"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import type { Membership, Tenant } from "@prisma/client"

interface TenantSelectorProps {
  memberships: (Membership & { tenant: Tenant })[]
}

export function TenantSelector({ memberships }: TenantSelectorProps) {
  const router = useRouter()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {memberships.map((membership) => (
        <Card
          key={membership.id}
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push(`/app/${membership.tenantId}/inbox`)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{membership.tenant.name}</CardTitle>
                <CardDescription className="mt-1">{membership.tenant.billingEmail}</CardDescription>
              </div>
              <Badge variant="secondary">{membership.role}</Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function getUserMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      tenant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function checkTenantAccess(userId: string, tenantId: string) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  })
  return membership
}

export async function requireTenantAccess(userId: string, tenantId: string, minRole?: Role) {
  const membership = await checkTenantAccess(userId, tenantId)

  if (!membership) {
    redirect("/app/select-tenant")
  }

  if (minRole) {
    const roleHierarchy: Record<Role, number> = {
      VIEWER: 1,
      AGENT: 2,
      ADMIN: 3,
      OWNER: 4,
    }

    if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
      throw new Error("Insufficient permissions")
    }
  }

  return membership
}

export function hasPermission(role: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    VIEWER: 1,
    AGENT: 2,
    ADMIN: 3,
    OWNER: 4,
  }

  return roleHierarchy[role] >= roleHierarchy[requiredRole]
}

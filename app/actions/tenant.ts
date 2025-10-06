"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  billingEmail: z.string().email("Invalid email address"),
  localName: z.string().min(2, "Local name must be at least 2 characters"),
  localAddress: z.string().optional(),
})

export async function createTenant(formData: FormData) {
  try {
    const user = await requireAuth()

    const validatedFields = createTenantSchema.safeParse({
      name: formData.get("name"),
      billingEmail: formData.get("billingEmail"),
      localName: formData.get("localName"),
      localAddress: formData.get("localAddress"),
    })

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, billingEmail, localName, localAddress } = validatedFields.data

    const tenant = await prisma.tenant.create({
      data: {
        name,
        billingEmail,
        memberships: {
          create: {
            userId: user.id!,
            role: "OWNER",
          },
        },
        locals: {
          create: {
            name: localName,
            address: localAddress,
          },
        },
      },
      include: {
        locals: true,
      },
    })

    revalidatePath("/app/select-tenant")
    return { success: true, tenantId: tenant.id }
  } catch (error) {
    console.error("Error creating tenant:", error)
    return { error: "Failed to create tenant" }
  }
}

export async function inviteUserToTenant(tenantId: string, email: string, role: "ADMIN" | "AGENT" | "VIEWER") {
  try {
    const user = await requireAuth()

    // Check if current user has permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id!,
          tenantId,
        },
      },
    })

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return { error: "Insufficient permissions" }
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!invitedUser) {
      return { error: "User not found" }
    }

    // Check if already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: invitedUser.id,
          tenantId,
        },
      },
    })

    if (existingMembership) {
      return { error: "User is already a member" }
    }

    await prisma.membership.create({
      data: {
        userId: invitedUser.id,
        tenantId,
        role,
      },
    })

    revalidatePath(`/app/${tenantId}/settings`)
    return { success: true }
  } catch (error) {
    console.error("Error inviting user:", error)
    return { error: "Failed to invite user" }
  }
}

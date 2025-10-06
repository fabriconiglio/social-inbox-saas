"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireTenantAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createSLASchema = z.object({
  tenantId: z.string(),
  name: z.string().min(2),
  firstResponseMins: z.string().transform((val) => Number.parseInt(val, 10)),
})

export async function createSLA(formData: FormData) {
  try {
    const user = await requireAuth()

    const validatedFields = createSLASchema.safeParse({
      tenantId: formData.get("tenantId"),
      name: formData.get("name"),
      firstResponseMins: formData.get("firstResponseMins"),
    })

    if (!validatedFields.success) {
      return { error: "Invalid fields" }
    }

    const { tenantId, name, firstResponseMins } = validatedFields.data

    await requireTenantAccess(user.id!, tenantId, "ADMIN")

    await prisma.sLA.create({
      data: {
        tenantId,
        name,
        firstResponseMins,
      },
    })

    revalidatePath(`/app/${tenantId}/settings/sla`)
    return { success: true }
  } catch (error) {
    console.error("[Create SLA] Error:", error)
    return { error: "Failed to create SLA" }
  }
}

export async function deleteSLA(formData: FormData) {
  try {
    const user = await requireAuth()
    const slaId = formData.get("slaId") as string

    const sla = await prisma.sLA.findUnique({
      where: { id: slaId },
    })

    if (!sla) {
      return { error: "SLA not found" }
    }

    await requireTenantAccess(user.id!, sla.tenantId, "ADMIN")

    await prisma.sLA.delete({
      where: { id: slaId },
    })

    revalidatePath(`/app/${sla.tenantId}/settings/sla`)
    return { success: true }
  } catch (error) {
    console.error("[Delete SLA] Error:", error)
    return { error: "Failed to delete SLA" }
  }
}

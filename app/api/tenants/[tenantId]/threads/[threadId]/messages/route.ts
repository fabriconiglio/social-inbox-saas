import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; threadId: string }> },
) {
  try {
    const { tenantId, threadId } = await params

    const { getMockMessagesByThreadId } = await import("@/lib/mock-data")
    const messages = getMockMessagesByThreadId(threadId)
    return NextResponse.json(messages)

    // Original database code (commented for preview)
    /*
    const user = await requireAuth()

    const membership = await checkTenantAccess(user.id!, tenantId)
    if (!membership) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: {
        threadId,
        thread: {
          tenantId,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        sentAt: "asc",
      },
    })

    return NextResponse.json(messages)
    */
  } catch (error) {
    console.error("[Messages API] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

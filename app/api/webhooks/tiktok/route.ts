import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdapter } from "@/lib/adapters"
import { 
  extractSignatureFromHeaders, 
  getPayloadAsString, 
  logWebhookVerification 
} from "@/lib/webhook-verification"

export async function POST(request: NextRequest) {
  try {
    // Obtener payload como string para verificación HMAC
    const payloadString = await getPayloadAsString(request)
    const payload = JSON.parse(payloadString)

    // Extraer firma del header
    const signature = extractSignatureFromHeaders(request.headers)
    
    const adapter = getAdapter("tiktok")

    if (!adapter) {
      return NextResponse.json({ error: "Invalid channel type" }, { status: 400 })
    }

    // Verificar firma HMAC
    if (signature) {
      // Obtener webhook secret desde variables de entorno
      const webhookSecret = process.env.TIKTOK_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET
      
      const isValid = adapter.verifyWebhook(payloadString, signature, webhookSecret)
      logWebhookVerification("TikTok", isValid, signature, payloadString.length)
      
      if (!isValid) {
        console.error("[TikTok] Webhook verification failed - rejecting request")
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
      }
    } else {
      console.warn("[TikTok] No signature provided - skipping verification")
    }

    const channels = await prisma.channel.findMany({
      where: {
        type: "TIKTOK",
        status: "ACTIVE",
      },
      include: {
        local: {
          include: {
            tenant: true,
          },
        },
      },
    })

    for (const channel of channels) {
      const messageDTO = await adapter.ingestWebhook(payload, channel.id)

      if (messageDTO) {
        let contact = await prisma.contact.findUnique({
          where: {
            tenantId_platform_handle: {
              tenantId: channel.local.tenantId,
              platform: "tiktok",
              handle: messageDTO.senderHandle,
            },
          },
        })

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              tenantId: channel.local.tenantId,
              platform: "tiktok",
              handle: messageDTO.senderHandle,
              name: messageDTO.senderName,
            },
          })
        }

        let thread = await prisma.thread.findUnique({
          where: {
            channelId_externalId: {
              channelId: channel.id,
              externalId: messageDTO.threadExternalId,
            },
          },
        })

        if (!thread) {
          thread = await prisma.thread.create({
            data: {
              tenantId: channel.local.tenantId,
              localId: channel.localId,
              channelId: channel.id,
              externalId: messageDTO.threadExternalId,
              status: "OPEN",
              contactId: contact.id,
              lastMessageAt: messageDTO.sentAt,
            },
          })
        } else {
          await prisma.thread.update({
            where: { id: thread.id },
            data: {
              lastMessageAt: messageDTO.sentAt,
              status: thread.status === "CLOSED" ? "OPEN" : thread.status,
            },
          })
        }

        await prisma.message.create({
          data: {
            threadId: thread.id,
            channelId: channel.id,
            direction: "INBOUND",
            externalId: messageDTO.externalId,
            body: messageDTO.body,
            attachments: messageDTO.attachments || [],
            sentAt: messageDTO.sentAt,
          },
        })

        console.log(`[TikTok] Message ingested for thread ${thread.id}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TikTok Webhook] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

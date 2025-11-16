import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAdapter } from "@/lib/adapters"
import { env } from "@/lib/env"
import { 
  extractSignatureFromHeaders, 
  getPayloadAsString, 
  logWebhookVerification 
} from "@/lib/webhook-verification"

// Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === env.META_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verified")
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse("Forbidden", { status: 403 })
}

// Webhook payload
export async function POST(request: NextRequest) {
  try {
    // Obtener payload como string para verificación HMAC
    const payloadString = await getPayloadAsString(request)
    const payload = JSON.parse(payloadString)

    // Extraer firma del header
    const signature = extractSignatureFromHeaders(request.headers)
    
    const adapter = getAdapter("whatsapp")

    if (!adapter) {
      return NextResponse.json({ error: "Invalid channel type" }, { status: 400 })
    }

    // Verificar firma HMAC
    if (signature) {
      // Obtener webhook secret desde variables de entorno
      // WhatsApp usa el App Secret para la verificación HMAC
      const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET || process.env.META_APP_SECRET || process.env.META_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET
      
      if (!webhookSecret) {
        if (process.env.NODE_ENV !== "development") {
          return NextResponse.json({ error: "Webhook secret not configured" }, { status: 403 })
        }
      } else {
        const isValid = adapter.verifyWebhook(payloadString, signature, webhookSecret)
        logWebhookVerification("WhatsApp", isValid, signature, payloadString.length)
        
        if (!isValid && process.env.NODE_ENV !== "development") {
          return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
        }
      }
    }

    const channels = await prisma.channel.findMany({
      where: {
        type: "WHATSAPP",
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
              platform: "whatsapp",
              handle: messageDTO.senderHandle,
            },
          },
        })

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              tenantId: channel.local.tenantId,
              platform: "whatsapp",
              handle: messageDTO.senderHandle,
              name: messageDTO.senderName,
              phone: messageDTO.senderHandle,
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
            attachments: (messageDTO.attachments || []) as any,
            sentAt: messageDTO.sentAt,
          },
        })

        // Crear notificación si el thread está asignado a alguien
        if (thread.assigneeId) {
          await prisma.notification.create({
            data: {
              userId: thread.assigneeId,
              type: "new_message",
              payloadJSON: {
                threadId: thread.id,
                contactName: contact.name || contact.handle,
                messagePreview: messageDTO.body.substring(0, 100) + (messageDTO.body.length > 100 ? "..." : ""),
                threadChannel: channel.displayName,
                threadContact: contact.name || contact.handle,
              },
            },
          })
        }

        console.log(`[WhatsApp] Message ingested for thread ${thread.id}`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // Create users
  console.log("Creating users...")
  const adminPassword = await bcrypt.hash("admin123", 10)
  const agentPassword = await bcrypt.hash("agent123", 10)
  const viewerPassword = await bcrypt.hash("viewer123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Admin Demo",
      password: adminPassword,
    },
  })

  const agent = await prisma.user.upsert({
    where: { email: "agent@demo.com" },
    update: {},
    create: {
      email: "agent@demo.com",
      name: "Agent Demo",
      password: agentPassword,
    },
  })

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@demo.com" },
    update: {},
    create: {
      email: "viewer@demo.com",
      name: "Viewer Demo",
      password: viewerPassword,
    },
  })

  console.log("✓ Users created")

  // Create tenant
  console.log("Creating tenant...")
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: {
      id: "demo-tenant",
      name: "Demo SA",
      billingEmail: "billing@demo.com",
    },
  })

  console.log("✓ Tenant created")

  // Create memberships
  console.log("Creating memberships...")
  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: admin.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      tenantId: tenant.id,
      role: "ADMIN",
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: agent.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: agent.id,
      tenantId: tenant.id,
      role: "AGENT",
    },
  })

  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: viewer.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: viewer.id,
      tenantId: tenant.id,
      role: "VIEWER",
    },
  })

  console.log("✓ Memberships created")

  // Create locals
  console.log("Creating locals...")
  const localCentro = await prisma.local.upsert({
    where: { id: "local-centro" },
    update: {},
    create: {
      id: "local-centro",
      tenantId: tenant.id,
      name: "Local Centro",
      address: "Av. Colón 123, Córdoba",
      timezone: "America/Argentina/Cordoba",
    },
  })

  const localCerro = await prisma.local.upsert({
    where: { id: "local-cerro" },
    update: {},
    create: {
      id: "local-cerro",
      tenantId: tenant.id,
      name: "Local Cerro",
      address: "Av. Rafael Núñez 456, Córdoba",
      timezone: "America/Argentina/Cordoba",
    },
  })

  console.log("✓ Locals created")

  // Create channels
  console.log("Creating channels...")
  const channelInstagram = await prisma.channel.upsert({
    where: { id: "channel-ig-centro" },
    update: {},
    create: {
      id: "channel-ig-centro",
      localId: localCentro.id,
      type: "INSTAGRAM",
      displayName: "Instagram Centro",
      status: "ACTIVE",
      meta: {
        pageId: "mock_page_123",
        accessToken: "mock_token",
      },
    },
  })

  const channelFacebook = await prisma.channel.upsert({
    where: { id: "channel-fb-centro" },
    update: {},
    create: {
      id: "channel-fb-centro",
      localId: localCentro.id,
      type: "FACEBOOK",
      displayName: "Facebook Centro",
      status: "ACTIVE",
      meta: {
        pageId: "mock_page_456",
        accessToken: "mock_token",
      },
    },
  })

  const channelWhatsApp = await prisma.channel.upsert({
    where: { id: "channel-wa-cerro" },
    update: {},
    create: {
      id: "channel-wa-cerro",
      localId: localCerro.id,
      type: "WHATSAPP",
      displayName: "WhatsApp Cerro",
      status: "ACTIVE",
      meta: {
        phoneId: "mock_phone_789",
        businessId: "mock_business_123",
      },
    },
  })

  const channelMock = await prisma.channel.upsert({
    where: { id: "channel-mock-cerro" },
    update: {},
    create: {
      id: "channel-mock-cerro",
      localId: localCerro.id,
      type: "MOCK",
      displayName: "Mock Channel",
      status: "ACTIVE",
      meta: {},
    },
  })

  console.log("✓ Channels created")

  // Create contacts
  console.log("Creating contacts...")
  const contact1 = await prisma.contact.upsert({
    where: {
      tenantId_platform_handle: {
        tenantId: tenant.id,
        platform: "instagram",
        handle: "user_maria",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      platform: "instagram",
      handle: "user_maria",
      name: "María González",
      notes: "Cliente frecuente, prefiere respuestas rápidas",
    },
  })

  const contact2 = await prisma.contact.upsert({
    where: {
      tenantId_platform_handle: {
        tenantId: tenant.id,
        platform: "facebook",
        handle: "user_juan",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      platform: "facebook",
      handle: "user_juan",
      name: "Juan Pérez",
      email: "juan@example.com",
    },
  })

  const contact3 = await prisma.contact.upsert({
    where: {
      tenantId_platform_handle: {
        tenantId: tenant.id,
        platform: "whatsapp",
        handle: "+5493512345678",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      platform: "whatsapp",
      handle: "+5493512345678",
      name: "Laura Martínez",
      phone: "+5493512345678",
    },
  })

  const contact4 = await prisma.contact.upsert({
    where: {
      tenantId_platform_handle: {
        tenantId: tenant.id,
        platform: "mock",
        handle: "user_carlos",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      platform: "mock",
      handle: "user_carlos",
      name: "Carlos Rodríguez",
    },
  })

  console.log("✓ Contacts created")

  // Create threads and messages
  console.log("Creating threads and messages...")

  // Thread 1: Instagram - Open, assigned to agent
  const thread1 = await prisma.thread.create({
    data: {
      tenantId: tenant.id,
      localId: localCentro.id,
      channelId: channelInstagram.id,
      externalId: "ig_thread_1",
      status: "OPEN",
      assigneeId: agent.id,
      contactId: contact1.id,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    },
  })

  await prisma.message.createMany({
    data: [
      {
        threadId: thread1.id,
        channelId: channelInstagram.id,
        direction: "INBOUND",
        externalId: "ig_msg_1",
        body: "Hola! Quería consultar por los precios de sus productos",
        sentAt: new Date(Date.now() - 1000 * 60 * 20),
      },
      {
        threadId: thread1.id,
        channelId: channelInstagram.id,
        direction: "OUTBOUND",
        authorId: agent.id,
        externalId: "ig_msg_2",
        body: "Hola María! Claro, con gusto te paso la lista de precios. ¿Qué productos te interesan?",
        sentAt: new Date(Date.now() - 1000 * 60 * 18),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 18),
      },
      {
        threadId: thread1.id,
        channelId: channelInstagram.id,
        direction: "INBOUND",
        externalId: "ig_msg_3",
        body: "Me interesan las zapatillas deportivas",
        sentAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    ],
  })

  // Thread 2: Facebook - Pending, unassigned
  const thread2 = await prisma.thread.create({
    data: {
      tenantId: tenant.id,
      localId: localCentro.id,
      channelId: channelFacebook.id,
      externalId: "fb_thread_1",
      status: "PENDING",
      contactId: contact2.id,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45),
    },
  })

  await prisma.message.createMany({
    data: [
      {
        threadId: thread2.id,
        channelId: channelFacebook.id,
        direction: "INBOUND",
        externalId: "fb_msg_1",
        body: "Buenos días, quisiera saber el horario de atención",
        sentAt: new Date(Date.now() - 1000 * 60 * 50),
      },
      {
        threadId: thread2.id,
        channelId: channelFacebook.id,
        direction: "OUTBOUND",
        authorId: admin.id,
        externalId: "fb_msg_2",
        body: "Hola Juan! Nuestro horario es de lunes a viernes de 9 a 18hs",
        sentAt: new Date(Date.now() - 1000 * 60 * 48),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 48),
      },
      {
        threadId: thread2.id,
        channelId: channelFacebook.id,
        direction: "INBOUND",
        externalId: "fb_msg_3",
        body: "Perfecto, gracias! ¿Atienden los sábados?",
        sentAt: new Date(Date.now() - 1000 * 60 * 45),
      },
    ],
  })

  // Thread 3: WhatsApp - Open, assigned to admin
  const thread3 = await prisma.thread.create({
    data: {
      tenantId: tenant.id,
      localId: localCerro.id,
      channelId: channelWhatsApp.id,
      externalId: "wa_thread_1",
      status: "OPEN",
      assigneeId: admin.id,
      contactId: contact3.id,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
    },
  })

  await prisma.message.createMany({
    data: [
      {
        threadId: thread3.id,
        channelId: channelWhatsApp.id,
        direction: "INBOUND",
        externalId: "wa_msg_1",
        body: "Hola! Necesito hacer una devolución",
        sentAt: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        threadId: thread3.id,
        channelId: channelWhatsApp.id,
        direction: "OUTBOUND",
        authorId: admin.id,
        externalId: "wa_msg_2",
        body: "Hola Laura! Claro, ¿qué producto querés devolver?",
        sentAt: new Date(Date.now() - 1000 * 60 * 8),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 8),
      },
      {
        threadId: thread3.id,
        channelId: channelWhatsApp.id,
        direction: "INBOUND",
        externalId: "wa_msg_3",
        body: "Una remera que compré la semana pasada, me quedó grande",
        sentAt: new Date(Date.now() - 1000 * 60 * 5),
      },
    ],
  })

  // Thread 4: Mock - Closed
  const thread4 = await prisma.thread.create({
    data: {
      tenantId: tenant.id,
      localId: localCerro.id,
      channelId: channelMock.id,
      externalId: "mock_thread_1",
      status: "CLOSED",
      assigneeId: agent.id,
      contactId: contact4.id,
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
  })

  await prisma.message.createMany({
    data: [
      {
        threadId: thread4.id,
        channelId: channelMock.id,
        direction: "INBOUND",
        externalId: "mock_msg_1",
        body: "Hola, quiero cancelar mi pedido",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 10),
      },
      {
        threadId: thread4.id,
        channelId: channelMock.id,
        direction: "OUTBOUND",
        authorId: agent.id,
        externalId: "mock_msg_2",
        body: "Hola Carlos! Claro, ya cancelé tu pedido. Te reembolsaremos en 5 días hábiles.",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 5),
        deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 5),
      },
      {
        threadId: thread4.id,
        channelId: channelMock.id,
        direction: "INBOUND",
        externalId: "mock_msg_3",
        body: "Perfecto, muchas gracias!",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    ],
  })

  // Create more threads for analytics
  for (let i = 5; i <= 15; i++) {
    const randomChannel = [channelInstagram, channelFacebook, channelWhatsApp, channelMock][
      Math.floor(Math.random() * 4)
    ]
    const randomContact = [contact1, contact2, contact3, contact4][Math.floor(Math.random() * 4)]
    const randomStatus = ["OPEN", "PENDING", "CLOSED"][Math.floor(Math.random() * 3)]
    const randomAssignee = Math.random() > 0.3 ? (Math.random() > 0.5 ? admin.id : agent.id) : null

    const thread = await prisma.thread.create({
      data: {
        tenantId: tenant.id,
        localId: randomChannel.localId,
        channelId: randomChannel.id,
        externalId: `thread_${i}`,
        status: randomStatus as any,
        assigneeId: randomAssignee,
        contactId: randomContact.id,
        lastMessageAt: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 1440)), // Random time in last 24h
      },
    })

    await prisma.message.create({
      data: {
        threadId: thread.id,
        channelId: randomChannel.id,
        direction: "INBOUND",
        externalId: `msg_${i}_1`,
        body: `Mensaje de prueba ${i}`,
        sentAt: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 1440)),
      },
    })
  }

  console.log("✓ Threads and messages created")

  // Create canned responses
  console.log("Creating canned responses...")
  await prisma.cannedResponse.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: "Saludo inicial",
        content: "Hola {{nombre}}! Gracias por contactarte con {{local}}. ¿En qué podemos ayudarte?",
        variablesJSON: { nombre: "string", local: "string" },
      },
      {
        tenantId: tenant.id,
        title: "Horarios",
        content: "Nuestro horario de atención es de lunes a viernes de 9 a 18hs y sábados de 9 a 13hs.",
        variablesJSON: {},
      },
      {
        tenantId: tenant.id,
        title: "Despedida",
        content: "Gracias por tu consulta! Si necesitás algo más, no dudes en escribirnos.",
        variablesJSON: {},
      },
    ],
  })

  console.log("✓ Canned responses created")

  // Create SLA
  console.log("Creating SLA...")
  await prisma.sLA.create({
    data: {
      tenantId: tenant.id,
      name: "SLA Estándar",
      firstResponseMins: 60,
      businessHoursJSON: {
        monday: { start: "09:00", end: "18:00" },
        tuesday: { start: "09:00", end: "18:00" },
        wednesday: { start: "09:00", end: "18:00" },
        thursday: { start: "09:00", end: "18:00" },
        friday: { start: "09:00", end: "18:00" },
      },
    },
  })

  console.log("✓ SLA created")

  // Create sample notifications
  console.log("Creating sample notifications...")
  await prisma.notification.createMany({
    data: [
      {
        userId: agent.id,
        type: "new_message",
        payloadJSON: {
          threadId: thread1.id,
          contactName: "María González",
          messagePreview: "Hola! Quería consultar por los precios de sus productos",
          threadChannel: "Instagram",
        },
      },
      {
        userId: agent.id,
        type: "thread_assigned",
        payloadJSON: {
          threadId: thread1.id,
          assignedBy: "Admin Demo",
          threadContact: "María González",
          threadChannel: "Instagram",
        },
      },
      {
        userId: admin.id,
        type: "sla_warning",
        payloadJSON: {
          threadId: thread1.id,
          threadContact: "María González",
          timeRemaining: "15 minutos",
        },
      },
      {
        userId: agent.id,
        type: "new_message",
        payloadJSON: {
          threadId: thread2.id,
          contactName: "Juan Pérez",
          messagePreview: "¿Cuál es su horario de atención?",
          threadChannel: "Facebook",
        },
        readAt: new Date(), // Esta está marcada como leída
      },
    ],
  })

  console.log("✓ Sample notifications created")

  console.log("✅ Seed completed successfully!")
  console.log("\n📝 Demo credentials:")
  console.log("Admin: admin@demo.com / admin123")
  console.log("Agent: agent@demo.com / agent123")
  console.log("Viewer: viewer@demo.com / viewer123")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

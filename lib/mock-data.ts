// Mock data for preview without database setup

export const mockUser = {
  id: "user-1",
  email: "admin@acme.com",
  name: "Admin Usuario",
  role: "ADMIN" as const,
}

export const mockLocals = [
  {
    id: "local-1",
    name: "Sucursal Centro",
    tenantId: "tenant-1",
    channels: [
      {
        id: "channel-1",
        type: "INSTAGRAM" as const,
        displayName: "@acme_centro",
        status: "ACTIVE" as const,
        localId: "local-1",
      },
      {
        id: "channel-2",
        type: "WHATSAPP" as const,
        displayName: "+52 55 1234 5678",
        status: "ACTIVE" as const,
        localId: "local-1",
      },
    ],
  },
  {
    id: "local-2",
    name: "Sucursal Norte",
    tenantId: "tenant-1",
    channels: [
      {
        id: "channel-3",
        type: "FACEBOOK" as const,
        displayName: "ACME Norte",
        status: "ACTIVE" as const,
      },
    ],
  },
]

export const mockMembers = [
  {
    id: "member-1",
    userId: "user-1",
    tenantId: "tenant-1",
    role: "ADMIN" as const,
    user: {
      id: "user-1",
      name: "Admin Usuario",
      email: "admin@acme.com",
    },
  },
  {
    id: "member-2",
    userId: "user-2",
    tenantId: "tenant-1",
    role: "AGENT" as const,
    user: {
      id: "user-2",
      name: "María García",
      email: "maria@acme.com",
    },
  },
  {
    id: "member-3",
    userId: "user-3",
    tenantId: "tenant-1",
    role: "AGENT" as const,
    user: {
      id: "user-3",
      name: "Carlos López",
      email: "carlos@acme.com",
    },
  },
]

export const mockThreads = [
  {
    id: "thread-1",
    tenantId: "tenant-1",
    localId: "local-1",
    channelId: "channel-1",
    contactId: "contact-1",
    subject: "Consulta sobre productos",
    status: "OPEN" as const,
    priority: "MEDIUM" as const,
    assigneeId: "user-2",
    lastMessageAt: new Date("2025-01-15T10:30:00"),
    createdAt: new Date("2025-01-15T10:00:00"),
    channel: {
      id: "channel-1",
      type: "INSTAGRAM" as const,
      displayName: "@acme_centro",
      status: "ACTIVE" as const,
    },
    local: {
      id: "local-1",
      name: "Sucursal Centro",
    },
    assignee: {
      id: "user-2",
      name: "María García",
      email: "maria@acme.com",
    },
    contact: {
      id: "contact-1",
      handle: "@juanperez",
      name: "Juan Pérez",
      email: null,
      phone: null,
      avatarUrl: null,
    },
    messages: [
      {
        id: "msg-1",
        threadId: "thread-1",
        direction: "INBOUND" as const,
        content: "Hola, quisiera información sobre sus productos",
        sentAt: new Date("2025-01-15T10:30:00"),
      },
      {
        id: "msg-1-reply",
        threadId: "thread-1",
        direction: "OUTBOUND" as const,
        content: "¡Hola Juan! Con gusto te ayudo. ¿Qué tipo de productos te interesan?",
        sentAt: new Date("2025-01-15T10:32:00"),
        status: "DELIVERED" as const,
        attachments: [],
        author: {
          id: "user-2",
          name: "María García",
          email: "maria@acme.com",
        },
      },
    ],
  },
  {
    id: "thread-2",
    tenantId: "tenant-1",
    localId: "local-1",
    channelId: "channel-2",
    contactId: "contact-2",
    subject: "Problema con pedido #1234",
    status: "OPEN" as const,
    priority: "HIGH" as const,
    assigneeId: "user-3",
    lastMessageAt: new Date("2025-01-15T11:45:00"),
    createdAt: new Date("2025-01-15T09:00:00"),
    channel: {
      id: "channel-2",
      type: "WHATSAPP" as const,
      displayName: "+52 55 1234 5678",
      status: "ACTIVE" as const,
    },
    local: {
      id: "local-1",
      name: "Sucursal Centro",
    },
    assignee: {
      id: "user-3",
      name: "Carlos López",
      email: "carlos@acme.com",
    },
    contact: {
      id: "contact-2",
      handle: "+52 55 9876 5432",
      name: "Ana Martínez",
      email: "ana@example.com",
      phone: "+52 55 9876 5432",
      avatarUrl: null,
    },
    messages: [
      {
        id: "msg-2",
        threadId: "thread-2",
        direction: "INBOUND" as const,
        content: "Mi pedido #1234 no ha llegado y ya pasaron 5 días",
        sentAt: new Date("2025-01-15T11:45:00"),
      },
      {
        id: "msg-2-reply",
        threadId: "thread-2",
        direction: "OUTBOUND" as const,
        content: "Hola Ana, lamento mucho el inconveniente. Déjame revisar el estatus de tu pedido #1234 de inmediato.",
        sentAt: new Date("2025-01-15T11:47:00"),
        status: "DELIVERED" as const,
        attachments: [],
        author: {
          id: "user-3",
          name: "Carlos López",
          email: "carlos@acme.com",
        },
      },
    ],
  },
  {
    id: "thread-3",
    tenantId: "tenant-1",
    localId: "local-2",
    channelId: "channel-3",
    contactId: "contact-3",
    subject: "Horarios de atención",
    status: "PENDING" as const,
    priority: "LOW" as const,
    assigneeId: null,
    lastMessageAt: new Date("2025-01-15T08:15:00"),
    createdAt: new Date("2025-01-15T08:15:00"),
    channel: {
      id: "channel-3",
      type: "FACEBOOK" as const,
      displayName: "ACME Norte",
      status: "ACTIVE" as const,
    },
    local: {
      id: "local-2",
      name: "Sucursal Norte",
    },
    assignee: null,
    contact: {
      id: "contact-3",
      handle: "laura.rodriguez",
      name: "Laura Rodríguez",
      email: null,
      phone: null,
      avatarUrl: null,
    },
    messages: [
      {
        id: "msg-3",
        threadId: "thread-3",
        direction: "INBOUND" as const,
        content: "¿Cuál es su horario de atención los fines de semana?",
        sentAt: new Date("2025-01-15T08:15:00"),
      },
    ],
  },
  {
    id: "thread-4",
    tenantId: "tenant-1",
    localId: "local-1",
    channelId: "channel-1",
    contactId: "contact-4",
    subject: "Solicitud de cotización",
    status: "CLOSED" as const,
    priority: "MEDIUM" as const,
    assigneeId: "user-2",
    lastMessageAt: new Date("2025-01-14T16:20:00"),
    createdAt: new Date("2025-01-14T14:00:00"),
    channel: {
      id: "channel-1",
      type: "INSTAGRAM" as const,
      displayName: "@acme_centro",
      status: "ACTIVE" as const,
    },
    local: {
      id: "local-1",
      name: "Sucursal Centro",
    },
    assignee: {
      id: "user-2",
      name: "María García",
      email: "maria@acme.com",
    },
    contact: {
      id: "contact-4",
      handle: "@empresabc",
      name: "Empresa ABC",
      email: "contacto@empresaabc.com",
      phone: null,
      avatarUrl: null,
    },
    messages: [
      {
        id: "msg-4",
        threadId: "thread-4",
        direction: "INBOUND" as const,
        content: "Necesito cotización para 100 unidades",
        sentAt: new Date("2025-01-14T16:20:00"),
      },
      {
        id: "msg-4-reply",
        threadId: "thread-4",
        direction: "OUTBOUND" as const,
        content:
          "Perfecto, te envío la cotización por correo en las próximas horas. ¿Necesitas alguna especificación particular?",
        sentAt: new Date("2025-01-14T16:25:00"),
        status: "DELIVERED" as const,
        attachments: [],
        author: {
          id: "user-2",
          name: "María García",
          email: "maria@acme.com",
        },
      },
    ],
  },
  {
    id: "thread-5",
    tenantId: "tenant-1",
    localId: "local-1",
    channelId: "channel-2",
    contactId: "contact-5",
    subject: "Pregunta sobre garantía",
    status: "OPEN" as const,
    priority: "MEDIUM" as const,
    assigneeId: "user-1",
    lastMessageAt: new Date("2025-01-15T12:00:00"),
    createdAt: new Date("2025-01-15T11:30:00"),
    channel: {
      id: "channel-2",
      type: "WHATSAPP" as const,
      displayName: "+52 55 1234 5678",
      status: "ACTIVE" as const,
    },
    local: {
      id: "local-1",
      name: "Sucursal Centro",
    },
    assignee: {
      id: "user-1",
      name: "Admin Usuario",
      email: "admin@acme.com",
    },
    contact: {
      id: "contact-5",
      handle: "+52 55 1111 2222",
      name: "Roberto Sánchez",
      email: null,
      phone: "+52 55 1111 2222",
      avatarUrl: null,
    },
    messages: [
      {
        id: "msg-5",
        threadId: "thread-5",
        direction: "INBOUND" as const,
        content: "¿Cuánto tiempo de garantía tienen los productos?",
        sentAt: new Date("2025-01-15T12:00:00"),
      },
    ],
  },
]

export const mockAnalytics = {
  totalThreads: 156,
  openThreads: 42,
  closedThreads: 98,
  avgResponseTime: 12.5,
  averageFirstResponseTime: 18,
  averageResolutionTime: 240,
  closeRate: 62.8,
  channelData: [
    { name: "Instagram", value: 65 },
    { name: "WhatsApp", value: 52 },
    { name: "Facebook", value: 28 },
    { name: "TikTok", value: 11 },
  ],
  agentData: [
    { name: "María García", value: 48 },
    { name: "Carlos López", value: 42 },
    { name: "Admin Usuario", value: 35 },
    { name: "Sin asignar", value: 31 },
  ],
  messageVolume: 1247,
  hourlyMetrics: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    inbound: Math.floor(Math.random() * 20) + (i >= 9 && i <= 17 ? 15 : 5),
    outbound: Math.floor(Math.random() * 15) + (i >= 9 && i <= 17 ? 10 : 3),
    total: 0
  })).map(item => ({
    ...item,
    total: item.inbound + item.outbound
  })),
  peakMetrics: {
    peaks: [
      {
        date: "2024-01-15",
        hour: 14,
        volume: 45,
        intensity: "high" as const
      },
      {
        date: "2024-01-16",
        hour: 10,
        volume: 38,
        intensity: "high" as const
      },
      {
        date: "2024-01-17",
        hour: 16,
        volume: 32,
        intensity: "medium" as const
      },
      {
        date: "2024-01-18",
        hour: 11,
        volume: 28,
        intensity: "medium" as const
      },
      {
        date: "2024-01-19",
        hour: 15,
        volume: 25,
        intensity: "low" as const
      }
    ],
    averageVolume: 12.5,
    maxVolume: 45,
    peakThreshold: 18.2,
    patterns: {
      mostFrequentHours: [
        { hour: 14, count: 3 },
        { hour: 10, count: 2 },
        { hour: 16, count: 2 }
      ],
      mostActiveDays: [
        { date: "2024-01-15", count: 2 },
        { date: "2024-01-16", count: 1 },
        { date: "2024-01-17", count: 1 }
      ],
      totalPeaks: 5
    }
  },
  timelineMetrics: {
    timeline: [
      { period: "2024-01-15", inbound: 45, outbound: 32, total: 77 },
      { period: "2024-01-16", inbound: 52, outbound: 38, total: 90 },
      { period: "2024-01-17", inbound: 38, outbound: 28, total: 66 },
      { period: "2024-01-18", inbound: 61, outbound: 45, total: 106 },
      { period: "2024-01-19", inbound: 43, outbound: 31, total: 74 },
      { period: "2024-01-20", inbound: 29, outbound: 18, total: 47 },
      { period: "2024-01-21", inbound: 35, outbound: 22, total: 57 }
    ],
    totalMessages: 517,
    averagePerPeriod: 73.9,
    trend: "increasing" as const,
    granularity: "day" as const
  },
  comparisonMetrics: {
    current: {
      totalThreads: 156,
      openThreads: 42,
      closedThreads: 98,
      totalMessages: 1247,
      inboundMessages: 743,
      outboundMessages: 504,
      avgResponseTime: 18,
      closeRate: 62.8,
      periodLength: 7
    },
    previous: {
      totalThreads: 142,
      openThreads: 38,
      closedThreads: 89,
      totalMessages: 1089,
      inboundMessages: 621,
      outboundMessages: 468,
      avgResponseTime: 22,
      closeRate: 58.5,
      periodLength: 7
    },
    comparisons: {
      totalThreads: {
        current: 156,
        previous: 142,
        change: 9.9,
        changeType: "increase" as const
      },
      totalMessages: {
        current: 1247,
        previous: 1089,
        change: 14.5,
        changeType: "increase" as const
      },
      avgResponseTime: {
        current: 18,
        previous: 22,
        change: -18.2,
        changeType: "decrease" as const
      },
      closeRate: {
        current: 62.8,
        previous: 58.5,
        change: 7.4,
        changeType: "increase" as const
      },
      inboundMessages: {
        current: 743,
        previous: 621,
        change: 19.6,
        changeType: "increase" as const
      },
      outboundMessages: {
        current: 504,
        previous: 468,
        change: 7.7,
        changeType: "increase" as const
      }
    },
    periodInfo: {
      currentStart: new Date("2024-01-15"),
      currentEnd: new Date("2024-01-21"),
      previousStart: new Date("2024-01-08"),
      previousEnd: new Date("2024-01-14"),
      comparisonType: "previous_period" as const
    }
  },
  heatmapMetrics: {
    heatmap: [
      {
        day: "Domingo",
        dayIndex: 0,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 5) + (i >= 10 && i <= 14 ? 3 : 0),
          outbound: Math.floor(Math.random() * 3) + (i >= 10 && i <= 14 ? 2 : 0),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      },
      {
        day: "Lunes",
        dayIndex: 1,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 15) + (i >= 9 && i <= 17 ? 10 : 2),
          outbound: Math.floor(Math.random() * 10) + (i >= 9 && i <= 17 ? 5 : 1),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      },
      {
        day: "Martes",
        dayIndex: 2,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 18) + (i >= 9 && i <= 17 ? 12 : 2),
          outbound: Math.floor(Math.random() * 12) + (i >= 9 && i <= 17 ? 6 : 1),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      },
      {
        day: "Miércoles",
        dayIndex: 3,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 20) + (i >= 9 && i <= 17 ? 15 : 2),
          outbound: Math.floor(Math.random() * 14) + (i >= 9 && i <= 17 ? 8 : 1),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      },
      {
        day: "Jueves",
        dayIndex: 4,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 22) + (i >= 9 && i <= 17 ? 18 : 2),
          outbound: Math.floor(Math.random() * 16) + (i >= 9 && i <= 17 ? 10 : 1),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      },
      {
        day: "Viernes",
        dayIndex: 5,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 25) + (i >= 9 && i <= 17 ? 20 : 2),
          outbound: Math.floor(Math.random() * 18) + (i >= 9 && i <= 17 ? 12 : 1),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      },
      {
        day: "Sábado",
        dayIndex: 6,
        hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          inbound: Math.floor(Math.random() * 8) + (i >= 10 && i <= 16 ? 5 : 1),
          outbound: Math.floor(Math.random() * 5) + (i >= 10 && i <= 16 ? 3 : 0),
          total: 0
        })).map(item => ({ ...item, total: item.inbound + item.outbound }))
      }
    ],
    maxActivity: 45,
    totalMessages: 2847,
    peakHours: [
      { hour: 14, total: 156 },
      { hour: 10, total: 142 },
      { hour: 16, total: 138 }
    ],
    peakDays: [
      { day: 5, total: 456 }, // Viernes
      { day: 4, total: 432 }, // Jueves
      { day: 3, total: 398 }  // Miércoles
    ],
    averagePerHour: 16.9
  },
  funnelMetrics: {
    funnel: {
      totalThreads: 1247,
      assignedThreads: 1089,
      threadsWithAgentResponse: 987,
      resolvedThreads: 856,
      openThreads: 158,
      pendingThreads: 233,
      closedThreads: 856
    },
    conversionRates: {
      assignmentRate: 87.3,
      responseRate: 79.2,
      resolutionRate: 68.6
    },
    averageTimes: {
      timeToAssignment: 12.5, // minutos
      timeToFirstResponse: 18.7, // minutos
      timeToResolution: 2.4 // horas
    },
    losses: {
      lostAtAssignment: 158,
      lostAtResponse: 102,
      lostAtResolution: 131,
      lossRateAtAssignment: 12.7,
      lossRateAtResponse: 9.4,
      lossRateAtResolution: 13.3
    },
    stages: [
      {
        name: "Conversaciones Iniciadas",
        count: 1247,
        percentage: 100,
        color: "bg-blue-500"
      },
      {
        name: "Asignadas",
        count: 1089,
        percentage: 87.3,
        color: "bg-yellow-500"
      },
      {
        name: "Con Respuesta",
        count: 987,
        percentage: 79.2,
        color: "bg-orange-500"
      },
      {
        name: "Resueltas",
        count: 856,
        percentage: 68.6,
        color: "bg-green-500"
      }
    ]
  },
  rankingMetrics: {
    agents: [
      {
        position: 1,
        agent: {
          id: "agent-1",
          name: "María González",
          email: "maria@example.com"
        },
        metrics: {
          totalThreads: 45,
          openThreads: 8,
          closedThreads: 37,
          totalMessages: 234,
          inboundMessages: 156,
          outboundMessages: 78,
          avgFirstResponseTime: 12.5,
          avgResolutionTime: 2.3,
          resolutionRate: 82.2,
          productivity: 5.2,
          avgMessageLength: 145,
          score: 87.5
        },
        trend: "top"
      },
      {
        position: 2,
        agent: {
          id: "agent-2",
          name: "Carlos Rodríguez",
          email: "carlos@example.com"
        },
        metrics: {
          totalThreads: 38,
          openThreads: 5,
          closedThreads: 33,
          totalMessages: 198,
          inboundMessages: 132,
          outboundMessages: 66,
          avgFirstResponseTime: 15.2,
          avgResolutionTime: 2.8,
          resolutionRate: 86.8,
          productivity: 5.2,
          avgMessageLength: 138,
          score: 82.3
        },
        trend: "top"
      },
      {
        position: 3,
        agent: {
          id: "agent-3",
          name: "Ana Martínez",
          email: "ana@example.com"
        },
        metrics: {
          totalThreads: 42,
          openThreads: 12,
          closedThreads: 30,
          totalMessages: 189,
          inboundMessages: 126,
          outboundMessages: 63,
          avgFirstResponseTime: 18.7,
          avgResolutionTime: 3.2,
          resolutionRate: 71.4,
          productivity: 4.5,
          avgMessageLength: 142,
          score: 75.8
        },
        trend: "top"
      },
      {
        position: 4,
        agent: {
          id: "agent-4",
          name: "Luis Fernández",
          email: "luis@example.com"
        },
        metrics: {
          totalThreads: 31,
          openThreads: 6,
          closedThreads: 25,
          totalMessages: 156,
          inboundMessages: 104,
          outboundMessages: 52,
          avgFirstResponseTime: 22.3,
          avgResolutionTime: 3.8,
          resolutionRate: 80.6,
          productivity: 5.0,
          avgMessageLength: 128,
          score: 68.9
        },
        trend: "good"
      },
      {
        position: 5,
        agent: {
          id: "agent-5",
          name: "Sofia López",
          email: "sofia@example.com"
        },
        metrics: {
          totalThreads: 28,
          openThreads: 9,
          closedThreads: 19,
          totalMessages: 134,
          inboundMessages: 89,
          outboundMessages: 45,
          avgFirstResponseTime: 25.1,
          avgResolutionTime: 4.2,
          resolutionRate: 67.9,
          productivity: 4.8,
          avgMessageLength: 135,
          score: 62.4
        },
        trend: "good"
      }
    ],
    summary: {
      totalAgents: 5,
      avgScore: 75.4,
      topPerformers: [
        {
          position: 1,
          agent: {
            id: "agent-1",
            name: "María González",
            email: "maria@example.com"
          },
          metrics: {
            totalThreads: 45,
            resolutionRate: 82.2,
            score: 87.5
          }
        },
        {
          position: 2,
          agent: {
            id: "agent-2",
            name: "Carlos Rodríguez",
            email: "carlos@example.com"
          },
          metrics: {
            totalThreads: 38,
            resolutionRate: 86.8,
            score: 82.3
          }
        },
        {
          position: 3,
          agent: {
            id: "agent-3",
            name: "Ana Martínez",
            email: "ana@example.com"
          },
          metrics: {
            totalThreads: 42,
            resolutionRate: 71.4,
            score: 75.8
          }
        }
      ],
      needsImprovement: [
        {
          position: 5,
          agent: {
            id: "agent-5",
            name: "Sofia López",
            email: "sofia@example.com"
          },
          metrics: {
            totalThreads: 28,
            resolutionRate: 67.9,
            score: 62.4
          }
        }
      ]
    },
    categories: {
      byScore: [], // Se llena dinámicamente
      byThreads: [], // Se llena dinámicamente
      byResolutionRate: [], // Se llena dinámicamente
      byResponseTime: [] // Se llena dinámicamente
    }
  },
  volumeMetrics: {
    agents: [
      {
        agent: {
          id: "agent-1",
          name: "María González",
          email: "maria@example.com"
        },
        metrics: {
          totalThreads: 45,
          openThreads: 8,
          pendingThreads: 5,
          closedThreads: 32,
          totalMessages: 234,
          inboundMessages: 156,
          outboundMessages: 78,
          avgMessagesPerThread: 5.2,
          avgThreadDuration: 2.3,
          productivity: 1.5,
          threadsByDay: {
            "2024-01-15": 3,
            "2024-01-16": 4,
            "2024-01-17": 2,
            "2024-01-18": 5,
            "2024-01-19": 3
          },
          threadsByHour: {
            9: 2, 10: 3, 11: 4, 14: 5, 15: 3, 16: 2
          },
          threadsByStatus: {
            "OPEN": 8,
            "PENDING": 5,
            "CLOSED": 32
          }
        }
      },
      {
        agent: {
          id: "agent-2",
          name: "Carlos Rodríguez",
          email: "carlos@example.com"
        },
        metrics: {
          totalThreads: 38,
          openThreads: 5,
          pendingThreads: 3,
          closedThreads: 30,
          totalMessages: 198,
          inboundMessages: 132,
          outboundMessages: 66,
          avgMessagesPerThread: 5.2,
          avgThreadDuration: 2.8,
          productivity: 1.3,
          threadsByDay: {
            "2024-01-15": 2,
            "2024-01-16": 3,
            "2024-01-17": 4,
            "2024-01-18": 3,
            "2024-01-19": 2
          },
          threadsByHour: {
            8: 1, 9: 2, 10: 3, 13: 4, 14: 3, 15: 2
          },
          threadsByStatus: {
            "OPEN": 5,
            "PENDING": 3,
            "CLOSED": 30
          }
        }
      },
      {
        agent: {
          id: "agent-3",
          name: "Ana Martínez",
          email: "ana@example.com"
        },
        metrics: {
          totalThreads: 42,
          openThreads: 12,
          pendingThreads: 4,
          closedThreads: 26,
          totalMessages: 189,
          inboundMessages: 126,
          outboundMessages: 63,
          avgMessagesPerThread: 4.5,
          avgThreadDuration: 3.2,
          productivity: 1.4,
          threadsByDay: {
            "2024-01-15": 4,
            "2024-01-16": 3,
            "2024-01-17": 2,
            "2024-01-18": 4,
            "2024-01-19": 3
          },
          threadsByHour: {
            9: 3, 10: 2, 11: 4, 14: 3, 15: 4, 16: 3
          },
          threadsByStatus: {
            "OPEN": 12,
            "PENDING": 4,
            "CLOSED": 26
          }
        }
      },
      {
        agent: {
          id: "agent-4",
          name: "Luis Fernández",
          email: "luis@example.com"
        },
        metrics: {
          totalThreads: 31,
          openThreads: 6,
          pendingThreads: 2,
          closedThreads: 23,
          totalMessages: 156,
          inboundMessages: 104,
          outboundMessages: 52,
          avgMessagesPerThread: 5.0,
          avgThreadDuration: 3.8,
          productivity: 1.0,
          threadsByDay: {
            "2024-01-15": 2,
            "2024-01-16": 1,
            "2024-01-17": 3,
            "2024-01-18": 2,
            "2024-01-19": 1
          },
          threadsByHour: {
            8: 1, 9: 2, 10: 1, 13: 2, 14: 1, 15: 2
          },
          threadsByStatus: {
            "OPEN": 6,
            "PENDING": 2,
            "CLOSED": 23
          }
        }
      },
      {
        agent: {
          id: "agent-5",
          name: "Sofia López",
          email: "sofia@example.com"
        },
        metrics: {
          totalThreads: 28,
          openThreads: 9,
          pendingThreads: 3,
          closedThreads: 16,
          totalMessages: 134,
          inboundMessages: 89,
          outboundMessages: 45,
          avgMessagesPerThread: 4.8,
          avgThreadDuration: 4.2,
          productivity: 0.9,
          threadsByDay: {
            "2024-01-15": 1,
            "2024-01-16": 2,
            "2024-01-17": 1,
            "2024-01-18": 2,
            "2024-01-19": 1
          },
          threadsByHour: {
            9: 1, 10: 1, 11: 2, 14: 1, 15: 1, 16: 1
          },
          threadsByStatus: {
            "OPEN": 9,
            "PENDING": 3,
            "CLOSED": 16
          }
        }
      }
    ],
    summary: {
      totalAgents: 5,
      totalThreads: 184,
      totalMessages: 911,
      avgThreadsPerAgent: 36.8,
      avgMessagesPerThread: 4.95
    },
    topPerformers: {
      byVolume: [
        {
          agent: {
            id: "agent-1",
            name: "María González",
            email: "maria@example.com"
          },
          metrics: {
            totalThreads: 45,
            totalMessages: 234
          }
        },
        {
          agent: {
            id: "agent-3",
            name: "Ana Martínez",
            email: "ana@example.com"
          },
          metrics: {
            totalThreads: 42,
            totalMessages: 189
          }
        },
        {
          agent: {
            id: "agent-2",
            name: "Carlos Rodríguez",
            email: "carlos@example.com"
          },
          metrics: {
            totalThreads: 38,
            totalMessages: 198
          }
        }
      ],
      byMessages: [
        {
          agent: {
            id: "agent-1",
            name: "María González",
            email: "maria@example.com"
          },
          metrics: {
            totalMessages: 234,
            totalThreads: 45
          }
        },
        {
          agent: {
            id: "agent-2",
            name: "Carlos Rodríguez",
            email: "carlos@example.com"
          },
          metrics: {
            totalMessages: 198,
            totalThreads: 38
          }
        },
        {
          agent: {
            id: "agent-3",
            name: "Ana Martínez",
            email: "ana@example.com"
          },
          metrics: {
            totalMessages: 189,
            totalThreads: 42
          }
        }
      ],
      byProductivity: [
        {
          agent: {
            id: "agent-1",
            name: "María González",
            email: "maria@example.com"
          },
          metrics: {
            productivity: 1.5,
            avgThreadDuration: 2.3
          }
        },
        {
          agent: {
            id: "agent-3",
            name: "Ana Martínez",
            email: "ana@example.com"
          },
          metrics: {
            productivity: 1.4,
            avgThreadDuration: 3.2
          }
        },
        {
          agent: {
            id: "agent-2",
            name: "Carlos Rodríguez",
            email: "carlos@example.com"
          },
          metrics: {
            productivity: 1.3,
            avgThreadDuration: 2.8
          }
        }
      ]
    },
    distribution: {
      byStatus: {
        open: 40,
        pending: 17,
        closed: 127
      },
      byHour: {
        8: 2, 9: 8, 10: 12, 11: 10, 13: 6, 14: 15, 15: 13, 16: 8
      },
      byDay: {
        "2024-01-15": 12,
        "2024-01-16": 14,
        "2024-01-17": 12,
        "2024-01-18": 16,
        "2024-01-19": 10
      }
    }
  }
}

export const mockContacts = [
  {
    id: "contact-1",
    tenantId: "tenant-1",
    platform: "INSTAGRAM",
    handle: "@juanperez",
    name: "Juan Pérez",
    email: null,
    phone: null,
    avatarUrl: null,
    notes: "Cliente frecuente, interesado en productos premium",
    createdAt: new Date("2025-01-10T10:00:00"),
    threads: [{ id: "thread-1" }],
  },
  {
    id: "contact-2",
    tenantId: "tenant-1",
    platform: "WHATSAPP",
    handle: "+52 55 9876 5432",
    name: "Ana Martínez",
    email: "ana@example.com",
    phone: "+52 55 9876 5432",
    avatarUrl: null,
    notes: "Requiere seguimiento especial por problema con pedido",
    createdAt: new Date("2025-01-12T09:00:00"),
    threads: [{ id: "thread-2" }],
  },
  {
    id: "contact-3",
    tenantId: "tenant-1",
    platform: "FACEBOOK",
    handle: "laura.rodriguez",
    name: "Laura Rodríguez",
    email: null,
    phone: null,
    avatarUrl: null,
    notes: null,
    createdAt: new Date("2025-01-15T08:00:00"),
    threads: [{ id: "thread-3" }],
  },
  {
    id: "contact-4",
    tenantId: "tenant-1",
    platform: "INSTAGRAM",
    handle: "@empresabc",
    name: "Empresa ABC",
    email: "contacto@empresaabc.com",
    phone: "+52 55 3333 4444",
    avatarUrl: null,
    notes: "Cliente corporativo - solicitudes de cotización frecuentes",
    createdAt: new Date("2025-01-08T14:00:00"),
    threads: [{ id: "thread-4" }],
  },
  {
    id: "contact-5",
    tenantId: "tenant-1",
    platform: "WHATSAPP",
    handle: "+52 55 1111 2222",
    name: "Roberto Sánchez",
    email: null,
    phone: "+52 55 1111 2222",
    avatarUrl: null,
    notes: null,
    createdAt: new Date("2025-01-15T11:00:00"),
    threads: [{ id: "thread-5" }],
  },
]

export const mockMessages = [
  {
    id: "msg-1",
    threadId: "thread-1",
    direction: "INBOUND",
    body: "Hola, quisiera información sobre sus productos",
    sentAt: new Date("2025-01-15T10:30:00"),
    status: "DELIVERED",
    attachments: [],
    contact: {
      name: "Juan Pérez",
      handle: "@juanperez",
    },
  },
  {
    id: "msg-1-reply",
    threadId: "thread-1",
    direction: "OUTBOUND",
    body: "¡Hola Juan! Con gusto te ayudo. ¿Qué tipo de productos te interesan?",
    sentAt: new Date("2025-01-15T10:32:00"),
    status: "DELIVERED",
    attachments: [],
    author: {
      name: "María García",
      email: "maria@acme.com",
    },
  },
  {
    id: "msg-2",
    threadId: "thread-2",
    direction: "INBOUND",
    body: "Mi pedido #1234 no ha llegado y ya pasaron 5 días",
    sentAt: new Date("2025-01-15T11:45:00"),
    status: "DELIVERED",
    attachments: [],
    contact: {
      name: "Ana Martínez",
      handle: "+52 55 9876 5432",
    },
  },
  {
    id: "msg-2-reply",
    threadId: "thread-2",
    direction: "OUTBOUND",
    body: "Hola Ana, lamento mucho el inconveniente. Déjame revisar el estatus de tu pedido #1234 de inmediato.",
    sentAt: new Date("2025-01-15T11:47:00"),
    status: "DELIVERED",
    attachments: [],
    author: {
      name: "Carlos López",
      email: "carlos@acme.com",
    },
  },
  {
    id: "msg-3",
    threadId: "thread-3",
    direction: "INBOUND",
    body: "¿Cuál es su horario de atención los fines de semana?",
    sentAt: new Date("2025-01-15T08:15:00"),
    status: "DELIVERED",
    attachments: [],
    contact: {
      name: "Laura Rodríguez",
      handle: "laura.rodriguez",
    },
  },
  {
    id: "msg-4",
    threadId: "thread-4",
    direction: "INBOUND",
    body: "Necesito cotización para 100 unidades",
    sentAt: new Date("2025-01-14T16:20:00"),
    status: "DELIVERED",
    attachments: [],
    contact: {
      name: "Empresa ABC",
      handle: "@empresabc",
    },
  },
  {
    id: "msg-4-reply",
    threadId: "thread-4",
    direction: "OUTBOUND",
    body: "Perfecto, te envío la cotización por correo en las próximas horas. ¿Necesitas alguna especificación particular?",
    sentAt: new Date("2025-01-14T16:25:00"),
    status: "DELIVERED",
    attachments: [],
    author: {
      name: "María García",
      email: "maria@acme.com",
    },
  },
  {
    id: "msg-5",
    threadId: "thread-5",
    direction: "INBOUND",
    body: "¿Cuánto tiempo de garantía tienen los productos?",
    sentAt: new Date("2025-01-15T12:00:00"),
    status: "DELIVERED",
    attachments: [],
    contact: {
      name: "Roberto Sánchez",
      handle: "+52 55 1111 2222",
    },
  },
]

export const mockLocalsWithCount = [
  {
    id: "local-1",
    name: "Sucursal Centro",
    address: "Av. Reforma 123, CDMX",
    tenantId: "tenant-1",
    channels: [
      {
        id: "channel-1",
        type: "INSTAGRAM",
        displayName: "@acme_centro",
        status: "ACTIVE",
      },
      {
        id: "channel-2",
        type: "WHATSAPP",
        displayName: "+52 55 1234 5678",
        status: "ACTIVE",
      },
    ],
    _count: {
      threads: 87,
    },
  },
  {
    id: "local-2",
    name: "Sucursal Norte",
    address: "Blvd. Norte 456, Monterrey",
    tenantId: "tenant-1",
    channels: [
      {
        id: "channel-3",
        type: "FACEBOOK",
        displayName: "ACME Norte",
        status: "ACTIVE",
      },
      {
        id: "channel-4",
        type: "TIKTOK",
        displayName: "@acme_norte",
        status: "ACTIVE",
      },
    ],
    _count: {
      threads: 69,
    },
  },
]

export const mockSLAs = [
  {
    id: "sla-1",
    tenantId: "tenant-1",
    name: "SLA Estándar",
    firstResponseMinutes: 30,
    resolutionMinutes: 240,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00"),
    updatedAt: new Date("2025-01-01T00:00:00"),
  },
  {
    id: "sla-2",
    tenantId: "tenant-1",
    name: "SLA Premium",
    firstResponseMinutes: 15,
    resolutionMinutes: 120,
    isActive: false,
    createdAt: new Date("2025-01-01T00:00:00"),
    updatedAt: new Date("2025-01-01T00:00:00"),
  },
]

export function getMockMessagesByThreadId(threadId: string) {
  return mockMessages.filter((msg) => msg.threadId === threadId)
}

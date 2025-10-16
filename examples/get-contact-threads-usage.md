# Uso de getContactThreads

## Descripción
Función para obtener todas las conversaciones (threads) de un contacto específico con información completa.

## Sintaxis
```typescript
getContactThreads(contactId: string)
```

## Parámetros
- `contactId`: ID del contacto del cual obtener los threads

## Retorno
```typescript
{
  success: true,
  data: {
    contact: {
      id: string
      name: string | null
      handle: string
      platform: string
    }
    threads: Array<{
      id: string
      externalId: string
      subject: string | null
      status: "OPEN" | "PENDING" | "CLOSED"
      assigneeId: string | null
      assignee: {
        id: string
        name: string | null
        email: string | null
        image: string | null
      } | null
      channel: {
        id: string
        displayName: string
        type: string
        status: string
      }
      lastMessageAt: Date
      createdAt: Date
      updatedAt: Date
      lastMessage: {
        id: string
        direction: "INBOUND" | "OUTBOUND"
        body: string
        sentAt: Date
        deliveredAt: Date | null
        authorId: string | null
      } | null
      messageCount: number
    }>
    totalThreads: number
    openThreads: number
    pendingThreads: number
    closedThreads: number
  }
} | {
  error: string
}
```

## Ejemplos de Uso

### Obtener todos los threads de un contacto
```typescript
const result = await getContactThreads("contact_123")

if (result.error) {
  console.error("Error:", result.error)
} else {
  console.log("Contacto:", result.data.contact)
  console.log("Total threads:", result.data.totalThreads)
  console.log("Threads abiertos:", result.data.openThreads)
  
  result.data.threads.forEach(thread => {
    console.log(`Thread ${thread.id}:`)
    console.log(`- Canal: ${thread.channel.displayName}`)
    console.log(`- Estado: ${thread.status}`)
    console.log(`- Asignado a: ${thread.assignee?.name || 'Sin asignar'}`)
    console.log(`- Último mensaje: ${thread.lastMessage?.body || 'Sin mensajes'}`)
    console.log(`- Total mensajes: ${thread.messageCount}`)
  })
}
```

### Filtrar threads por estado
```typescript
const result = await getContactThreads("contact_123")

if (result.success) {
  const openThreads = result.data.threads.filter(t => t.status === "OPEN")
  const closedThreads = result.data.threads.filter(t => t.status === "CLOSED")
  
  console.log("Threads abiertos:", openThreads.length)
  console.log("Threads cerrados:", closedThreads.length)
}
```

### Obtener threads asignados a un usuario específico
```typescript
const result = await getContactThreads("contact_123")

if (result.success) {
  const assignedThreads = result.data.threads.filter(t => t.assigneeId === "user_456")
  console.log("Threads asignados al usuario:", assignedThreads.length)
}
```

### Obtener threads de un canal específico
```typescript
const result = await getContactThreads("contact_123")

if (result.success) {
  const whatsappThreads = result.data.threads.filter(t => t.channel.type === "WHATSAPP")
  console.log("Threads de WhatsApp:", whatsappThreads.length)
}
```

## Información Incluida

### Por cada Thread:
- **Información básica**: ID, externalId, subject, status
- **Asignación**: assigneeId y datos del agente asignado
- **Canal**: Información del canal (nombre, tipo, estado)
- **Timestamps**: lastMessageAt, createdAt, updatedAt
- **Último mensaje**: Preview del último mensaje enviado
- **Contador**: Total de mensajes en el thread

### Estadísticas del Contacto:
- **totalThreads**: Total de conversaciones
- **openThreads**: Conversaciones abiertas
- **pendingThreads**: Conversaciones pendientes
- **closedThreads**: Conversaciones cerradas

## Validaciones
- El usuario debe estar autenticado
- El usuario debe tener acceso al tenant del contacto
- El contacto debe existir
- Solo se devuelven threads del mismo tenant

## Manejo de Errores
```typescript
const result = await getContactThreads("contact_123")

if (result.error) {
  switch (result.error) {
    case "Contacto no encontrado":
      console.log("El contacto no existe")
      break
    case "No tienes acceso a este tenant":
      console.log("No tienes permisos para ver este contacto")
      break
    default:
      console.log("Error inesperado:", result.error)
  }
} else {
  // Procesar threads
  console.log("Threads obtenidos:", result.data.threads.length)
}
```

## Casos de Uso Comunes

### 1. Historial de Conversaciones
```typescript
// Mostrar historial completo de un contacto
const result = await getContactThreads("contact_123")
if (result.success) {
  result.data.threads.forEach(thread => {
    console.log(`${thread.channel.displayName} - ${thread.status}`)
    if (thread.lastMessage) {
      console.log(`Último: ${thread.lastMessage.body}`)
    }
  })
}
```

### 2. Dashboard de Contacto
```typescript
// Mostrar estadísticas del contacto
const result = await getContactThreads("contact_123")
if (result.success) {
  console.log(`Total: ${result.data.totalThreads}`)
  console.log(`Abiertas: ${result.data.openThreads}`)
  console.log(`Pendientes: ${result.data.pendingThreads}`)
  console.log(`Cerradas: ${result.data.closedThreads}`)
}
```

### 3. Análisis de Comunicación
```typescript
// Analizar patrones de comunicación
const result = await getContactThreads("contact_123")
if (result.success) {
  const channels = result.data.threads.reduce((acc, thread) => {
    acc[thread.channel.type] = (acc[thread.channel.type] || 0) + 1
    return acc
  }, {})
  
  console.log("Uso por canal:", channels)
}
```

## Ventajas
- **Información Completa**: Incluye todos los datos necesarios en una sola consulta
- **Optimizada**: Solo obtiene el último mensaje para preview
- **Estadísticas**: Incluye contadores y estadísticas automáticamente
- **Segura**: Verificación de permisos y tenant
- **Ordenada**: Threads ordenados por fecha de último mensaje

# Uso de searchContacts

## Descripción
Función avanzada para buscar contactos con múltiples criterios de filtrado, ordenamiento y paginación.

## Sintaxis
```typescript
searchContacts(query: {
  tenantId: string
  search?: string
  platform?: string
  hasThreads?: boolean
  threadStatus?: "OPEN" | "PENDING" | "CLOSED"
  assignedTo?: string
  hasEmail?: boolean
  hasPhone?: boolean
  createdAfter?: Date
  createdBefore?: Date
  lastActivityAfter?: Date
  lastActivityBefore?: Date
  limit?: number
  offset?: number
  sortBy?: "name" | "handle" | "createdAt" | "lastActivity"
  sortOrder?: "asc" | "desc"
})
```

## Parámetros

### Búsqueda Básica
- `tenantId`: ID del tenant (requerido)
- `search`: Texto para buscar en nombre, handle, email, teléfono o notas
- `platform`: Filtrar por plataforma específica
- `limit`: Número máximo de resultados (default: 50)
- `offset`: Número de resultados a omitir para paginación (default: 0)

### Filtros de Contacto
- `hasEmail`: true/false para contactos con/sin email
- `hasPhone`: true/false para contactos con/sin teléfono
- `createdAfter`: Fecha mínima de creación
- `createdBefore`: Fecha máxima de creación

### Filtros de Threads
- `hasThreads`: true/false para contactos con/sin conversaciones
- `threadStatus`: Filtrar por estado de threads (OPEN, PENDING, CLOSED)
- `assignedTo`: ID del usuario asignado a los threads
- `lastActivityAfter`: Fecha mínima de última actividad
- `lastActivityBefore`: Fecha máxima de última actividad

### Ordenamiento
- `sortBy`: Campo para ordenar (name, handle, createdAt, lastActivity)
- `sortOrder`: Dirección del ordenamiento (asc, desc)

## Retorno
```typescript
{
  success: true,
  data: {
    contacts: Array<{
      id: string
      name: string | null
      handle: string
      platform: string
      phone: string | null
      email: string | null
      notes: string | null
      createdAt: Date
      updatedAt: Date
      lastActivity: Date
      threads: Array<Thread>
      stats: {
        totalThreads: number
        openThreads: number
        pendingThreads: number
        closedThreads: number
      }
    }>
    stats: {
      total: number
      returned: number
      hasMore: boolean
      platforms: Array<{
        platform: string
        _count: { platform: number }
      }>
    }
    pagination: {
      limit: number
      offset: number
      total: number
      hasMore: boolean
    }
  }
} | {
  error: string
}
```

## Ejemplos de Uso

### Búsqueda Simple
```typescript
// Buscar contactos por texto
const result = await searchContacts({
  tenantId: "tenant_123",
  search: "juan"
})

if (result.success) {
  console.log("Contactos encontrados:", result.data.contacts.length)
  result.data.contacts.forEach(contact => {
    console.log(`${contact.name} (@${contact.handle}) - ${contact.platform}`)
  })
}
```

### Filtros Avanzados
```typescript
// Contactos de WhatsApp con threads abiertos
const result = await searchContacts({
  tenantId: "tenant_123",
  platform: "whatsapp",
  hasThreads: true,
  threadStatus: "OPEN"
})
```

### Búsqueda por Fechas
```typescript
// Contactos creados en los últimos 30 días
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const result = await searchContacts({
  tenantId: "tenant_123",
  createdAfter: thirtyDaysAgo
})
```

### Búsqueda por Actividad
```typescript
// Contactos activos en la última semana
const oneWeekAgo = new Date()
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

const result = await searchContacts({
  tenantId: "tenant_123",
  lastActivityAfter: oneWeekAgo,
  sortBy: "lastActivity",
  sortOrder: "desc"
})
```

### Búsqueda por Asignación
```typescript
// Contactos con threads asignados a un agente específico
const result = await searchContacts({
  tenantId: "tenant_123",
  hasThreads: true,
  assignedTo: "user_456"
})
```

### Búsqueda por Datos de Contacto
```typescript
// Contactos con email pero sin teléfono
const result = await searchContacts({
  tenantId: "tenant_123",
  hasEmail: true,
  hasPhone: false
})
```

### Paginación
```typescript
// Segunda página de resultados
const result = await searchContacts({
  tenantId: "tenant_123",
  limit: 20,
  offset: 20
})

if (result.success) {
  console.log("Página 2 de", Math.ceil(result.data.pagination.total / 20))
  console.log("Tiene más páginas:", result.data.pagination.hasMore)
}
```

### Ordenamiento Personalizado
```typescript
// Ordenar por nombre ascendente
const result = await searchContacts({
  tenantId: "tenant_123",
  sortBy: "name",
  sortOrder: "asc"
})
```

## Casos de Uso Comunes

### 1. Dashboard de Contactos
```typescript
// Obtener estadísticas generales
const result = await searchContacts({
  tenantId: "tenant_123",
  limit: 0 // Solo estadísticas
})

if (result.success) {
  console.log("Total contactos:", result.data.stats.total)
  console.log("Por plataforma:", result.data.stats.platforms)
}
```

### 2. Búsqueda de Clientes VIP
```typescript
// Contactos con muchas conversaciones
const result = await searchContacts({
  tenantId: "tenant_123",
  hasThreads: true,
  sortBy: "lastActivity",
  sortOrder: "desc",
  limit: 10
})
```

### 3. Limpieza de Datos
```typescript
// Contactos sin información de contacto
const result = await searchContacts({
  tenantId: "tenant_123",
  hasEmail: false,
  hasPhone: false
})
```

### 4. Análisis de Actividad
```typescript
// Contactos inactivos (sin actividad en 30 días)
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const result = await searchContacts({
  tenantId: "tenant_123",
  lastActivityBefore: thirtyDaysAgo
})
```

### 5. Gestión de Asignaciones
```typescript
// Contactos con threads sin asignar
const result = await searchContacts({
  tenantId: "tenant_123",
  hasThreads: true,
  threadStatus: "OPEN"
})

// Filtrar en el frontend los que no tienen assignee
const unassigned = result.data.contacts.filter(contact => 
  contact.threads.some(thread => !thread.assigneeId)
)
```

## Validaciones
- El usuario debe estar autenticado
- El usuario debe tener acceso al tenant
- Los filtros de fecha deben ser objetos Date válidos
- Los IDs de usuario deben existir en el sistema

## Manejo de Errores
```typescript
const result = await searchContacts({
  tenantId: "tenant_123",
  search: "juan"
})

if (result.error) {
  switch (result.error) {
    case "No tienes acceso a este tenant":
      console.log("Sin permisos para este tenant")
      break
    default:
      console.log("Error inesperado:", result.error)
  }
} else {
  // Procesar resultados
  console.log("Búsqueda exitosa:", result.data.contacts.length, "resultados")
}
```

## Ventajas sobre listContacts
- **Filtros Avanzados**: Muchos más criterios de búsqueda
- **Relaciones**: Incluye información de threads y estadísticas
- **Ordenamiento**: Múltiples opciones de ordenamiento
- **Estadísticas**: Información agregada de la búsqueda
- **Paginación**: Control completo de paginación
- **Performance**: Query optimizada con select específico

## Mejores Prácticas
1. **Usar límites**: Siempre especificar `limit` para evitar consultas muy grandes
2. **Paginación**: Usar `offset` para navegar por resultados grandes
3. **Filtros específicos**: Usar filtros para reducir el conjunto de resultados
4. **Ordenamiento**: Elegir el ordenamiento más relevante para el caso de uso
5. **Caché**: Considerar caché para búsquedas frecuentes

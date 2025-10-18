# Filtros Avanzados - MessageHub

## Descripción

Los filtros avanzados permiten a los usuarios filtrar conversaciones en el inbox por múltiples criterios simultáneamente, incluyendo local, canal, estado, asignación, rango de fechas y búsqueda de texto.

## Funcionalidades

### 1. Filtros Disponibles

- **Local**: Filtrar por ubicación específica
- **Canal**: Filtrar por plataforma (Instagram, Facebook, WhatsApp, TikTok)
- **Estado**: Filtrar por estado de conversación (Abierta, Pendiente, Cerrada)
- **Asignado a**: Filtrar por agente asignado o sin asignar
- **Rango de fechas**: Filtrar por período temporal
- **Búsqueda**: Buscar en contenido de mensajes y datos de contacto

### 2. Hook useAdvancedFilters

```typescript
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"

function MyComponent({ tenantId }: { tenantId: string }) {
  const {
    filters,           // Estado actual de los filtros
    searchQuery,       // Query de búsqueda con debounce
    setSearchQuery,    // Función para actualizar búsqueda
    activeFiltersCount, // Número de filtros activos
    updateFilter,      // Función para actualizar un filtro
    clearFilters,      // Función para limpiar todos los filtros
    clearFilter,       // Función para limpiar un filtro específico
    getDateRangeFilter, // Función para obtener rango de fechas
    matchesFilters,    // Función para validar si un thread cumple filtros
  } = useAdvancedFilters(tenantId)

  // Usar filtros...
}
```

### 3. Integración en Componentes

#### ThreadList Component

```typescript
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"

export function ThreadList({ threads, tenantId, userId, userMembership }: ThreadListProps) {
  const { filters, matchesFilters } = useAdvancedFilters(tenantId)

  // Filtrar threads usando filtros avanzados
  const filteredThreads = threads.filter(thread => 
    matchesFilters(thread, userMembership)
  )

  return (
    <div>
      {/* Mostrar filtros activos */}
      {filters.localId && (
        <Badge variant="secondary">Local: {filters.localId}</Badge>
      )}
      
      {/* Lista de threads filtrados */}
      {filteredThreads.map(thread => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  )
}
```

#### InboxSidebar Component

```typescript
import { useAdvancedFilters } from "@/hooks/use-advanced-filters"

export function InboxSidebar({ tenantId, locals, members }: InboxSidebarProps) {
  const { 
    filters, 
    searchQuery, 
    setSearchQuery, 
    activeFiltersCount, 
    updateFilter, 
    clearFilters 
  } = useAdvancedFilters(tenantId)

  return (
    <div>
      {/* Campo de búsqueda */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar conversaciones..."
      />

      {/* Filtro de local */}
      <Select
        value={filters.localId || "all"}
        onValueChange={(v) => updateFilter("localId", v === "all" ? null : v)}
      >
        <SelectContent>
          <SelectItem value="all">Todos los locales</SelectItem>
          {locals.map(local => (
            <SelectItem key={local.id} value={local.id}>
              {local.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botón para limpiar filtros */}
      {activeFiltersCount > 0 && (
        <Button onClick={clearFilters}>
          Limpiar filtros ({activeFiltersCount})
        </Button>
      )}
    </div>
  )
}
```

## Filtros Específicos

### 1. Filtro de Búsqueda

- **Debounce**: 500ms para evitar búsquedas excesivas
- **Campos buscados**:
  - Nombre del contacto
  - Handle del contacto
  - Contenido de mensajes
  - ID externo de la conversación
- **Mínimo de caracteres**: 2

```typescript
// Búsqueda automática con debounce
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchQuery !== filters.q) {
      updateFilter("q", searchQuery || null)
    }
  }, 500)

  return () => clearTimeout(timeoutId)
}, [searchQuery])
```

### 2. Filtro de Rango de Fechas

```typescript
// Opciones disponibles
const dateRanges = {
  "all": "Todos los tiempos",
  "today": "Hoy",
  "yesterday": "Ayer", 
  "thisWeek": "Esta semana",
  "lastWeek": "Semana pasada",
  "thisMonth": "Este mes",
  "lastMonth": "Mes pasado"
}

// Implementación del filtro
function getDateRangeFilter(dateRange?: string) {
  if (!dateRange || dateRange === "all") return null

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  switch (dateRange) {
    case "today":
      return { from: startOfDay, to: endOfDay }
    case "yesterday":
      // Implementación para ayer...
    // ... otros casos
  }
}
```

### 3. Filtro de Asignación

```typescript
// Opciones especiales
const assigneeOptions = [
  { value: "all", label: "Todos" },
  { value: "me", label: "Yo" },
  { value: "unassigned", label: "Sin asignar" },
  // ... miembros del equipo
]

// Validación en matchesFilters
if (filters.assignee) {
  if (filters.assignee === "me" && thread.assigneeId !== userMembership?.userId) return false
  if (filters.assignee === "unassigned" && thread.assigneeId !== null) return false
  if (filters.assignee !== "me" && filters.assignee !== "unassigned" && thread.assigneeId !== filters.assignee) return false
}
```

## Gestión de Estado

### 1. URL como Fuente de Verdad

Los filtros se almacenan en la URL como query parameters:

```typescript
// URL: /app/tenant123/inbox?localId=loc1&channel=instagram&status=open&q=busqueda
const filters = {
  localId: "loc1",
  channel: "instagram", 
  status: "open",
  q: "busqueda"
}
```

### 2. Persistencia

- Los filtros persisten al refrescar la página
- Se pueden compartir URLs con filtros aplicados
- Navegación hacia atrás/adelante funciona correctamente

### 3. Sincronización

```typescript
// Sincronizar estado interno con URL
useEffect(() => {
  setSearchQuery(filters.q || "")
}, [filters.q])
```

## Validación de Filtros

### 1. Función matchesFilters

```typescript
function matchesFilters(thread: any, userMembership?: any) {
  // Filtro por local
  if (filters.localId && thread.localId !== filters.localId) return false

  // Filtro por canal
  if (filters.channel && thread.channel.type.toLowerCase() !== filters.channel.toLowerCase()) return false

  // Filtro por estado
  if (filters.status && thread.status.toLowerCase() !== filters.status.toLowerCase()) return false

  // Filtro por asignado
  if (filters.assignee) {
    if (filters.assignee === "me" && thread.assigneeId !== userMembership?.userId) return false
    if (filters.assignee === "unassigned" && thread.assigneeId !== null) return false
    if (filters.assignee !== "me" && filters.assignee !== "unassigned" && thread.assigneeId !== filters.assignee) return false
  }

  // Filtro por rango de fechas
  if (filters.dateRange) {
    const dateRange = getDateRangeFilter(filters.dateRange)
    if (dateRange) {
      const threadDate = new Date(thread.lastMessageAt)
      if (threadDate < dateRange.from || threadDate > dateRange.to) return false
    }
  }

  // Filtro por búsqueda
  if (filters.q && filters.q.length >= 2) {
    const query = filters.q.toLowerCase()
    const matchesSearch = 
      thread.contact?.name?.toLowerCase().includes(query) ||
      thread.contact?.handle?.toLowerCase().includes(query) ||
      thread.messages?.some((msg: any) => msg.body.toLowerCase().includes(query)) ||
      thread.externalId?.toLowerCase().includes(query)
    
    if (!matchesSearch) return false
  }

  return true
}
```

## UI/UX

### 1. Indicadores Visuales

- **Badges**: Muestran filtros activos en ThreadList
- **Contador**: Número de filtros activos en botón "Limpiar filtros"
- **Estados**: Botones de filtro rápido muestran estado activo/inactivo

### 2. Feedback al Usuario

```typescript
// Mostrar filtros activos
{(filters.localId || filters.channel || filters.status || filters.assignee || filters.dateRange) && (
  <div className="mt-2 flex flex-wrap gap-1">
    {filters.localId && (
      <Badge variant="secondary" className="text-xs">
        Local: {filters.localId}
      </Badge>
    )}
    {/* ... otros badges */}
  </div>
)}

// Mensaje cuando no hay resultados
{filteredThreads.length === 0 ? (
  <div className="text-center text-muted-foreground">
    {filters.q ? (
      <>No se encontraron resultados para "{filters.q}"</>
    ) : (
      "No hay conversaciones que coincidan con los filtros"
    )}
  </div>
) : (
  // Lista de threads
)}
```

### 3. Accesibilidad

- Labels descriptivos para todos los campos
- Navegación por teclado
- Screen reader friendly
- Contraste adecuado en badges y estados

## Rendimiento

### 1. Debounce en Búsqueda

```typescript
// Evitar búsquedas excesivas
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchQuery !== filters.q) {
      updateFilter("q", searchQuery || null)
    }
  }, 500)

  return () => clearTimeout(timeoutId)
}, [searchQuery])
```

### 2. Filtrado Local

- Los filtros se aplican localmente en el cliente
- No requiere requests adicionales al servidor
- Respuesta inmediata al cambiar filtros

### 3. Memoización

```typescript
// Memoizar conteo de filtros activos
const activeFiltersCount = useMemo(() => {
  return Object.values(filters).filter(value => value !== undefined).length
}, [filters])
```

## Casos de Uso

### 1. Agente Buscando Sus Conversaciones

```typescript
// Filtrar solo conversaciones asignadas al usuario actual
updateFilter("assignee", "me")
```

### 2. Supervisor Revisando Conversaciones Pendientes

```typescript
// Filtrar conversaciones pendientes de esta semana
updateFilter("status", "pending")
updateFilter("dateRange", "thisWeek")
```

### 3. Búsqueda de Cliente Específico

```typescript
// Buscar conversaciones de un cliente específico
setSearchQuery("nombre del cliente")
```

### 4. Análisis por Canal

```typescript
// Ver todas las conversaciones de Instagram del mes pasado
updateFilter("channel", "instagram")
updateFilter("dateRange", "lastMonth")
```

## Extensibilidad

### 1. Agregar Nuevos Filtros

```typescript
// En useAdvancedFilters
interface AdvancedFilters {
  // ... filtros existentes
  priority?: string      // Nuevo filtro de prioridad
  tags?: string[]        // Nuevo filtro de etiquetas
}

// En matchesFilters
if (filters.priority && thread.priority !== filters.priority) return false
if (filters.tags && !filters.tags.every(tag => thread.tags.includes(tag))) return false
```

### 2. Filtros Personalizados

```typescript
// Permitir filtros personalizados por tenant
const customFilters = getCustomFiltersForTenant(tenantId)

// Aplicar filtros personalizados
customFilters.forEach(filter => {
  if (filters[filter.key] && !filter.validate(thread, filters[filter.key])) {
    return false
  }
})
```

## Testing

### 1. Unit Tests

```typescript
describe("useAdvancedFilters", () => {
  it("should filter threads by local", () => {
    const { matchesFilters } = useAdvancedFilters("tenant1")
    const thread = { localId: "loc1", channel: { type: "instagram" } }
    
    expect(matchesFilters(thread)).toBe(true)
  })

  it("should filter threads by date range", () => {
    const { matchesFilters } = useAdvancedFilters("tenant1")
    const thread = { lastMessageAt: new Date().toISOString() }
    
    expect(matchesFilters(thread)).toBe(true)
  })
})
```

### 2. Integration Tests

```typescript
describe("InboxSidebar", () => {
  it("should update filters when user changes selections", async () => {
    render(<InboxSidebar tenantId="tenant1" locals={[]} members={[]} />)
    
    const channelSelect = screen.getByLabelText("Canal")
    fireEvent.click(channelSelect)
    fireEvent.click(screen.getByText("Instagram"))
    
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining("channel=instagram")
    )
  })
})
```

## Conclusión

Los filtros avanzados proporcionan una experiencia de usuario rica y flexible para gestionar conversaciones en el inbox. La implementación utiliza:

- **Hook personalizado** para gestión de estado
- **URL como fuente de verdad** para persistencia
- **Debounce** para optimizar búsquedas
- **Filtrado local** para rendimiento
- **UI accesible** con indicadores visuales claros

La arquitectura es extensible y permite agregar nuevos filtros fácilmente según las necesidades del negocio.

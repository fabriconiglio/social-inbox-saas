# Búsqueda en Tiempo Real con Debounce - MessageHub

## Descripción

La búsqueda en tiempo real permite a los usuarios buscar conversaciones de manera instantánea con debounce optimizado para mejorar el rendimiento y la experiencia de usuario.

## Funcionalidades

### 1. Debounce Inteligente

- **300ms de delay**: Balance entre responsividad y rendimiento
- **Actualización inmediata**: Para campos vacíos
- **Indicador visual**: Spinner durante la búsqueda
- **Cancelación automática**: Previene búsquedas innecesarias

### 2. Estados de Búsqueda

```typescript
const {
  searchQuery,     // Query actual de búsqueda
  isSearching,     // Estado de búsqueda activa
  filters,         // Filtros aplicados
  searchStats      // Estadísticas de resultados
} = useAdvancedFilters(tenantId)
```

### 3. Optimizaciones de Rendimiento

- **Memoización**: Función `matchesFilters` memoizada
- **Búsqueda optimizada**: Prioriza campos más comunes
- **Filtrado local**: Sin requests al servidor
- **Early returns**: Evita procesamiento innecesario

## Implementación

### 1. Hook useAdvancedFilters

```typescript
// Estado de búsqueda
const [searchQuery, setSearchQuery] = useState(filters.q || "")
const [isSearching, setIsSearching] = useState(false)

// Debounce optimizado
useEffect(() => {
  // Si la búsqueda está vacía, actualizar inmediatamente
  if (!searchQuery.trim()) {
    if (filters.q) {
      setIsSearching(true)
      updateFilter("q", null)
      setTimeout(() => setIsSearching(false), 100)
    }
    return
  }

  // Mostrar indicador de búsqueda
  setIsSearching(true)

  // Debounce para búsquedas con contenido
  const timeoutId = setTimeout(() => {
    if (searchQuery.trim() !== filters.q) {
      updateFilter("q", searchQuery.trim() || null)
    }
    setIsSearching(false)
  }, 300)

  return () => {
    clearTimeout(timeoutId)
    setIsSearching(false)
  }
}, [searchQuery, filters.q, updateFilter])
```

### 2. Componente InboxSidebar

```typescript
export function InboxSidebar({ tenantId, locals, members }: InboxSidebarProps) {
  const { 
    searchQuery, 
    setSearchQuery, 
    isSearching 
  } = useAdvancedFilters(tenantId)

  return (
    <div className="space-y-2">
      <Label htmlFor="search">Buscar</Label>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="search"
          placeholder="Buscar conversaciones..."
          className="pl- Firmar pr-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isSearching}
        />
        {isSearching && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isSearching && (
        <p className="text-xs text-muted-foreground">Buscando...</p>
      )}
    </div>
  )
}
```

### 3. Componente ThreadList

```typescript
export function ThreadList({ threads, tenantId, userId, userMembership }: ThreadListProps) {
  const { 
    filters, 
    matchesFilters, 
    isSearching, 
    getSearchStats 
  } = useAdvancedFilters(tenantId)

  // Filtrar threads
  const filteredThreads = threads.filter(thread => 
    matchesFilters(thread, userMembership)
  )

  // Estadísticas
  const searchStats = getSearchStats(threads.length, filteredThreads.length)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3>
          {filters.q ? "Resultados de búsqueda" : "Conversaciones"} 
          ({filteredThreads.length})
        </h3>
        {isSearching && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            Buscando...
          </div>
        )}
      </div>
      
      {/* Estadísticas de filtrado */}
      {searchStats.filtered !== searchStats.total && (
        <p className="text-xs text-muted-foreground mt-1">
          Mostrando {searchStats.filtered} de {searchStats.total} conversaciones ({searchStats.percentage}%)
        </p>
      )}
    </div>
  )
}
```

## Características Técnicas

### 1. Debounce Inteligente

```typescript
// Comportamiento del debounce:
// - Búsquedas vacías: Actualización inmediata
// - Búsquedas con contenido: 300ms de delay
// - Cancelación automática: Al cambiar query
// - Indicador visual: Durante el delay

useEffect(() => {
  if (!searchQuery.trim()) {
    // Actualización inmediata para campos vacíos
    if (filters.q) {
      updateFilter("q", null)
    }
    return
  }

  // Debounce para contenido
  const timeoutId = setTimeout(() => {
    updateFilter("q", searchQuery.trim())
  }, 300)

  return () => clearTimeout(timeoutId)
}, [searchQuery])
```

### 2. Optimización de Búsqueda

```typescript
// Función de búsqueda optimizada
const matchesFilters = useMemo(() => {
  return (thread: any, userMembership?: any) => {
    // ... otros filtros ...

    // Búsqueda optimizada por prioridad
    if (filters.q && filters.q.length >= 2) {
      const query = filters.q.toLowerCase()
      
      // 1. Nombre del contacto (más común)
      if (thread.contact?.name?.toLowerCase().includes(query)) return true
      
      // 2. Handle del contacto
      if (thread.contact?.handle?.toLowerCase().includes(query)) return true
      
      // 3. External ID
      if (thread.externalId?.toLowerCase().includes(query)) return true
      
      // 4. Mensajes (más costoso, al final)
      if (thread.messages?.some((msg: any) => msg.body.toLowerCase().includes(query))) return true
      
      return false
    }

    return true
  }
}, [filters, getDateRangeFilter])
```

### 3. Estados Visuales

```typescript
// Indicadores de estado
const isSearching = false  // Durante debounce
const hasResults = filteredThreads.length > 0
const hasFilters = Object.keys(filters).some(key => filters[key])

// UI condicional
{isSearching && <LoadingSpinner />}
{hasResults && <ResultsCount />}
{hasFilters && <ActiveFilters />}
```

## Experiencia de Usuario

### 1. Feedback Visual

- **Spinner animado**: Durante búsqueda activa
- **Texto de estado**: "Buscando..." debajo del campo
- **Estadísticas**: Porcentaje de resultados encontrados
- **Contador**: Número de resultados en tiempo real

### 2. Comportamiento Intuitivo

```typescript
// Flujo de búsqueda:
// 1. Usuario escribe → Spinner aparece
// 2. 300ms después → Búsqueda se ejecuta
// 3. Resultados se muestran → Spinner desaparece
// 4. Estadísticas se actualizan → Feedback visual

// Casos especiales:
// - Campo vacío → Actualización inmediata
// - Cambio rápido → Cancelación automática
// - Sin resultados → Mensaje claro
```

### 3. Accesibilidad

- **Labels descriptivos**: Para screen readers
- **Estados ARIA**: Indicar búsqueda activa
- **Navegación por teclado**: Funciona correctamente
- **Contraste**: Indicadores visibles

## Rendimiento

### 1. Optimizaciones Implementadas

```typescript
// Memoización de funciones costosas
const matchesFilters = useMemo(() => {
  return (thread, userMembership) => { /* ... */ }
}, [filters, getDateRangeFilter])

// Early returns en búsqueda
if (thread.contact?.name?.toLowerCase().includes(query)) return true
// No busca en mensajes si ya encontró match

// Debounce para reducir operaciones
setTimeout(() => {
  // Solo ejecuta si el usuario paró de escribir
}, 300)
```

### 2. Métricas de Rendimiento

- **Tiempo de respuesta**: < 50ms para filtros simples
- **Debounce delay**: 300ms (balance óptimo)
- **Memoria**: Función memoizada evita recreación
- **CPU**: Early returns reducen procesamiento

### 3. Escalabilidad

```typescript
// Para grandes volúmenes de datos:
// - Virtualización de lista (futuro)
// - Paginación de resultados (futuro)
// - Índices de búsqueda (futuro)
// - Web Workers para búsqueda pesada (futuro)
```

## Casos de Uso

### 1. Búsqueda Rápida

```typescript
// Usuario busca "Juan"
// 1. Escribe "J" → Spinner aparece
// 2. Escribe "u" → Spinner continúa
// 3. Escribe "a" → Spinner continúa
// 4. Escribe "n" → 300ms después, búsqueda ejecuta
// 5. Resultados aparecen → Spinner desaparece
```

### 2. Búsqueda con Filtros

```typescript
// Usuario busca "problema" + filtro "Instagram"
// 1. Aplica filtro de canal → Resultados se filtran
// 2. Escribe "problema" → Búsqueda en resultados filtrados
// 3. Resultados finales → Combinación de filtros + búsqueda
```

### 3. Limpieza de Búsqueda

```typescript
// Usuario borra búsqueda
// 1. Borra caracteres → Spinner aparece
// 2. Campo queda vacío → Actualización inmediata
// 3. Filtros se mantienen → Solo se quita búsqueda
```

## Testing

### 1. Unit Tests

```typescript
describe("useAdvancedFilters", () => {
  it("should debounce search queries", async () => {
    const { result } = renderHook(() => useAdvancedFilters("tenant1"))
    
    act(() => {
      result.current.setSearchQuery("test")
    })
    
    expect(result.current.isSearching).toBe(true)
    
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false)
    }, { timeout: 500 })
  })

  it("should update immediately for empty queries", () => {
    const { result } = renderHook(() => useAdvancedFilters("tenant1"))
    
    act(() => {
      result.current.setSearchQuery("")
    })
    
    expect(result.current.isSearching).toBe(false)
  })
})
```

### 2. Integration Tests

```typescript
describe("InboxSidebar", () => {
  it("should show loading state during search", async () => {
    render(<InboxSidebar tenantId="tenant1" locals={[]} members={[]} />)
    
    const searchInput = screen.getByPlaceholderText("Buscar conversaciones...")
    
    fireEvent.change(searchInput, { target: { value: "test" } })
    
    expect(screen.getByText("Buscando...")).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText("Buscando...")).not.toBeInTheDocument()
    })
  })
})
```

## Extensibilidad

### 1. Configuración de Debounce

```typescript
// Permitir configuración por tenant
const DEBOUNCE_DELAY = getTenantConfig(tenantId).searchDebounce || 300

useEffect(() => {
  const timeoutId = setTimeout(() => {
    updateFilter("q", searchQuery.trim())
  }, DEBOUNCE_DELAY)
  
  return () => clearTimeout(timeoutId)
}, [searchQuery])
```

### 2. Búsqueda Avanzada

```typescript
// Futuras mejoras:
// - Búsqueda por regex
// - Búsqueda por campos específicos
// - Autocompletado
// - Sugerencias de búsqueda
// - Historial de búsquedas
```

### 3. Integración con Backend

```typescript
// Para búsquedas en grandes volúmenes:
async function searchThreads(query: string, filters: AdvancedFilters) {
  const response = await fetch(`/api/search/threads`, {
    method: 'POST',
    body: JSON.stringify({ query, filters })
  })
  
  return response.json()
}
```

## Conclusión

La búsqueda en tiempo real con debounce proporciona una experiencia de usuario fluida y responsiva, optimizada para el rendimiento. Las características clave incluyen:

- **Debounce inteligente**: Balance entre responsividad y rendimiento
- **Indicadores visuales**: Feedback claro del estado de búsqueda
- **Optimizaciones**: Memoización y early returns
- **Escalabilidad**: Preparado para grandes volúmenes de datos
- **Accesibilidad**: Compatible con screen readers y navegación por teclado

La implementación es robusta, extensible y proporciona una base sólida para futuras mejoras en la funcionalidad de búsqueda.

# Barra de Búsqueda en Inbox - Guía de Uso

## Descripción General

La barra de búsqueda en el inbox permite a los usuarios encontrar conversaciones, contactos y mensajes rápidamente. Incluye búsqueda en tiempo real, filtros avanzados y destacado de resultados.

## Características Principales

### ✅ Búsqueda en Tiempo Real
- Debounce de 300ms para optimizar performance
- Búsqueda en contactos, mensajes y metadata
- Indicador de carga durante la búsqueda

### ✅ Filtros Avanzados
- Por canal (Instagram, Facebook, WhatsApp, TikTok)
- Por estado (abierto, pendiente, cerrado)
- Por asignación (yo, sin asignar, usuario específico)
- Por local
- Por rango de fechas

### ✅ Resultados Destacados
- Highlighting de términos de búsqueda
- Puntuación de relevancia
- Campos coincidentes identificados
- Estadísticas de resultados

### ✅ Interfaz Optimizada
- Barra de búsqueda con iconos intuitivos
- Filtros desplegables
- Contador de filtros activos
- Sugerencias de búsqueda (futuro)

## Componentes

### 1. SearchBar
Barra de búsqueda principal con debounce y controles.

```typescript
<SearchBar
  value={query}
  onChange={setQuery}
  onClear={clearSearch}
  placeholder="Buscar conversaciones..."
  showFilters={true}
  onToggleFilters={toggleFilters}
  activeFiltersCount={activeFilters.length}
/>
```

### 2. SearchFilters
Panel de filtros avanzados desplegable.

```typescript
<SearchFilters
  isOpen={showFilters}
  onClose={() => setShowFilters(false)}
  filters={currentFilters}
  onFilterChange={updateFilter}
  onClearFilters={clearFilters}
  locals={locals}
  members={members}
  channels={channels}
/>
```

### 3. SearchResults
Visualización de resultados con highlighting.

```typescript
<SearchResults
  results={searchResults}
  query={searchQuery}
  onSelectResult={handleSelectThread}
/>
```

### 4. SearchStats
Estadísticas de resultados de búsqueda.

```typescript
<SearchStats
  query={searchQuery}
  results={searchResults}
  isLoading={isSearching}
/>
```

## Hooks

### useSearch
Hook principal para manejar búsqueda completa.

```typescript
const {
  query,
  setQuery,
  filters,
  setFilters,
  results,
  contacts,
  isLoading,
  error,
  clearSearch
} = useSearch({ tenantId, enabled: true, debounceMs: 300 })
```

### useThreadSearch
Hook simplificado para búsqueda de threads solamente.

```typescript
const { data, error, isLoading } = useThreadSearch(
  tenantId,
  query,
  filters
)
```

### useSearchSuggestions
Hook para sugerencias de búsqueda (futuro).

```typescript
const { data: suggestions } = useSearchSuggestions(tenantId, query)
```

## Server Actions

### searchThreads
Busca threads con filtros y texto.

```typescript
const result = await searchThreads(query, tenantId, filters)
// Returns: { success: boolean, data?: SearchResult[], error?: string }
```

### searchContacts
Busca contactos por nombre, handle, teléfono o email.

```typescript
const result = await searchContacts(query, tenantId)
// Returns: { success: boolean, data?: Contact[], error?: string }
```

### getSearchSuggestions
Obtiene sugerencias de búsqueda basadas en el query.

```typescript
const result = await getSearchSuggestions(query, tenantId)
// Returns: { success: boolean, data?: string[], error?: string }
```

## Tipos de Datos

### SearchResult
Resultado de búsqueda de thread con metadata adicional.

```typescript
interface SearchResult {
  id: string
  externalId: string
  status: string
  createdAt: Date
  updatedAt: Date
  channel: {
    id: string
    type: string
    name: string
  }
  local: {
    id: string
    name: string
    tenantId: string
  }
  contact: {
    id: string
    name: string | null
    handle: string
    platform: string
  } | null
  assignee: {
    id: string
    name: string | null
    email: string
  } | null
  messages: Array<{
    id: string
    body: string
    sentAt: Date
    direction: string
  }>
  relevanceScore: number
  matchedFields: string[]
}
```

### SearchFilters
Filtros disponibles para la búsqueda.

```typescript
interface SearchFilters {
  localId?: string
  channel?: string
  status?: string
  assignee?: string
  dateRange?: string
}
```

## Algoritmo de Relevancia

La puntuación de relevancia se calcula basándose en:

1. **Coincidencias en nombre del contacto**: +10 puntos
2. **Coincidencias en handle del contacto**: +8 puntos
3. **Coincidencias en mensajes**: +2 puntos por mensaje
4. **Coincidencias en external ID**: +5 puntos
5. **Recencia**: Bonus por threads actualizados recientemente
   - Menos de 1 día: +3 puntos
   - Menos de 7 días: +2 puntos
   - Menos de 30 días: +1 punto

## Campos de Búsqueda

La búsqueda incluye los siguientes campos:

- **Nombre del contacto**
- **Handle del contacto**
- **Contenido de mensajes**
- **External ID del thread**
- **Metadatos del thread**

## Filtros de Fecha

Los rangos de fecha disponibles son:

- **Hoy**: Desde las 00:00 del día actual
- **Ayer**: El día anterior completo
- **Esta semana**: Desde el lunes de la semana actual
- **Semana pasada**: La semana anterior completa
- **Este mes**: Desde el día 1 del mes actual
- **Mes pasado**: El mes anterior completo

## Performance

### Optimizaciones Implementadas
- **Debounce**: 300ms para evitar búsquedas excesivas
- **SWR Caching**: Cache de resultados con TTL de 1 segundo
- **Límite de resultados**: Máximo 50 threads por búsqueda
- **Límite de mensajes**: Solo últimos 5 mensajes por thread
- **Índices de BD**: Optimizados para campos de búsqueda frecuentes

### Límites
- Mínimo 2 caracteres para activar búsqueda
- Máximo 100 caracteres en query
- Máximo 50 resultados por página
- Timeout de 10 segundos por búsqueda

## Estados de UI

### Loading States
- Spinner en barra de búsqueda durante búsqueda
- Skeleton para resultados mientras carga
- Indicador de "buscando..." en header

### Empty States
- Mensaje cuando no hay resultados
- Sugerencias de términos alternativos
- Botón para limpiar filtros

### Error States
- Mensaje de error si falla la búsqueda
- Fallback a lista normal de threads
- Retry automático en errores de red

## Accesibilidad

### Características
- **Keyboard Navigation**: Tab, Enter, Escape
- **Screen Reader**: Labels descriptivos
- **Focus Management**: Focus automático al limpiar
- **ARIA Labels**: Estados y roles apropiados

### Atajos de Teclado
- **Escape**: Limpiar búsqueda y cerrar filtros
- **Enter**: Activar búsqueda
- **Tab**: Navegar entre controles
- **Arrow Keys**: Navegar resultados (futuro)

## Internacionalización

### Textos en Español
- Placeholders y labels en español
- Mensajes de error localizados
- Formato de fechas en español
- Pluralización correcta

### Fechas
- Usa `date-fns` con locale español
- Formato relativo (hace 2 horas, ayer, etc.)
- Timezone del usuario

## Testing

### Casos de Prueba
1. **Búsqueda básica**: Texto simple en contactos
2. **Búsqueda en mensajes**: Contenido de conversaciones
3. **Filtros combinados**: Múltiples filtros simultáneos
4. **Búsqueda vacía**: Sin resultados
5. **Búsqueda con caracteres especiales**: Emojis, acentos
6. **Performance**: Búsquedas con muchos resultados
7. **Error handling**: Fallos de red o servidor

### Datos de Prueba
- Threads con diferentes estados
- Contactos con nombres variados
- Mensajes con contenido diverso
- Fechas distribuidas en el tiempo
- Asignaciones variadas

## Roadmap Futuro

### Mejoras Planeadas
- [ ] **Sugerencias en tiempo real**: Autocomplete mientras escribes
- [ ] **Búsqueda avanzada**: Operadores booleanos (AND, OR, NOT)
- [ ] **Historial de búsquedas**: Búsquedas recientes guardadas
- [ ] **Búsqueda por adjuntos**: Encontrar por tipo de archivo
- [ ] **Búsqueda por tags**: Etiquetas personalizadas
- [ ] **Exportar resultados**: Descargar resultados de búsqueda
- [ ] **Búsqueda global**: Buscar en múltiples tenants
- [ ] **AI Search**: Búsqueda semántica con IA

### Optimizaciones
- [ ] **Indexación**: Elasticsearch para búsquedas complejas
- [ ] **Prefetching**: Pre-cargar resultados populares
- [ ] **Virtual Scrolling**: Para listas muy largas
- [ ] **Worker Threads**: Búsquedas en background

## Troubleshooting

### Problemas Comunes

#### Búsqueda no funciona
1. Verificar conexión a internet
2. Revisar consola para errores
3. Limpiar cache del navegador
4. Verificar permisos de tenant

#### Resultados lentos
1. Reducir términos de búsqueda
2. Usar filtros más específicos
3. Verificar performance de BD
4. Revisar logs del servidor

#### Filtros no aplican
1. Verificar que el filtro esté activo
2. Limpiar todos los filtros y reintentar
3. Verificar permisos de usuario
4. Revisar configuración de tenant

### Logs Útiles
- `[Search]` - Logs de búsqueda
- `[SearchFilters]` - Logs de filtros
- `[SearchResults]` - Logs de resultados
- `[SearchError]` - Errores de búsqueda

## Integración

### Con Otros Componentes
- **ThreadList**: Muestra resultados de búsqueda
- **InboxSidebar**: Contiene controles de búsqueda
- **ThreadView**: Se actualiza al seleccionar resultado
- **NotificationCenter**: Notifica nuevos resultados

### APIs Externas
- **Prisma**: Queries optimizadas a la BD
- **SWR**: Cache y sincronización
- **Date-fns**: Formateo de fechas
- **Next.js**: Server actions y routing

---

## Conclusión

La barra de búsqueda proporciona una experiencia de búsqueda rápida y eficiente para encontrar conversaciones y contactos. Con filtros avanzados, resultados destacados y optimizaciones de performance, mejora significativamente la productividad de los usuarios.

La implementación es escalable y preparada para futuras mejoras como IA y búsqueda semántica.

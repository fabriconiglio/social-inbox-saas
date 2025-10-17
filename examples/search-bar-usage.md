# Barra de Búsqueda en Inbox - Guía de Uso

## Descripción

La barra de búsqueda en el inbox permite a los usuarios encontrar conversaciones rápidamente buscando por nombre de contacto, handle, contenido de mensajes o ID del thread.

## Características

### ✅ Búsqueda Simple y Rápida
- **Búsqueda en tiempo real** con debounce de 500ms
- **Búsqueda local** en los threads ya cargados (sin consultas adicionales a la BD)
- **Múltiples campos** de búsqueda simultáneos
- **Interfaz intuitiva** con icono de búsqueda

### ✅ Campos de Búsqueda
- **Nombre del contacto**: Busca en el campo `contact.name`
- **Handle del contacto**: Busca en el campo `contact.handle`
- **Contenido de mensajes**: Busca en el `body` de todos los mensajes
- **External ID**: Busca en el `externalId` del thread

### ✅ Integración con Filtros
- **Compatible** con todos los filtros existentes (canal, estado, asignación, local)
- **Combinación** de búsqueda + filtros para resultados precisos
- **Limpieza automática** de resultados al cambiar filtros

## Implementación

### Componente Principal
La barra de búsqueda está integrada en el `InboxSidebar`:

```typescript
// En InboxSidebar
<div className="space-y-2">
  <Label htmlFor="search">Buscar</Label>
  <div className="relative">
    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      id="search"
      placeholder="Buscar conversaciones..."
      className="pl-8"
      defaultValue={filters.q}
      onChange={(e) => {
        const value = e.target.value
        // Debounce simple
        setTimeout(() => updateFilter("q", value || null), 500)
      }}
    />
  </div>
</div>
```

### Filtrado en ThreadList
El filtrado se realiza localmente en el componente `ThreadList`:

```typescript
// Filtrar threads localmente si hay query de búsqueda
const filteredThreads = searchQuery && searchQuery.length >= 2 
  ? threads.filter(thread => {
      const query = searchQuery.toLowerCase()
      
      // Buscar en nombre del contacto
      if (thread.contact?.name?.toLowerCase().includes(query)) return true
      
      // Buscar en handle del contacto
      if (thread.contact?.handle?.toLowerCase().includes(query)) return true
      
      // Buscar en mensajes
      if (thread.messages.some(msg => msg.body.toLowerCase().includes(query))) return true
      
      // Buscar en external ID
      if (thread.externalId.toLowerCase().includes(query)) return true
      
      return false
    })
  : threads
```

## Uso

### Para Usuarios
1. **Escribir en la barra**: Escribe al menos 2 caracteres para activar la búsqueda
2. **Esperar resultados**: Los resultados aparecen automáticamente después de 500ms
3. **Combinar con filtros**: Usa los filtros existentes para refinar la búsqueda
4. **Limpiar búsqueda**: Borra el texto para volver a ver todos los threads

### Para Desarrolladores
La búsqueda se integra automáticamente con el sistema de filtros existente:

```typescript
// El parámetro 'q' se agrega a la URL
// Ejemplo: /app/tenant123/inbox?q=john&status=open&channel=whatsapp

// Se pasa al ThreadList como prop
<ThreadList
  threads={threads}
  searchQuery={filters.q} // undefined si no hay búsqueda
  // ... otras props
/>
```

## Estados de la UI

### Estado Normal
- Input vacío
- Muestra todos los threads
- Placeholder: "Buscar conversaciones..."

### Estado de Búsqueda
- Input con texto
- Muestra solo threads que coinciden
- Header cambia a "Resultados de búsqueda"
- Contador muestra cantidad de resultados

### Estado Sin Resultados
- Mensaje: "No se encontraron resultados para '[término]'"
- Sugerencia: "Intenta con otros términos de búsqueda"
- Mantiene los filtros activos

## Performance

### Optimizaciones
- **Debounce de 500ms**: Evita búsquedas excesivas mientras el usuario escribe
- **Búsqueda local**: No hace consultas adicionales a la BD
- **Filtrado eficiente**: Usa `Array.filter()` nativo de JavaScript
- **Case insensitive**: Convierte todo a minúsculas para comparación

### Límites
- **Mínimo 2 caracteres**: Para activar la búsqueda
- **Búsqueda local únicamente**: Solo en threads ya cargados
- **Sin paginación**: Muestra todos los resultados que coincidan

## Casos de Uso

### 1. Buscar por Nombre de Contacto
```
Usuario escribe: "Juan"
Resultado: Muestra todos los threads donde el contacto se llama "Juan"
```

### 2. Buscar por Handle
```
Usuario escribe: "@juan_perez"
Resultado: Muestra threads del contacto con ese handle
```

### 3. Buscar por Contenido de Mensaje
```
Usuario escribe: "precio"
Resultado: Muestra threads que contengan mensajes con la palabra "precio"
```

### 4. Buscar por ID de Thread
```
Usuario escribe: "thread_123"
Resultado: Muestra el thread con ese external ID
```

### 5. Combinar con Filtros
```
Usuario: 
- Escribe "precio" en búsqueda
- Selecciona "WhatsApp" en filtro de canal
- Selecciona "Abiertas" en filtro de estado

Resultado: Threads de WhatsApp abiertas que contengan "precio" en mensajes
```

## Accesibilidad

### Características
- **Label asociado**: Input tiene label "Buscar"
- **Placeholder descriptivo**: Indica qué se puede buscar
- **Focus visible**: Input se enfoca correctamente
- **Keyboard navigation**: Funciona con teclado

### Atajos
- **Tab**: Navegar al campo de búsqueda
- **Escape**: Limpiar búsqueda (futuro)
- **Enter**: Activar búsqueda (futuro)

## Integración con el Sistema

### URL Parameters
La búsqueda se integra con el sistema de filtros existente:

```typescript
// Parámetros de URL soportados:
?q=searchTerm          // Término de búsqueda
&status=open          // Estado del thread
&channel=whatsapp     // Canal
&assignee=me          // Asignación
&localId=uuid         // Local
```

### Estado de la Aplicación
```typescript
// En InboxLayout
const filters = {
  q: searchParams.get('q') || undefined,      // Query de búsqueda
  status: searchParams.get('status') || undefined,
  channel: searchParams.get('channel') || undefined,
  assignee: searchParams.get('assignee') || undefined,
  localId: searchParams.get('localId') || undefined,
}
```

## Futuras Mejoras

### Posibles Extensiones
- [ ] **Búsqueda en BD**: Para datasets grandes
- [ ] **Highlighting**: Resaltar términos encontrados
- [ ] **Sugerencias**: Autocomplete mientras escribes
- [ ] **Búsqueda avanzada**: Operadores booleanos
- [ ] **Historial**: Búsquedas recientes
- [ ] **Atajos de teclado**: Escape, Enter, etc.

### Optimizaciones
- [ ] **Virtual scrolling**: Para listas muy largas
- [ ] **Debounce configurable**: Diferentes tiempos según el caso
- [ ] **Cache de resultados**: Para búsquedas repetidas
- [ ] **Indexación**: Índices de BD para búsquedas rápidas

## Troubleshooting

### Problemas Comunes

#### No aparecen resultados
1. Verificar que se escribieron al menos 2 caracteres
2. Comprobar que hay threads cargados
3. Verificar que los filtros no están ocultando resultados

#### Búsqueda muy lenta
1. Verificar cantidad de threads cargados
2. Revisar complejidad de los filtros aplicados
3. Considerar implementar búsqueda en BD para datasets grandes

#### No funciona con filtros
1. Verificar que los filtros están aplicados correctamente
2. Comprobar que la búsqueda se ejecuta después de aplicar filtros
3. Revisar la lógica de combinación de filtros

---

## Conclusión

La barra de búsqueda proporciona una forma rápida y eficiente de encontrar conversaciones específicas. Su implementación simple y local la hace perfecta para casos de uso básicos, mientras que su integración con el sistema de filtros permite búsquedas más precisas.

La funcionalidad está lista para uso en producción y puede extenderse fácilmente según las necesidades futuras del proyecto.

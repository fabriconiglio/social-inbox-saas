# Componentes de Visualización de SLA

Este directorio contiene componentes para destacar visualmente threads con SLA vencido o por vencer.

## Componentes Disponibles

### 1. SLAStatusIndicator

Indicador de estado de SLA para un thread específico.

```tsx
import { SLAStatusIndicator } from "@/components/threads/sla-status-indicator"

<SLAStatusIndicator
  tenantId="tenant-1"
  threadId="thread-123"
  showDetails={true}
  size="md"
/>
```

**Props:**
- `tenantId`: ID del tenant
- `threadId`: ID del thread
- `showDetails`: Mostrar tooltip con detalles (opcional)
- `size`: Tamaño del indicador ("sm" | "md" | "lg")

### 2. ThreadSLAHighlight

Wrapper para destacar visualmente threads en listas o cards.

```tsx
import { ThreadSLAHighlight, ThreadCardSLA, ThreadRowSLA } from "@/components/threads/thread-sla-highlight"

// Para cards
<ThreadCardSLA tenantId="tenant-1" threadId="thread-123">
  <div>Contenido del card</div>
</ThreadCardSLA>

// Para filas de tabla
<ThreadRowSLA tenantId="tenant-1" threadId="thread-123">
  <tr>Contenido de la fila</tr>
</ThreadRowSLA>

// Personalizado
<ThreadSLAHighlight
  tenantId="tenant-1"
  threadId="thread-123"
  showBorder={true}
  showBackground={true}
  showBadge={true}
  badgePosition="top-right"
>
  <div>Contenido personalizado</div>
</ThreadSLAHighlight>
```

**Props:**
- `tenantId`: ID del tenant
- `threadId`: ID del thread
- `showBorder`: Mostrar borde de color (opcional)
- `showBackground`: Mostrar fondo de color (opcional)
- `showBadge`: Mostrar badge de estado (opcional)
- `badgePosition`: Posición del badge ("top-right" | "top-left" | "bottom-right" | "bottom-left")

### 3. SLAVisualSummary

Resumen visual del estado de SLAs del tenant.

```tsx
import { SLAVisualSummary } from "@/components/threads/sla-visual-summary"

<SLAVisualSummary
  tenantId="tenant-1"
  showDetails={true}
  compact={false}
/>
```

**Props:**
- `tenantId`: ID del tenant
- `showDetails`: Mostrar detalles expandidos (opcional)
- `compact`: Modo compacto (opcional)

### 4. SLAHeaderIndicator

Indicador para la barra de navegación o header.

```tsx
import { SLAHeaderIndicator, SLAHeaderIndicatorCompact } from "@/components/threads/sla-header-indicator"

// Indicador completo
<SLAHeaderIndicator
  tenantId="tenant-1"
  showNotifications={true}
  onNotificationClick={() => console.log('Ver notificaciones')}
/>

// Indicador compacto
<SLAHeaderIndicatorCompact tenantId="tenant-1" />
```

**Props:**
- `tenantId`: ID del tenant
- `showNotifications`: Mostrar tooltip con notificaciones (opcional)
- `onNotificationClick`: Callback al hacer clic (opcional)

## Niveles de Estado

### Advertencias de SLA
- **Crítico**: 95%+ del SLA usado o ≤5 min restantes
- **Alto**: 90%+ del SLA usado o ≤15 min restantes
- **Medio**: 85%+ del SLA usado o ≤30 min restantes
- **Bajo**: 75%+ del SLA usado o >30 min restantes

### SLAs Vencidos
- **Urgente**: 2+ horas de retraso o 200%+ del SLA
- **Crítico**: 1+ hora de retraso o 150%+ del SLA
- **Retrasado**: Retraso básico

## Colores y Estilos

### Advertencias
- Crítico: Rojo (`bg-red-100 text-red-800`)
- Alto: Naranja (`bg-orange-100 text-orange-800`)
- Medio: Amarillo (`bg-yellow-100 text-yellow-800`)
- Bajo: Azul (`bg-blue-100 text-blue-800`)

### SLAs Vencidos
- Urgente: Rojo intenso (`bg-red-200 text-red-900`)
- Crítico: Rojo (`bg-red-100 text-red-800`)
- Retrasado: Naranja (`bg-orange-100 text-orange-800`)

### Estados Normales
- OK: Verde (`bg-green-100 text-green-800`)

## Animaciones

- **Pulse**: Se aplica automáticamente a estados críticos y urgentes
- **Hover**: Efectos de hover en botones y badges
- **Loading**: Animaciones de carga mientras se obtienen datos

## Uso en Diferentes Contextos

### Lista de Threads
```tsx
{threads.map(thread => (
  <ThreadCardSLA key={thread.id} tenantId={tenantId} threadId={thread.id}>
    <ThreadCard thread={thread} />
  </ThreadCardSLA>
))}
```

### Tabla de Threads
```tsx
<tbody>
  {threads.map(thread => (
    <ThreadRowSLA key={thread.id} tenantId={tenantId} threadId={thread.id}>
      <tr>
        <td>{thread.subject}</td>
        <td>{thread.contact.name}</td>
        <td>
          <SLAStatusIndicator 
            tenantId={tenantId} 
            threadId={thread.id} 
            size="sm" 
          />
        </td>
      </tr>
    </ThreadRowSLA>
  ))}
</tbody>
```

### Header/Navegación
```tsx
<header className="flex items-center justify-between">
  <h1>MessageHub</h1>
  <div className="flex items-center gap-4">
    <SLAHeaderIndicator tenantId={tenantId} />
    <UserMenu />
  </div>
</header>
```

### Dashboard
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <SLAVisualSummary tenantId={tenantId} />
  <OtherWidget />
  <AnotherWidget />
</div>
```

## Personalización

Todos los componentes aceptan `className` para personalización adicional:

```tsx
<SLAStatusIndicator
  tenantId={tenantId}
  threadId={threadId}
  className="custom-sla-indicator"
/>
```

## Performance

- Los componentes cargan datos de forma asíncrona
- Se actualizan automáticamente cada 30 segundos
- Incluyen estados de carga para mejor UX
- Optimizados para renderizado eficiente

## Accesibilidad

- Tooltips informativos para usuarios
- Colores con suficiente contraste
- Iconos descriptivos
- Estados de carga claros
- Navegación por teclado compatible

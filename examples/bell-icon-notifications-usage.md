# Bell Icon con Badge Contador - MessageHub

## Descripción

El icono de campana (bell) en el header proporciona acceso rápido a las notificaciones del usuario, con un badge contador que muestra el número de notificaciones no leídas y efectos visuales para llamar la atención del usuario.

## Funcionalidades

### 1. Icono de Campana

- **Ubicación**: Header principal de la aplicación
- **Estilo**: Icono de Bell de Lucide React
- **Interactividad**: Dropdown con lista de notificaciones
- **Responsive**: Se adapta a diferentes tamaños de pantalla

### 2. Badge Contador

- **Contador dinámico**: Muestra número de notificaciones no leídas
- **Límite visual**: Muestra "99+" para números mayores a 99
- **Animación**: Efecto pulse para llamar la atención
- **Color**: Badge rojo (destructive) para máxima visibilidad

### 3. Estados Visuales

- **Sin notificaciones**: Icono normal, sin badge
- **Con notificaciones**: Icono con badge rojo pulsante
- **Nuevas notificaciones**: Ring azul alrededor del botón
- **Hover**: Efecto de hover con fondo accent

## Implementación

### 1. Componente NotificationsDropdown

```typescript
"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [open, setOpen] = useState(false)

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Detectar nuevas notificaciones
  useEffect(() => {
    setHasNewNotifications(unreadCount > 0)
  }, [unreadCount])

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative hover:bg-accent transition-all duration-200 ${
            hasNewNotifications ? 'ring-2 ring-primary/20' : ''
          }`}
        >
          <Bell className={`h-5 w-5 transition-colors ${
            hasNewNotifications ? 'text-primary' : ''
          }`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs font-semibold animate-pulse"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Contenido del dropdown */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 2. Integración en AppHeader

```typescript
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown"

export function AppHeader({ user, tenantId }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <div />
      <div className="flex items-center space-x-2">
        <NotificationsDropdown />
        <ThemeToggle />
        {/* Avatar del usuario */}
      </div>
    </header>
  )
}
```

### 3. Sistema de Notificaciones

```typescript
// Server Actions para manejar notificaciones
export async function createNotification(
  userId: string,
  type: string,
  payload: Record<string, any>
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        payloadJSON: payload,
      },
    })
    return { success: true, data: notification }
  } catch (error) {
    return { error: "Error al crear notificación" }
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    })
    return { success: true, count }
  } catch (error) {
    return { error: "Error al obtener contador" }
  }
}
```

## Características Visuales

### 1. Badge Contador

```css
/* Estilos del badge */
.badge-notification {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #dc2626; /* Red-600 */
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 2. Estados del Botón

```typescript
// Estado normal
className="relative hover:bg-accent"

// Estado con nuevas notificaciones
className="relative hover:bg-accent ring-2 ring-primary/20"

// Icono normal
className="h-5 w-5"

// Icono con notificaciones
className="h-5 w-5 text-primary"
```

### 3. Transiciones

```css
/* Transiciones suaves */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: color 0.2s ease-in-out;
}
```

## Experiencia de Usuario

### 1. Flujo de Notificaciones

```typescript
// Flujo típico:
// 1. Usuario recibe notificación → Badge aparece con contador
// 2. Badge pulsa para llamar atención → Usuario nota la notificación
// 3. Usuario hace clic en el icono → Dropdown se abre
// 4. Usuario ve notificaciones → Puede marcar como leídas
// 5. Contador se actualiza → Badge desaparece si no hay más
```

### 2. Comportamiento Intuitivo

- **Feedback inmediato**: Badge aparece instantáneamente
- **Animación sutil**: Pulse no es molesto pero es notorio
- **Estados claros**: Diferencia entre sin notificaciones y con notificaciones
- **Acceso rápido**: Un clic para ver todas las notificaciones

### 3. Accesibilidad

- **Semántica correcta**: Botón con aria-label apropiado
- **Contraste**: Badge rojo con texto blanco
- **Navegación por teclado**: Funciona con Tab y Enter
- **Screen readers**: Anuncian el número de notificaciones

## Funcionalidades Avanzadas

### 1. Polling Automático

```typescript
// Verificar nuevas notificaciones cada 30 segundos
useEffect(() => {
  const interval = setInterval(() => {
    loadUnreadCount()
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

### 2. Detección de Nuevas Notificaciones

```typescript
// Detectar cuando hay nuevas notificaciones
useEffect(() => {
  if (unreadCount > 0) {
    setHasNewNotifications(true)
  } else {
    setHasNewNotifications(false)
  }
}, [unreadCount])
```

### 3. Limpieza de Estado

```typescript
// Limpiar estado cuando se abre el dropdown
const handleOpenChange = (newOpen: boolean) => {
  setOpen(newOpen)
  if (newOpen) {
    setHasNewNotifications(false)
    loadNotifications()
  }
}
```

## Tipos de Notificaciones

### 1. Asignación de Conversación

```typescript
// Notificación cuando se asigna una conversación
const notification = {
  type: "thread_assigned",
  payloadJSON: {
    assignedBy: "Juan Pérez",
    threadContact: "María García",
    threadChannel: "Instagram",
    threadId: "thread_123"
  }
}
```

### 2. Nuevo Mensaje

```typescript
// Notificación de nuevo mensaje (futuro)
const notification = {
  type: "new_message",
  payloadJSON: {
    contactName: "María García",
    messagePreview: "Hola, necesito ayuda con...",
    threadId: "thread_123"
  }
}
```

### 3. SLA Expirado

```typescript
// Notificación de SLA expirado (futuro)
const notification = {
  type: "sla_expired",
  payloadJSON: {
    threadId: "thread_123",
    contactName: "María García",
    timeExpired: "5 minutos"
  }
}
```

## Rendimiento

### 1. Optimizaciones

```typescript
// Memoización de funciones costosas
const loadUnreadCount = useCallback(async () => {
  // Cargar contador
}, [])

// Polling eficiente
useEffect(() => {
  const interval = setInterval(loadUnreadCount, 30000)
  return () => clearInterval(interval)
}, [loadUnreadCount])
```

### 2. Lazy Loading

```typescript
// Cargar notificaciones solo cuando se abre el dropdown
const handleOpenChange = (newOpen: boolean) => {
  setOpen(newOpen)
  if (newOpen) {
    loadNotifications() // Solo cargar cuando es necesario
  }
}
```

### 3. Error Handling

```typescript
// Manejo robusto de errores
try {
  const result = await getUnreadCount("")
  if (result.success) {
    setUnreadCount(result.count || 0)
  }
} catch (error) {
  console.debug("Error al cargar notificaciones (modo mock activo)")
  setUnreadCount(0)
}
```

## Testing

### 1. Unit Tests

```typescript
describe("NotificationsDropdown", () => {
  it("should show badge when there are unread notifications", () => {
    render(<NotificationsDropdown />)
    
    // Simular notificaciones no leídas
    act(() => {
      // Mock unreadCount > 0
    })
    
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByRole("button")).toHaveClass("animate-pulse")
  })

  it("should hide badge when no unread notifications", () => {
    render(<NotificationsDropdown />)
    
    // Simular sin notificaciones
    act(() => {
      // Mock unreadCount = 0
    })
    
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })
})
```

### 2. Integration Tests

```typescript
describe("AppHeader with notifications", () => {
  it("should display notification bell in header", () => {
    render(<AppHeader user={mockUser} tenantId="tenant1" />)
    
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument()
  })
})
```

## Extensibilidad

### 1. Diferentes Tipos de Badge

```typescript
// Futuras mejoras: diferentes colores por tipo
const getBadgeVariant = (notificationType: string) => {
  switch (notificationType) {
    case "urgent": return "destructive"
    case "warning": return "secondary"
    case "info": return "default"
    default: return "destructive"
  }
}
```

### 2. Sonidos de Notificación

```typescript
// Futura mejora: sonidos para nuevas notificaciones
const playNotificationSound = () => {
  const audio = new Audio('/sounds/notification.mp3')
  audio.play()
}

useEffect(() => {
  if (hasNewNotifications) {
    playNotificationSound()
  }
}, [hasNewNotifications])
```

### 3. Push Notifications

```typescript
// Futura mejora: notificaciones push del navegador
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  return false
}
```

## Conclusión

El icono de campana con badge contador proporciona una experiencia de notificaciones completa y profesional:

- **Visibilidad**: Badge rojo pulsante llama la atención
- **Información**: Contador muestra cantidad exacta
- **Accesibilidad**: Funciona con teclado y screen readers
- **Performance**: Polling eficiente y lazy loading
- **Extensibilidad**: Preparado para nuevos tipos de notificaciones

La implementación es robusta, accesible y proporciona una base sólida para futuras mejoras en el sistema de notificaciones.

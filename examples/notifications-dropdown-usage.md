# Dropdown con Lista de Notificaciones - MessageHub

## Descripción

El dropdown de notificaciones proporciona una interfaz completa para gestionar notificaciones in-app, incluyendo visualización, gestión y navegación a conversaciones relacionadas.

## Funcionalidades

### 1. Header del Dropdown

- **Título**: "Notificaciones" con contador de nuevas
- **Badge**: Muestra número de notificaciones no leídas
- **Botón "Marcar todas"**: Marca todas las notificaciones como leídas
- **Botón de actualizar**: Recarga notificaciones manualmente

### 2. Lista de Notificaciones

- **Scroll area**: Área desplazable para muchas notificaciones
- **Notificaciones no leídas**: Destacadas visualmente
- **Estados visuales**: Diferentes estilos según el tipo
- **Acciones**: Marcar como leída y eliminar

### 3. Tipos de Notificaciones

- **Asignación de conversación**: Cuando se asigna un thread
- **Desasignación**: Cuando se remueve la asignación
- **SLA warnings**: Alertas de SLA próximo a expirar
- **SLA expirado**: Notificaciones de SLA vencido
- **Nuevos mensajes**: Notificaciones de mensajes entrantes

## Implementación

### 1. Estructura del Dropdown

```typescript
<DropdownMenu open={open} onOpenChange={handleOpenChange}>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge variant="destructive" className="absolute -right-1 -top-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end" className="w-96">
    {/* Header */}
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        {unreadCount > 0 && (
          <Badge variant="secondary">
            {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        {/* Botones de acción */}
      </div>
    </div>
    
    {/* Lista de notificaciones */}
    <ScrollArea className="h-[400px]">
      {/* Contenido de notificaciones */}
    </ScrollArea>
    
    {/* Footer */}
    <DropdownMenuSeparator />
    <div className="p-2">
      <Button variant="ghost" size="sm" className="w-full">
        Configurar notificaciones
      </Button>
    </div>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. Gestión de Estados

```typescript
const [notifications, setNotifications] = useState<any[]>([])
const [unreadCount, setUnreadCount] = useState(0)
const [loading, setLoading] = useState(false)
const [open, setOpen] = useState(false)
const [hasNewNotifications, setHasNewNotifications] = useState(false)

// Cargar notificaciones
useEffect(() => {
  loadNotifications()
  loadUnreadCount()
  
  // Polling cada 30 segundos
  const interval = setInterval(() => {
    loadUnreadCount()
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

### 3. Tipos de Notificaciones

```typescript
// Asignación de conversación
const threadAssignedNotification = {
  type: "thread_assigned",
  payloadJSON: {
    assignedBy: "Juan Pérez",
    threadContact: "María García",
    threadChannel: "Instagram",
    threadId: "thread_123"
  }
}

// SLA warning
const slaWarningNotification = {
  type: "sla_warning",
  payloadJSON: {
    threadContact: "María García",
    threadChannel: "WhatsApp",
    timeRemaining: "15 minutos",
    threadId: "thread_456"
  }
}

// Nuevo mensaje
const newMessageNotification = {
  type: "new_message",
  payloadJSON: {
    contactName: "María García",
    messagePreview: "Hola, necesito ayuda con mi pedido...",
    threadId: "thread_789"
  }
}
```

## Características Visuales

### 1. Header Mejorado

```typescript
// Header con contador y acciones
<div className="flex items-center justify-between px-3 py-2">
  <div className="flex items-center gap-2">
    <DropdownMenuLabel className="text-base font-semibold">
      Notificaciones
    </DropdownMenuLabel>
    {unreadCount > 0 && (
      <Badge variant="secondary" className="text-xs">
        {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
      </Badge>
    )}
  </div>
  <div className="flex items-center gap-1">
    {/* Botones de acción */}
  </div>
</div>
```

### 2. Notificaciones Individuales

```typescript
// Notificación con estados visuales
<div className={`group relative flex items-start gap-3 p-4 transition-all duration-200 hover:bg-accent/50 ${
  !notification.readAt ? "bg-primary/5 border-l-2 border-l-primary" : ""
}`}>
  {/* Indicador de no leído */}
  {!notification.readAt && (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full"></div>
  )}
  
  {/* Icono contextual */}
  <div className={`mt-0.5 p-2 rounded-full ${
    !notification.readAt ? "bg-primary/10" : "bg-muted"
  }`}>
    {getNotificationIcon(notification.type)}
  </div>
  
  {/* Contenido */}
  <div className="flex-1 cursor-pointer min-w-0">
    {getNotificationMessage(notification)}
    <div className="flex items-center gap-2 mt-2">
      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(notification.createdAt), {
          addSuffix: true,
          locale: es,
        })}
      </p>
      {!notification.readAt && (
        <div className="w-2 h-2 bg-primary rounded-full"></div>
      )}
    </div>
  </div>
  
  {/* Botones de acción */}
  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {/* Botones aparecen en hover */}
  </div>
</div>
```

### 3. Estados Vacíos

```typescript
// Estado cuando no hay notificaciones
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-3 mb-3">
    <Bell className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium text-foreground">No hay notificaciones</p>
  <p className="text-xs text-muted-foreground mt-1">
    Te notificaremos cuando tengas nuevas actividades
  </p>
</div>
```

## Gestión de Notificaciones

### 1. Marcar como Leída

```typescript
async function handleMarkAsRead(notificationId: string) {
  try {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      await loadNotifications()
      await loadUnreadCount()
    }
  } catch (error) {
    console.debug("No se pudo marcar notificación como leída")
  }
}
```

### 2. Marcar Todas como Leídas

```typescript
async function handleMarkAllAsRead() {
  try {
    setLoading(true)
    const result = await markAllAsRead()
    if (result.success) {
      toast.success("Todas las notificaciones marcadas como leídas")
      await loadNotifications()
      await loadUnreadCount()
    }
  } catch (error) {
    console.debug("No se pudieron marcar todas las notificaciones")
  } finally {
    setLoading(false)
  }
}
```

### 3. Eliminar Notificación

```typescript
async function handleDelete(notificationId: string) {
  try {
    const result = await deleteNotification(notificationId)
    if (result.success) {
      await loadNotifications()
      await loadUnreadCount()
    }
  } catch (error) {
    console.debug("No se pudo eliminar notificación")
  }
}
```

## Navegación Inteligente

### 1. Click en Notificación

```typescript
function handleNotificationClick(notification: any) {
  // Marcar como leída si no lo está
  if (!notification.readAt) {
    handleMarkAsRead(notification.id)
  }

  // Navegar según el tipo
  const tenantId = window.location.pathname.split("/")[2]
  
  switch (notification.type) {
    case "thread_assigned":
    case "thread_unassigned":
    case "sla_warning":
    case "sla_expired":
    case "new_message":
      if (notification.payloadJSON?.threadId) {
        router.push(`/app/${tenantId}/inbox?thread=${notification.payloadJSON.threadId}`)
        setOpen(false)
      }
      break
    default:
      // Solo marcar como leída para otros tipos
      break
  }
}
```

### 2. Navegación Contextual

- **Asignaciones**: Lleva directamente al thread asignado
- **SLA**: Navega al thread con problema de SLA
- **Mensajes**: Abre el thread con el nuevo mensaje
- **Otros tipos**: Solo marca como leído

## Iconos y Colores

### 1. Iconos por Tipo

```typescript
function getNotificationIcon(type: string) {
  switch (type) {
    case "thread_assigned":
      return <UserPlus className="h-4 w-4 text-blue-600" />
    case "thread_unassigned":
      return <UserMinus className="h-4 w-4 text-gray-600" />
    case "sla_warning":
      return <Clock className="h-4 w-4 text-orange-600" />
    case "sla_expired":
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case "new_message":
      return <MessageCircle className="h-4 w-4 text-green-600" />
    default:
      return <Bell className="h-4 w-4 text-gray-600" />
  }
}
```

### 2. Colores Semánticos

- **Azul**: Asignaciones y acciones positivas
- **Verde**: Nuevos mensajes y actividades normales
- **Naranja**: Advertencias y SLA próximos a expirar
- **Rojo**: SLA expirados y errores críticos
- **Gris**: Acciones neutras y desasignaciones

## Experiencia de Usuario

### 1. Flujo de Interacción

```typescript
// Flujo típico:
// 1. Usuario ve badge con notificaciones → Hace clic en icono
// 2. Dropdown se abre → Muestra lista de notificaciones
// 3. Usuario ve notificaciones no leídas destacadas → Puede interactuar
// 4. Click en notificación → Navega al contexto relevante
// 5. Botones de acción → Marcar como leída o eliminar
// 6. Botón "Marcar todas" → Limpia todas las notificaciones
```

### 2. Feedback Visual

- **Estados claros**: Diferenciación visual entre leídas y no leídas
- **Hover effects**: Botones aparecen al pasar el mouse
- **Transiciones**: Animaciones suaves para cambios de estado
- **Loading states**: Indicadores de carga para acciones

### 3. Accesibilidad

- **Navegación por teclado**: Funciona con Tab y Enter
- **Screen readers**: Textos descriptivos y roles apropiados
- **Contraste**: Colores que cumplen estándares WCAG
- **Tooltips**: Información adicional en botones de acción

## Rendimiento

### 1. Optimizaciones

```typescript
// Polling eficiente
useEffect(() => {
  const interval = setInterval(() => {
    loadUnreadCount() // Solo actualizar contador, no toda la lista
  }, 30000)
  
  return () => clearInterval(interval)
}, [])

// Lazy loading
const handleOpenChange = (newOpen: boolean) => {
  setOpen(newOpen)
  if (newOpen) {
    loadNotifications() // Solo cargar cuando se abre
  }
}
```

### 2. Gestión de Estado

- **Estado local**: Para notificaciones y contador
- **Actualización incremental**: Solo recargar cuando es necesario
- **Error handling**: Manejo robusto de errores de red
- **Fallback**: Modo mock cuando no hay BD configurada

## Testing

### 1. Unit Tests

```typescript
describe("NotificationsDropdown", () => {
  it("should display notifications list", () => {
    render(<NotificationsDropdown />)
    
    expect(screen.getByText("Notificaciones")).toBeInTheDocument()
  })

  it("should show unread count badge", () => {
    render(<NotificationsDropdown />)
    
    // Mock unreadCount > 0
    expect(screen.getByText("5 nuevas")).toBeInTheDocument()
  })

  it("should handle notification click", async () => {
    render(<NotificationsDropdown />)
    
    const notification = screen.getByText("Te asignó una conversación")
    fireEvent.click(notification)
    
    // Verificar navegación
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.stringContaining("/inbox?thread=")
    )
  })
})
```

### 2. Integration Tests

```typescript
describe("Notification management", () => {
  it("should mark all notifications as read", async () => {
    render(<NotificationsDropdown />)
    
    const markAllButton = screen.getByText("Marcar todas")
    fireEvent.click(markAllButton)
    
    await waitFor(() => {
      expect(screen.queryByText("nuevas")).not.toBeInTheDocument()
    })
  })
})
```

## Extensibilidad

### 1. Nuevos Tipos de Notificaciones

```typescript
// Agregar nuevo tipo
case "team_mention":
  return (
    <div>
      <p className="font-medium text-sm">
        Te mencionaron en un comentario
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {notification.payloadJSON?.mentionedBy} • {notification.payloadJSON?.context}
      </p>
    </div>
  )
```

### 2. Configuración de Notificaciones

```typescript
// Futura mejora: configuración por tipo
const notificationSettings = {
  thread_assigned: { enabled: true, sound: true },
  sla_warning: { enabled: true, sound: false },
  new_message: { enabled: false, sound: false }
}
```

### 3. Filtros y Búsqueda

```typescript
// Futura mejora: filtrar notificaciones
const [filter, setFilter] = useState("all") // all, unread, by_type

const filteredNotifications = notifications.filter(notification => {
  if (filter === "unread") return !notification.readAt
  if (filter.startsWith("type:")) return notification.type === filter.split(":")[1]
  return true
})
```

## Conclusión

El dropdown de notificaciones proporciona una experiencia completa y profesional para gestionar notificaciones in-app:

- **UI rica**: Diseño moderno con estados visuales claros
- **Funcionalidad completa**: Gestión, navegación y configuración
- **Tipos diversos**: Soporte para múltiples tipos de notificaciones
- **Navegación inteligente**: Lleva al contexto relevante automáticamente
- **Performance**: Optimizado para grandes volúmenes de notificaciones
- **Extensibilidad**: Fácil agregar nuevos tipos y funcionalidades

La implementación es robusta, accesible y proporciona una base sólida para futuras mejoras en el sistema de notificaciones.

# Uso de updateContactById

## Descripción
Función simplificada para actualizar contactos que solo requiere el `contactId` y los datos a actualizar.

## Sintaxis
```typescript
updateContactById(contactId: string, data: {
  name?: string
  handle?: string
  platform?: "instagram" | "facebook" | "whatsapp" | "tiktok"
  phone?: string
  email?: string
  notes?: string
})
```

## Parámetros
- `contactId`: ID del contacto a actualizar
- `data`: Objeto con los campos a actualizar (todos opcionales)

## Retorno
```typescript
{
  success: true,
  data: Contact
} | {
  error: string
}
```

## Ejemplos de Uso

### Actualizar solo el nombre
```typescript
const result = await updateContactById("contact_123", {
  name: "Juan Pérez"
})
```

### Actualizar múltiples campos
```typescript
const result = await updateContactById("contact_123", {
  name: "Juan Pérez",
  phone: "+54 9 11 1234-5678",
  email: "juan@ejemplo.com",
  notes: "Cliente VIP"
})
```

### Limpiar un campo (establecer como null)
```typescript
const result = await updateContactById("contact_123", {
  phone: "", // Se convertirá en null
  email: ""  // Se convertirá en null
})
```

### Cambiar plataforma y handle
```typescript
const result = await updateContactById("contact_123", {
  platform: "whatsapp",
  handle: "+549112345678"
})
```

## Validaciones
- Solo usuarios con rol ADMIN o OWNER pueden actualizar contactos
- El usuario debe tener acceso al tenant del contacto
- No se permiten handles duplicados en la misma plataforma
- Validación de formato de email
- Campos requeridos no pueden estar vacíos

## Manejo de Errores
```typescript
const result = await updateContactById("contact_123", { name: "Nuevo Nombre" })

if (result.error) {
  console.error("Error:", result.error)
  // Posibles errores:
  // - "Contacto no encontrado"
  // - "No tienes acceso a este tenant"
  // - "No tienes permisos para actualizar contactos"
  // - "Ya existe un contacto con este handle en esta plataforma"
  // - "El email no es válido"
} else {
  console.log("Contacto actualizado:", result.data)
}
```

## Ventajas sobre updateContact
- API más simple (solo contactId + data)
- No requiere pasar tenantId
- Validaciones automáticas
- Mejor para uso en componentes React
- Manejo automático de permisos

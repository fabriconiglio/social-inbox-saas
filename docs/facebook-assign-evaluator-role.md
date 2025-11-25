# Cómo Asignar Rol de Evaluator en Facebook Developers

Esta guía explica cómo asignar el rol de "evaluator" a una cuenta de Facebook para que pueda revisar tu solicitud de permisos.

---

## ¿Qué Significa la Nota de Facebook?

Facebook dice esto sobre `pages_messaging`:

> "Crea una cuenta real en Facebook y otórgale el rol de evaluador en 'Roles de la app'. No envíes un usuario de prueba creado en 'Roles de la app'. Los usuarios de prueba creados allí no pueden recibir mensajes de bots."

### Explicación Simple:

**Dos tipos de "usuarios" en Facebook Developers:**

1. **Cuenta REAL de Facebook** ✅ (LO QUE DEBES USAR)
   - Es una persona real con una cuenta normal de Facebook
   - Tiene un perfil de Facebook real, puede hacer todo lo normal
   - **SÍ puede recibir mensajes de bots** (lo que necesitas para probar `pages_messaging`)
   - A esta cuenta le asignas el rol de "evaluator" en tu app

2. **Test User (Usuario de Prueba)** ❌ (LO QUE NO DEBES USAR)
   - Es un usuario artificial creado específicamente en "Roles de la app" de Facebook Developers
   - Se crea desde: Roles de la app > Test Users > Crear Test User
   - **NO puede recibir mensajes de bots** (limitación de Facebook)
   - Esto hace que no sirva para probar `pages_messaging` porque no puede recibir los mensajes que envías

### ¿Por Qué Importa Esto?

Para probar `pages_messaging`, necesitas:
- Enviar mensajes desde tu app a través de la API
- Que el destinatario reciba esos mensajes
- Verificar que los mensajes llegaron correctamente

Si usas un "test user" de Facebook Developers:
- Puedes enviar el mensaje desde tu app ✅
- Pero el test user NO recibirá el mensaje ❌ (porque los test users no pueden recibir mensajes de bots)

Por eso Facebook dice que uses una cuenta REAL:
- Puedes enviar el mensaje desde tu app ✅
- La cuenta real SÍ recibirá el mensaje ✅
- Puedes verificar que funcionó ✅

---

## ¿Cuándo Necesitas Esto?

Cuando Facebook esté revisando tu solicitud de permisos (`pages_messaging`, `pages_manage_metadata`, `pages_read_engagement`), el evaluador de Facebook necesitará acceso a tu app con el rol de "evaluator".

**IMPORTANTE**: 
- No necesitas hacer esto ahora mismo
- Solo lo harás cuando Facebook te lo solicite durante el proceso de revisión
- Facebook te indicará qué cuenta necesita el rol de evaluator
- **Debe ser una cuenta REAL de Facebook, no un test user**

---

## Pasos para Asignar el Rol de Evaluator

### Paso 1: Acceder a Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de administrador de la app
3. Selecciona tu aplicación desde el dashboard

### Paso 2: Ir a la Sección de Roles

1. En el menú lateral izquierdo, busca la sección **"Roles"** o **"Roles de la app"**
2. Haz clic en esa sección
3. Verás varias pestañas/secciones:
   - **Roles**: Administradores, Desarrolladores, Testers (aquí es donde agregas personas REALES)
   - **Test Users**: Usuarios de prueba artificiales (NO uses esta sección para evaluator)

### Paso 3: Agregar Evaluator (Cuenta Real)

**IMPORTANTE**: Debes agregar el evaluator en la sección de **"Roles"** (no en "Test Users").

1. En la sección de **"Roles"** (no en "Test Users"), busca el botón **"Agregar personas"** o **"Add People"**
2. Haz clic en el botón

### Paso 4: Ingresar Información del Evaluador

1. En el campo que aparece, ingresa:
   - **Email de Facebook** del evaluador (Facebook te proporcionará este email cuando lo soliciten)
   - O el **ID de Facebook** del evaluador
   - **Debe ser una cuenta REAL de Facebook**, no un test user
2. Selecciona el rol **"Evaluator"** o **"Tester"** (dependiendo de lo que Facebook solicite)
3. Haz clic en **"Agregar"** o **"Add"**

### Paso 5: Confirmar

1. El evaluador recibirá una notificación por email
2. El evaluador debe aceptar la invitación
3. Una vez aceptada, aparecerá en tu lista de **Roles** (no en Test Users) con el rol de "Evaluator"

### ❌ NO Hacer Esto:

- **NO** crear un usuario en "Test Users" 
- **NO** usar la opción "Create Test User" en "Test Users"
- **NO** intentar asignar rol de evaluator a un test user

### ✅ Sí Hacer Esto:

- **SÍ** agregar una cuenta REAL de Facebook en la sección "Roles"
- **SÍ** asignar el rol de "Evaluator" a esa cuenta real
- **SÍ** usar el email o ID de Facebook de una persona real

---

## Ubicación Exacta en Facebook Developers

La ruta completa es:
```
Facebook Developers Dashboard
  → Tu App
    → Configuración (Settings) o Roles
      → Roles de la app (App Roles)
        → Agregar personas (Add People)
```

---

## Roles Disponibles

En Facebook Developers, los roles comunes son:

- **Administrador**: Control total de la app
- **Desarrollador**: Puede editar código y configuraciones
- **Tester**: Puede probar la app antes del lanzamiento
- **Evaluator**: Puede revisar solicitudes de permisos (este es el que necesitas)

---

## Notas Importantes

1. **Solo cuando Facebook lo solicite**: No asignes el rol de evaluator hasta que Facebook te lo pida durante la revisión de tu solicitud

2. **Email del evaluador**: Facebook te proporcionará el email o ID de Facebook del evaluador cuando lo necesiten

3. **Aceptación de invitación**: El evaluador debe aceptar la invitación antes de poder usar el rol

4. **Permisos necesarios**: Asegúrate de que el evaluador tenga acceso a:
   - La página de Facebook que se usará para las pruebas
   - Facebook Developers para generar tokens de prueba

5. **Remover después**: Una vez que Facebook termine la revisión, puedes remover el rol de evaluator si lo deseas (aunque generalmente no es necesario)

---

## ¿Qué Hacer Si No Ves la Opción de Roles?

Si no encuentras la sección de Roles:

1. Verifica que eres administrador de la app
2. Busca en diferentes lugares del menú:
   - Configuración (Settings)
   - Roles y permisos (Roles & Permissions)
   - Usuarios y roles (Users & Roles)
3. Algunas apps nuevas pueden tener una estructura de menú diferente

---

## Alternativa: Usar Graph API

Si prefieres usar la API directamente (avanzado):

```bash
# Obtener Access Token de administrador
# Luego hacer POST a:
POST https://graph.facebook.com/v18.0/{app-id}/roles

# Con parámetros:
{
  "user": "{user-id-del-evaluador}",
  "role": "testers"  # o "developers" según corresponda
}
```

Pero generalmente es más fácil usar la interfaz web.

---

## Ejemplo Visual

```
Facebook Developers Dashboard
│
├── Tu App: "MessageHub"
│   │
│   ├── Dashboard
│   ├── Configuración
│   │   └── Roles de la app  ← AQUÍ
│   │       │
│   │       ├── Pestaña: "Roles"  ← ✅ USAR ESTA
│   │       │   ├── Administradores: [Tu cuenta]
│   │       │   ├── Desarrolladores: []
│   │       │   ├── Testers/Evaluators: []  ← Agregar aquí
│   │       │   └── [Botón: Agregar personas]
│   │       │
│   │       └── Pestaña: "Test Users"  ← ❌ NO USAR ESTA
│   │           ├── [Lista de test users artificiales]
│   │           └── [Botón: Create Test User]  ← NO usar
│   │
│   └── ...
```

### Diferencias Clave:

**Sección "Roles"** (✅ Correcto):
- Para agregar personas REALES (con cuenta real de Facebook)
- Pueden recibir mensajes de bots ✅
- Usar esta sección para evaluator

**Sección "Test Users"** (❌ Incorrecto para esto):
- Para crear usuarios artificiales de prueba
- NO pueden recibir mensajes de bots ❌
- NO usar esta sección para evaluator

---

## Contacto con Facebook

Si tienes problemas asignando el rol:

1. Revisa la documentación oficial de Facebook Developers sobre roles
2. Contacta al soporte de Facebook Developers
3. Verifica que tu app esté en modo "Desarrollo" o "Producción" según corresponda

---

**Última actualización**: `[COMPLETAR: Fecha]`


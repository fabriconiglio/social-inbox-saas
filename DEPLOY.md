# Guía de Despliegue en DigitalOcean Droplet

## Estructura del Servidor

```
/home/tu-usuario/
├── ecommerce/          # Tu proyecto actual
└── social-inbox/       # Este proyecto nuevo
```

## 1. Preparar el Proyecto

### Clonar en el servidor:
```bash
cd /home/tu-usuario
git clone <tu-repo> social-inbox
cd social-inbox
npm install
```

### Variables de Entorno (.env):
```bash
# Database (puede ser la misma PostgreSQL o una base diferente)
DATABASE_URL="postgresql://user:password@localhost:5432/social_inbox"
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="tu-secret-de-32-chars-minimo"
NEXTAUTH_URL="https://inbox.tudominio.com"  # ⚠️ Cambiar por tu dominio

# Meta (Facebook, Instagram, WhatsApp)
META_APP_ID="tu-app-id"
META_APP_SECRET="tu-app-secret"
META_VERIFY_TOKEN="tu-verify-token"
META_WEBHOOK_SECRET="tu-webhook-secret"

# Encryption
ENCRYPTION_MASTER_KEY="tu-encryption-key-de-32-chars"

# Node Environment
NODE_ENV="production"
```

### Build y Migraciones:
```bash
npm run build
npm run db:generate
npm run db:migrate
```

## 2. Configurar Nginx (Reverse Proxy)

### Crear configuración para social-inbox:
```bash
sudo nano /etc/nginx/sites-available/social-inbox
```

### Contenido del archivo:
```nginx
server {
    listen 80;
    server_name inbox.tudominio.com;  # ⚠️ Cambiar por tu dominio/subdominio

    location / {
        proxy_pass http://localhost:3001;  # Puerto diferente al ecommerce
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Para Socket.IO
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
    }

    # WebSocket support para Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Habilitar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/social-inbox /etc/nginx/sites-enabled/
sudo nginx -t  # Verificar configuración
sudo systemctl reload nginx
```

## 3. Configurar PM2 para Múltiples Aplicaciones

### Instalar PM2 (si no lo tenés):
```bash
npm install -g pm2
```

### Crear archivo de configuración PM2:
```bash
cd /home/tu-usuario/social-inbox
nano ecosystem.config.js
```

### Contenido de ecosystem.config.js:
```javascript
module.exports = {
  apps: [
    {
      name: 'social-inbox',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: '/home/tu-usuario/social-inbox',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/tu-usuario/social-inbox/logs/error.log',
      out_file: '/home/tu-usuario/social-inbox/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'social-inbox-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '/home/tu-usuario/social-inbox',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/tu-usuario/social-inbox/logs/worker-error.log',
      out_file: '/home/tu-usuario/social-inbox/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
}
```

### Crear directorio de logs:
```bash
mkdir -p /home/tu-usuario/social-inbox/logs
```

### Iniciar aplicaciones con PM2:
```bash
pm2 start ecosystem.config.js
pm2 save  # Guardar configuración
pm2 startup  # Configurar inicio automático
```

## 4. Verificar PostgreSQL y Redis

### PostgreSQL:
```bash
# Verificar si PostgreSQL está corriendo
sudo systemctl status postgresql

# Crear base de datos para social-inbox (si usás una diferente)
sudo -u postgres psql
CREATE DATABASE social_inbox;
CREATE USER social_inbox_user WITH PASSWORD 'tu-password';
GRANT ALL PRIVILEGES ON DATABASE social_inbox TO social_inbox_user;
\q
```

### Redis:
```bash
# Verificar si Redis está corriendo
sudo systemctl status redis

# Si no está instalado:
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

## 5. Configurar SSL con Certbot (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d inbox.tudominio.com
```

## 6. Comandos Útiles

### Ver logs:
```bash
pm2 logs social-inbox
pm2 logs social-inbox-worker
```

### Reiniciar aplicaciones:
```bash
pm2 restart social-inbox
pm2 restart social-inbox-worker
pm2 restart all  # Todas las apps
```

### Ver estado:
```bash
pm2 status
pm2 monit  # Monitor en tiempo real
```

### Actualizar código:
```bash
cd /home/tu-usuario/social-inbox
git pull
npm install
npm run build
pm2 restart social-inbox
pm2 restart social-inbox-worker
```

## 7. Verificar Workers de BullMQ

Los workers ya están configurados en `lib/queue-worker.ts` y se ejecutan automáticamente con PM2 usando el proceso `social-inbox-worker`.

**Nota**: Los workers se inicializan automáticamente cuando Next.js arranca, pero en producción es mejor ejecutarlos como proceso separado para mejor control y monitoreo.

## Notas Importantes

1. **Puertos diferentes**: El ecommerce probablemente usa el puerto 3000, este proyecto usa 3001
2. **Dominios diferentes**: Usá un subdominio (ej: `inbox.tudominio.com`) para este proyecto
3. **Base de datos**: Podés usar la misma PostgreSQL con diferentes bases de datos
4. **Redis**: Podés usar la misma instancia de Redis (usa diferentes DB numbers si querés)
5. **Webhooks**: Actualizá las URLs en Meta Developer Console para apuntar a tu dominio de producción

## Troubleshooting

### Verificar que los puertos estén libres:
```bash
sudo netstat -tulpn | grep :3001
```

### Ver logs de Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Verificar variables de entorno en PM2:
```bash
pm2 env social-inbox
```


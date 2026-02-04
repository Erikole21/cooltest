# AWS Free Tier Deployment Guide - Cooltest

Esta guía proporciona instrucciones paso a paso para desplegar la aplicación e-commerce Cooltest en AWS usando servicios del free tier.

> **Nota para la prueba técnica**: Esta guía está diseñada para un despliegue funcional y demostrable. El objetivo es mostrar conocimiento de AWS, Docker, y DevOps básico. No se requiere configuración avanzada de producción.

## Arquitectura del Despliegue

El despliegue utiliza los siguientes servicios de AWS (todos dentro de los límites del free tier):

- **EC2 t2.micro** (1 instancia): Aloja contenedores Docker para Backend, Frontend, PostgreSQL y Redis
- **Elastic IP**: Dirección IP estática gratuita (necesaria para webhooks y acceso público)
- **Security Groups**: Configuración de firewall para controlar tráfico de red
- **Route 53** (opcional): Gestión de DNS si tienes un dominio

**Arquitectura simplificada para la prueba técnica:**
```
Internet
   ↓
Elastic IP (pública)
   ↓
EC2 t2.micro
   ├── Docker Compose
   │   ├── PostgreSQL (puerto 5432)
   │   └── Redis (puerto 6380 en host)
   ├── Backend NestJS (puerto 3000) - PM2
   └── Frontend React (puerto 5173) - PM2
```

**Nota**: Esta es una arquitectura monolítica simple adecuada para demostración. En producción real, se recomendaría separar servicios (RDS, ElastiCache, S3 para frontend estático, etc.).

## Quick Start (Resumen Ejecutivo)

Si ya tienes experiencia con AWS, aquí está el resumen:
1. Crear EC2 t2.micro (Ubuntu 22.04)
2. Asignar Elastic IP
3. Configurar Security Group (SSH, HTTP, HTTPS, puertos 3000, 5173)
4. Instalar Docker, Docker Compose, Node.js
5. Clonar repo y configurar `.env`
6. Levantar PostgreSQL y Redis con Docker
7. Build y ejecutar backend/frontend con PM2
8. Configurar webhook de Wompi apuntando a `http://TU_IP:3000/api/webhooks/wompi`

**Tiempo estimado**: 30-45 minutos

---

## Prerequisites

- Cuenta AWS con elegibilidad para free tier
- Git instalado
- Cliente SSH (PuTTY para Windows, o integrado en Mac/Linux)
- Conocimiento básico de terminal/Linux

## Estimación de Costos

Usando los límites del free tier:
- **EC2 t2.micro**: 750 horas/mes GRATIS (suficiente para 1 instancia 24/7)
- **30 GB almacenamiento EBS**: GRATIS
- **1 Elastic IP** (cuando está asociada): GRATIS
- **Transferencia de datos**: 15 GB/mes GRATIS

**Costo total: $0/mes** (dentro de los límites del free tier)

**Importante**: El free tier de AWS es válido por 12 meses desde la creación de la cuenta. Después de eso, una instancia t2.micro cuesta aproximadamente $8-10/mes si corre 24/7.

---

## Part 1: EC2 Instance Setup

### 1.1 Launch EC2 Instance

1. Login to AWS Console: https://console.aws.amazon.com
2. Navigate to **EC2 Dashboard**
3. Click **Launch Instance**

**Configure Instance:**
- **Name**: `cooltest-app`
- **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
- **Instance Type**: `t2.micro` (1 vCPU, 1 GB RAM - Free tier eligible)
- **Key Pair**:
  - Create new key pair: `cooltest-key`
  - Type: RSA
  - Format: `.pem` (Mac/Linux) or `.ppk` (Windows/PuTTY)
  - **Download and save securely**

**Network Settings:**
- Create new security group: `cooltest-sg`
- Allow SSH (port 22) from your IP
- Allow HTTP (port 80) from anywhere (0.0.0.0/0)
- Allow HTTPS (port 443) from anywhere (0.0.0.0/0)

**Storage:**
- 30 GB gp3 (Free tier includes 30 GB)

4. Click **Launch Instance**
5. Wait for instance state: `Running`

### 1.2 Allocate Elastic IP

1. In EC2 Dashboard, go to **Elastic IPs**
2. Click **Allocate Elastic IP address**
3. Click **Allocate**
4. Select the new Elastic IP
5. Click **Actions** → **Associate Elastic IP address**
6. Select instance: `cooltest-app`
7. Click **Associate**
8. **Note the Elastic IP address** (e.g., 54.123.45.67)

### 1.3 Configure Security Group

1. Go to **Security Groups**
2. Select `cooltest-sg`
3. Edit **Inbound Rules**, add:

```
Type            Protocol  Port Range  Source          Description
SSH             TCP       22          My IP           SSH access
HTTP            TCP       80          0.0.0.0/0       HTTP access
HTTPS           TCP       443         0.0.0.0/0       HTTPS access
Custom TCP      TCP       3000        0.0.0.0/0       Backend API (temp)
Custom TCP      TCP       5173        0.0.0.0/0       Frontend Dev (temp)
```

**Note**: Ports 3000 and 5173 are temporary for testing. In production, you should only expose port 80/443 and use a reverse proxy.

---

## Part 2: Server Configuration

### 2.1 Connect to EC2 Instance

**Mac/Linux:**
```bash
chmod 400 cooltest-key.pem
ssh -i cooltest-key.pem ubuntu@YOUR_ELASTIC_IP
```

**Windows (using PuTTY):**
- Convert .pem to .ppk using PuTTYgen
- Open PuTTY, enter `ubuntu@YOUR_ELASTIC_IP`
- Under Connection → SSH → Auth, browse to your .ppk file
- Click Open

### 2.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.3 Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

**Reconnect to the instance** after logout.

### 2.4 Install Node.js and npm

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.5 Install Git

```bash
sudo apt install -y git
git --version
```

---

## Part 3: Application Deployment

### 3.1 Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/cooltest.git
cd cooltest
```

**Note**: Replace with your actual repository URL. If repository is private, set up SSH keys or HTTPS authentication.

### 3.2 Configure Environment Variables

**Backend:**
```bash
cd ~/cooltest/backend
nano .env
```

Add the following (reemplaza `YOUR_ELASTIC_IP` con tu IP elástica):
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database (usa las credenciales de docker-compose.yml)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cooltest?schema=public"

# Redis (puerto 6380 en host según docker-compose.yml)
REDIS_URL="redis://localhost:6380"

# Wompi API Configuration (Sandbox)
WOMPI_API_URL="https://api-sandbox.co.uat.wompi.dev/v1"
WOMPI_PUBLIC_KEY="pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7"
WOMPI_PRIVATE_KEY="prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg"
WOMPI_EVENTS_KEY="stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N"
WOMPI_INTEGRITY_SECRET="stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp"

# Fees (in Colombian Peso cents)
BASE_FEE_CENTS=0
DELIVERY_FEE_CENTS=0

# Stock reservation TTL (seconds)
RESERVATION_TTL_SECONDS=900

# CORS Origins (comma-separated)
SOCKET_CORS_ORIGIN="http://YOUR_ELASTIC_IP:5173,http://YOUR_ELASTIC_IP"
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

**Frontend:**
```bash
cd ~/cooltest/frontend
nano .env
```

Add the following (reemplaza `YOUR_ELASTIC_IP` con tu IP elástica):
```env
# Backend API URL
VITE_API_URL=http://YOUR_ELASTIC_IP:3000
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 3.3 Start Database and Redis with Docker

```bash
cd ~/cooltest
docker-compose up -d postgres redis
```

Verify services are running:
```bash
docker-compose ps
```

You should see `postgres` and `redis` with status "Up".

### 3.4 Setup Backend

```bash
cd ~/cooltest/backend

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample products
npm run prisma:seed

# Build application
npm run build
```

### 3.5 Setup Frontend

```bash
cd ~/cooltest/frontend

# Install dependencies
npm install

# Build for production
npm run build
```

---

## Part 4: Run Application

### 4.1 Start Backend

```bash
cd ~/cooltest/backend

# Start in background using PM2 (recommended) or nohup
npm install -g pm2
pm2 start dist/main.js --name cooltest-backend

# Or using nohup (alternative)
# nohup npm run start:prod > backend.log 2>&1 &
```

Verify backend is running:
```bash
pm2 status
curl http://localhost:3000/health
```

### 4.2 Start Frontend

```bash
cd ~/cooltest/frontend

# Install serve to host static files
npm install -g serve

# Start frontend
pm2 start "serve -s dist -l 5173" --name cooltest-frontend

# Or using nohup (alternative)
# nohup npx serve -s dist -l 5173 > frontend.log 2>&1 &
```

Verify frontend is running:
```bash
pm2 status
curl http://localhost:5173
```

### 4.3 Configure PM2 to Start on Boot

```bash
pm2 startup
# Copy and run the command that PM2 outputs

pm2 save
```

---

## Part 5: Access Application

### 5.1 Test Application

Open browser and navigate to:
- **Frontend**: `http://YOUR_ELASTIC_IP:5173`
- **Backend API**: `http://YOUR_ELASTIC_IP:3000/api/products`

### 5.2 Configure Wompi Webhook (IMPORTANTE)

Para que las transacciones se actualicen automáticamente, configura el webhook de Wompi:

1. Accede al panel de Wompi Sandbox: https://comercios.wompi.co/
2. Ve a **Configuración** → **Webhooks**
3. Agrega un nuevo webhook con:
   - **URL**: `http://YOUR_ELASTIC_IP:3000/api/webhooks/wompi`
   - **Eventos**: Selecciona todos los eventos de transacciones
4. Guarda la configuración

**Nota**: Si usas Nginx (Part 6), el webhook debe apuntar a `http://YOUR_ELASTIC_IP/api/webhooks/wompi` (sin puerto).

### 5.3 Test Purchase Flow

1. Navega a `http://YOUR_ELASTIC_IP:5173`
2. Haz clic en "Pagar" en un producto
3. Completa la información del cliente
4. Usa la tarjeta de prueba de Wompi:
   - **Número**: `4242 4242 4242 4242`
   - **Vencimiento**: `12/30`
   - **CVC**: `123`
   - **Nombre**: `TEST USER`
5. Completa la compra y verifica:
   - Mensaje "Pago aprobado"
   - Stock del producto se reduce
   - Producto se resalta visualmente
   - Actualización en tiempo real vía Socket.IO

---

## Part 6: Production Optimization (Optional)

### 6.1 Setup Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx
```

Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/cooltest
```

Add configuration:
```nginx
server {
    listen 80;
    server_name YOUR_ELASTIC_IP;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/cooltest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Update frontend `.env`:
```env
VITE_API_URL=http://YOUR_ELASTIC_IP
```

Rebuild frontend:
```bash
cd ~/cooltest/frontend
npm run build
pm2 restart cooltest-frontend
```

Now you can access the app at: `http://YOUR_ELASTIC_IP`

### 6.2 Setup SSL with Let's Encrypt (Requires Domain)

If you have a domain pointed to your Elastic IP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Update `.env` files to use `https://` URLs and rebuild.

---

## Part 7: Monitoring and Maintenance

### 7.1 View Application Logs

```bash
# PM2 logs
pm2 logs cooltest-backend
pm2 logs cooltest-frontend

# Docker logs
docker-compose logs postgres
docker-compose logs redis
```

### 7.2 Monitor Resources

```bash
# System resources
htop

# PM2 monitoring
pm2 monit

# Docker stats
docker stats
```

### 7.3 Backup Database

```bash
# Create backup
docker exec -t cooltest-postgres-1 pg_dump -U cooltest cooltest > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i cooltest-postgres-1 psql -U cooltest cooltest < backup_20240101.sql
```

### 7.4 Update Application

```bash
cd ~/cooltest
git pull

# Update backend
cd backend
npm install
npm run build
pm2 restart cooltest-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart cooltest-frontend
```

---

## Part 8: Troubleshooting

### Issue: Cannot connect to EC2 instance

**Solution:**
- Verify Security Group allows SSH from your IP
- Ensure Elastic IP is associated
- Check key pair permissions: `chmod 400 cooltest-key.pem`

### Issue: Application not accessible

**Solution:**
```bash
# Check if services are running
pm2 status
docker-compose ps

# Check ports are listening
sudo netstat -tlnp | grep -E '3000|5173'

# Check Security Group allows inbound traffic on ports 3000, 5173
```

### Issue: Database connection failed

**Solution:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection (usa las credenciales de docker-compose.yml)
docker exec -it cooltest-postgres-1 psql -U postgres -d cooltest

# Check DATABASE_URL in backend/.env (debe usar postgres:postgres)
```

### Issue: Out of memory errors

**Solution:**
- t2.micro has only 1GB RAM
- Add swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Issue: Ports already in use

**Solution:**
```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5173

# Kill process
sudo kill -9 PID
```

### Issue: Webhook de Wompi no funciona

**Solution:**
- Verifica que el Security Group permite tráfico HTTP en puerto 3000 desde `0.0.0.0/0`
- Verifica que el backend está corriendo: `pm2 status`
- Revisa los logs del backend: `pm2 logs cooltest-backend`
- Prueba el endpoint manualmente: `curl -X POST http://YOUR_ELASTIC_IP:3000/api/webhooks/wompi`
- Si usas Nginx, verifica que la ruta `/api/webhooks/wompi` está correctamente configurada

### Issue: Socket.IO no funciona (actualizaciones en tiempo real)

**Solution:**
- Verifica que `SOCKET_CORS_ORIGIN` en `.env` incluye la URL del frontend
- Verifica que el frontend está usando la URL correcta del backend en `VITE_API_URL`
- Revisa la consola del navegador para errores de conexión WebSocket
- Verifica que el Security Group permite tráfico en el puerto del backend

### Issue: Stock no se actualiza después de compra

**Solution:**
- Verifica que el webhook de Wompi está configurado correctamente
- Revisa los logs del backend para ver si llegan eventos de Wompi
- Verifica que Redis está corriendo: `docker-compose ps redis`
- Verifica que las variables de entorno de stock (`RESERVATION_TTL_SECONDS`) están correctas

---

## Part 9: Scaling Beyond Free Tier

When traffic grows, consider:

1. **Database**: Migrate to RDS PostgreSQL (db.t3.micro - $15/month)
2. **Redis**: Use ElastiCache Redis (cache.t3.micro - $12/month)
3. **Backend**: Deploy to Elastic Beanstalk or ECS
4. **Frontend**: Host on S3 + CloudFront ($1-5/month)
5. **Load Balancer**: ALB for multiple instances ($16/month)
6. **Monitoring**: CloudWatch Logs and Alarms (free tier available)

---

## Quick Command Reference

```bash
# View application status
pm2 status
docker-compose ps

# Restart services
pm2 restart cooltest-backend
pm2 restart cooltest-frontend
docker-compose restart postgres redis

# View logs
pm2 logs
docker-compose logs

# Stop services
pm2 stop all
docker-compose down

# Start services
pm2 start all
docker-compose up -d

# Backup database
docker exec -t cooltest-postgres-1 pg_dump -U cooltest cooltest > backup.sql
```

---

## Security Checklist

- [ ] Changed default Prisma credentials in docker-compose.yml
- [ ] Updated Wompi keys in .env (use production keys for prod)
- [ ] Restricted Security Group SSH to your IP only
- [ ] Setup HTTPS with SSL certificate
- [ ] Disabled frontend/backend dev ports (3000, 5173) after Nginx setup
- [ ] Setup automated backups
- [ ] Enabled CloudWatch monitoring
- [ ] Configured firewall (UFW) on EC2 instance
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`

---

## Resources

- AWS Free Tier: https://aws.amazon.com/free/
- EC2 Documentation: https://docs.aws.amazon.com/ec2/
- Docker Documentation: https://docs.docker.com/
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- Nginx Documentation: https://nginx.org/en/docs/
- Wompi Documentation: https://docs.wompi.co/

---

## Verificación Final para la Prueba Técnica

Antes de considerar el despliegue completo, verifica:

1. ✅ **Frontend accesible**: `http://YOUR_ELASTIC_IP:5173` carga correctamente
2. ✅ **Backend API responde**: `http://YOUR_ELASTIC_IP:3000/api/products` devuelve productos
3. ✅ **Base de datos funcionando**: Los productos se muestran correctamente
4. ✅ **Webhook configurado**: Wompi puede enviar eventos a tu servidor
5. ✅ **Flujo de pago completo**: Puedes completar una transacción de prueba
6. ✅ **Stock se actualiza**: El stock se reduce después de una compra aprobada
7. ✅ **Socket.IO funciona**: Las actualizaciones en tiempo real funcionan

**Comandos de verificación rápida:**
```bash
# Verificar servicios
pm2 status
docker-compose ps

# Verificar logs
pm2 logs cooltest-backend --lines 50
pm2 logs cooltest-frontend --lines 50

# Verificar conectividad
curl http://localhost:3000/api/products
curl http://localhost:5173
```

---

## Support

Para problemas con:
- **AWS**: AWS Support (free tier incluye soporte básico)
- **Aplicación**: Revisa los issues en GitHub o crea uno nuevo
- **Integración Wompi**: Soporte Wompi (https://wompi.co/soporte)

---

**¡Despliegue completado! Tu aplicación Cooltest está ejecutándose en AWS Free Tier.**

**Para la prueba técnica**: Asegúrate de tener la URL pública accesible y documenta cualquier limitación conocida (por ejemplo, si no configuraste HTTPS o Nginx).

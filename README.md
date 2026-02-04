# Cooltest - E-commerce con Integración Wompi

Aplicación fullstack de e-commerce con sistema de pagos con tarjeta de crédito integrado con Wompi (Sandbox).

## 📋 Índice

- [Descripción](#descripción)
- [App desplegada (pruebas UAT) AWS](#app-desplegada-pruebas-uat)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Quick Start](#quick-start)
- [Documentación](#documentación)

## Descripción

Cooltest es una aplicación de onboarding para comprar productos de tecnología pagando con tarjeta de crédito a través de la API de Wompi en modo Sandbox. El flujo incluye:

1. Ver productos con stock disponible
2. Ingresar datos de tarjeta y entrega
3. Ver resumen de pago con fees
4. Ejecutar pago (integración Wompi)
5. Ver resultado y volver al listado con stock actualizado

## App desplegada (pruebas UAT)

La aplicación está desplegada en AWS para pruebas del test. Para ejecutar el flujo de pago (UAT):

| Dónde | URL |
|-------|-----|
| **App (frontend)** — ingresar aquí para probar el checkout | **http://16.58.208.177:5173/** |
| **API (opcional)** — listar productos | http://16.58.208.177:3000/api/v1/products |

**Flujo a probar (5 pasos):** Productos → Datos tarjeta/entrega → Resumen → Pago → Resultado → Volver a productos.

**Tarjeta de prueba Wompi Sandbox:**

- Número: `4242 4242 4242 4242`
- Vencimiento: `12/30`
- CVC: `123`
- Nombre: `TEST USER`

**Postman:** Colección disponible en `backend/postman_collection.json`. Base URL: `http://16.58.208.177:3000/api/v1`.

## Stack Tecnológico

### Backend
- **Framework:** NestJS 11 + Fastify
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL 15
- **ORM:** Prisma
- **Cola:** Bull (Redis)
- **WebSockets:** Socket.IO
- **Arquitectura:** Hexagonal (Ports & Adapters)

### Frontend
- **Framework:** React 18 + TypeScript
- **Estado:** Redux Toolkit
- **Build:** Vite
- **Estilos:** TailwindCSS + Headless UI
- **Routing:** React Router 6
- **WebSockets:** Socket.IO Client

### Infraestructura
- **Docker Compose:** PostgreSQL + Redis
- **Wompi:** Modo Sandbox (sin dinero real)

## Estructura del Proyecto

```
cooltest/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── domain/         # Entidades y Ports
│   │   ├── application/    # Use Cases y Servicios
│   │   └── infrastructure/ # Adapters (Controllers, Repositories, HTTP)
│   ├── prisma/             # Schema y Seeds
│   ├── postman_collection.json
│   └── README.md
├── frontend/                # SPA React + Vite + Redux
│   ├── src/
│   │   ├── api/            # Cliente API y Wompi
│   │   ├── components/     # ProductCard, formularios, resumen, resultado
│   │   ├── store/           # Redux (products, checkout) + persistencia
│   │   ├── pages/           # ProductsPage, CheckoutPage
│   │   └── hooks/           # useTransactionUpdate (Socket.IO)
│   └── .env.example
├── docker-compose.yml      # PostgreSQL + Redis
└── README.md               # Este archivo
```

## Quick Start

### Requisitos previos

- **Node.js 18+**
- **Docker** y **Docker Compose**
- **npm** o yarn

### Orden recomendado (copiar y pegar)

Desde la **raíz del repositorio** (carpeta que contiene `cooltest/` o, si clonaste solo cooltest, la carpeta `cooltest/`):

```bash
# 1. Levantar PostgreSQL y Redis
docker-compose up -d

# 2. Entrar al backend e instalar
cd backend
npm install

# 3. Variables de entorno (ya trae credenciales Wompi Sandbox)
cp .env.example .env

# 4. Prisma: generar cliente, migrar BD, cargar productos
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Arrancar API
npm run start:dev
```

El backend quedará en: **http://localhost:3000/api/v1**

- **PostgreSQL:** `localhost:5432` (usuario `postgres`, contraseña `postgres`, BD `cooltest`)
- **Redis:** `localhost:6380` (puerto host; contenedor usa 6379)

**Verificar:** Abrir `http://localhost:3000/api/v1/products` en el navegador o con `curl`; debe devolver un JSON con la lista de productos (10 ítems de tecnología).

**Tests:** Desde `backend/`: `npm run test` o `npm run test:cov` (cobertura >80%).

### Frontend (desde otra terminal)

Desde la raíz de `cooltest/`:

```bash
cd frontend
npm install
cp .env.example .env   # opcional; ya trae valores por defecto
npm run dev
```

La app quedará en **http://localhost:5173**. El proxy de Vite redirige `/api` y `/socket.io` al backend en `localhost:3000`.

Flujo: Productos → Pagar con tarjeta → Datos tarjeta/entrega → Resumen → Pago → Resultado → Volver a productos.

### Probar con Postman

Importar `backend/postman_collection.json` en Postman y probar los endpoints:

- `GET /api/v1/products` - Listar productos
- `GET /api/v1/products/1` - Ver un producto
- `POST /api/v1/checkout` - Crear transacción (requiere tokens de Wompi)

Ver [backend/README.md](backend/README.md) para más detalles.

## Documentación

### Backend
Ver [backend/README.md](backend/README.md) para:
- Guía completa de instalación
- Arquitectura hexagonal
- Modelo de datos
- Flujo de checkout
- Integración Wompi
- Webhook y Bull (polling)
- Socket.IO
- Troubleshooting

### Frontend
Ver [frontend/README.md](frontend/README.md) para:
- Cómo ejecutar y construir
- Redux (products, checkout) y persistencia en `localStorage`
- Integración Wompi (tokens desde el navegador)
- Socket.IO para actualización de transacciones

## Estado del Proyecto

### ✅ Fase 1: Backend (Completada)
- [x] NestJS + Fastify configurado
- [x] Docker Compose (PostgreSQL + Redis)
- [x] Prisma con schema completo
- [x] Seed de 10 productos de tecnología
- [x] Arquitectura Hexagonal implementada
- [x] Todos los endpoints REST
- [x] Integración Wompi con firma de integridad
- [x] Bull para polling de respaldo
- [x] Webhook handler con validación
- [x] Socket.IO para notificaciones
- [x] Postman Collection
- [x] README completo

### ✅ Fase 2: Frontend (Completada)
- [x] React + Redux Toolkit + TypeScript + Vite
- [x] TailwindCSS
- [x] Rutas: `/` (productos), `/checkout` (pasos 2–4)
- [x] Integración con backend (proxy `/api`, `/socket.io`)
- [x] Socket.IO client para `transaction-update`
- [x] Flujo completo: productos → tarjeta/entrega → resumen → pago → resultado
- [x] Validación tarjeta (Luhn), detección VISA/Mastercard
- [x] Persistencia del progreso de checkout en `localStorage`
- [x] Diseño responsive (mobile-first)

### ✅ Fase 3: Testing (Completada)
- [x] Tests unitarios Backend con Jest (>80% cobertura)
- [x] Tests unitarios Frontend con Vitest + React Testing Library (>80% cobertura en líneas)

### ✅ Fase 4: Deployment AWS (Completada)
- [x] Backend desplegado en EC2 (http://16.58.208.177:3000)
- [x] Frontend desplegado en EC2 (http://16.58.208.177:5173)
- [x] Base de datos PostgreSQL en Docker
- [x] Redis en Docker
- [x] Aplicación funcional y accesible públicamente
- [x] Webhook endpoint listo para configurar (ver [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md))

### ✅ Fase 5: Mejoras para Producción (Completada)
- [x] **Rate Limiting** implementado con @nestjs/throttler
  - Límite global: 10 req/min por IP
  - Límite específico checkout: 5 req/min por IP
  - Health checks y webhooks exentos de rate limiting
- [x] **Validación estricta de webhooks**
  - Firma HMAC-SHA256 obligatoria
  - UnauthorizedException para firmas inválidas o faltantes
  - Prevención de webhooks no autorizados
- [x] **Health Check Endpoints** con @nestjs/terminus
  - `GET /api/v1/health` - Comprehensive check (database, memory heap, RSS, disk)
  - `GET /api/v1/health/ready` - Readiness probe para Kubernetes/AWS
  - `GET /api/v1/health/live` - Liveness probe simple
- [x] **Timeout y Retry** en cliente HTTP Wompi
  - Timeout configurado a 30 segundos
  - 3 reintentos con backoff exponencial
  - Retry automático en errores de red, 5xx, y 429
  - Logging de reintentos para debugging
- [x] **Tests E2E** para flujo completo
  - Flujo de checkout con reserva de stock
  - Prevención de overselling
  - Manejo de reservas concurrentes
  - Validación de health checks
  - Verificación de rate limiting
- [x] **Coverage actualizado**
  - Backend: 81.15% (95/95 tests pasando)
  - Frontend: 84.53% (111/111 tests pasando)

## Endpoints Disponibles

Todos con prefijo `/api/v1`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Listar productos con stock |
| GET | `/products/:id` | Obtener un producto |
| GET | `/customers/:id` | Obtener un cliente |
| GET | `/deliveries/:id` | Obtener una entrega |
| GET | `/transactions/:id` | Obtener una transacción |
| POST | `/checkout` | Crear transacción de pago (reserva stock; puede devolver 404 si el producto no existe o 409 si no hay stock suficiente) **[Rate limited: 5 req/min]** |
| POST | `/webhooks/wompi` | Recibir notificaciones Wompi **[Validación de firma obligatoria]** |
| GET | `/health` | Health check completo (database, memory, disk) |
| GET | `/health/ready` | Readiness probe (database) |
| GET | `/health/live` | Liveness probe (timestamp) |

## Credenciales Wompi Sandbox

Las credenciales de pruebas están incluidas en `backend/.env.example`:

**Modo Sandbox:** Sin transacciones reales, sin dinero real.

## Mejoras de Producción Implementadas

La aplicación incluye las siguientes mejoras para entornos de producción:

### 🔒 Seguridad y Prevención de Abuso

**Rate Limiting (Throttling)**
- Límite global: 10 requests por minuto por IP
- Límite específico para checkout: 5 requests por minuto por IP
- Health checks y webhooks exentos de rate limiting
- Protección contra ataques DoS y uso abusivo

**Validación Estricta de Webhooks**
- Firma HMAC-SHA256 obligatoria en todos los webhooks
- Rechaza webhooks sin firma o con firma inválida (HTTP 401)
- Previene procesamiento de webhooks no autorizados
- Auditoría completa: todos los webhooks se guardan en base de datos

### 💚 Monitoreo y Observabilidad

**Health Check Endpoints**
- `GET /api/v1/health` - Check completo (database, memory heap, RSS, disk)
- `GET /api/v1/health/ready` - Readiness probe para Kubernetes/AWS Load Balancer
- `GET /api/v1/health/live` - Liveness probe simple con timestamp
- Compatibles con Kubernetes, AWS ECS, y otros orquestadores

### 🔄 Resiliencia

**Timeout y Retry en Cliente HTTP**
- Timeout de 30 segundos en llamadas a API de Wompi
- 3 reintentos automáticos con backoff exponencial
- Retry en errores de red, errores 5xx, y rate limits (429)
- Logging detallado de cada reintento para debugging

### ✅ Testing

**Tests End-to-End**
- Flujo completo de checkout con reserva de stock
- Prevención de overselling (race conditions)
- Manejo de reservas concurrentes
- Validación de health checks
- Verificación de rate limiting

**Coverage Actual**
- Backend: **81.15%** (95/95 tests pasando)
- Frontend: **84.53%** (111/111 tests pasando)

## Configuración de Webhook Wompi

El endpoint de webhook está **listo para configurar** en el panel de Wompi. La aplicación incluye:

✅ **Endpoint público:** `http://16.58.208.177:3000/api/v1/webhooks/wompi`
✅ **Validación de firma estricta:** Implementada con `WOMPI_EVENTS_SECRET` (obligatoria)
✅ **Procesamiento robusto:** Manejo de eventos `transaction.updated`
✅ **Sistema de respaldo:** Polling automático con Bull/Redis en caso de que el webhook falle

**Para configurar en Wompi Developer:**
1. Ingresar a [https://comercios.wompi.co/](https://comercios.wompi.co/)
2. Ir a **Configuración → Webhooks**
3. Agregar URL: `http://16.58.208.177:3000/api/v1/webhooks/wompi`
4. Seleccionar evento: `transaction.updated`

**Nota:** Se requiere acceso a la cuenta de Wompi Developer con las credenciales proporcionadas en la prueba. Ver guía completa en [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md).

## Autor

Erik Rodriguez - Prueba Técnica Full Stack

## Licencia

Este proyecto es parte de una prueba técnica y no tiene licencia pública.

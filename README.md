# Cooltest - E-commerce con Integración Wompi

Aplicación fullstack de e-commerce con sistema de pagos con tarjeta de crédito integrado con Wompi (Sandbox).

## 📋 Índice

- [Descripción](#descripción)
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

### 🔄 Fase 4: Deployment AWS (Pendiente)
- [ ] Backend desplegado
- [ ] Frontend desplegado
- [ ] Base de datos RDS
- [ ] Redis ElastiCache
- [ ] Webhook configurado

## Endpoints Disponibles

Todos con prefijo `/api/v1`:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/products` | Listar productos con stock |
| GET | `/products/:id` | Obtener un producto |
| GET | `/customers/:id` | Obtener un cliente |
| GET | `/deliveries/:id` | Obtener una entrega |
| GET | `/transactions/:id` | Obtener una transacción |
| POST | `/checkout` | Crear transacción de pago (reserva stock; puede devolver 404 si el producto no existe o 409 si no hay stock suficiente) |
| POST | `/webhooks/wompi` | Recibir notificaciones Wompi |

## Credenciales Wompi Sandbox

Las credenciales de pruebas están incluidas en `backend/.env.example`:


**Modo Sandbox:** Sin transacciones reales, sin dinero real.

## Autor

Erik Rodriguez - Prueba Técnica Full Stack

## Licencia

Este proyecto es parte de una prueba técnica y no tiene licencia pública.

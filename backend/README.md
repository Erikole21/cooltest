# Cooltest Backend - Wompi Payment Integration

Backend API para el sistema de pagos con tarjeta de crédito integrado con Wompi (Sandbox).

## Stack Tecnológico

- **Framework:** NestJS 11 + Fastify
- **Lenguaje:** TypeScript
- **Base de datos:** PostgreSQL 15
- **ORM:** Prisma
- **Cola de trabajos:** Bull (Redis)
- **WebSockets:** Socket.IO
- **Arquitectura:** Hexagonal (Ports & Adapters)
- **Estilo:** Railway Oriented Programming (donde aplica)

## Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

## Instalación

### 1. Ubicarse en el backend

Desde la raíz del repositorio (la carpeta que contiene `backend/`):

```bash
cd cooltest/backend
```

Si clonaste solo la carpeta `cooltest`, usar: `cd backend`.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

El archivo `.env` ya contiene las credenciales de Wompi Sandbox. Ajustar si es necesario:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cooltest?schema=public"

# Redis
REDIS_URL="redis://localhost:6380"

# Wompi Sandbox
# UAT Sandbox (documento de prueba del test)
WOMPI_API_URL="https://api-sandbox.co.uat.wompi.dev/v1"
WOMPI_PUBLIC_KEY="pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7"
WOMPI_PRIVATE_KEY="prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg"
WOMPI_EVENTS_KEY="stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N"
WOMPI_INTEGRITY_SECRET="stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp"

# Fees (en centavos COP)
BASE_FEE_CENTS=0
DELIVERY_FEE_CENTS=0

# CORS
SOCKET_CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```

### 4. Levantar servicios con Docker Compose

Desde la raíz de `cooltest/` (un nivel arriba):

```bash
cd ..
docker-compose up -d
```

Esto levantará:
- PostgreSQL en el puerto `5432`
- Redis en el puerto `6380` (mapeado 6380:6379 en docker-compose)

Verificar que los servicios estén corriendo:

```bash
docker-compose ps
```

Volver al directorio del backend para los siguientes pasos:

```bash
cd backend
```

### 5. Generar cliente de Prisma

```bash
npm run prisma:generate
```

### 6. Ejecutar migraciones de base de datos

```bash
npm run prisma:migrate
```

En un clone nuevo, Prisma aplicará la migración existente; confirmar si pregunta. Si creas cambios en el schema y pide nombre de migración, usar algo como: `nombre_descriptivo`.

### 7. Ejecutar seed de productos

```bash
npm run prisma:seed
```

Esto creará 10 productos de tecnología en la base de datos.

## Ejecutar la aplicación

### Modo desarrollo

```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3000/api/v1`

### Probar checkout contra Wompi (sandbox)

Con el backend en marcha (`npm run start:dev`), puedes validar la integración con un script que obtiene tokens de Wompi y llama a `POST /api/v1/checkout`:

```bash
node scripts/test-checkout-wompi.js
```

El script carga `.env`, obtiene tokens de aceptación y tokeniza la tarjeta de prueba `4242 4242 4242 4242`, luego llama al checkout. Si falla con **"La firma es inválida"**, verifica que `WOMPI_INTEGRITY_SECRET` en `.env` coincida exactamente con el **Secreto de integridad** del mismo comercio en el dashboard de Wompi (Desarrolladores > Secretos para integración técnica).

### Modo producción

```bash
npm run build
npm run start:prod
```

## Tests Unitarios

El proyecto cuenta con tests unitarios completos que cubren las capas críticas de la aplicación.

### Ejecutar tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:cov
```

### Cobertura de Código

La cobertura actual del código es:

```
-------------------------------------------------|---------|----------|---------|---------|-------------------
File                                             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------------------------------|---------|----------|---------|---------|-------------------
All files                                        |   86.44 |    80.23 |   91.8  |   86.47 |
-------------------------------------------------|---------|----------|---------|---------|-------------------
```

**Cobertura por capas:**

- ✅ **Entidades de dominio:** 100% - Lógica de negocio completamente testeada
- ✅ **Puertos/Interfaces:** 100% - Contratos bien definidos
- ✅ **Use Cases:** 100% - Casos de uso principales cubiertos (checkout)
- ✅ **Repositorios:** 100% - Adaptadores de persistencia testeados
- ✅ **Controllers:** 100% - Endpoints REST y webhook cubiertos
- ✅ **Servicios externos:** 100% - Integración con Wompi testeada
- ✅ **Procesador de polling:** 97.82% - Lógica asíncrona de verificación cubierta
- ✅ **Gateway de WebSockets:** 85.71% - Notificaciones en tiempo real testeadas

**Resultado:** **86.47% de cobertura de líneas**, superando el requisito de >80%.

**Tests ejecutados:**
- ✅ **16 test suites** completados exitosamente
- ✅ **76 tests** pasando correctamente
- ✅ **0 tests fallando**

### Estructura de tests

Los tests están organizados siguiendo la misma estructura hexagonal del código:

```
src/
├── domain/
│   └── entities/
│       ├── product.entity.spec.ts
│       └── transaction.entity.spec.ts
├── application/
│   ├── use-cases/
│   │   └── checkout.use-case.spec.ts
│   └── services/
│       └── transaction-polling.processor.spec.ts
└── infrastructure/
    └── adapters/
        ├── in/
        │   ├── controllers/
        │   │   ├── checkout.controller.spec.ts
        │   │   ├── products.controller.spec.ts
        │   │   ├── transactions.controller.spec.ts
        │   │   ├── customers.controller.spec.ts
        │   │   └── deliveries.controller.spec.ts
        │   └── gateways/
        │       └── transaction.gateway.spec.ts
        └── out/
            ├── http/
            │   └── wompi.service.spec.ts
            └── persistence/
                ├── product.repository.spec.ts
                ├── transaction.repository.spec.ts
                ├── customer.repository.spec.ts
                └── delivery.repository.spec.ts
```

### Tests incluidos

**Entidades de dominio:**
- Validación de lógica de negocio (stock, estados de transacción)
- Métodos helper y cálculos

**Casos de uso (Use Cases):**
- Flujo completo de checkout
- Validaciones de producto y stock
- Manejo de errores de Wompi
- Cálculo de fees y totales

**Repositorios:**
- CRUD de todas las entidades
- Conversión entre tipos de Prisma y dominio
- Manejo de valores null/undefined

**Controllers:**
- Endpoints REST con casos exitosos y de error
- Validación de DTOs
- Manejo de excepciones HTTP

**Servicio Wompi:**
- Creación de transacciones con firma de integridad
- Consulta de estado de transacciones
- Validación de webhooks
- Mapeo de estados

**Procesador de polling:**
- Lógica de reintento (10s inicial + 5×10min)
- Actualización de estados finales
- Decremento de stock en transacciones aprobadas
- Emisión de eventos Socket.IO

## Endpoints Disponibles

Todos los endpoints tienen el prefijo `/api/v1`.

### Productos

- `GET /api/v1/products` - Listar todos los productos
- `GET /api/v1/products/:id` - Obtener un producto por ID

### Clientes

- `GET /api/v1/customers/:id` - Obtener un cliente por ID

### Entregas

- `GET /api/v1/deliveries/:id` - Obtener una entrega por ID

### Transacciones

- `GET /api/v1/transactions/:id` - Obtener una transacción por ID (incluye producto, cliente y entrega)

### Checkout

- `POST /api/v1/checkout` - Crear una transacción de pago

**Body de ejemplo:**

```json
{
  "productId": 1,
  "quantity": 1,
  "paymentToken": "tok_test_12345_ABCDEFGH",
  "installments": 1,
  "acceptanceToken": "acceptance_token_from_wompi",
  "acceptPersonalAuth": "personal_auth_token_from_wompi",
  "customer": {
    "email": "test@example.com",
    "fullName": "John Doe"
  },
  "delivery": {
    "address": "Calle 123 #45-67",
    "city": "Bogotá",
    "phone": "+57 300 1234567"
  }
}
```

### Webhooks

- `POST /api/v1/webhooks/wompi` - Recibir notificaciones de Wompi (configurar en dashboard de Wompi)

## Postman Collection

Importar el archivo `postman_collection.json` en Postman para probar todos los endpoints.

**Pasos:**
1. Abrir Postman
2. Click en "Import"
3. Seleccionar el archivo `postman_collection.json`
4. Configurar la variable `baseUrl` a `http://localhost:3000/api/v1`

## Arquitectura

El proyecto sigue **Arquitectura Hexagonal (Ports & Adapters)**:

```
src/
├── domain/                    # Capa de dominio (entidades y ports)
│   ├── entities/             # Entidades del dominio
│   └── ports/                # Interfaces (puertos)
│       ├── in/              # Puertos de entrada (use cases)
│       └── out/             # Puertos de salida (repositories, services)
├── application/              # Capa de aplicación
│   ├── use-cases/           # Casos de uso (lógica de negocio)
│   └── services/            # Servicios de aplicación (Bull processors)
└── infrastructure/           # Capa de infraestructura
    ├── adapters/
    │   ├── in/              # Adaptadores de entrada (controllers, gateways)
    │   └── out/             # Adaptadores de salida (repositories, HTTP clients)
    └── config/              # Configuración (Prisma, etc.)
```

## Modelo de Datos

### Product
- Productos de tecnología con stock
- Stock se decrementa al aprobar una transacción

### Transaction
- Estados: `PENDING`, `APPROVED`, `DECLINED`, `ERROR`, `VOIDED`
- Referencia: `TXN-{id}` (generada automáticamente)
- Incluye fees configurables

### Customer
- Información del comprador

### Delivery
- Información de entrega

### WompiWebhookEvent
- Auditoría de todos los webhooks recibidos de Wompi

## Flujo de Checkout

1. **Validar producto y stock** disponible
2. **Calcular fees y total** (producto + base_fee + delivery_fee)
3. **Crear Customer y Delivery**
4. **Crear Transaction** en estado `PENDING`
5. **Llamar a Wompi** para crear la transacción con firma de integridad
6. **Actualizar Transaction** con el ID de Wompi
7. **Encolar job Bull** para polling de respaldo (10s → 5×10min)
8. **Retornar** el ID de la transacción al frontend

## Actualización de Estado de Transacción

Se soportan **dos vías**:

### 1. Webhook (inmediato)
- Wompi notifica cambios vía `POST /api/v1/webhooks/wompi`
- Se valida la firma (`x-event-checksum`)
- Se actualiza la transacción y el stock
- Se emite evento por Socket.IO

### 2. Bull (polling de respaldo)
- **Primera consulta:** 10 segundos después de crear la transacción
- **Siguientes:** 5 intentos cada 10 minutos
- Si la transacción ya está en estado final, no hace nada (idempotente)
- Si está `PENDING`, consulta a Wompi y actualiza

## Socket.IO

El servidor emite eventos `transaction-update` cuando una transacción cambia de estado:

```javascript
{
  transactionId: 123,
  status: "APPROVED",
  timestamp: "2024-01-01T12:00:00Z"
}
```

El frontend debe escuchar este evento en la ruta `/result/:transactionId`.

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Iniciar en modo watch

# Producción
npm run build             # Compilar TypeScript
npm run start:prod        # Iniciar desde dist/

# Prisma
npm run prisma:generate   # Generar cliente de Prisma
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:seed       # Ejecutar seed
npm run prisma:studio     # Abrir Prisma Studio (GUI)

# Testing
npm run test              # Ejecutar tests unitarios
npm run test:cov          # Ejecutar tests con cobertura
npm run test:e2e          # Ejecutar tests e2e

# Linting
npm run lint              # Ejecutar ESLint
npm run format            # Formatear código con Prettier
```

## Testing

Los tests unitarios están implementados con **cobertura >80%** (Jest). Ejecutar `npm run test:cov` para el reporte actual. Ver sección "Cobertura de Código" más arriba.

## Webhook Local (Opcional)

Para probar webhooks en desarrollo local, exponer el endpoint usando **ngrok**:

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer el puerto 3000
ngrok http 3000
```

Configurar la URL pública en el dashboard de Wompi Sandbox:
- URL: `https://your-ngrok-url.ngrok.io/api/v1/webhooks/wompi`

## Troubleshooting

### Error: "Cannot connect to database"
- Verificar que Docker Compose esté corriendo: `docker-compose ps`
- Verificar la `DATABASE_URL` en el archivo `.env`

### Error: "Redis connection refused"
- Verificar que Redis esté corriendo en Docker
- Verificar la `REDIS_URL` en el archivo `.env`

### Error: "Prisma Client not generated"
- Ejecutar: `npm run prisma:generate`

### Error: "No products in database"
- Ejecutar el seed: `npm run prisma:seed`

## Autor

Erik Rodriguez - Full Stack Technical Test

## Licencia

Este proyecto es parte de una prueba técnica y no tiene licencia pública.

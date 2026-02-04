# SDP – Spec Driven Development  
## Test FullStack: Onboarding de pago con tarjeta (integración Wompi)

**Objetivo:** Alinear requisitos y flujo antes de escribir código. El código vivirá en la carpeta `cooltest/`.

---

## 1. Resumen ejecutivo

Se debe construir una **app de onboarding** para comprar un producto pagando con tarjeta (vía API Wompi). El flujo incluye: ver producto y stock → ingresar datos de tarjeta y entrega → ver resumen de pago → ejecutar pago → ver resultado y volver al listado con stock actualizado.

- **Frontend:** SPA en React con Redux; diseño mobile-first y responsive.
- **Backend:** API en NestJS con Fastify (TypeScript); base de datos PostgreSQL.
- **Integración:** Wompi en modo **Sandbox** (sin dinero real).
- **Tests:** ≥80% cobertura (Jest) en front y back.
- **Deploy:** En la nube (recomendado AWS); README con instrucciones y resultados de tests.

---

## 2. Flujo de negocio (5 pantallas)

| Paso | Pantalla | Qué hace el usuario / sistema |
|------|----------|-------------------------------|
| **1** | **Productos** | Ve productos del store (descripción, precio, unidades en stock). |
| **2** | **Tarjeta + entrega** | Clic en "Pagar con tarjeta" → modal con datos de tarjeta (VISA/MasterCard, validación de estructura; datos falsos pero bien formateados) y datos de entrega. Detección de logo VISA/MasterCard es plus. |
| **3** | **Resumen** | Ve resumen en un **backdrop**: monto producto + fee base (siempre) + fee de envío. Botón "Pagar". |
| **4** | **Estado final** | Tras clic en Pagar: se crea transacción PENDING en nuestro backend, se llama a Wompi, se actualiza transacción, se asigna producto a entregar y se actualiza stock. Se muestra resultado (éxito/fallo). |
| **5** | **Productos** | Redirección a la página de productos con stock actualizado. |

**Resiliencia:** Si el usuario hace refresh, la app debe recuperar el progreso (estado en store/localStorage).

---

## 3. Responsabilidades de diseño (nuestras decisiones)

- **API:** Diseño de endpoints, esquema de datos, validaciones y manejo seguro de datos sensibles.
- **Modelo de datos:** Stock, transacciones, clientes (o datos de pago/entrega), entregas; distintos tipos de requests (CRUD según necesidad).
- **Documentación:** Postman Collection **o** Swagger URL público en README.
- **Modelo de datos:** Diagrama o descripción en README.
- **Detalle:** Validaciones pensadas en casos reales; UX clara en las 5 pantallas.

---

## 4. Frontend (SPA)

| Requisito | Detalle |
|-----------|---------|
| Framework | React con Redux. |
| Estado | Redux; alineado a Flux. Datos de la transacción de pago en estado y/o localStorage de forma segura. |
| Diseño | Mobile-first, responsive; referencia mínima iPhone SE (2020) 1334×750. Interacciones dentro de los límites de la UI. |
| Estilos | Framework CSS a elección; uso de Flexbox o Grid. |
| UX | Criterio del candidato; debe ser usable y coherente con el flujo de 5 pasos. |

---

## 5. Backend (API)

| Requisito | Detalle |
|-----------|---------|
| Stack | NestJS con Fastify, TypeScript. |
| Arquitectura | Lógica de negocio **fuera** de rutas/controladores. Hexagonal (Ports & Adapters). |
| Estilo de casos de uso | Railway Oriented Programming (ROP) donde aplique. |
| Base de datos | PostgreSQL. Esquema en README. |
| ORM / serialización | Libre elección (ej. Prisma o TypeORM). |
| Productos | Seed con productos dummy. **No** se pide endpoint para crear productos. |
| Entidades | **products** (con stock), **transactions**, **customers**, **deliveries**; distintos tipos de requests según el diseño. |
| Cola | Bull (Redis) para job de polling de estado de transacción Wompi (ver §17.2). |

---

## 6. Integración Wompi

- **Solo Sandbox:** sin transacciones reales.
- **Documentación:** [Inicio rápido Colombia](https://docs.wompi.co/docs/colombia/inicio-rapido/), [Ambientes y llaves](https://docs.wompi.co/docs/colombia/ambientes-y-llaves/).
- **Credenciales de prueba (no modificar, no 2FA):**
  - Login: https://login.staging.wompi.dev/
  - User: `smltrs00` / Password: `ChallengeWompi123*`
- **URLs API:**
  - UAT Sandbox (documento de prueba): `https://api-sandbox.co.uat.wompi.dev/v1` — usar con llaves del test (staging)
  - UAT: `https://api.co.uat.wompi.dev/v1`
  - Producción: `https://production.wompi.co/v1`
- **API Keys Sandbox:**
  - Public: `pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7`
  - Private: `prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg`
  - Events: `stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N`
  - Integrity: `stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp3`

Integración vía API Keys (el usuario de prueba puede cerrarse si hay acceso desde otra ubicación). **Webhooks:** Wompi notifica cambios de transacción vía POST a una URL configurada en el dashboard; guardar cada notificación en tabla `WompiWebhookEvent` (ver §17).

---

## 7. Testing

- **Obligatorio:** tests unitarios en Frontend y Backend.
- **Herramienta:** Jest.
- **Cobertura:** >80% en ambos.
- **README:** Incluir resultados de cobertura (o comando para generarlos).

---

## 8. Despliegue

- Cualquier proveedor cloud; recomendado **AWS** (free tier: Lambda, ECS, EKS, CloudFront, S3, RDS, DynamoDB, etc.).
- **Entregable:** Enlace a la app desplegada funcionando y conectada al Backend.

---

## 9. Entregables

1. App Frontend + API Backend completos y funcionales.
2. Repositorio GitHub **público**, README actualizado (sin usar la palabra "Wompi" en el nombre del repo; no compartir la solución con otros candidatos).
3. Enlace a la app en AWS (o otro cloud) funcionando contra tu Backend.

---

## 10. Criterios de evaluación (resumen)

| Puntos | Criterio |
|--------|----------|
| 5 | README completo y correcto. |
| 5 | Imágenes que carguen rápido y no se salgan de los límites de la UI. |
| 20 | Flujo completo de onboarding y checkout con tarjeta. |
| 20 | API funcionando correctamente. |
| 30 | >80% cobertura con tests unitarios (Backend y Frontend). |
| 20 | App y API desplegadas en la nube. |
| **Bonus** | OWASP/HTTPS/headers (5), responsive y multi-navegador (5), CSS (10), código limpio (10), Hexagonal (10), ROP (10). |

**Mínimo para aprobar:** 100 puntos. Con el mínimo se pasa a etapa de entrevista.

---

## 11. Stack y estructura definidos

| Decisión | Valor |
|----------|-------|
| Frontend | React + Redux + TypeScript |
| Backend | NestJS + Fastify + TypeScript |
| Base de datos | PostgreSQL |
| ORM | **Prisma** |
| Prefijo API | **/api/v1** (todas las rutas REST bajo este prefijo) |
| Documentación API | **Postman Collection** (incluir en repo o README; pasos claros para importar) |
| Estructura | `cooltest/frontend/` y `cooltest/backend/` en el mismo repo (repositorio público ya existente) |
| Redis | **Docker** (para Bull; pasos en README) |
| URL del backend en frontend | **Variable de entorno** (ej. `VITE_API_URL` o `REACT_APP_API_URL`) |
| Build tool frontend | **Vite** |
| CSS Framework | **TailwindCSS** + componentes headless (ej. Headless UI, Radix UI) |
| WebSocket cliente | **socket.io-client** estándar |
| Docker Compose | PostgreSQL + Redis incluidos; configuración completa en `docker-compose.yml` |
| Firma de integridad Wompi | **Implementar desde el inicio**; secret/integrity key configurable en `.env` (`WOMPI_INTEGRITY_SECRET`) |
| Productos seed | **Tecnología** (smartphones, laptops, tablets, accesorios, etc.) |

---

## 12. Plan de implementación por fases

**Orden de desarrollo:** Backend completo → Frontend completo → Tests (code coverage >80%) → Deployment AWS.

### Fase 1: Backend (prioridad máxima)

**Entregables Fase 1:**
1. Proyecto NestJS + Fastify + TypeScript configurado
2. Docker Compose con PostgreSQL + Redis
3. Prisma con schema completo y migraciones
4. Seed de productos de tecnología (mínimo 5-10 productos)
5. Todos los endpoints REST bajo `/api/v1` funcionando:
   - `GET /api/v1/products`
   - `GET /api/v1/products/:id`
   - `POST /api/v1/checkout` (con integración Wompi completa + firma de integridad)
   - `GET /api/v1/transactions/:id`
   - `GET /api/v1/customers/:id`
   - `GET /api/v1/deliveries/:id`
   - `POST /api/v1/webhooks/wompi`
6. Integración completa con Wompi Sandbox:
   - Crear transacciones con signature (firma de integridad implementada)
   - Webhook handler con validación de firma
7. Bull (Redis) para polling de respaldo (10s → 5×10min)
8. Socket.IO para notificaciones en tiempo real
9. Arquitectura Hexagonal (Ports & Adapters)
10. Railway Oriented Programming donde aplique
11. `.env.example` completo con todas las variables
12. Postman Collection exportada y documentada
13. README.md con instrucciones de setup

**Variables de entorno Backend (mínimo):**
- `DATABASE_URL`
- `REDIS_URL`
- `WOMPI_PUBLIC_KEY`
- `WOMPI_PRIVATE_KEY`
- `WOMPI_INTEGRITY_SECRET` (para firma de transacciones)
- `WOMPI_API_URL` (sandbox)
- `BASE_FEE_CENTS`
- `DELIVERY_FEE_CENTS`
- `PORT`
- `SOCKET_CORS_ORIGIN`

**Criterio de aceptación Fase 1:** Backend funcional, probado con Postman, transacciones exitosas con Wompi Sandbox, webhooks recibidos y procesados, Bull ejecutándose correctamente.

---

### Fase 2: Frontend (después de validar Backend)

**Entregables Fase 2:**
1. Proyecto React + Redux + TypeScript + Vite configurado
2. TailwindCSS configurado + componentes headless (Headless UI o Radix UI)
3. Socket.IO client para notificaciones en tiempo real
4. 4 rutas principales:
   - `/` - Productos (listado con stock)
   - `/checkout` - Tarjeta + entrega
   - `/summary` - Resumen (backdrop) + botón Pagar
   - `/result/:transactionId` - Resultado del pago
5. Redux store con:
   - Productos
   - Carrito/checkout
   - Transaction status
   - Persistencia en localStorage para resiliencia
6. Integración con API backend:
   - Obtener tokens de aceptación de Wompi (frontend directo)
   - Tokenizar tarjeta (frontend directo a Wompi)
   - Enviar checkout al backend
   - Escuchar socket para updates de transacción
7. Validaciones de tarjeta (estructura VISA/MasterCard)
8. Detección de logo VISA/MasterCard (plus)
9. Diseño mobile-first, responsive (mín. iPhone SE 2020: 1334×750)
10. UX coherente con flujo de 5 pasos
11. `.env.example` con `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_WOMPI_PUBLIC_KEY`

**Criterio de aceptación Fase 2:** Flujo completo de compra funcionando end-to-end, UI responsive, socket actualizando en tiempo real, localStorage recuperando progreso tras refresh.

---

### Fase 3: Tests y Code Coverage (después de validar Frontend)

**Entregables Fase 3:**
1. Tests unitarios Backend (Jest) - cobertura >80%
2. Tests unitarios Frontend (Jest + React Testing Library) - cobertura >80%
3. Comandos `npm run test` y `npm run test:cov` funcionando
4. Resultados de cobertura incluidos en README

**Criterio de aceptación Fase 3:** Cobertura >80% en backend y frontend, tests pasando.

---

### Fase 4: Deployment AWS (última fase)

**Entregables Fase 4:**
1. Backend desplegado en AWS (opciones: ECS, Lambda, EC2)
2. Frontend desplegado en AWS (opciones: S3+CloudFront, Amplify)
3. Base de datos PostgreSQL en AWS RDS
4. Redis en AWS ElastiCache o alternativa
5. Webhook URL pública configurada en Wompi dashboard
6. URLs funcionales en README
7. Instrucciones de deployment en README

**Criterio de aceptación Fase 4:** App funcionando en la nube, accesible públicamente, webhooks recibidos correctamente.

---

### Fase 5: Mejoras de Producción (implementada)

**Entregables Fase 5:**
1. **Rate Limiting** con @nestjs/throttler:
   - Límite global: 10 req/min por IP
   - Límite específico checkout: 5 req/min por IP
   - Health checks y webhooks exentos
2. **Validación estricta de webhooks:**
   - Firma HMAC-SHA256 obligatoria
   - UnauthorizedException para firmas inválidas o faltantes
   - Prevención de webhooks no autorizados
3. **Health Check Endpoints** con @nestjs/terminus:
   - `GET /api/v1/health` - Comprehensive (database, memory, disk)
   - `GET /api/v1/health/ready` - Readiness probe (database)
   - `GET /api/v1/health/live` - Liveness probe (timestamp)
4. **Timeout y Retry en cliente HTTP:**
   - Timeout: 30 segundos
   - Reintentos: 3 intentos con backoff exponencial
   - Retry en errores de red, 5xx, y 429 (rate limit)
5. **Tests E2E:**
   - Flujo completo de checkout con reserva de stock
   - Prevención de overselling
   - Manejo de reservas concurrentes
   - Validación de health checks
   - Verificación de rate limiting

**Cobertura de Tests:**
- Backend: 81.15% (95/95 tests pasando)
- Frontend: 84.53% (111/111 tests pasando)

**Criterio de aceptación Fase 5:** Rate limiting funcionando, health checks respondiendo correctamente, validación estricta de webhooks, cliente HTTP resiliente, tests E2E pasando.

---

## 13. Modelo de datos (propuesta)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Product      │     │   Transaction    │     │    Customer     │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ id (PK)          │     │ id (PK)         │
│ name            │     │ product_id (FK)   │>────│ email           │
│ description     │     │ customer_id (FK)  │     │ full_name       │
│ price (cents)   │     │ delivery_id (FK) │     │ created_at      │
│ stock_quantity  │     │ quantity         │     └─────────────────┘
│ image_url       │     │ unit_price       │              │
│ created_at      │     │ base_fee         │              │
│ updated_at      │     │ delivery_fee    │     ┌─────────────────┐
                        │ total           │     │    Delivery     │
                        │ status          │>────│ id (PK)         │
                        │ wompi_txn_id    │     │ address         │
                        │ reference       │     │ city            │
                        │ created_at      │     │ phone           │
                        │ updated_at      │     │ created_at      │
                        └──────────────────┘     └─────────────────┘
                                                           │
                        ┌──────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────┐
│   WompiWebhookEvent (auditoría)      │
├─────────────────────────────────────┤
│ id (PK)                              │
│ event_type (ej. transaction.updated) │
│ payload (JSONB – raw body)            │
│ received_at                          │
│ transaction_id (FK, nullable)        │  ← enlace opcional por reference
└─────────────────────────────────────┘
```

**Entidades:**

| Entidad | Campos principales | Notas |
|---------|--------------------|-------|
| **Product** | id, name, description, price (centavos COP), stock_quantity, reserved_quantity, image_url | `stock_quantity` es el stock físico; `reserved_quantity` es stock reservado para checkouts en curso; el stock definitivo se descuenta solo al aprobar transacción; image_url para imágenes de productos |
| **Transaction** | id (PK, **autoincrement**), product_id, customer_id, delivery_id, quantity, unit_price, base_fee, delivery_fee, total, status (PENDING \| APPROVED \| DECLINED \| ERROR \| **VOIDED**), wompi_txn_id, reference, reserved_until, stock_committed_at, stock_released_at | reference = prefijo + id para Wompi (ej. `TXN-123`); `reserved_until` define el TTL de la reserva; `stock_committed_at`/`stock_released_at` hacen el flujo idempotente |
| **Customer** | id, email, full_name | Datos del comprador |
| **Delivery** | id, address, city, phone | Datos de entrega |
| **WompiWebhookEvent** | id, event_type, payload (JSONB), received_at, transaction_id (FK opcional) | Guardar **tal cual** el body del webhook como soporte/auditoría; opcionalmente vincular a nuestra Transaction por `reference`. |

**Status de transacción:** `PENDING` → tras crear/reservar stock; `APPROVED` / `DECLINED` / `ERROR` / `VOIDED` según respuesta de Wompi o expiración de la reserva. **Reference:** generado como prefijo + id de nuestra Transaction (ej. `TXN-1`, `TXN-2`); el id es **autonumérico** (serial). Verificar en documentación Wompi longitud/caracteres permitidos para `reference`.

**Productos seed:** Crear mínimo 5-10 productos de tecnología (smartphones, laptops, tablets, accesorios). Usar URLs de imágenes públicas optimizadas (CDNs, Unsplash, etc.). Precios en centavos COP realistas.

---

## 13. Endpoints y notificación en tiempo real

**Prefijo base:** todas las rutas REST bajo **`/api/v1`**.

| Método | Ruta | Descripción | Request | Response |
|--------|------|-------------|---------|----------|
| **GET** | `/api/v1/products` | Listar productos con stock | — | `{ products: Product[] }` |
| **GET** | `/api/v1/products/:id` | Obtener un producto | — | `Product` |
| **POST** | `/api/v1/checkout` | Iniciar checkout: crea transacción PENDING, llama Wompi, encola Bull | body: productId, quantity, paymentToken, installments, acceptanceToken, acceptPersonalAuth, customer, delivery | `{ transactionId, status: "PENDING", total, ... }`; **transactionId** = id numérico (PK) |
| **GET** | `/api/v1/transactions/:id` | Consultar estado de una transacción | — | `Transaction` (con customer, delivery, product) |
| **GET** | `/api/v1/customers/:id` | Obtener cliente por ID | — | `Customer` |
| **GET** | `/api/v1/deliveries/:id` | Obtener entrega por ID | — | `Delivery` |
| **POST** | `/api/v1/webhooks/wompi` | Recibir notificaciones Wompi; guardar payload y actualizar Transaction; **emitir por socket** si status final | Body raw del webhook | `200` para acuse |

**WebSocket / Socket:** cuando el backend actualice el estado de una Transaction (por webhook o por job Bull), debe **notificar por socket** enviando el **id de la tabla Transaction** (y el nuevo status). El frontend en `/result/:transactionId` se suscribe al canal/evento y actualiza la UI al recibir la notificación.

**Flujo de checkout (POST /api/v1/checkout):**

1. Validar `productId`, `quantity` y **reservar stock** de forma atómica (`reserved_quantity += quantity` si `stock_quantity - reserved_quantity >= quantity`); si no, responder error de stock.
2. Calcular: `unit_price` del producto, `base_fee`, `delivery_fee`, `total` (desde env).
3. Crear Customer y Delivery.
4. Crear Transaction en `PENDING` con `reserved_until` (TTL de la reserva); **id** autonumérico; **reference** = prefijo + id (ej. `TXN-{id}`).
5. Llamar a Wompi: `POST /v1/transactions` con reference, token, amount_in_cents, etc.; guardar `wompi_txn_id`.
6. Encolar job Bull para polling de respaldo (ver §17).
7. Devolver `{ transactionId: <id numérico>, status: "PENDING", ... }`. Frontend **redirige a `/result/:transactionId`** y escucha el **socket** hasta recibir la notificación de cambio de estado (o timeout/fallback).

**Fees:** En env: `BASE_FEE_CENTS` y `DELIVERY_FEE_CENTS`. Pueden ser 0 según el test.

---

## 14. Rutas del SPA – decisión

**Opción A – Rutas por paso:** `/`, `/checkout`, `/summary`, `/result/:transactionId`  
**Opción B – Una sola ruta:** `/` con steps 1–5 en estado (sin rutas profundas).

| Criterio | Rutas por paso (A) | Una ruta con steps (B) |
|----------|---------------------|-------------------------|
| **Recuperación tras refresh** | ✅ URL identifica el paso; se puede rehidratar desde query/state. | ⚠️ Si no se persiste step en URL o localStorage, se pierde. |
| **Compartir enlace** | ✅ Se puede enlazar a resultado o resumen. | ❌ Solo se comparte la raíz. |
| **Complejidad** | Más rutas y navegación. | Menos rutas; lógica de steps en un solo árbol. |
| **Requisito “5-step screen”** | Cumple con pantallas claras por URL. | Cumple si cada step es una “pantalla” visual distinta. |
| **Resiliencia (test)** | Mejor: se puede guardar `transactionId` o step en localStorage y restaurar. | Requiere guardar step + datos en store/localStorage. |

**Decisión:** **Opción A (rutas por paso)**. Favorece resiliencia ante refresh, cumple el flujo de 5 pantallas con URLs claras y permite enlazar al resultado. Implementar persistencia de progreso (ej. step + transactionId en localStorage) para recuperar tras refresh.

| Ruta | Pantalla |
|------|----------|
| `/` | Productos (listado con stock) |
| `/checkout` | Tarjeta + entrega |
| `/summary` | Resumen (backdrop) + botón Pagar |
| `/result/:transactionId` | Resultado del pago → luego redirect a `/` |

---

## 15. Integración Wompi (tarjeta)

1. **Tokens de aceptación (frontend):** `GET /v1/merchants/:public_key` devuelve `presigned_acceptance.acceptance_token` y `presigned_personal_data_auth.acceptance_token`. Mostrar links (permalink) de los PDFs y checkboxes para aceptación explícita del usuario.
2. **Tokenización (frontend):** `POST /v1/tokens/cards` con llave pública. Body: `{ number, cvc, exp_month, exp_year, card_holder }`. Respuesta: `{ data: { id: "tok_xxx" } }`.
3. **Crear transacción (backend):** `POST /v1/transactions` con llave privada. Body incluye: `acceptance_token`, `accept_personal_auth`, `amount_in_cents`, `reference`, `currency: "COP"`, `payment_method: { type: "CARD", token, installments }`, `signature` (integridad). Ver [Tokens de aceptación](https://docs.wompi.co/docs/colombia/tokens-de-aceptacion/).
4. **Estado final:** vía **webhook** (inmediato) y/o **Bull** (polling de respaldo); ver §17.

---

## 16. Decisiones de afinación (cerradas)

- [x] **Fees:** En env (`BASE_FEE_CENTS`, `DELIVERY_FEE_CENTS`); pueden ser 0 según el test.
- [x] **Rutas del SPA:** Rutas por paso (`/`, `/checkout`, `/summary`, `/result/:transactionId`) para resiliencia y separación clara de pantallas.
- [x] **GET /customers/:id y GET /deliveries/:id:** Incluidos para separación de responsabilidades y variedad de tipos de request.
- [x] **Webhook Wompi:** Tabla `WompiWebhookEvent` para guardar el payload raw de cada notificación como soporte/auditoría; endpoint `POST /webhooks/wompi` que persiste y responde 200.

---

## 17. Obtención del estado de la transacción: webhook + Bull (dual)

Se soportan **dos vías** para saber cuándo la transacción en Wompi llegó a un estado final (APPROVED, DECLINED, ERROR, VOIDED): webhook (inmediato) y cola Bull (polling de respaldo).

---

### 17.1 Webhook (inmediato)

- **Evento:** `transaction.updated` (cobros con tarjeta).
- **Configuración:** URL pública HTTPS en dashboard Wompi (Desarrollo → Programadores); Sandbox y producción por separado.
- **Requisitos del endpoint:** POST, HTTPS, responder 2xx (ideal 200); si no, Wompi reintenta hasta 3 veces.
- **Backend (`POST /webhooks/wompi`):**
  1. Guardar **siempre** el body raw en `WompiWebhookEvent` (event_type, payload JSONB, received_at; opcionalmente transaction_id si se matchea por `reference`).
  2. Si el evento es `transaction.updated` y el payload trae status final: buscar nuestra Transaction por `reference` (o por wompi_txn_id), actualizar status (y wompi_txn_id si no estaba); si status = APPROVED, decrementar stock del Product; **emitir por socket** (id de Transaction + nuevo status).
  3. Opcional: validar firma (`X-Event-Checksum` / `signature.checksum`) antes de actualizar; si no coincide, rechazar (no 2xx) para que Wompi reintente.
  4. Responder **200** para acuse.

El webhook está **siempre escuchando** desde que la URL está configurada en Wompi; en cuanto Wompi notifica, actualizamos la transacción y el stock.

---

### 17.2 Bull – polling de respaldo

- **Cuándo:** Tras crear la transacción en Wompi en el checkout, se encola un **job Bull** asociado a nuestra Transaction (id o reference).
- **Planificación:**
  - **Primera ejecución:** a los **10 segundos**.
  - **Siguientes:** **5 intentos** más, cada **10 minutos** (es decir: 10 s → 10 min → 10 min → 10 min → 10 min → 10 min; 6 consultas en total, o si se cuenta “5 veces cada 10 min”: 1 a 10 s + 5 a 10 min = 6 consultas).
- **Lógica del job:**
  1. Cargar nuestra Transaction por id.
  2. Si `status` ya es **final** (APPROVED, DECLINED, ERROR, VOIDED): **no** llamar a Wompi; dar por terminado el job (éxito sin trabajo).
  3. Si `status` sigue PENDING: llamar a Wompi `GET /v1/transactions/:wompi_txn_id` (usar el id de Wompi guardado en nuestra Transaction).
  4. Si la respuesta de Wompi trae status final: actualizar nuestra Transaction (status, y cualquier otro campo útil); si APPROVED, decrementar stock; **emitir por socket** (id de Transaction + nuevo status); finalizar job.
  5. Si Wompi sigue en PENDING: el job termina y el siguiente intento será en 10 min (o al siguiente run según la cola).
- **Idempotencia:** Si el webhook ya actualizó la transacción, el job en el paso 2 no hace la llamada a Wompi; no hay doble descuento de stock si se usa “solo actualizar si sigue PENDING” y “decrementar stock” atómico o con guarda.

**Resumen de tiempos (ejemplo):** 10 s → 10 min → 20 min → 30 min → 40 min → 50 min (1 + 5 intentos cada 10 min).

---

### 17.3 Decisión

| Origen     | Cuándo actúa                    | Uso principal        |
|-----------|----------------------------------|------------------------|
| Webhook   | Inmediato al cambiar estado en Wompi | Actualización en tiempo real |
| Bull job  | 10 s y luego 5 veces cada 10 min     | Respaldo si el webhook falla o no llega |

Siempre persistir el payload del webhook en `WompiWebhookEvent` para soporte/auditoría. Documentación: [Eventos Wompi](https://docs.wompi.co/docs/colombia/eventos/) (cobros).

---

## 18. Replicabilidad: pasos claros para revisores

Es una **prueba técnica** que van a revisar; los pasos para hacer funcionar la app deben ser **claros y fáciles de replicar**. Incluir en el **README.md** (y en el repo) lo siguiente:

1. **Requisitos previos:** Node.js (versión, ej. 18+), Docker y Docker Compose (para PostgreSQL y Redis), cuenta/claves Wompi Sandbox (o usar las del test).
2. **Clonar y abrir:** `git clone <repo>`, `cd cooltest` (o la raíz del repo).
3. **Variables de entorno:**
   - Backend: archivo `.env.example` con todas las variables necesarias (ej. `DATABASE_URL`, `REDIS_URL`, `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `BASE_FEE_CENTS`, `DELIVERY_FEE_CENTS`, etc.); instrucciones para copiar a `.env`.
   - Frontend: variable para URL del API (ej. `VITE_API_URL` o `REACT_APP_API_URL`) y, si aplica, URL del socket; instrucciones claras.
4. **Levantar dependencias:** `docker-compose up -d` (o comando equivalente) para PostgreSQL y Redis; verificar que los servicios estén arriba.
5. **Backend:** `cd backend`, `npm install`, `npx prisma migrate dev` (o `prisma db push`), `npx prisma db seed`, `npm run start:dev` (o el comando definido). Puerto y URL base documentados.
6. **Frontend:** `cd frontend`, `npm install`, `npm run dev` (o build + serve). Cómo apuntar al backend (env).
7. **Postman:** dónde está la colección (archivo en repo o enlace), cómo importarla y qué variables de entorno/configurar (base URL del API). Pasos numerados.
8. **Tests:** `npm run test` (y `npm run test:cov` si aplica) en backend y frontend; comando para ver cobertura; indicar que se debe alcanzar >80%.
9. **Webhook (opcional para revisión local):** si el revisor quiere probar webhook, indicar cómo exponer la URL (ej. ngrok) y configurarla en el dashboard Wompi Sandbox; si no, aclarar que el estado se actualiza también por Bull (polling de respaldo) y por socket cuando llegue el webhook en entorno desplegado.

Incluir un **Quick start** en el README (copiar/pegar de comandos en orden) para quien quiera levantar todo en poco tiempo. Evitar suposiciones implícitas; todo lo que un revisor deba instalar o configurar debe estar escrito.

---

*Documento SDP v6 – Decisiones técnicas finales: Vite, TailwindCSS + componentes headless, socket.io-client, Docker Compose completo, firma de integridad Wompi implementada desde inicio, productos seed de tecnología. Plan de implementación por fases: (1) Backend completo, (2) Frontend completo, (3) Tests >80%, (4) Deployment AWS. Repositorio público en `cooltest/`.*

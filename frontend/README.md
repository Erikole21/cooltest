# Frontend - Cooltest Store

SPA React para el flujo de compra con pago por tarjeta (Wompi Sandbox).

## Stack

- **React 19** + **TypeScript**
- **Vite 7**
- **Redux Toolkit** (productos, checkout, persistencia en `localStorage`)
- **React Router 6**
- **TailwindCSS**
- **Socket.IO Client** (actualización de transacciones en tiempo real)

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:3000` (o configurar proxy/env)

## Instalación

```bash
npm install
cp .env.example .env   # opcional
npm run dev
```

App: **http://localhost:5173**

En desarrollo, Vite hace proxy de `/api` y `/socket.io` al backend en `localhost:3000`.

## Scripts

- `npm run dev` — Servidor de desarrollo
- `npm run build` — Build de producción
- `npm run preview` — Vista previa del build
- `npm run lint` — ESLint
- `npm run test` — Tests unitarios (Vitest)
- `npm run test:watch` — Tests en modo watch
- `npm run test:cov` — Tests con reporte de cobertura

## Tests unitarios

Los tests usan **Vitest** (API compatible con Jest) y **React Testing Library**.

```bash
npm run test        # ejecutar una vez
npm run test:cov    # con cobertura
```

**Cobertura actual:** >80% en líneas (requisito del test).

| Métrica   | Cobertura |
|----------|-----------|
| Statements | ~78%   |
| Branches   | ~66%   |
| Functions  | ~72%   |
| **Lines**  | **~81%** |

Tests incluidos: store (products, checkout), validación, API client y Wompi (mock), componentes (Layout, ProductCard, CardDeliveryForm, SummaryBackdrop, ResultView), páginas (ProductsPage, CheckoutPage), hook useSocket, App.

## Variables de entorno

Ver `.env.example`. Las más relevantes:

- `VITE_WOMPI_API_URL` — URL de la API Wompi (sandbox por defecto)
- `VITE_WOMPI_PUBLIC_KEY` — Llave pública Wompi (solo se usa en frontend)
- `VITE_BASE_FEE_CENTS` / `VITE_DELIVERY_FEE_CENTS` — Deben coincidir con el backend

## Flujo de la app

1. **Productos** (`/`) — Lista de productos con stock; botón "Pagar con tarjeta".
2. **Datos** (`/checkout`, paso 2) — Formulario: comprador, entrega, tarjeta (validación Luhn, logos VISA/Mastercard).
3. **Resumen** (paso 3) — Product amount + Base fee + Delivery fee + botón "Pagar".
4. **Resultado** (paso 4) — Estado de la transacción (Socket.IO actualiza APPROVED/DECLINED); botón "Volver a productos".

El progreso del checkout se persiste en `localStorage` para recuperar tras un refresh.

## Estructura

- `src/api/` — Cliente REST (`/api/v1`) y llamadas a Wompi (tokens de aceptación, tokenización de tarjeta).
- `src/store/` — Redux: `productsSlice`, `checkoutSlice`; rehidratación desde `localStorage`.
- `src/components/` — Layout, ProductCard, CardDeliveryForm, SummaryBackdrop, ResultView.
- `src/pages/` — ProductsPage, CheckoutPage (pasos 2–4).
- `src/hooks/useSocket.ts` — Suscripción a `transaction-update` por `transactionId`.

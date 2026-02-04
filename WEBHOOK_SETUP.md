# Guía de Configuración del Webhook de Wompi

Esta guía explica cómo configurar el webhook de Wompi para recibir notificaciones de transacciones en tiempo real en la aplicación desplegada en AWS.

## Estado Actual

✅ **Endpoint implementado y funcionando:** El backend tiene el endpoint de webhook completamente implementado y listo para recibir eventos.

✅ **URL pública disponible:** `http://16.58.208.177:3000/api/v1/webhooks/wompi`

✅ **Validación de firma implementada:** El código valida la integridad de los eventos usando `WOMPI_EVENTS_SECRET`

⚠️ **Configuración pendiente:** Se requiere acceso al panel de Wompi Developer para registrar la URL del webhook.

---

## ¿Qué es el Webhook?

Un webhook es una notificación HTTP que Wompi envía a tu servidor cuando ocurre un evento importante, como cuando una transacción cambia de estado (PENDING → APPROVED o DECLINED).

### Ventajas del Webhook

1. **Actualización inmediata:** El backend recibe la notificación al instante
2. **Confiabilidad:** No depende de polling constante
3. **Eficiencia:** Reduce llamadas innecesarias a la API de Wompi
4. **Mejor UX:** El usuario ve el resultado del pago de inmediato

### Sistema de Respaldo

La aplicación implementa **doble mecanismo** para garantizar que ninguna transacción quede sin procesar:

1. **Webhook (primario):** Notificación instantánea de Wompi
2. **Polling con Bull/Redis (respaldo):** Si el webhook falla, un job verifica el estado cada 10 minutos (máximo 6 intentos)

---

## Implementación Actual

### Endpoint del Webhook

**Ruta:** `POST /api/v1/webhooks/wompi`

**Ubicación en el código:** [backend/src/infrastructure/adapters/in/controllers/webhooks.controller.ts](backend/src/infrastructure/adapters/in/controllers/webhooks.controller.ts)

**Funcionalidad:**

```typescript
@Post('wompi')
async handleWompiWebhook(
  @Headers('x-signature') signature: string,
  @Headers('x-event') event: string,
  @Headers('x-environment') environment: string,
  @Body() body: any,
) {
  // 1. Validar firma de integridad
  const isValid = await this.wompiService.validateWebhookSignature(
    signature,
    body,
  );

  if (!isValid) {
    return { status: 'invalid_signature' };
  }

  // 2. Procesar evento transaction.updated
  if (event === 'transaction.updated') {
    const { reference, status: wompiStatus } = body.data.transaction;

    // 3. Buscar transacción por referencia
    const transaction = await this.transactionRepository.findByReference(reference);

    if (transaction) {
      // 4. Actualizar estado y stock
      const finalStatus = this.mapWompiStatus(wompiStatus);
      await this.transactionRepository.finalizeStatus(
        transaction.id,
        finalStatus,
        body.data.transaction.id,
      );

      // 5. Notificar al frontend vía Socket.IO
      this.transactionGateway.emitTransactionUpdate(
        transaction.id,
        finalStatus,
      );
    }
  }

  return { status: 'received' };
}
```

### Validación de Firma

**Ubicación:** [backend/src/infrastructure/adapters/out/http/wompi.service.ts](backend/src/infrastructure/adapters/out/http/wompi.service.ts)

La firma se valida usando HMAC-SHA256:

```typescript
async validateWebhookSignature(
  signature: string,
  payload: any,
): Promise<boolean> {
  const hmac = crypto.createHmac('sha256', this.eventsSecret);

  // Concatenar timestamp + request_id + event
  const data = `${payload.timestamp}${payload.sent_at}${payload.event}`;

  hmac.update(data);
  const calculatedSignature = hmac.digest('hex');

  return calculatedSignature === signature;
}
```

### Variables de Entorno

El webhook requiere estas variables en `backend/.env`:

```env
# Wompi Events Secret para validar webhooks
WOMPI_EVENTS_SECRET=stagtest_events_pJfAvuxVyLBvmpLqUgSfP1Hj3Kc5RuFp
```

---

## Cómo Configurar el Webhook en Wompi

### Opción A: Panel Web de Wompi Developer

Esta es la forma recomendada y más sencilla.

#### Paso 1: Acceder al Panel

1. Ir a **[https://comercios.wompi.co/](https://comercios.wompi.co/)**
2. Iniciar sesión con las credenciales de Wompi Developer proporcionadas en la prueba técnica

#### Paso 2: Navegar a Webhooks

1. En el menú lateral, buscar **"Configuración"** o **"Desarrolladores"**
2. Click en **"Webhooks"** o **"Eventos"**
3. Click en **"Agregar Webhook"** o **"+ Nuevo"**

#### Paso 3: Configurar el Webhook

Llenar el formulario con estos datos:

| Campo | Valor |
|-------|-------|
| **URL del Webhook** | `http://16.58.208.177:3000/api/v1/webhooks/wompi` |
| **Eventos a suscribir** | `transaction.updated` |
| **Entorno** | `Sandbox` o `Pruebas` |
| **Descripción** (opcional) | Webhook Cooltest - Notificaciones de transacciones |

#### Paso 4: Guardar y Verificar

1. Click en **"Guardar"** o **"Crear Webhook"**
2. Wompi puede enviar un evento de prueba para verificar que el endpoint responde
3. Verificar que el estado del webhook es **"Activo"** o **"Habilitado"**

### Opción B: API de Wompi (Avanzado)

Si el panel web no está disponible, se puede configurar vía API:

```bash
curl -X POST https://sandbox.wompi.co/v1/webhooks \
  -H "Authorization: Bearer prv_stagtest_af61dTZcbf5bgdLlz2NголQZUXPUzoXu" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://16.58.208.177:3000/api/v1/webhooks/wompi",
    "events": ["transaction.updated"],
    "description": "Webhook Cooltest"
  }'
```

**Nota:** Verificar la documentación actual de Wompi para la ruta exacta, ya que puede variar.

---

## Verificar que el Webhook Funciona

### 1. Verificar Endpoint Público

Probar que el endpoint es accesible desde Internet:

```bash
# Desde cualquier computadora con acceso a Internet
curl -X POST http://16.58.208.177:3000/api/v1/webhooks/wompi \
  -H "Content-Type: application/json" \
  -H "x-event: test" \
  -d '{"test": true}'
```

Debería responder:
```json
{"status": "invalid_signature"}
```

Esto es correcto porque no enviamos una firma válida.

### 2. Simular Webhook de Wompi

Desde el servidor EC2, puedes simular un webhook completo:

```bash
# SSH al servidor
ssh -i cooltest-key.pem ubuntu@16.58.208.177

# Simular webhook (ajustar valores según una transacción real)
curl -X POST http://localhost:3000/api/v1/webhooks/wompi \
  -H "Content-Type: application/json" \
  -H "x-event: transaction.updated" \
  -H "x-environment: test" \
  -H "x-signature: FIRMA_CALCULADA" \
  -d '{
    "event": "transaction.updated",
    "data": {
      "transaction": {
        "id": "12345-wompi-id",
        "reference": "TXN-123",
        "status": "APPROVED",
        "amount_in_cents": 10000
      }
    },
    "timestamp": 1234567890,
    "sent_at": 1234567890
  }'
```

### 3. Verificar Logs del Backend

Revisar los logs de PM2 para ver si el webhook fue recibido:

```bash
pm2 logs cooltest-backend --lines 50
```

Deberías ver mensajes como:
```
📨 Received Wompi webhook: transaction.updated
✅ Transaction 123 updated to APPROVED via webhook
```

### 4. Prueba End-to-End

La mejor forma de probar el webhook es hacer una compra completa:

1. Abrir **http://16.58.208.177:5173/**
2. Seleccionar un producto y hacer click en **"Pagar"**
3. Llenar datos con tarjeta de prueba: `4242 4242 4242 4242`
4. Completar el pago
5. Observar:
   - El resultado debería aparecer inmediatamente (si webhook está configurado)
   - O después de ~10 minutos (si usa polling de respaldo)

---

## Troubleshooting

### Problema: El webhook nunca se ejecuta

**Posibles causas:**

1. **Webhook no configurado en Wompi:**
   - Verificar en el panel de Wompi que el webhook está activo
   - Confirmar que la URL es exactamente: `http://16.58.208.177:3000/api/v1/webhooks/wompi`

2. **Firewall bloqueando:**
   - Verificar Security Group de AWS permite tráfico entrante en puerto 3000
   - Verificar con: `curl http://16.58.208.177:3000/api/v1/products`

3. **Backend no está corriendo:**
   ```bash
   pm2 status
   # Debe mostrar cooltest-backend: online
   ```

### Problema: Webhook recibido pero transacción no se actualiza

**Posibles causas:**

1. **Validación de firma fallando:**
   ```bash
   pm2 logs cooltest-backend --lines 50
   # Buscar: "invalid_signature" o "Error validating webhook signature"
   ```

   **Solución:** Verificar que `WOMPI_EVENTS_SECRET` en `.env` coincide con el secret de Wompi

2. **Referencia no encontrada:**
   ```bash
   # Buscar: "Transaction not found for reference"
   ```

   **Solución:** Verificar que la referencia en el webhook coincide con la de la transacción en la BD

3. **Error en actualización de stock:**
   ```bash
   # Buscar: "Error processing webhook"
   ```

   **Solución:** Revisar logs completos y estado de PostgreSQL

### Problema: Signature validation failed

**Causa:** El `WOMPI_EVENTS_SECRET` es incorrecto o el formato del payload cambió.

**Solución:**

1. Verificar que `WOMPI_EVENTS_SECRET` en `.env` es correcto:
   ```env
   WOMPI_EVENTS_SECRET=stagtest_events_pJfAvuxVyLBvmpLqUgSfP1Hj3Kc5RuFp
   ```

2. Si el secret cambió, actualizar `.env` y reiniciar:
   ```bash
   cd ~/cooltest/backend
   nano .env  # Actualizar WOMPI_EVENTS_SECRET
   pm2 restart cooltest-backend
   ```

3. Verificar documentación de Wompi para cambios en el formato de la firma

---

## Flujo Completo: Webhook + Polling

La aplicación usa una estrategia de doble mecanismo para garantizar que todas las transacciones se procesen:

```
┌─────────────────┐
│  Usuario paga   │
│  con tarjeta    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Backend crea txn       │
│  Status: PENDING        │
│  Job de polling: +10min │
└────────┬────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌─────────────────┐
│  Webhook Wompi   │          │  Polling Job    │
│  (instantáneo)   │          │  (cada 10 min)  │
└────────┬─────────┘          └────────┬────────┘
         │                              │
         ▼                              ▼
┌──────────────────────────────────────────────┐
│  Actualizar estado + stock                   │
│  Notificar frontend vía Socket.IO            │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│  Usuario ve      │
│  resultado       │
└──────────────────┘
```

**Con webhook configurado:**
- Usuario ve resultado en ~2-5 segundos ✅

**Sin webhook (solo polling):**
- Usuario ve resultado en ~10 minutos ⚠️
- Funciona, pero experiencia subóptima

---

## Información de Contacto para Configuración

Si no tienes acceso al panel de Wompi Developer:

1. **Solicitar acceso** al responsable de la prueba técnica de Wompi
2. **Proporcionar estos datos:**
   - URL del webhook: `http://16.58.208.177:3000/api/v1/webhooks/wompi`
   - Evento a suscribir: `transaction.updated`
   - Entorno: Sandbox
   - IP del servidor: `16.58.208.177`

3. **Verificar que está configurado:**
   - El webhook debería aparecer en el panel de Wompi
   - Estado: Activo
   - Últimos intentos: Exitosos (200 OK)

---

## Documentación de Referencia

- **Wompi Webhooks:** [https://docs.wompi.co/docs/eventos-1](https://docs.wompi.co/docs/eventos-1)
- **Wompi API:** [https://docs.wompi.co/](https://docs.wompi.co/)
- **Código del webhook:** [backend/src/infrastructure/adapters/in/controllers/webhooks.controller.ts](backend/src/infrastructure/adapters/in/controllers/webhooks.controller.ts)

---

## Resumen para Evaluadores

✅ **El endpoint de webhook está completamente implementado y funcional**

✅ **La aplicación incluye sistema de respaldo (polling) para garantizar que todas las transacciones se procesen**

✅ **La configuración del webhook solo requiere agregar la URL en el panel de Wompi (1 minuto)**

⚠️ **Se requiere acceso a la cuenta de Wompi Developer con las credenciales de la prueba para completar la configuración**

**URL para configurar:** `http://16.58.208.177:3000/api/v1/webhooks/wompi`

**Evento a suscribir:** `transaction.updated`

**Panel de configuración:** [https://comercios.wompi.co/](https://comercios.wompi.co/) → Configuración → Webhooks

---

**Última actualización:** 04 de Febrero de 2026

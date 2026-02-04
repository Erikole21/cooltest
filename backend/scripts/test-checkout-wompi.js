/**
 * Script para probar el endpoint de checkout contra Wompi sandbox.
 * Requiere: backend corriendo (npm run start:dev), .env con WOMPI_* correctos.
 *
 * Uso: node scripts/test-checkout-wompi.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Cargar .env si existe (sin dependencia dotenv)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://api-sandbox.co.uat.wompi.dev/v1';
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || '';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

function parseUrl(url) {
  const u = new URL(url);
  return { protocol: u.protocol, host: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + u.search };
}

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const isHttps = options.protocol === 'https:';
    const req = (isHttps ? https : http).request(
      {
        hostname: options.host,
        port: options.port,
        path: options.path,
        method: options.method || 'GET',
        headers: { 'Content-Type': 'application/json', ...options.headers },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Request timeout (25s)'));
    });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  if (!WOMPI_PUBLIC_KEY) {
    console.error('Falta WOMPI_PUBLIC_KEY. Ejecuta con: set WOMPI_PUBLIC_KEY=pub_stagtest_... && node scripts/test-checkout-wompi.js');
    console.error('O asegúrate de tener .env cargado (ej. desde la raíz del backend).');
    process.exit(1);
  }

  const base = parseUrl(WOMPI_API_URL);
  const basePath = base.path.replace(/\/$/, '') || '';

  console.log('1. Obteniendo tokens de aceptación (GET /merchants/:public_key)...');
  const merchantRes = await request({
    ...base,
    path: `${basePath}/merchants/${encodeURIComponent(WOMPI_PUBLIC_KEY)}`,
    method: 'GET',
  });

  if (merchantRes.status !== 200 || !merchantRes.data?.data?.presigned_acceptance) {
    console.error('Error obteniendo merchant:', merchantRes.status, merchantRes.data);
    process.exit(1);
  }

  const acceptanceToken = merchantRes.data.data.presigned_acceptance.acceptance_token;
  const presignedPersonal = merchantRes.data.data.presigned_personal_data_auth;
  const acceptPersonalAuth = presignedPersonal ? presignedPersonal.acceptance_token : acceptanceToken;
  console.log('   Tokens de aceptación obtenidos.');

  console.log('2. Tokenizando tarjeta de prueba (POST /tokens/cards)...');
  const tokenRes = await request(
    {
      ...base,
      path: `${basePath}/tokens/cards`,
      method: 'POST',
      headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` },
    },
    {
      number: '4242424242424242',
      exp_month: '06',
      exp_year: '29',
      cvc: '123',
      card_holder: 'Pedro Perez',
    }
  );

  if (tokenRes.status !== 201 && tokenRes.status !== 200) {
    console.error('Error tokenizando tarjeta:', tokenRes.status, tokenRes.data);
    process.exit(1);
  }

  const paymentToken = tokenRes.data?.data?.id || tokenRes.data?.id;
  if (!paymentToken) {
    console.error('No se obtuvo id del token:', tokenRes.data);
    process.exit(1);
  }
  console.log('   Token de pago:', paymentToken);

  console.log('3. Llamando checkout del backend (POST /api/v1/checkout)...');
  const checkoutBody = {
    productId: 21, // iPhone 15 Pro Max (producto válido del seed)
    quantity: 1,
    paymentToken,
    acceptanceToken,
    acceptPersonalAuth,
    customer: { email: 'test@wompi.com', fullName: 'Test User' },
    delivery: { address: 'Calle 1 #2-3', city: 'Bogota', phone: '3001234567' },
  };

  const backendBase = parseUrl(BACKEND_URL);
  const checkoutRes = await request(
    {
      ...backendBase,
      path: '/api/v1/checkout',
      method: 'POST',
    },
    checkoutBody
  );

  if (checkoutRes.status >= 200 && checkoutRes.status < 300) {
    console.log('   Checkout OK:', checkoutRes.data);
    return;
  }
  console.error('   Checkout falló:', checkoutRes.status, checkoutRes.data);
  const msg = checkoutRes.data?.message || '';
  if (msg.includes('firma') && msg.includes('inválida')) {
    console.error('\n   Si la firma es inválida, verifica en el dashboard de Wompi:');
    console.error('   Desarrolladores > Secretos para integración técnica > Secreto de integridad');
    console.error('   WOMPI_INTEGRITY_SECRET en .env debe coincidir exactamente con ese valor.');
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

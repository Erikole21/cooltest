const WOMPI_API_URL =
  import.meta.env.VITE_WOMPI_API_URL ?? 'https://api-sandbox.co.uat.wompi.dev/v1';
const WOMPI_PUBLIC_KEY =
  import.meta.env.VITE_WOMPI_PUBLIC_KEY ?? 'pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7';

export interface WompiAcceptanceTokens {
  acceptanceToken: string;
  acceptPersonalAuth: string;
}

export interface CardTokenRequest {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  card_holder: string;
}

export async function getWompiAcceptanceTokens(): Promise<WompiAcceptanceTokens> {
  const res = await fetch(
    `${WOMPI_API_URL}/merchants/${encodeURIComponent(WOMPI_PUBLIC_KEY)}`
  );
  if (!res.ok) {
    throw new Error('No se pudieron obtener los tokens de aceptación');
  }
  const data = await res.json();
  const presigned = data?.data?.presigned_acceptance;
  const presignedPersonal = data?.data?.presigned_personal_data_auth;
  if (!presigned?.acceptance_token) {
    throw new Error('Respuesta de Wompi inválida');
  }
  return {
    acceptanceToken: presigned.acceptance_token,
    acceptPersonalAuth:
      presignedPersonal?.acceptance_token ?? presigned.acceptance_token,
  };
}

export async function tokenizeCard(
  card: CardTokenRequest
): Promise<string> {
  // Wompi espera `exp_year` en 2 dígitos (YY). Aceptamos 2 o 4 dígitos en UI.
  const expYearRaw = card.exp_year.trim();
  const expYearYY =
    expYearRaw.length === 4 ? expYearRaw.slice(-2) : expYearRaw;

  const res = await fetch(`${WOMPI_API_URL}/tokens/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WOMPI_PUBLIC_KEY}`,
    },
    body: JSON.stringify({
      number: card.number.replace(/\s/g, ''),
      exp_month: card.exp_month.padStart(2, '0'),
      exp_year: expYearYY,
      cvc: card.cvc,
      card_holder: card.card_holder,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { reason?: string } })?.error?.reason ??
        'Error al tokenizar la tarjeta'
    );
  }
  const data = await res.json();
  const token =
    data?.data?.id ?? data?.id;
  if (!token) {
    throw new Error('No se recibió token de pago');
  }
  return token;
}

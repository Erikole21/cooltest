const API_BASE = '/api/v1';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProducts: () =>
    request<{ products: import('../types').Product[] }>('/products'),

  getProduct: (id: number) =>
    request<import('../types').Product>(`/products/${id}`),

  getTransaction: (id: number) =>
    request<{
      id: number;
      status: string;
      total: number;
      productId: number;
      quantity: number;
    }>(`/transactions/${id}`),

  checkout: (body: import('../types').CheckoutPayload) =>
    request<import('../types').CheckoutResponse>('/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

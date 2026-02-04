import { vi, beforeEach, describe, it, expect } from 'vitest';
import { api } from './client';

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getProducts returns products from response', async () => {
    const products = [
      {
        id: 1,
        name: 'P',
        description: 'D',
        price: 1000,
        stockQuantity: 5,
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
      },
    ];
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ products }),
    });
    const result = await api.getProducts();
    expect(result.products).toEqual(products);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/products',
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('getProduct returns single product', async () => {
    const product = {
      id: 1,
      name: 'P',
      description: 'D',
      price: 1000,
      stockQuantity: 5,
      imageUrl: null,
      createdAt: '',
      updatedAt: '',
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(product),
    });
    const result = await api.getProduct(1);
    expect(result).toEqual(product);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/products/1',
      expect.any(Object)
    );
  });

  it('checkout POSTs payload and returns response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          transactionId: 10,
          status: 'PENDING',
          total: 15000,
        }),
    });
    const result = await api.checkout({
      productId: 1,
      quantity: 2,
      paymentToken: 'tok_xxx',
      acceptanceToken: 'acc_xxx',
      acceptPersonalAuth: 'auth_xxx',
      customer: { email: 'a@b.co', fullName: 'Test' },
      delivery: { address: 'Calle', city: 'Bogota', phone: '123' },
    });
    expect(result.transactionId).toBe(10);
    expect(result.status).toBe('PENDING');
    expect(result.total).toBe(15000);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/checkout',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );
  });

  it('throws when response not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Bad request' }),
    });
    await expect(api.getProducts()).rejects.toThrow('Bad request');
  });
});

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { getWompiAcceptanceTokens, tokenizeCard } from './wompi';

describe('wompi api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getWompiAcceptanceTokens returns tokens from response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            presigned_acceptance: { acceptance_token: 'acc_xxx' },
            presigned_personal_data_auth: { acceptance_token: 'personal_xxx' },
          },
        }),
    });
    const result = await getWompiAcceptanceTokens();
    expect(result.acceptanceToken).toBe('acc_xxx');
    expect(result.acceptPersonalAuth).toBe('personal_xxx');
  });

  it('getWompiAcceptanceTokens uses acceptance when personal missing', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            presigned_acceptance: { acceptance_token: 'acc_xxx' },
          },
        }),
    });
    const result = await getWompiAcceptanceTokens();
    expect(result.acceptPersonalAuth).toBe('acc_xxx');
  });

  it('getWompiAcceptanceTokens throws when not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });
    await expect(getWompiAcceptanceTokens()).rejects.toThrow();
  });

  it('tokenizeCard returns token from response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'tok_xxx' } }),
    });
    const result = await tokenizeCard({
      number: '4242424242424242',
      exp_month: '12',
      exp_year: '30',
      cvc: '123',
      card_holder: 'Test',
    });
    expect(result).toBe('tok_xxx');
  });

  it('tokenizeCard throws when not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { reason: 'Invalid card' } }),
    });
    await expect(
      tokenizeCard({
        number: '1234',
        exp_month: '01',
        exp_year: '25',
        cvc: '123',
        card_holder: 'T',
      })
    ).rejects.toThrow();
  });
});

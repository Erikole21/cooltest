import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store, loadCheckoutFromStorage } from './index';

describe('store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    });
  });

  it('has products and checkout reducers', () => {
    const state = store.getState();
    expect(state).toHaveProperty('products');
    expect(state).toHaveProperty('checkout');
    expect(state.products.items).toEqual([]);
    expect(state.checkout.step).toBe(1);
  });

  it('loadCheckoutFromStorage returns undefined when no key', () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    expect(loadCheckoutFromStorage()).toBeUndefined();
  });

  it('loadCheckoutFromStorage returns checkout when valid JSON', () => {
    const saved = { step: 2, product: null, quantity: 1 };
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({ checkout: saved })
    );
    expect(loadCheckoutFromStorage()).toEqual(saved);
  });
});

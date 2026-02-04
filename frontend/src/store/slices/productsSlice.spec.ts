import productsReducer, { fetchProducts, clearError } from './productsSlice';

describe('productsSlice', () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
    highlightedProductId: null,
  };

  it('returns initial state', () => {
    expect(productsReducer(undefined, { type: 'unknown' })).toEqual(
      initialState
    );
  });

  it('sets loading on fetchProducts.pending', () => {
    const state = productsReducer(initialState, fetchProducts.pending('', undefined));
    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('sets items on fetchProducts.fulfilled', () => {
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
    const state = productsReducer(
      { ...initialState, loading: true },
      fetchProducts.fulfilled(products, '', undefined)
    );
    expect(state.loading).toBe(false);
    expect(state.items).toEqual(products);
    expect(state.error).toBe(null);
  });

  it('sets error on fetchProducts.rejected', () => {
    const state = productsReducer(
      { ...initialState, loading: true },
      fetchProducts.rejected(null, '', undefined, 'Failed')
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Failed');
  });

  it('clearError resets error', () => {
    const state = productsReducer(
      { ...initialState, error: 'Some error' },
      clearError()
    );
    expect(state.error).toBe(null);
  });
});

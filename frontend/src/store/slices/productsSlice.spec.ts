import productsReducer, { fetchProducts, refreshProduct, clearError, setHighlightedProductId } from './productsSlice';

describe('productsSlice', () => {
  const initialState = {
    items: [],
    loading: false,
    error: null,
    highlightedProductId: null,
  };

  const mockProduct = {
    id: 1,
    name: 'P',
    description: 'D',
    price: 1000,
    stockQuantity: 5,
    imageUrl: null,
    createdAt: '',
    updatedAt: '',
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
    const products = [mockProduct];
    const state = productsReducer(
      { ...initialState, loading: true },
      fetchProducts.fulfilled(products, '', undefined)
    );
    expect(state.loading).toBe(false);
    expect(state.items).toEqual(products);
    expect(state.error).toBe(null);
  });

  it('sets error on fetchProducts.rejected with payload', () => {
    const state = productsReducer(
      { ...initialState, loading: true },
      fetchProducts.rejected(null, '', undefined, 'Failed')
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Failed');
  });

  it('sets error on fetchProducts.rejected without payload', () => {
    const state = productsReducer(
      { ...initialState, loading: true },
      {
        type: fetchProducts.rejected.type,
        payload: undefined,
        error: { message: 'Network error' },
      }
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Error desconocido');
  });

  it('clearError resets error', () => {
    const state = productsReducer(
      { ...initialState, error: 'Some error' },
      clearError()
    );
    expect(state.error).toBe(null);
  });

  it('setHighlightedProductId sets the highlighted product id', () => {
    const state = productsReducer(initialState, setHighlightedProductId(5));
    expect(state.highlightedProductId).toBe(5);
  });

  it('setHighlightedProductId can clear the highlighted product id', () => {
    const state = productsReducer(
      { ...initialState, highlightedProductId: 5 },
      setHighlightedProductId(null)
    );
    expect(state.highlightedProductId).toBe(null);
  });

  it('refreshProduct.fulfilled updates existing product', () => {
    const existingProduct = { ...mockProduct, stockQuantity: 5 };
    const updatedProduct = { ...mockProduct, stockQuantity: 3 };

    const state = productsReducer(
      { ...initialState, items: [existingProduct] },
      refreshProduct.fulfilled(updatedProduct, '', 1)
    );

    expect(state.items[0].stockQuantity).toBe(3);
    expect(state.items).toHaveLength(1);
  });

  it('refreshProduct.fulfilled adds new product when not found', () => {
    const newProduct = { ...mockProduct, id: 2 };

    const state = productsReducer(
      { ...initialState, items: [mockProduct] },
      refreshProduct.fulfilled(newProduct, '', 2)
    );

    expect(state.items).toHaveLength(2);
    expect(state.items[0]).toEqual(newProduct);
    expect(state.items[1]).toEqual(mockProduct);
  });
});

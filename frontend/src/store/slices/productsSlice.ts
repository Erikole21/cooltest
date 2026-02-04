import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';
import type { Product } from '../../types';

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
  highlightedProductId: number | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
  highlightedProductId: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.getProducts();
      return res.products;
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Error al cargar productos'
      );
    }
  }
);

export const refreshProduct = createAsyncThunk(
  'products/refreshOne',
  async (productId: number, { rejectWithValue }) => {
    try {
      return await api.getProduct(productId);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Error al cargar el producto'
      );
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setHighlightedProductId: (state, action: { payload: number | null }) => {
      state.highlightedProductId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? 'Error desconocido';
      })
      .addCase(refreshProduct.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex((p) => p.id === updated.id);
        if (idx >= 0) state.items[idx] = updated;
        else state.items.unshift(updated);
      });
  },
});

export const { clearError, setHighlightedProductId } = productsSlice.actions;
export default productsSlice.reducer;

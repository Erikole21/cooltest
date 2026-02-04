import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { ProductsPage } from './ProductsPage';
import productsReducer from '../store/slices/productsSlice';
import checkoutReducer from '../store/slices/checkoutSlice';

vi.mock('../api/client', () => ({
  api: {
    getProducts: vi.fn(),
  },
}));

async function getApiMock() {
  const { api } = await import('../api/client');
  return api.getProducts as ReturnType<typeof vi.fn>;
}

function renderWithStore(preloadedState?: {
  products?: {
    items: unknown[];
    loading: boolean;
    error: string | null;
    highlightedProductId?: number | null;
  };
  checkout?: {
    lastTransactionId?: number | null;
    lastProductId?: number | null;
  };
}) {
  const store = configureStore({
    reducer: { products: productsReducer, checkout: checkoutReducer },
    preloadedState,
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('ProductsPage', () => {
  it('shows loading when items empty and loading true', async () => {
    renderWithStore({
      products: { items: [], loading: true, error: null, highlightedProductId: null },
    });
    await waitFor(() => {
      expect(screen.queryByText('Productos disponibles')).not.toBeInTheDocument();
      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });
  });

  it('shows error and Reintentar when fetch fails', async () => {
    const getProducts = await getApiMock();
    getProducts.mockRejectedValueOnce(new Error('Network error'));
    renderWithStore();
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
  });

  it('shows product list when items loaded', async () => {
    const items = [
      {
        id: 1,
        name: 'Product A',
        description: 'Desc',
        price: 1000,
        stockQuantity: 5,
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const getProducts = await getApiMock();
    getProducts.mockResolvedValueOnce({ products: items });
    renderWithStore();
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });
    expect(screen.getByText(/Productos disponibles/)).toBeInTheDocument();
  });

  it('opens checkout modal when user clicks Pay', async () => {
    const items = [
      {
        id: 1,
        name: 'Product A',
        description: 'Desc',
        price: 1000,
        stockQuantity: 5,
        imageUrl: null,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const getProducts = await getApiMock();
    getProducts.mockResolvedValueOnce({ products: items });
    renderWithStore();

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });

    const payBtn = screen.getByRole('button', { name: /Pagar con tarjeta/i });
    fireEvent.click(payBtn);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /Datos de pago y entrega/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText(/Email/i)).toBeInTheDocument();
  });
});

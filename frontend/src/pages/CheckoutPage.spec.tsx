import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import productsReducer from '../store/slices/productsSlice';
import checkoutReducer from '../store/slices/checkoutSlice';

vi.mock('../api/wompi', () => ({
  getWompiAcceptanceTokens: vi.fn(),
  tokenizeCard: vi.fn(),
}));

vi.mock('../api/client', () => ({
  api: {
    checkout: vi.fn(),
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    getTransaction: vi.fn(),
  },
}));

const mockProduct = {
  id: 1,
  name: 'Product',
  description: 'Desc',
  price: 10000,
  stockQuantity: 10,
  imageUrl: null,
  createdAt: '',
  updatedAt: '',
};

function renderCheckoutPage(step: 1 | 2 | 3 | 4 = 2) {
  const store = configureStore({
    reducer: { products: productsReducer, checkout: checkoutReducer },
    preloadedState: {
      checkout: {
        step,
        product: mockProduct,
        quantity: 2,
        customer: { email: 'a@b.co', fullName: 'Test' },
        delivery: { address: 'Calle', city: 'Bogota', phone: '123' },
        cardForm: {
          number: '4242 4242 4242 4242',
          expMonth: '12',
          expYear: '30',
          cvc: '123',
          cardHolder: 'Test',
        },
        transactionId: null,
        transactionStatus: null,
        lastError: null,
      },
    },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <CheckoutPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('CheckoutPage', () => {
  it('renders step 2 form when step is 2', () => {
    renderCheckoutPage(2);
    expect(screen.getByText(/Datos de pago y entrega/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/)).toBeInTheDocument();
  });

  it('renders step 3 summary when step is 3', () => {
    renderCheckoutPage(3);
    expect(screen.getByText(/Resumen del pago/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar/ })).toBeInTheDocument();
  });

  it('renders step 4 result when step is 4', () => {
    const store = configureStore({
      reducer: { products: productsReducer, checkout: checkoutReducer },
      preloadedState: {
        checkout: {
          step: 4,
          product: null,
          quantity: 1,
          customer: null,
          delivery: null,
          cardForm: null,
          transactionId: 10,
          transactionStatus: 'APPROVED',
          lastError: null,
        },
      },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/checkout']}>
          <CheckoutPage />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/Pago aprobado/)).toBeInTheDocument();
  });

  it('processes payment when user clicks Pay (success)', async () => {
    const { getWompiAcceptanceTokens, tokenizeCard } = await import('../api/wompi');
    const { api } = await import('../api/client');

    (getWompiAcceptanceTokens as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      acceptanceToken: 'acc',
      acceptPersonalAuth: 'accp',
    });
    (tokenizeCard as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('tok_123');
    (api.checkout as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      transactionId: 99,
      status: 'PENDING',
      total: 123,
    });

    renderCheckoutPage(3);

    fireEvent.click(screen.getByRole('button', { name: /^Pagar$/i }));

    await waitFor(() => {
      expect(api.checkout).toHaveBeenCalledTimes(1);
    });

    expect(api.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 1,
        quantity: 2,
        paymentToken: 'tok_123',
        acceptanceToken: 'acc',
        acceptPersonalAuth: 'accp',
      })
    );

    await waitFor(() => {
      expect(screen.getByText(/Procesando/i)).toBeInTheDocument();
    });
  });

  it('shows a user friendly error when payment fails', async () => {
    const { getWompiAcceptanceTokens } = await import('../api/wompi');
    (getWompiAcceptanceTokens as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('La firma es inválida')
    );

    renderCheckoutPage(3);
    fireEvent.click(screen.getByRole('button', { name: /^Pagar$/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/No se pudo validar la firma del pago/i)
      ).toBeInTheDocument();
    });
  });
});

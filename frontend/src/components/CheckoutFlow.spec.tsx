import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { CheckoutFlow } from './CheckoutFlow';
import checkoutReducer from '../store/slices/checkoutSlice';
import productsReducer from '../store/slices/productsSlice';
import * as wompiApi from '../api/wompi';
import * as apiClient from '../api/client';

vi.mock('../hooks/useSocket', () => ({
  useTransactionUpdate: vi.fn(),
}));

const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'Test description',
  price: 100000,
  stockQuantity: 10,
  imageUrl: null,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const renderCheckoutFlow = (checkoutState = {}, presentation: 'modal' | 'page' = 'modal') => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      products: productsReducer,
    },
    preloadedState: {
      checkout: {
        step: 1,
        product: null,
        quantity: 1,
        customer: null,
        delivery: null,
        cardForm: null,
        lastError: null,
        transactionId: null,
        transactionStatus: null,
        ...checkoutState,
      },
      products: {
        items: [mockProduct],
        loading: false,
        error: null,
        highlightedProductId: null,
      },
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <CheckoutFlow presentation={presentation} />
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('CheckoutFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when step is 1', () => {
    const { container } = renderCheckoutFlow({ step: 1 });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no product selected', () => {
    const { container} = renderCheckoutFlow({ step: 2, product: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders CardDeliveryForm when step is 2', () => {
    renderCheckoutFlow({ step: 2, product: mockProduct, quantity: 1 });
    expect(screen.getByPlaceholderText(/Email/)).toBeInTheDocument();
  });

  it('renders summary when step is 3', () => {
    renderCheckoutFlow({
      step: 3,
      product: mockProduct,
      quantity: 2,
      customer: { email: 'test@test.com', fullName: 'Test User' },
      delivery: { address: 'Test St', city: 'Test City', phone: '123456' },
      cardForm: {
        number: '4242424242424242',
        expMonth: '12',
        expYear: '2030',
        cvc: '123',
        cardHolder: 'TEST USER',
      },
    });
    expect(screen.getAllByText(/Pagar/)[0]).toBeInTheDocument();
  });

  it('renders ResultView when step is 4 in modal presentation', () => {
    renderCheckoutFlow({
      step: 4,
      product: mockProduct,
      transactionId: 1,
      transactionStatus: 'APPROVED',
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Resultado del pago')).toBeInTheDocument();
  });

  it('renders ResultView when step is 4 in page presentation', () => {
    renderCheckoutFlow({
      step: 4,
      product: mockProduct,
      transactionId: 1,
      transactionStatus: 'APPROVED',
    }, 'page');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows close button in modal presentation', () => {
    renderCheckoutFlow({ step: 2, product: mockProduct });
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  it('does not show close button in page presentation', () => {
    renderCheckoutFlow({ step: 2, product: mockProduct }, 'page');
    expect(screen.queryByLabelText('Cerrar')).not.toBeInTheDocument();
  });

  it('does not proceed when validation fails', () => {
    const { store } = renderCheckoutFlow({
      step: 2,
      product: mockProduct,
      customer: { email: '', fullName: '' },
      delivery: { address: 'Test', city: 'Test', phone: '123' },
      cardForm: {
        number: '4242424242424242',
        expMonth: '12',
        expYear: '2030',
        cvc: '123',
        cardHolder: 'TEST',
      },
    });

    const submitButton = screen.getByRole('button', { name: /Continuar al resumen/ });
    fireEvent.click(submitButton);

    // Should still be on step 2
    expect(store.getState().checkout.step).toBe(2);
  });

  it('processes payment successfully', async () => {
    vi.spyOn(wompiApi, 'getWompiAcceptanceTokens').mockResolvedValue({
      acceptanceToken: 'acc-token',
      acceptPersonalAuth: 'personal-token',
      permalink: 'http://test.com',
    });
    vi.spyOn(wompiApi, 'tokenizeCard').mockResolvedValue('payment-token');
    vi.spyOn(apiClient.api, 'checkout').mockResolvedValue({
      transactionId: 123,
      status: 'PENDING',
    });

    const { store } = renderCheckoutFlow({
      step: 3,
      product: mockProduct,
      quantity: 1,
      customer: { email: 'test@test.com', fullName: 'Test' },
      delivery: { address: 'Test', city: 'Test', phone: '123' },
      cardForm: {
        number: '4242 4242 4242 4242',
        expMonth: '12',
        expYear: '2030',
        cvc: '123',
        cardHolder: 'TEST',
      },
    });

    const payButton = screen.getByText(/Pagar/);
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(wompiApi.getWompiAcceptanceTokens).toHaveBeenCalled();
      expect(wompiApi.tokenizeCard).toHaveBeenCalled();
      expect(apiClient.api.checkout).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(store.getState().checkout.transactionId).toBe(123);
    });
  });

  it('handles payment error', async () => {
    vi.spyOn(wompiApi, 'getWompiAcceptanceTokens').mockRejectedValue(
      new Error('Acceptance token error')
    );

    const { store } = renderCheckoutFlow({
      step: 3,
      product: mockProduct,
      quantity: 1,
      customer: { email: 'test@test.com', fullName: 'Test' },
      delivery: { address: 'Test', city: 'Test', phone: '123' },
      cardForm: {
        number: '4242424242424242',
        expMonth: '12',
        expYear: '2030',
        cvc: '123',
        cardHolder: 'TEST',
      },
    });

    const payButton = screen.getByText(/Pagar/);
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(store.getState().checkout.lastError).toBeTruthy();
    });
  });

  it('allows going back from summary to form', () => {
    const { store } = renderCheckoutFlow({
      step: 3,
      product: mockProduct,
      customer: { email: 'test@test.com', fullName: 'Test' },
      delivery: { address: 'Test', city: 'Test', phone: '123' },
      cardForm: {
        number: '4242424242424242',
        expMonth: '12',
        expYear: '2030',
        cvc: '123',
        cardHolder: 'TEST',
      },
    });

    const backButton = screen.getByText(/Volver/);
    fireEvent.click(backButton);

    expect(store.getState().checkout.step).toBe(2);
  });
});

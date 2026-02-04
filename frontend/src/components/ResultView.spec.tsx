import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { ResultView } from './ResultView';
import checkoutReducer from '../store/slices/checkoutSlice';
import productsReducer from '../store/slices/productsSlice';

function renderWithStore(transactionStatus = 'APPROVED', transactionId = 42) {
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
        transactionId,
        transactionStatus,
        lastTransactionId: null,
        lastProductId: null,
        lastError: null,
      },
    },
  });
  const result = render(
    <Provider store={store}>
      <MemoryRouter>
        <ResultView />
      </MemoryRouter>
    </Provider>
  );
  return { ...result, store };
}

describe('ResultView', () => {
  it('shows Pago aprobado when status APPROVED', () => {
    renderWithStore('APPROVED');
    expect(screen.getByText(/Pago aprobado/)).toBeInTheDocument();
  });

  it('shows Pago rechazado when status DECLINED', () => {
    renderWithStore('DECLINED');
    expect(screen.getByText(/Pago rechazado/)).toBeInTheDocument();
  });

  it('shows transaction id', () => {
    renderWithStore('APPROVED', 99);
    expect(screen.getByText(/Transacción #99/)).toBeInTheDocument();
  });

  it('Volver a productos button dispatches finishCheckout', () => {
    const { store } = renderWithStore();
    fireEvent.click(screen.getByRole('button', { name: /Volver a productos/ }));
    expect(store.getState().checkout.step).toBe(1);
    expect(store.getState().checkout.transactionId).toBe(null);
  });
});

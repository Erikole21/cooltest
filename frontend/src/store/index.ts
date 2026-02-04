import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import productsReducer from './slices/productsSlice';
import checkoutReducer from './slices/checkoutSlice';

const CHECKOUT_KEY = 'cooltest_checkout';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    checkout: checkoutReducer,
  },
});

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify({ checkout: state.checkout }));
  } catch {
    // ignore
  }
});

export function loadCheckoutFromStorage(): unknown {
  try {
    const raw = localStorage.getItem(CHECKOUT_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'checkout' in parsed) {
      return (parsed as { checkout: unknown }).checkout;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchProducts,
  setHighlightedProductId,
  refreshProduct,
} from '../store/slices/productsSlice';
import { ProductCard } from '../components/ProductCard';
import {
  clearLastTracking,
  setTransactionStatus,
  startCheckout,
} from '../store/slices/checkoutSlice';
import { CheckoutFlow } from '../components/CheckoutFlow';
import { useTransactionUpdate } from '../hooks/useSocket';
import type { Product } from '../types';

const TERMINAL_STATUSES = new Set(['APPROVED', 'DECLINED', 'ERROR', 'VOIDED']);

export function ProductsPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, highlightedProductId } = useAppSelector(
    (s) => s.products
  );
  const { lastTransactionId, lastProductId } = useAppSelector((s) => s.checkout);

  useTransactionUpdate(lastTransactionId, (event) => {
    dispatch(setTransactionStatus(event.status));
    if (lastProductId != null && TERMINAL_STATUSES.has(event.status)) {
      void dispatch(refreshProduct(lastProductId));
      dispatch(setHighlightedProductId(lastProductId));
      dispatch(clearLastTracking());
    }
  });

  useEffect(() => {
    void dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (highlightedProductId == null) return;
    const t = window.setTimeout(() => {
      dispatch(setHighlightedProductId(null));
    }, 1800);
    return () => window.clearTimeout(t);
  }, [highlightedProductId, dispatch]);

  const handlePay = useCallback(
    (product: Product, quantity: number) => {
      dispatch(startCheckout({ product, quantity }));
    },
    [dispatch]
  );

  if (loading && items.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void dispatch(fetchProducts())}
          className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">
        Productos disponibles
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPay={handlePay}
            highlight={highlightedProductId === product.id}
          />
        ))}
      </div>
      <CheckoutFlow presentation="modal" />
      {items.length === 0 && !loading && (
        <p className="text-center text-slate-500">No hay productos.</p>
      )}
    </div>
  );
}

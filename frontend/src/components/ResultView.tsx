import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { finishCheckout } from '../store/slices/checkoutSlice';
import {
  refreshProduct,
  setHighlightedProductId,
} from '../store/slices/productsSlice';

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Pago aprobado',
  PENDING: 'Procesando…',
  DECLINED: 'Pago rechazado',
  ERROR: 'Error en el pago',
  VOIDED: 'Transacción anulada',
};

export function ResultView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((s) => s.checkout.transactionStatus);
  const transactionId = useAppSelector((s) => s.checkout.transactionId);
  const productId = useAppSelector((s) => s.checkout.product?.id ?? null);

  const isSuccess = status === 'APPROVED';
  const isPending = status === 'PENDING';

  const didRefreshProductsRef = useRef(false);
  useEffect(() => {
    if (!isSuccess) return;
    if (didRefreshProductsRef.current) return;
    if (productId == null) return;
    didRefreshProductsRef.current = true;
    void dispatch(refreshProduct(productId));
    dispatch(setHighlightedProductId(productId));
  }, [isSuccess, productId, dispatch]);

  const handleBackToProducts = () => {
    const pid = productId;
    dispatch(finishCheckout());
    if (pid != null) {
      void dispatch(refreshProduct(pid));
      dispatch(setHighlightedProductId(pid));
    }
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-lg">
      {isPending && (
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        </div>
      )}
      {!isPending && (
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}
        >
          {isSuccess ? (
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-800">
        {STATUS_LABELS[status ?? 'PENDING'] ?? status ?? 'Procesando…'}
      </h2>
      {transactionId != null && (
        <p className="mt-2 text-sm text-slate-500">
          Transacción #{transactionId}
        </p>
      )}
      <button
        type="button"
        onClick={handleBackToProducts}
        className="mt-6 w-full rounded-lg bg-slate-800 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        Volver a productos
      </button>
    </div>
  );
}

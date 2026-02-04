import { useEffect, useRef, useState } from 'react';
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
  const product = useAppSelector((s) => s.checkout.product);
  const quantity = useAppSelector((s) => s.checkout.quantity);
  const customer = useAppSelector((s) => s.checkout.customer);
  const delivery = useAppSelector((s) => s.checkout.delivery);

  const isSuccess = status === 'APPROVED';
  const isPending = status === 'PENDING';

  const [copied, setCopied] = useState(false);

  const paymentReference = transactionId ? `TXN-${transactionId}` : '';

  const handleCopyReference = async () => {
    if (!paymentReference) return;
    try {
      await navigator.clipboard.writeText(paymentReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
      {/* Status Icon and Title */}
      <div className="text-center">
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
      </div>

      {/* Payment Reference */}
      {isSuccess && paymentReference && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Referencia de Pago
              </p>
              <p className="mt-1 text-lg font-mono font-semibold text-slate-900">
                {paymentReference}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyReference}
              className="ml-4 flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              {copied ? (
                <>
                  <svg
                    className="h-4 w-4"
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
                  Copiado
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Product Details */}
      {isSuccess && product && (
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Detalle del Producto
          </h3>
          <div className="flex gap-4">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-slate-900">{product.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                Cantidad: {quantity} unidad{quantity > 1 ? 'es' : ''}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatCurrency(product.price * quantity)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Information */}
      {isSuccess && customer && delivery && (
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Información de Entrega
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nombre:</span>
              <span className="font-medium text-slate-900">{customer.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-900">{customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teléfono:</span>
              <span className="font-medium text-slate-900">{delivery.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Dirección:</span>
              <span className="font-medium text-slate-900 text-right">{delivery.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ciudad:</span>
              <span className="font-medium text-slate-900">{delivery.city}</span>
            </div>
          </div>
        </div>
      )}

      {/* Back Button - solo cuando el pago tiene estado final (no PENDING) */}
      {!isPending && (
        <button
          type="button"
          onClick={handleBackToProducts}
          className="mt-6 w-full rounded-lg bg-slate-800 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Volver a productos
        </button>
      )}
    </div>
  );
}

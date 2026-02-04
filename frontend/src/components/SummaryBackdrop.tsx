import type { Product } from '../types';

interface SummaryBackdropProps {
  product: Product;
  quantity: number;
  baseFeeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  onPay: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function SummaryBackdrop({
  product,
  quantity,
  baseFeeCents,
  deliveryFeeCents,
  totalCents,
  onPay,
  onBack,
  loading = false,
  error = null,
}: SummaryBackdropProps) {
  const productAmount = product.price * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
    >
    <div
      id="summary-title"
      className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
    >
      {onBack && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="text-sm text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ← Volver a datos
          </button>
        </div>
      )}
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Resumen del pago
      </h2>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-slate-600">
            {product.name} × {quantity}
          </span>
          <span className="font-medium text-slate-800">
            {formatPrice(productAmount)}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-600">Cargo base</span>
          <span className="font-medium text-slate-800">
            {formatPrice(baseFeeCents)}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-slate-600">Envío</span>
          <span className="font-medium text-slate-800">
            {formatPrice(deliveryFeeCents)}
          </span>
        </li>
      </ul>
      <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-semibold">
        <span>Total</span>
        <span className="text-emerald-700">{formatPrice(totalCents)}</span>
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onPay}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {loading ? 'Procesando pago…' : 'Pagar'}
      </button>
    </div>
    </div>
  );
}

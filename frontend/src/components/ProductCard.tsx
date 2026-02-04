import { useState } from 'react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPay: (product: Product, quantity: number) => void;
  highlight?: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProductCard({ product, onPay, highlight = false }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const canBuy = product.stockQuantity > 0;

  const handlePay = () => {
    if (!canBuy || quantity < 1 || quantity > product.stockQuantity) return;
    onPay(product, Math.min(quantity, product.stockQuantity));
  };

  return (
    <article
      className={[
        'flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md',
        highlight
          ? 'border-emerald-300 ring-2 ring-emerald-200 animate-pulse'
          : 'border-slate-200',
      ].join(' ')}
    >
      <div className="aspect-square bg-slate-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            Sin imagen
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-semibold text-slate-800">{product.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">
          {product.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="text-lg font-semibold text-slate-900">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-slate-500">
            Stock: {product.stockQuantity}
          </span>
        </div>
        {canBuy && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={product.stockQuantity}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(product.stockQuantity, parseInt(e.target.value, 10) || 1)
                  )
                )
              }
              className="w-16 rounded border border-slate-300 px-2 py-1.5 text-center text-sm"
            />
            <button
              type="button"
              onClick={handlePay}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Pagar con tarjeta
            </button>
          </div>
        )}
        {!canBuy && (
          <p className="mt-3 text-sm text-slate-500">Sin stock disponible</p>
        )}
      </div>
    </article>
  );
}

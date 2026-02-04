import { useCallback } from 'react';
import type { CardForm, CustomerForm, DeliveryForm } from '../types';
import type { CardBrand } from '../types';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpMonth,
  formatExpYear,
  formatCvc,
} from '../utils/validation';

interface CardDeliveryFormProps {
  customer: CustomerForm;
  delivery: DeliveryForm;
  cardForm: CardForm;
  onCustomerChange: (c: CustomerForm) => void;
  onDeliveryChange: (d: DeliveryForm) => void;
  onCardFormChange: (c: CardForm) => void;
  onSubmit: () => void;
  error: string | null;
  loading?: boolean;
}

export function CardDeliveryForm({
  customer,
  delivery,
  cardForm,
  onCustomerChange,
  onDeliveryChange,
  onCardFormChange,
  onSubmit,
  error,
  loading = false,
}: CardDeliveryFormProps) {
  const cardBrand: CardBrand = detectCardBrand(cardForm.number);

  const handleCardNumber = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCardNumber(e.target.value);
      onCardFormChange({ ...cardForm, number: formatted });
    },
    [cardForm, onCardFormChange]
  );

  const handleExpMonth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCardFormChange({
        ...cardForm,
        expMonth: formatExpMonth(e.target.value),
      });
    },
    [cardForm, onCardFormChange]
  );

  const handleExpYear = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCardFormChange({
        ...cardForm,
        expYear: formatExpYear(e.target.value),
      });
    },
    [cardForm, onCardFormChange]
  );

  const handleCvc = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onCardFormChange({ ...cardForm, cvc: formatCvc(e.target.value) });
    },
    [cardForm, onCardFormChange]
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Datos del comprador
        </h3>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={customer.email}
            onChange={(e) =>
              onCustomerChange({ ...customer, email: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={customer.fullName}
            onChange={(e) =>
              onCustomerChange({ ...customer, fullName: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Dirección de entrega
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Dirección"
            value={delivery.address}
            onChange={(e) =>
              onDeliveryChange({ ...delivery, address: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
          <input
            type="text"
            placeholder="Ciudad"
            value={delivery.city}
            onChange={(e) =>
              onDeliveryChange({ ...delivery, city: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={delivery.phone}
            onChange={(e) =>
              onDeliveryChange({ ...delivery, phone: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          Tarjeta de crédito (datos de prueba)
        </h3>
        <div className="flex items-center gap-2 pb-2">
          {cardBrand && (
            <span className="inline-flex h-8 items-center rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600">
              {cardBrand === 'visa' ? 'VISA' : 'Mastercard'}
            </span>
          )}
        </div>
        <div className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="Número (ej: 4242 4242 4242 4242)"
            value={cardForm.number}
            onChange={handleCardNumber}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            maxLength={19}
          />
          <input
            type="text"
            placeholder="Titular de la tarjeta"
            value={cardForm.cardHolder}
            onChange={(e) =>
              onCardFormChange({ ...cardForm, cardHolder: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM"
              value={cardForm.expMonth}
              onChange={handleExpMonth}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={2}
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="AAAA"
              value={cardForm.expYear}
              onChange={handleExpYear}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={4}
            />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVC"
              value={cardForm.cvc}
              onChange={handleCvc}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              maxLength={4}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {loading ? 'Verificando…' : 'Continuar al resumen'}
      </button>
    </form>
  );
}

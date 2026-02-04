import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  finishCheckout,
  goToSummary,
  setCardForm,
  setCheckoutError,
  setCheckoutResult,
  setCustomer,
  setDelivery,
  setStep,
  setTransactionStatus,
} from '../store/slices/checkoutSlice';
import { CardDeliveryForm } from './CardDeliveryForm';
import { SummaryBackdrop } from './SummaryBackdrop';
import { ResultView } from './ResultView';
import { useTransactionUpdate } from '../hooks/useSocket';
import {
  validateCardForm,
  validateCustomerForm,
  validateDeliveryForm,
} from '../utils/validation';
import { getWompiAcceptanceTokens, tokenizeCard } from '../api/wompi';
import { api } from '../api/client';

type Presentation = 'modal' | 'page';

const BASE_FEE_CENTS = parseInt(import.meta.env.VITE_BASE_FEE_CENTS ?? '0', 10);
const DELIVERY_FEE_CENTS = parseInt(
  import.meta.env.VITE_DELIVERY_FEE_CENTS ?? '0',
  10
);

function normalizeCheckoutError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Error al procesar el pago';
  // Mensajes más útiles para el usuario final (sin filtrar detalles sensibles)
  if ((/signature/i.test(raw) || /firma/i.test(raw)) && /inv[aá]lid/i.test(raw)) {
    return 'No se pudo validar la firma del pago. Intenta nuevamente en unos segundos.';
  }
  if (/acceptance_token|presigned/i.test(raw)) {
    return 'No se pudo iniciar el pago (términos de Wompi). Intenta nuevamente.';
  }
  if (/token/i.test(raw) && /tarjeta|card/i.test(raw)) {
    return 'No se pudo tokenizar la tarjeta. Revisa los datos e intenta de nuevo.';
  }
  return raw;
}

export function CheckoutFlow({ presentation }: { presentation: Presentation }) {
  const dispatch = useAppDispatch();
  const checkout = useAppSelector((s) => s.checkout);
  const [paying, setPaying] = useState(false);

  const { step, product, quantity, customer, delivery, cardForm } = checkout;
  const transactionId = checkout.transactionId;

  useTransactionUpdate(transactionId ?? null, (event) => {
    dispatch(setTransactionStatus(event.status));
  });

  const handleContinueToSummary = useCallback(() => {
    if (!customer || !delivery || !cardForm) return;
    const customerErr = validateCustomerForm(customer);
    if (customerErr) return void dispatch(setCheckoutError(customerErr));
    const deliveryErr = validateDeliveryForm(delivery);
    if (deliveryErr) return void dispatch(setCheckoutError(deliveryErr));
    const cardErr = validateCardForm(cardForm);
    if (cardErr) return void dispatch(setCheckoutError(cardErr));
    dispatch(setCheckoutError(null));
    dispatch(goToSummary());
  }, [customer, delivery, cardForm, dispatch]);

  const handlePay = useCallback(async () => {
    if (!product || !customer || !delivery || !cardForm) return;
    setPaying(true);
    dispatch(setCheckoutError(null));
    try {
      const [acceptance, paymentToken] = await Promise.all([
        getWompiAcceptanceTokens(),
        tokenizeCard({
          number: cardForm.number.replace(/\s/g, ''),
          exp_month: cardForm.expMonth.padStart(2, '0'),
          exp_year: cardForm.expYear,
          cvc: cardForm.cvc,
          card_holder: cardForm.cardHolder,
        }),
      ]);

      const res = await api.checkout({
        productId: product.id,
        quantity,
        paymentToken,
        installments: 1,
        acceptanceToken: acceptance.acceptanceToken,
        acceptPersonalAuth: acceptance.acceptPersonalAuth,
        customer: { email: customer.email, fullName: customer.fullName },
        delivery: {
          address: delivery.address,
          city: delivery.city,
          phone: delivery.phone,
        },
      });

      dispatch(
        setCheckoutResult({ transactionId: res.transactionId, status: res.status })
      );
    } catch (e) {
      dispatch(setCheckoutError(normalizeCheckoutError(e)));
    } finally {
      setPaying(false);
    }
  }, [product, quantity, customer, delivery, cardForm, dispatch]);

  // Resultado debe poder mostrarse incluso tras refresh parcial.
  // En modo modal, mantenemos el overlay para que sea visible (si no, queda al final de la lista de productos).
  if (step === 4) {
    if (presentation === 'page') return <ResultView />;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Resultado del pago"
      >
        <div className="max-h-[90vh] w-full max-w-md overflow-auto">
          <ResultView />
        </div>
      </div>
    );
  }

  // Nada que mostrar si no hay un checkout activo.
  if (step === 1 || !product) return null;

  if (step === 3) {
    return (
      <SummaryBackdrop
        product={product}
        quantity={quantity}
        customer={customer}
        delivery={delivery}
        baseFeeCents={BASE_FEE_CENTS}
        deliveryFeeCents={DELIVERY_FEE_CENTS}
        totalCents={product.price * quantity + BASE_FEE_CENTS + DELIVERY_FEE_CENTS}
        onPay={handlePay}
        onBack={() => dispatch(setStep(2))}
        loading={paying}
        error={checkout.lastError}
      />
    );
  }

  // step === 2
  const content = (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-4 flex items-center justify-between gap-2 text-sm text-slate-600">
        <button
          type="button"
          onClick={() => dispatch(finishCheckout())}
          className="hover:text-slate-800"
        >
          ← Volver a productos
        </button>
        {presentation === 'modal' && (
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => dispatch(finishCheckout())}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </div>
      <h2 className="mb-6 text-xl font-bold text-slate-800">
        Datos de pago y entrega
      </h2>
      <CardDeliveryForm
        customer={customer ?? { email: '', fullName: '' }}
        delivery={delivery ?? { address: '', city: '', phone: '' }}
        cardForm={
          cardForm ?? {
            number: '',
            expMonth: '',
            expYear: '',
            cvc: '',
            cardHolder: '',
          }
        }
        onCustomerChange={(c) => dispatch(setCustomer(c))}
        onDeliveryChange={(d) => dispatch(setDelivery(d))}
        onCardFormChange={(c) => dispatch(setCardForm(c))}
        onSubmit={handleContinueToSummary}
        error={checkout.lastError}
        loading={false}
      />
    </div>
  );

  if (presentation === 'page') {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="sr-only" id="checkout-modal-title">
          Datos de pago y entrega
        </div>
        {content}
      </div>
    </div>
  );
}


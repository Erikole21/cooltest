import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { CheckoutFlow } from '../components/CheckoutFlow';

export function CheckoutPage() {
  const navigate = useNavigate();
  const checkout = useAppSelector((s) => s.checkout);
  const { step, product } = checkout;

  useEffect(() => {
    if (step === 1 && !product) {
      navigate('/', { replace: true });
    }
  }, [step, product, navigate]);

  return (
    <div className="mx-auto max-w-md">
      <CheckoutFlow presentation="page" />
    </div>
  );
}

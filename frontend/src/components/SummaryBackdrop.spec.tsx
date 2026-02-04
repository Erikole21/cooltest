import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryBackdrop } from './SummaryBackdrop';

const mockProduct = {
  id: 1,
  name: 'Product',
  description: 'Desc',
  price: 10000,
  stockQuantity: 10,
  imageUrl: null,
  createdAt: '',
  updatedAt: '',
};

describe('SummaryBackdrop', () => {
  it('renders product name and total', () => {
    const onPay = () => {};
    render(
      <SummaryBackdrop
        product={mockProduct}
        quantity={2}
        baseFeeCents={0}
        deliveryFeeCents={0}
        totalCents={20000}
        onPay={onPay}
      />
    );
    expect(screen.getByText(/Resumen del pago/)).toBeInTheDocument();
    expect(screen.getByText(/Product × 2/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar/ })).toBeInTheDocument();
  });

  it('calls onPay when Pay button clicked', () => {
    const onPay = vi.fn();
    render(
      <SummaryBackdrop
        product={mockProduct}
        quantity={1}
        baseFeeCents={0}
        deliveryFeeCents={0}
        totalCents={10000}
        onPay={onPay}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Pagar/ }));
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it('renders Volver a datos when onBack provided', () => {
    const onBack = () => {};
    render(
      <SummaryBackdrop
        product={mockProduct}
        quantity={1}
        baseFeeCents={0}
        deliveryFeeCents={0}
        totalCents={10000}
        onPay={() => {}}
        onBack={onBack}
      />
    );
    expect(screen.getByText(/Volver a datos/)).toBeInTheDocument();
  });
});

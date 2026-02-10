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

const mockCustomer = { email: 'test@test.com', fullName: 'Test User' };
const mockDelivery = { address: 'Calle 1', city: 'Bogota', phone: '3001234567' };

describe('SummaryBackdrop', () => {
  it('renders product name and total', () => {
    const onPay = () => {};
    render(
      <SummaryBackdrop
        product={mockProduct}
        quantity={2}
        customer={mockCustomer}
        delivery={mockDelivery}
        baseFeeCents={0}
        deliveryFeeCents={0}
        vatFeeCents={3800}
        totalCents={23800}
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
        vatFeeCents={1900}
        totalCents={11900}
        onPay={onPay}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Pagar/ }));
    expect(onPay).toHaveBeenCalledTimes(1);
  });

  it('renders customer name and phone in summary', () => {
    render(
      <SummaryBackdrop
        product={mockProduct}
        quantity={1}
        customer={mockCustomer}
        delivery={mockDelivery}
        baseFeeCents={0}
        deliveryFeeCents={0}
        vatFeeCents={1900}
        totalCents={11900}
        onPay={() => {}}
      />
    );
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
  });

  it('renders Volver a datos when onBack provided', () => {
    const onBack = () => {};
    render(
      <SummaryBackdrop
        product={mockProduct}
        quantity={1}
        customer={mockCustomer}
        delivery={mockDelivery}
        baseFeeCents={0}
        deliveryFeeCents={0}
        vatFeeCents={1900}
        totalCents={11900}
        onPay={() => {}}
        onBack={onBack}
      />
    );
    expect(screen.getByText(/Volver a datos/)).toBeInTheDocument();
  });
});

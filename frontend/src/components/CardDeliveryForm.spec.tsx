import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardDeliveryForm } from './CardDeliveryForm';

const defaultProps = {
  customer: { email: '', fullName: '' },
  delivery: { address: '', city: '', phone: '' },
  cardForm: {
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    cardHolder: '',
  },
  onCustomerChange: vi.fn(),
  onDeliveryChange: vi.fn(),
  onCardFormChange: vi.fn(),
  onSubmit: vi.fn(),
  error: null,
};

describe('CardDeliveryForm', () => {
  it('renders customer, delivery and card sections', () => {
    render(<CardDeliveryForm {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Email/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Nombre completo/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Dirección/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ciudad/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Teléfono/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Número/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar al resumen/ })).toBeInTheDocument();
  });

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        customer={{ email: 'a@b.co', fullName: 'Test' }}
        delivery={{ address: 'Calle', city: 'Bogota', phone: '123' }}
        cardForm={{
          number: '4242 4242 4242 4242',
          expMonth: '12',
          expYear: '30',
          cvc: '123',
          cardHolder: 'Test',
        }}
        onSubmit={onSubmit}
      />
    );
    fireEvent.submit(screen.getByRole('button', { name: /Continuar al resumen/ }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows error when error prop set', () => {
    render(<CardDeliveryForm {...defaultProps} error="Invalid card" />);
    expect(screen.getByText('Invalid card')).toBeInTheDocument();
  });

  it('calls onCustomerChange when email changes', async () => {
    const onCustomerChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        customer={{ email: '', fullName: '' }}
        onCustomerChange={onCustomerChange}
      />
    );
    const emailInput = screen.getByPlaceholderText(/Email/);
    fireEvent.change(emailInput, { target: { value: 'a@b.co' } });
    expect(onCustomerChange).toHaveBeenCalledWith({
      email: 'a@b.co',
      fullName: '',
    });
  });

  it('calls onCardFormChange when card number changes', async () => {
    const onCardFormChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        cardForm={{
          number: '',
          expMonth: '',
          expYear: '',
          cvc: '',
          cardHolder: '',
        }}
        onCardFormChange={onCardFormChange}
      />
    );
    const numberInput = screen.getByPlaceholderText(/Número/);
    fireEvent.change(numberInput, { target: { value: '4242' } });
    expect(onCardFormChange).toHaveBeenCalled();
    expect(onCardFormChange.mock.calls[0][0].number).toBe('4242');
  });
});

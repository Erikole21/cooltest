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

  it('calls onCustomerChange when fullName changes', async () => {
    const onCustomerChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        customer={{ email: 'a@b.co', fullName: '' }}
        onCustomerChange={onCustomerChange}
      />
    );
    const nameInput = screen.getByPlaceholderText(/Nombre completo/);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    expect(onCustomerChange).toHaveBeenCalledWith({
      email: 'a@b.co',
      fullName: 'John Doe',
    });
  });

  it('calls onDeliveryChange when address changes', async () => {
    const onDeliveryChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        delivery={{ address: '', city: '', phone: '' }}
        onDeliveryChange={onDeliveryChange}
      />
    );
    const addressInput = screen.getByPlaceholderText(/Dirección/);
    fireEvent.change(addressInput, { target: { value: 'Calle 123' } });
    expect(onDeliveryChange).toHaveBeenCalledWith({
      address: 'Calle 123',
      city: '',
      phone: '',
    });
  });

  it('calls onDeliveryChange when city changes', async () => {
    const onDeliveryChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        delivery={{ address: 'Calle', city: '', phone: '' }}
        onDeliveryChange={onDeliveryChange}
      />
    );
    const cityInput = screen.getByPlaceholderText(/Ciudad/);
    fireEvent.change(cityInput, { target: { value: 'Bogotá' } });
    expect(onDeliveryChange).toHaveBeenCalledWith({
      address: 'Calle',
      city: 'Bogotá',
      phone: '',
    });
  });

  it('calls onDeliveryChange when phone changes', async () => {
    const onDeliveryChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        delivery={{ address: 'Calle', city: 'Bogotá', phone: '' }}
        onDeliveryChange={onDeliveryChange}
      />
    );
    const phoneInput = screen.getByPlaceholderText(/Teléfono/);
    fireEvent.change(phoneInput, { target: { value: '3001234567' } });
    expect(onDeliveryChange).toHaveBeenCalledWith({
      address: 'Calle',
      city: 'Bogotá',
      phone: '3001234567',
    });
  });

  it('calls onCardFormChange when expMonth changes', async () => {
    const onCardFormChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        cardForm={{
          number: '4242',
          expMonth: '',
          expYear: '',
          cvc: '',
          cardHolder: '',
        }}
        onCardFormChange={onCardFormChange}
      />
    );
    const monthInput = screen.getByPlaceholderText(/MM/);
    fireEvent.change(monthInput, { target: { value: '12' } });
    expect(onCardFormChange).toHaveBeenCalled();
    expect(onCardFormChange.mock.calls[0][0].expMonth).toBe('12');
  });

  it('calls onCardFormChange when expYear changes', async () => {
    const onCardFormChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        cardForm={{
          number: '4242',
          expMonth: '12',
          expYear: '',
          cvc: '',
          cardHolder: '',
        }}
        onCardFormChange={onCardFormChange}
      />
    );
    const yearInput = screen.getByPlaceholderText(/AAAA/);
    fireEvent.change(yearInput, { target: { value: '2030' } });
    expect(onCardFormChange).toHaveBeenCalled();
    expect(onCardFormChange.mock.calls[0][0].expYear).toBe('2030');
  });

  it('calls onCardFormChange when cvc changes', async () => {
    const onCardFormChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        cardForm={{
          number: '4242',
          expMonth: '12',
          expYear: '2030',
          cvc: '',
          cardHolder: '',
        }}
        onCardFormChange={onCardFormChange}
      />
    );
    const cvcInput = screen.getByPlaceholderText(/CVC/);
    fireEvent.change(cvcInput, { target: { value: '123' } });
    expect(onCardFormChange).toHaveBeenCalled();
    expect(onCardFormChange.mock.calls[0][0].cvc).toBe('123');
  });

  it('calls onCardFormChange when cardHolder changes', async () => {
    const onCardFormChange = vi.fn();
    render(
      <CardDeliveryForm
        {...defaultProps}
        cardForm={{
          number: '4242',
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardHolder: '',
        }}
        onCardFormChange={onCardFormChange}
      />
    );
    const holderInput = screen.getByPlaceholderText(/Titular de la tarjeta/);
    fireEvent.change(holderInput, { target: { value: 'JOHN DOE' } });
    expect(onCardFormChange).toHaveBeenCalledWith({
      number: '4242',
      expMonth: '12',
      expYear: '2030',
      cvc: '123',
      cardHolder: 'JOHN DOE',
    });
  });

  it('disables submit button when loading', () => {
    render(<CardDeliveryForm {...defaultProps} loading={true} />);
    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('shows loading text when loading', () => {
    render(<CardDeliveryForm {...defaultProps} loading={true} />);
    const submitButton = screen.getByRole('button');
    expect(submitButton.textContent).toContain('Verificando');
  });
});

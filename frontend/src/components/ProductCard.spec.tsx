import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: 1,
  name: 'Test Product',
  description: 'Test description',
  price: 10000,
  stockQuantity: 5,
  imageUrl: null,
  createdAt: '',
  updatedAt: '',
};

function renderCard(product = mockProduct, onPay = vi.fn()) {
  const result = render(<ProductCard product={product} onPay={onPay} />);
  return { ...result, onPay };
}

describe('ProductCard', () => {
  it('renders product name and price', () => {
    renderCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/Stock: 5/)).toBeInTheDocument();
  });

  it('renders Pay button when in stock', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /Pagar con tarjeta/i })).toBeInTheDocument();
  });

  it('shows Sin stock when stock is 0', () => {
    renderCard({ ...mockProduct, stockQuantity: 0 });
    expect(screen.getByText(/Sin stock disponible/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pagar con tarjeta/i })).not.toBeInTheDocument();
  });

  it('calls onPay with product and quantity when Pay clicked', () => {
    const { onPay } = renderCard();
    const button = screen.getByRole('button', { name: /Pagar con tarjeta/i });
    fireEvent.click(button);
    expect(onPay).toHaveBeenCalledTimes(1);
    expect(onPay).toHaveBeenCalledWith(mockProduct, 1);
  });
});

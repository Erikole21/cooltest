export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
}

export interface CustomerForm {
  email: string;
  fullName: string;
}

export interface DeliveryForm {
  address: string;
  city: string;
  phone: string;
}

export interface CardForm {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  cardHolder: string;
}

export type CardBrand = 'visa' | 'mastercard' | null;

export interface CheckoutPayload {
  productId: number;
  quantity: number;
  paymentToken: string;
  installments?: number;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  customer: CustomerForm;
  delivery: DeliveryForm;
}

export interface CheckoutResponse {
  transactionId: number;
  status: string;
  vatFee: number;
  total: number;
}

export type CheckoutStep = 1 | 2 | 3 | 4 | 5;

export interface TransactionUpdateEvent {
  transactionId: number;
  status: string;
  timestamp: string;
}

export const CHECKOUT_STEP_LABELS: Record<CheckoutStep, string> = {
  1: 'Producto',
  2: 'Tarjeta y entrega',
  3: 'Resumen',
  4: 'Resultado',
  5: 'Producto',
};

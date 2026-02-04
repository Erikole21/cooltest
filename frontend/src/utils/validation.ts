import type { CardForm, CustomerForm, DeliveryForm } from '../types';
import type { CardBrand } from '../types';

export function detectCardBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(n))
    return 'mastercard';
  return null;
}

export function validateCardNumber(value: string): boolean {
  const n = value.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(n)) return false;
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let digit = parseInt(n[i], 10);
    if (alt) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function validateExpiry(month: string, year: string): boolean {
  const m = parseInt(month, 10);
  const y = parseInt(year.length === 2 ? `20${year}` : year, 10);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const exp = new Date(y, m - 1);
  return exp >= now;
}

export function validateCvc(value: string): boolean {
  return /^\d{3,4}$/.test(value.trim());
}

export function validateCardForm(form: CardForm): string | null {
  if (!form.cardHolder?.trim()) return 'Nombre del titular es requerido';
  if (!validateCardNumber(form.number))
    return 'Número de tarjeta inválido';
  if (!validateExpiry(form.expMonth, form.expYear))
    return 'Fecha de vencimiento inválida';
  if (!validateCvc(form.cvc)) return 'CVC inválido';
  return null;
}

export function validateCustomerForm(form: CustomerForm): string | null {
  if (!form.email?.trim()) return 'Email es requerido';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return 'Email inválido';
  if (!form.fullName?.trim()) return 'Nombre completo es requerido';
  return null;
}

export function validateDeliveryForm(form: DeliveryForm): string | null {
  if (!form.address?.trim()) return 'Dirección es requerida';
  if (!form.city?.trim()) return 'Ciudad es requerida';
  if (!form.phone?.trim()) return 'Teléfono es requerido';
  return null;
}

export function formatCardNumber(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 19);
  const groups = n.match(/.{1,4}/g) ?? [];
  return groups.join(' ').trim();
}

export function formatExpMonth(value: string): string {
  const n = value.replace(/\D/g, '').slice(0, 2);
  if (n.length <= 1) return n;
  const num = parseInt(n, 10);
  if (num <= 0) return '01';
  if (num > 12) return '12';
  return n;
}

export function formatExpYear(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function formatCvc(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

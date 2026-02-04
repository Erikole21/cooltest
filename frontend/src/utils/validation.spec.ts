import {
  detectCardBrand,
  validateCardNumber,
  validateExpiry,
  validateCvc,
  validateCardForm,
  validateCustomerForm,
  validateDeliveryForm,
  formatCardNumber,
  formatExpMonth,
  formatExpYear,
  formatCvc,
} from './validation';

describe('validation', () => {
  describe('detectCardBrand', () => {
    it('detects VISA for numbers starting with 4', () => {
      expect(detectCardBrand('4242 4242 4242 4242')).toBe('visa');
      expect(detectCardBrand('4111111111111111')).toBe('visa');
    });
    it('detects Mastercard for 51-55', () => {
      expect(detectCardBrand('5555 5555 5555 4444')).toBe('mastercard');
      expect(detectCardBrand('5105105105105100')).toBe('mastercard');
    });
    it('returns null for unknown brand', () => {
      expect(detectCardBrand('1234 5678')).toBe(null);
    });
  });

  describe('validateCardNumber', () => {
    it('accepts valid Luhn number', () => {
      expect(validateCardNumber('4242424242424242')).toBe(true);
    });
    it('rejects invalid Luhn', () => {
      expect(validateCardNumber('4242424242424241')).toBe(false);
    });
    it('rejects too short', () => {
      expect(validateCardNumber('123456789012')).toBe(false);
    });
  });

  describe('validateExpiry', () => {
    it('accepts future date', () => {
      expect(validateExpiry('12', '30')).toBe(true);
    });
    it('rejects past date', () => {
      expect(validateExpiry('01', '20')).toBe(false);
    });
    it('rejects invalid month', () => {
      expect(validateExpiry('13', '30')).toBe(false);
    });
  });

  describe('validateCvc', () => {
    it('accepts 3 digits', () => {
      expect(validateCvc('123')).toBe(true);
    });
    it('accepts 4 digits', () => {
      expect(validateCvc('1234')).toBe(true);
    });
    it('rejects 2 digits', () => {
      expect(validateCvc('12')).toBe(false);
    });
  });

  describe('validateCardForm', () => {
    it('returns error when cardHolder empty', () => {
      expect(
        validateCardForm({
          number: '4242424242424242',
          expMonth: '12',
          expYear: '30',
          cvc: '123',
          cardHolder: '',
        })
      ).toBe('Nombre del titular es requerido');
    });
    it('returns error when card invalid', () => {
      expect(
        validateCardForm({
          number: '4242424242424241',
          expMonth: '12',
          expYear: '30',
          cvc: '123',
          cardHolder: 'Test',
        })
      ).toBeTruthy();
    });
    it('returns null when valid', () => {
      expect(
        validateCardForm({
          number: '4242424242424242',
          expMonth: '12',
          expYear: '30',
          cvc: '123',
          cardHolder: 'Test User',
        })
      ).toBe(null);
    });
  });

  describe('validateCustomerForm', () => {
    it('returns error when email empty', () => {
      expect(validateCustomerForm({ email: '', fullName: 'Test' })).toBe(
        'Email es requerido'
      );
    });
    it('returns error when email invalid', () => {
      expect(
        validateCustomerForm({ email: 'bad', fullName: 'Test' })
      ).toBe('Email inválido');
    });
    it('returns null when valid', () => {
      expect(
        validateCustomerForm({ email: 'a@b.co', fullName: 'Test' })
      ).toBe(null);
    });
  });

  describe('validateDeliveryForm', () => {
    it('returns error when address empty', () => {
      expect(
        validateDeliveryForm({ address: '', city: 'Bogota', phone: '123' })
      ).toBe('Dirección es requerida');
    });
    it('returns null when valid', () => {
      expect(
        validateDeliveryForm({
          address: 'Calle 1',
          city: 'Bogota',
          phone: '3001234567',
        })
      ).toBe(null);
    });
  });

  describe('formatters', () => {
    it('formatCardNumber adds spaces', () => {
      expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    });
    it('formatExpMonth caps at 12', () => {
      expect(formatExpMonth('15')).toBe('12');
    });
    it('formatExpYear strips non-digits', () => {
      expect(formatExpYear('2030')).toBe('2030');
    });
    it('formatCvc limits length', () => {
      expect(formatCvc('12345')).toBe('1234');
    });
  });
});

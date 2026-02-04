import checkoutReducer, {
  startCheckout,
  setStep,
  setCustomer,
  setDelivery,
  goToSummary,
  setCheckoutResult,
  setTransactionStatus,
  finishCheckout,
  resetCheckout,
  rehydrateCheckout,
} from './checkoutSlice';

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

describe('checkoutSlice', () => {
  const initialState = {
    step: 1,
    product: null,
    quantity: 1,
    customer: null,
    delivery: null,
    cardForm: null,
    transactionId: null,
    transactionStatus: null,
    lastTransactionId: null,
    lastProductId: null,
    lastError: null,
  };

  it('returns initial state', () => {
    expect(checkoutReducer(undefined, { type: 'unknown' })).toEqual(
      initialState
    );
  });

  it('startCheckout sets product, quantity and step 2', () => {
    const state = checkoutReducer(
      initialState,
      startCheckout({ product: mockProduct, quantity: 2 })
    );
    expect(state.step).toBe(2);
    expect(state.product).toEqual(mockProduct);
    expect(state.quantity).toBe(2);
    expect(state.customer).toEqual({ email: '', fullName: '' });
    expect(state.delivery).toEqual({ address: '', city: '', phone: '' });
  });

  it('setStep updates step', () => {
    const state = checkoutReducer(
      { ...initialState, step: 2 },
      setStep(3)
    );
    expect(state.step).toBe(3);
  });

  it('setCustomer updates customer', () => {
    const customer = { email: 'a@b.co', fullName: 'Test' };
    const state = checkoutReducer(initialState, setCustomer(customer));
    expect(state.customer).toEqual(customer);
  });

  it('setDelivery updates delivery', () => {
    const delivery = { address: 'Calle', city: 'Bogota', phone: '123' };
    const state = checkoutReducer(initialState, setDelivery(delivery));
    expect(state.delivery).toEqual(delivery);
  });

  it('goToSummary sets step 3', () => {
    const state = checkoutReducer(
      { ...initialState, step: 2 },
      goToSummary()
    );
    expect(state.step).toBe(3);
  });

  it('setCheckoutResult sets transaction and step 4', () => {
    const state = checkoutReducer(
      { ...initialState, step: 3 },
      setCheckoutResult({ transactionId: 42, status: 'APPROVED' })
    );
    expect(state.transactionId).toBe(42);
    expect(state.transactionStatus).toBe('APPROVED');
    expect(state.step).toBe(4);
  });

  it('setTransactionStatus updates status', () => {
    const state = checkoutReducer(
      { ...initialState, transactionStatus: 'PENDING' },
      setTransactionStatus('APPROVED')
    );
    expect(state.transactionStatus).toBe('APPROVED');
  });

  it('finishCheckout resets to step 1', () => {
    const state = checkoutReducer(
      {
        ...initialState,
        step: 4,
        product: mockProduct,
        transactionId: 1,
        lastTransactionId: 1,
        lastProductId: 1,
      },
      finishCheckout()
    );
    expect(state.step).toBe(1);
    expect(state.product).toBe(null);
    expect(state.transactionId).toBe(null);
  });

  it('resetCheckout returns initialState', () => {
    const state = checkoutReducer(
      { ...initialState, step: 3, product: mockProduct },
      resetCheckout()
    );
    expect(state).toEqual(initialState);
  });

  it('rehydrateCheckout merges partial state', () => {
    const state = checkoutReducer(
      initialState,
      rehydrateCheckout({ step: 2, product: mockProduct, quantity: 2 })
    );
    expect(state.step).toBe(2);
    expect(state.product).toEqual(mockProduct);
    expect(state.quantity).toBe(2);
  });
});

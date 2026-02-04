import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CheckoutStep,
  Product,
  CustomerForm,
  DeliveryForm,
  CardForm,
} from '../../types';

interface CheckoutState {
  step: CheckoutStep;
  product: Product | null;
  quantity: number;
  customer: CustomerForm | null;
  delivery: DeliveryForm | null;
  cardForm: CardForm | null;
  transactionId: number | null;
  transactionStatus: string | null;
  lastTransactionId: number | null;
  lastProductId: number | null;
  lastError: string | null;
}

const initialForm: CustomerForm = {
  email: '',
  fullName: '',
};

const initialDelivery: DeliveryForm = {
  address: '',
  city: '',
  phone: '',
};

const initialCard: CardForm = {
  number: '',
  expMonth: '',
  expYear: '',
  cvc: '',
  cardHolder: '',
};

const initialState: CheckoutState = {
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

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    startCheckout: (
      state,
      action: PayloadAction<{ product: Product; quantity: number }>
    ) => {
      state.step = 2;
      state.product = action.payload.product;
      state.quantity = action.payload.quantity;
      state.customer = state.customer ?? initialForm;
      state.delivery = state.delivery ?? initialDelivery;
      state.cardForm = state.cardForm ?? initialCard;
      state.transactionId = null;
      state.transactionStatus = null;
      state.lastError = null;
    },
    setStep: (state, action: PayloadAction<CheckoutStep>) => {
      state.step = action.payload;
    },
    setCustomer: (state, action: PayloadAction<CustomerForm>) => {
      state.customer = action.payload;
    },
    setDelivery: (state, action: PayloadAction<DeliveryForm>) => {
      state.delivery = action.payload;
    },
    setCardForm: (state, action: PayloadAction<CardForm>) => {
      state.cardForm = action.payload;
    },
    goToSummary: (state) => {
      state.step = 3;
      state.lastError = null;
    },
    setCheckoutResult: (
      state,
      action: PayloadAction<{
        transactionId: number;
        status: string;
      }>
    ) => {
      state.transactionId = action.payload.transactionId;
      state.transactionStatus = action.payload.status;
      state.lastTransactionId = action.payload.transactionId;
      state.lastProductId = state.product?.id ?? state.lastProductId;
      state.step = 4;
      state.lastError = null;
    },
    setTransactionStatus: (state, action: PayloadAction<string>) => {
      state.transactionStatus = action.payload;
    },
    setCheckoutError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
    },
    finishCheckout: (state) => {
      state.step = 1;
      state.product = null;
      state.quantity = 1;
      state.transactionId = null;
      state.transactionStatus = null;
      state.lastError = null;
    },
    clearLastTracking: (state) => {
      state.lastTransactionId = null;
      state.lastProductId = null;
    },
    resetCheckout: () => initialState,
    rehydrateCheckout: (
      state,
      action: PayloadAction<Partial<CheckoutState>>
    ) => {
      const payload = action.payload;
      if (payload.step != null) state.step = payload.step;
      if (payload.product != null) state.product = payload.product;
      if (payload.quantity != null) state.quantity = payload.quantity;
      if (payload.customer != null) state.customer = payload.customer;
      if (payload.delivery != null) state.delivery = payload.delivery;
      if (payload.cardForm != null) state.cardForm = payload.cardForm;
      if (payload.transactionId != null) state.transactionId = payload.transactionId;
      if (payload.transactionStatus != null)
        state.transactionStatus = payload.transactionStatus;
    },
  },
});

export const {
  startCheckout,
  setStep,
  setCustomer,
  setDelivery,
  setCardForm,
  goToSummary,
  setCheckoutResult,
  setTransactionStatus,
  setCheckoutError,
  finishCheckout,
  clearLastTracking,
  resetCheckout,
  rehydrateCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;

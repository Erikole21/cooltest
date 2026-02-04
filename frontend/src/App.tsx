import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store, loadCheckoutFromStorage } from './store';
import { rehydrateCheckout } from './store/slices/checkoutSlice';
import { Layout } from './components/Layout';
import { ProductsPage } from './pages/ProductsPage';
import { CheckoutPage } from './pages/CheckoutPage';

function Rehydrate() {
  const dispatch = useDispatch();
  useEffect(() => {
    const saved = loadCheckoutFromStorage();
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      dispatch(rehydrateCheckout(saved as Record<string, unknown>));
    }
  }, [dispatch]);
  return null;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Rehydrate />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ProductsPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;

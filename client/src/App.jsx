import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { checkAuthSession } from './redux/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    // If a token exists in storage, verify/refresh user info on app boot
    if (token) {
      dispatch(checkAuthSession());
    }
  }, [dispatch, token]);

  return (
    <>
      {/* Toast notifications handler */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131326',
            color: '#e2e8f0',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;

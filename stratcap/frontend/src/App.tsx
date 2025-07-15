import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ErrorBoundary } from './components/ErrorBoundary';
import AppRoutes from './routes';

import { RootState } from './store/store';
import { checkAuth } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Only check auth if there's a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(checkAuth() as any);
    }
  }, [dispatch]);

  if (isLoading) {
    return (
      <div style={{ 
        fontSize: '24px', 
        color: 'blue', 
        padding: '20px' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
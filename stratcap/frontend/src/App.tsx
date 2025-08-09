import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { ErrorBoundary } from './components/ErrorBoundary';
import AppRoutes from './routes';
import { enhancedTheme } from './theme/enhanced-theme';

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
      <ThemeProvider theme={enhancedTheme}>
        <CssBaseline />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '18px',
          color: enhancedTheme.palette.primary.main
        }}>
          Loading...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={enhancedTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
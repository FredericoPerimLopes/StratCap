import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { ErrorBoundary } from './components/ErrorBoundary';
import AppRoutes from './routes';

import { RootState } from './store/store';
import { checkAuth } from './store/slices/authSlice';

// StratCap Professional Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a8a',        // StratCap Navy
      light: '#3b82f6',       // StratCap Blue
      dark: '#1e40af',        // Deep Navy
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',        // Professional Gray
      light: '#94a3b8',       // Light Gray
      dark: '#475569',        // Dark Gray
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',     // Clean Background
      paper: '#ffffff',       // Card Background
    },
    text: {
      primary: '#0f172a',     // Dark Slate
      secondary: '#64748b',   // Medium Gray
      disabled: '#94a3b8',    // Light Gray
    },
    error: {
      main: '#dc2626',
      light: '#fca5a5',
      dark: '#991b1b',
    },
    warning: {
      main: '#d97706',
      light: '#fcd34d',
      dark: '#92400e',
    },
    success: {
      main: '#059669',
      light: '#6ee7b7',
      dark: '#047857',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.625,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(30, 58, 138, 0.1)',
          border: '1px solid rgba(30, 58, 138, 0.08)',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          fontSize: '1rem',
        },
        contained: {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          boxShadow: '0 4px 16px rgba(30, 58, 138, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            boxShadow: '0 6px 20px rgba(30, 58, 138, 0.4)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#3b82f6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1e3a8a',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          // Let Material-UI handle icon sizing naturally
        },
        fontSizeSmall: {
          fontSize: '1rem',
        },
        fontSizeMedium: {
          fontSize: '1.25rem',
        },
        fontSizeLarge: {
          fontSize: '1.75rem',
        },
      },
    },
  },
});

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '18px',
          color: theme.palette.primary.main
        }}>
          Loading...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
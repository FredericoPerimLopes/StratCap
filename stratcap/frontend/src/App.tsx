import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { enhancedTheme } from './theme/enhanced-theme';
import { ErrorBoundary } from './components/shared';
import { LoadingSpinner } from './components/shared';
import AppRoutes from './routes';

// Global styles
const globalStyles = (
  <GlobalStyles
    styles={(theme) => ({
      '*': {
        boxSizing: 'border-box',
      },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
        margin: 0,
        padding: 0,
      },
      '#root': {
        height: '100%',
        width: '100%',
      },
      // Custom scrollbar
      '::-webkit-scrollbar': {
        width: 8,
      },
      '::-webkit-scrollbar-track': {
        background: '#f1f1f1',
      },
      '::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: 4,
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: '#a8a8a8',
      },
    })}
  />
);

function App() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<LoadingSpinner message="Loading application..." fullScreen />}
        persistor={persistor}
      >
        <ThemeProvider theme={enhancedTheme}>
          <CssBaseline />
          {globalStyles}
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            autoHideDuration={5000}
          >
            <ErrorBoundary>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ErrorBoundary>
          </SnackbarProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
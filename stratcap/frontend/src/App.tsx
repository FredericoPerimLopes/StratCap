import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles, Box, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { enhancedTheme } from './theme/enhanced-theme';
import { ErrorBoundary } from './components/shared';
import { AppRouter } from './components/routing/AppRouter';

// Global styles
const globalStyles = (
  <GlobalStyles
    styles={{
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
    }}
  />
);

function App() {
  return (
    <Provider store={store}>
      <PersistGate
        loading={<Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Typography>Loading...</Typography></Box>}
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
                <AppRouter />
              </BrowserRouter>
            </ErrorBoundary>
          </SnackbarProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
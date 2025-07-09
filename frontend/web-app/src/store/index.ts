import { configureStore } from '@reduxjs/toolkit';

// Slices
import authSlice from './slices/authSlice';
import fundsSlice from './slices/fundsSlice';
import investorsSlice from './slices/investorsSlice';
import reportsSlice from './slices/reportsSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    funds: fundsSlice,
    investors: investorsSlice,
    reports: reportsSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
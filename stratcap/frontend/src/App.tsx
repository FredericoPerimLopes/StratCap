import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Main pages
import DashboardPage from './pages/DashboardPage';
import FundFamiliesPage from './pages/fund-families/FundFamiliesPage';
import FundFamilyDetailPage from './pages/fund-families/FundFamilyDetailPage';
import FundsPage from './pages/funds/FundsPage';
import FundDetailPage from './pages/funds/FundDetailPage';
import InvestorsPage from './pages/investors/InvestorsPage';
import InvestorDetailPage from './pages/investors/InvestorDetailPage';
import CommitmentsPage from './pages/commitments/CommitmentsPage';
import CapitalActivitiesPage from './pages/capital-activities/CapitalActivitiesPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

import { RootState } from './store/store';
import { checkAuth } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(checkAuth() as any);
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  
                  {/* Fund Family Routes */}
                  <Route path="/fund-families" element={<FundFamiliesPage />} />
                  <Route path="/fund-families/:id" element={<FundFamilyDetailPage />} />
                  
                  {/* Fund Routes */}
                  <Route path="/funds" element={<FundsPage />} />
                  <Route path="/funds/:id" element={<FundDetailPage />} />
                  
                  {/* Investor Routes */}
                  <Route path="/investors" element={<InvestorsPage />} />
                  <Route path="/investors/:id" element={<InvestorDetailPage />} />
                  
                  {/* Commitment Routes */}
                  <Route path="/commitments" element={<CommitmentsPage />} />
                  
                  {/* Capital Activity Routes */}
                  <Route path="/capital-activities" element={<CapitalActivitiesPage />} />
                  
                  {/* Transaction Routes */}
                  <Route path="/transactions" element={<TransactionsPage />} />
                  
                  {/* Reports Routes */}
                  <Route path="/reports" element={<ReportsPage />} />
                  
                  {/* Settings Routes */}
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
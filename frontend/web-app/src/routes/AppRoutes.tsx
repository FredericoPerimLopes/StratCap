import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Layout Components
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import FundFamilyLayout from '../components/layout/FundFamilyLayout';

// Auth Components
import LoginPage from '../pages/auth/LoginPage';
import SimpleLoginPage from '../pages/auth/SimpleLoginPage';
import PasswordSetupPage from '../pages/auth/PasswordSetupPage';
import PasswordResetPage from '../pages/auth/PasswordResetPage';
import MFASetupPage from '../pages/auth/MFASetupPage';
import MFAPage from '../pages/auth/MFAPage';

// Account Components
import AccountProfilePage from '../pages/account/AccountProfilePage';
import AccountSecurityPage from '../pages/account/AccountSecurityPage';

// Global Components
import Dashboard from '../pages/Dashboard';
import FundFamilyListPage from '../pages/fund-family/FundFamilyListPage';
import EntitiesPage from '../pages/global/EntitiesPage';
import InvestorsPage from '../pages/global/InvestorsPage';
import InvestmentsPage from '../pages/global/InvestmentsPage';
import ReportsPage from '../pages/global/ReportsPage';
import PivotsPage from '../pages/global/PivotsPage';
import GeneralLedgerPage from '../pages/global/GeneralLedgerPage';
import SettingsPage from '../pages/global/SettingsPage';
import InternalPage from '../pages/internal/InternalPage';

// Fund Family Module Components
import FundFamilySummaryPage from '../pages/fund-family/FundFamilySummaryPage';
import CapitalActivityRoutes from './CapitalActivityRoutes';
import CommitmentsRoutes from './CommitmentsRoutes';
import InvestorTransferRoutes from './InvestorTransferRoutes';
import ClosingRoutes from './ClosingRoutes';
import CreditFacilityRoutes from './CreditFacilityRoutes';
import FeesRoutes from './FeesRoutes';
import FinancialReportingRoutes from './FinancialReportingRoutes';
import ConfigurationRoutes from './ConfigurationRoutes';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="login/simple" element={<SimpleLoginPage />} />
        <Route path="logout" element={<Navigate to="/auth/login" replace />} />
        <Route path="password/setup" element={<PasswordSetupPage />} />
        <Route path="password/reset" element={<PasswordResetPage />} />
        <Route path="mfa/setup" element={<MFASetupPage />} />
        <Route path="mfa" element={<MFAPage />} />
      </Route>

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Account Management */}
        <Route path="account" element={<AccountProfilePage />} />
        <Route path="account/security" element={<AccountSecurityPage />} />

        {/* Fund Family List */}
        <Route path="fund-family" element={<FundFamilyListPage />} />

        {/* Fund Family Specific Routes */}
        <Route path="fund-family/:fundFamilyId" element={<FundFamilyLayout />}>
          <Route index element={<Navigate to="summary" replace />} />
          <Route path="summary" element={<FundFamilySummaryPage />} />
          
          {/* Capital Activity Module */}
          <Route path="capital-activity/*" element={<CapitalActivityRoutes />} />
          
          {/* Commitments Module */}
          <Route path="commitments/*" element={<CommitmentsRoutes />} />
          
          {/* Investor Transfers Module */}
          <Route path="investor-transfers/*" element={<InvestorTransferRoutes />} />
          
          {/* Closings Module */}
          <Route path="closing/*" element={<ClosingRoutes />} />
          
          {/* Credit Facility Module */}
          <Route path="credit-facility/*" element={<CreditFacilityRoutes />} />
          
          {/* Fees Module */}
          <Route path="fees/*" element={<FeesRoutes />} />
          
          {/* Financial Reporting Module */}
          <Route path="financial-reporting/*" element={<FinancialReportingRoutes />} />
          
          {/* Configuration Module */}
          <Route path="configuration/*" element={<ConfigurationRoutes />} />
        </Route>

        {/* Global Views */}
        <Route path="entities" element={<EntitiesPage />} />
        <Route path="investors" element={<InvestorsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="pivots" element={<PivotsPage />} />
        
        {/* General Ledger */}
        <Route path="general-ledger/*" element={<GeneralLedgerPage />} />
        
        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Internal Tools */}
        <Route path="internal/*" element={<InternalPage />} />
      </Route>

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
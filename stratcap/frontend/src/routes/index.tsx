import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

// Layout Components
import DashboardLayout from '../components/Layout/DashboardLayout';

// Auth Components
import Login from '../components/Auth/Login';
import MFALogin from '../components/Auth/MFALogin';
import ForgotPassword from '../components/Auth/ForgotPassword';
import ResetPassword from '../components/Auth/ResetPassword';
import MFASetup from '../components/Auth/MFASetup';

// Dashboard
import Dashboard from '../components/Dashboard/Dashboard';

// Fund Management
import FundList from '../components/Funds/FundList';
import FundForm from '../components/Funds/FundForm';
import FundDetails from '../components/Funds/FundDetails';

// Investor Management
import InvestorList from '../components/Investors/InvestorList';
import InvestorForm from '../components/Investors/InvestorForm';
import InvestorDetails from '../components/Investors/InvestorDetails';

// Capital Activities
import CapitalActivityList from '../components/CapitalActivities/CapitalActivityList';
import CapitalActivityForm from '../components/CapitalActivities/CapitalActivityForm';
import CapitalActivityDetails from '../components/CapitalActivities/CapitalActivityDetails';

// Waterfall
import WaterfallCalculation from '../components/Waterfall/WaterfallCalculation';
import WaterfallHistory from '../components/Waterfall/WaterfallHistory';

// Reports
import ReportsList from '../components/Reports/ReportsList';
import ReportBuilder from '../components/Reports/ReportBuilder';
import ReportViewer from '../components/Reports/ReportViewer';

// Credit Facilities
import CreditFacilityList from '../components/CreditFacility/CreditFacilityList';
import CreditFacilityForm from '../components/CreditFacility/CreditFacilityForm';
import DrawdownForm from '../components/CreditFacility/DrawdownForm';
import PaydownForm from '../components/CreditFacility/PaydownForm';

// Global Entity Management
import GlobalEntityDirectory from '../components/GlobalEntity/GlobalEntityDirectory';

// Data Analysis
import PivotTableBuilder from '../components/DataAnalysis/PivotTableBuilder';

// General Ledger
import JournalEntryForm from '../components/GeneralLedger/JournalEntryForm';
import TrialBalance from '../components/GeneralLedger/TrialBalance';

// Configuration Management
import SystemSettings from '../components/Configuration/SystemSettings';
import UserPreferences from '../components/Configuration/UserPreferences';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  
  console.log('ProtectedRoute: isAuthenticated =', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to /auth/login');
    return <Navigate to="/auth/login" replace />;
  }
  
  return <>{children}</>;
};

// Auth Layout Wrapper - Just render outlet directly since Login handles its own layout
const AuthLayoutWrapper = () => {
  return <Outlet />;
};

// Dashboard Layout Wrapper
const DashboardLayoutWrapper = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </ProtectedRoute>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
        {/* Test Routes */}
        <Route path="/test" element={<div style={{fontSize: '24px', color: 'orange'}}>TEST ROUTE WORKS</div>} />
        <Route path="/debug" element={<div style={{fontSize: '24px', color: 'purple'}}>Current URL: {window.location.pathname}</div>} />
        
        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayoutWrapper />}>
          <Route path="login" element={<Login />} />
          <Route path="mfa" element={<MFALogin email="" tempToken="" onSuccess={() => {}} onBack={() => {}} />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="mfa-setup" element={<MFASetup />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayoutWrapper />}>
          {/* Dashboard - Default route */}
          <Route index element={<Dashboard />} />
          
          {/* Fund Management */}
          <Route path="funds">
            <Route index element={<FundList />} />
            <Route path="new" element={<FundForm />} />
            <Route path=":id" element={<FundDetails />} />
            <Route path=":id/edit" element={<FundForm />} />
          </Route>

          {/* Investor Management */}
          <Route path="investors">
            <Route index element={<InvestorList />} />
            <Route path="new" element={<InvestorForm />} />
            <Route path=":id" element={<InvestorDetails />} />
            <Route path=":id/edit" element={<InvestorForm />} />
          </Route>

          {/* Capital Activities */}
          <Route path="capital-activities">
            <Route index element={<CapitalActivityList />} />
            <Route path="new" element={<CapitalActivityForm />} />
            <Route path=":id" element={<CapitalActivityDetails />} />
            <Route path=":id/edit" element={<CapitalActivityForm />} />
          </Route>

          {/* Waterfall */}
          <Route path="waterfall">
            <Route index element={<WaterfallCalculation />} />
            <Route path="history" element={<WaterfallHistory />} />
          </Route>

          {/* Credit Facilities */}
          <Route path="credit-facilities">
            <Route index element={<CreditFacilityList />} />
            <Route path="new" element={<CreditFacilityForm />} />
            <Route path=":id/edit" element={<CreditFacilityForm />} />
            <Route path=":id/drawdown" element={<DrawdownForm />} />
            <Route path=":id/paydown" element={<PaydownForm />} />
          </Route>

          {/* Global Entity Management */}
          <Route path="global-entities">
            <Route index element={<GlobalEntityDirectory />} />
          </Route>

          {/* Data Analysis */}
          <Route path="data-analysis">
            <Route index element={<PivotTableBuilder />} />
            <Route path="pivot-tables" element={<PivotTableBuilder />} />
          </Route>

          {/* General Ledger */}
          <Route path="general-ledger">
            <Route path="journal-entries" element={<JournalEntryForm />} />
            <Route path="journal-entries/new" element={<JournalEntryForm />} />
            <Route path="journal-entries/:id/edit" element={<JournalEntryForm />} />
            <Route path="trial-balance" element={<TrialBalance />} />
          </Route>

          {/* Reports */}
          <Route path="reports">
            <Route index element={<ReportsList />} />
            <Route path="builder" element={<ReportBuilder />} />
            <Route path=":id" element={<ReportViewer />} />
          </Route>

          {/* Configuration */}
          <Route path="configuration">
            <Route path="system" element={<SystemSettings />} />
            <Route path="preferences" element={<UserPreferences />} />
          </Route>
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
};

export default AppRoutes;
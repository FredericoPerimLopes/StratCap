import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

// Layout Components
import DashboardLayout from '../components/Layout/DashboardLayout';
import AuthLayout from '../components/Layout/AuthLayout';

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
import CreditFacilityList from '../components/CreditFacilities/CreditFacilityList';
import CreditFacilityForm from '../components/CreditFacilities/CreditFacilityForm';
import DrawdownForm from '../components/CreditFacilities/DrawdownForm';
import PaydownForm from '../components/CreditFacilities/PaydownForm';

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
        <Route path="login" element={<Login />} />
        <Route path="mfa" element={<MFALogin />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="mfa-setup" element={<MFASetup />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
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

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
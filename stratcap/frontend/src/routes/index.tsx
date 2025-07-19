import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

// Layout Components
import DashboardLayout from '../components/Layout/DashboardLayout';

// Auth Components
import Login from '../components/Auth/Login';
import SimpleLogin from '../components/Auth/SimpleLogin';
import UserRegistration from '../components/Auth/UserRegistration';
import RegistrationSuccess from '../components/Auth/RegistrationSuccess';
import SetupPassword from '../components/Auth/SetupPassword';
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

// Fund Family Management
import { FundFamilyList, FundFamilyForm, FundFamilyDetails } from '../components/FundFamilies';

// Fee Management
import { FeeManagementDashboard, FeeCalculationForm } from '../components/FeeManagement';

// Fund Configuration
import { FundConfigurationWizard, FundConfigurationList } from '../components/FundConfiguration';

// Investor Management
import InvestorList from '../components/Investors/InvestorList';
import InvestorForm from '../components/Investors/InvestorForm';
import InvestorDetails from '../components/Investors/InvestorDetails';

// Investor Transfer
import { InvestorTransferWizard } from '../components/InvestorTransfer';

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
import ReportPreview from '../components/Reports/ReportPreview';

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
          <Route path="login" element={<SimpleLogin />} />
          <Route path="login-legacy" element={<Login />} />
          <Route path="register" element={<UserRegistration />} />
          <Route path="registration-success" element={<RegistrationSuccess />} />
          <Route path="setup-password" element={<SetupPassword />} />
          <Route path="mfa" element={<MFALogin email="" tempToken="" onSuccess={() => {}} onBack={() => {}} />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="mfa-setup" element={<MFASetup />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayoutWrapper />}>
          {/* Dashboard - Default route */}
          <Route index element={<Dashboard />} />
          
          {/* Fund Family Management */}
          <Route path="fund-families">
            <Route index element={<FundFamilyList />} />
            <Route path="new" element={<FundFamilyForm />} />
            <Route path=":id" element={<FundFamilyDetails />} />
            <Route path=":id/edit" element={<FundFamilyForm />} />
          </Route>

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
            <Route path="transfer/new" element={<InvestorTransferWizard />} />
            <Route path="transfer/:id/edit" element={<InvestorTransferWizard />} />
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

          {/* Fee Management */}
          <Route path="fee-management">
            <Route index element={<FeeManagementDashboard />} />
            <Route path="calculations/new" element={<FeeCalculationForm />} />
            <Route path="calculations/:id/edit" element={<FeeCalculationForm />} />
          </Route>

          {/* Fund Configuration */}
          <Route path="fund-configuration">
            <Route index element={<FundConfigurationList />} />
            <Route path="wizard" element={<FundConfigurationWizard />} />
            <Route path=":id/edit" element={<FundConfigurationWizard />} />
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
            <Route path="preview" element={<ReportPreview />} />
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
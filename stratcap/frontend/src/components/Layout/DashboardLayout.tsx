import React, { ReactNode } from 'react';
import { Layout } from '../layout/Layout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return <Layout>{children}</Layout>;
};

export default DashboardLayout;
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layout';
import { Dashboard } from '../dashboard';
import { FundList, FundDetails, FundForm } from '../funds';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route
        path="/*"
        element={
          <MainLayout>
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="funds" element={<FundList />} />
              <Route path="funds/new" element={<FundForm />} />
              <Route path="funds/:id" element={<FundDetails />} />
              <Route path="funds/:id/edit" element={<FundForm />} />
            </Routes>
          </MainLayout>
        }
      />
    </Routes>
  );
};

export default AppRouter;
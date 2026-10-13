import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './context/AuthContext';
import { createBrowserRouter } from 'react-router-dom';

// Layout
import Layout from './components/layout/Layout';

// Public pages (no layout)
import LandingPage from './pages/public/LandingPage';
import VerificationResult from './pages/public/VerificationResult';
import VehiclePassport from './pages/public/VehiclePassport';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import VehicleManagement from './pages/admin/VehicleManagement';
import OrganizationManagement from './pages/admin/OrganizationManagement';
import BlockchainActivity from './pages/admin/BlockchainActivity';

// Service pages
import ServiceDashboard from './pages/service/ServiceDashboard';
import AddServiceRecord from './pages/service/AddServiceRecord';

// Insurance pages
import InsuranceDashboard from './pages/insurance/InsuranceDashboard';
import AddAccidentRecord from './pages/insurance/AddAccidentRecord';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';

export const router = createBrowserRouter([
  // ── Public routes (no sidebar) ───────────────────────────────────
  { path: '/',               element: <LandingPage /> },
  { path: '/verify/:regNumber', element: <VerificationResult /> },
  { path: '/passport/:regNumber', element: <VehiclePassport /> },

  // ── Authenticated routes (with sidebar layout) ────────────────────
  {
    element: <Layout />,
    children: [
      
      // Admin
      {
        element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
        children: [
          { path: '/admin',                 element: <AdminDashboard /> },
          { path: '/admin/vehicles',        element: <VehicleManagement /> },
          { path: '/admin/organizations',   element: <OrganizationManagement /> },
          { path: '/admin/blockchain',      element: <BlockchainActivity /> },
        ]
      },

      
      // Service Center
      {
        element: <ProtectedRoute allowedRoles={[ROLES.SERVICE]} />,
        children: [
          { path: '/service',               element: <ServiceDashboard /> },
          { path: '/service/add',           element: <AddServiceRecord /> },
        ]
      },

      
      // Insurance
      {
        element: <ProtectedRoute allowedRoles={[ROLES.INSURANCE]} />,
        children: [
          { path: '/insurance',             element: <InsuranceDashboard /> },
          { path: '/insurance/add',         element: <AddAccidentRecord /> },
        ]
      },

      
      // Owner
      {
        element: <ProtectedRoute allowedRoles={[ROLES.OWNER, ROLES.ADMIN, ROLES.SERVICE, ROLES.INSURANCE]} />,
        children: [
          { path: '/owner',                 element: <OwnerDashboard /> },
        ]
      },
    ],
  },
]);

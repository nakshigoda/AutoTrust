import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If the user's role is not in the allowedRoles array, redirect them home
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

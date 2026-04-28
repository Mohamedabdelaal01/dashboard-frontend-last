import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute — wraps any page that requires authentication.
 * - Shows a spinner while the auth check is in-flight.
 * - Redirects to /login if not authenticated.
 * - `role`         — single role string (legacy, kept for backward compat)
 * - `allowedRoles` — array of allowed roles (preferred for new usage)
 *   If neither is set, any authenticated user is allowed.
 */
export default function ProtectedRoute({ children, role, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-950">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Resolve allowed roles: allowedRoles prop takes precedence over legacy role prop
  const allowed = allowedRoles ?? (role ? [role] : null);
  const userRole = user.role ?? 'rep'; // default gracefully if role is null/undefined

  if (allowed && !allowed.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/**
 * Dashboard — RBAC router.
 * Renders AdminDashboardView for admins, SalesRepDashboardView for reps.
 * Handles null roles gracefully by defaulting to the sales rep view.
 */
import { useAuth } from '../contexts/AuthContext';
import AdminDashboardView   from './AdminDashboardView';
import SalesRepDashboardView from './SalesRepDashboardView';

const Dashboard = () => {
  const { user } = useAuth();

  // Treat null/undefined role as 'rep' — safe default for existing users
  const role = user?.role ?? 'rep';

  if (role === 'admin') {
    return <AdminDashboardView />;
  }

  return <SalesRepDashboardView />;
};

export default Dashboard;

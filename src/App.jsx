import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }     from './contexts/AuthContext';
import { AlertsProvider }   from './contexts/AlertsContext';
import ProtectedRoute       from './components/ProtectedRoute';
import AppShell             from './components/AppShell';
import Login                from './pages/Login';
import Dashboard            from './pages/Dashboard';
import LeadDetail           from './pages/LeadDetail';
import Leads                from './pages/Leads';
import Analytics            from './pages/Analytics';
import Settings             from './pages/Settings';
import ManyChatGuide        from './pages/ManyChatGuide';

function App() {
  return (
    <AuthProvider>
      <AlertsProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected shell — all pages inside share Sidebar + Navbar */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index              element={<Dashboard />} />
              <Route path="leads"       element={<Leads />} />
              <Route path="leads/:userId" element={<LeadDetail />} />
              {/* Admin-only routes */}
              <Route
                path="analytics"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="manychat-guide"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ManyChatGuide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AlertsProvider>
    </AuthProvider>
  );
}

export default App;

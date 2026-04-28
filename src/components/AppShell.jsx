import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * AppShell — persistent layout wrapper for all protected pages.
 * Renders Sidebar + Navbar + page content via <Outlet />.
 */
export default function AppShell() {
  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#1e293b',
            },
          },
        }}
      />
    </div>
  );
}

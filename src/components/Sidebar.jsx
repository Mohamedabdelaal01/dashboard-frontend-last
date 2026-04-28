import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Settings, Sofa,
  LogOut, BookOpen, Phone, Trophy, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location       = useLocation();
  const navigate       = useNavigate();
  const { user, logout } = useAuth();

  const isAdmin = (user?.role ?? 'rep') === 'admin';

  // ── Admin nav: global analytics, settings, full leads, ManyChat guide ───
  const adminNavItems = [
    { path: '/',               icon: LayoutDashboard, label: 'لوحة التحكم'       },
    { path: '/leads',          icon: Users,           label: 'كل العملاء'         },
    { path: '/analytics',      icon: BarChart3,       label: 'التحليلات'          },
    { path: '/manychat-guide', icon: BookOpen,        label: 'دليل ManyChat'      },
    { path: '/settings',       icon: Settings,        label: 'إعدادات النظام'     },
  ];

  // ── Sales rep nav: personal tools only ───────────────────────────────────
  const repNavItems = [
    { path: '/',      icon: LayoutDashboard, label: 'داشبورد'         },
    { path: '/leads', icon: Users,           label: 'عملائي'          },
  ];

  const navItems = isAdmin ? adminNavItems : repNavItems;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'GF';

  const roleLabel   = isAdmin ? 'مدير النظام' : 'مندوب مبيعات';
  const RoleIcon    = isAdmin ? ShieldCheck : Trophy;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-dark-900 border-l border-dark-800 flex flex-col h-full z-20">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/20">
            <Sofa className="w-6 h-6 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">جراند للأثاث</h1>
            <p className="text-[10px] text-dark-400 font-medium uppercase tracking-widest mt-1">Grand Furniture</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 mt-2">
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${active
                  ? 'bg-primary-600/10 text-primary-500 border border-primary-600/20'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-100 border border-transparent'
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className={`font-semibold text-sm ${active ? 'text-primary-400' : ''}`}>{item.label}</span>
              {active && (
                <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Logout */}
      <div className="p-4 border-t border-dark-800 bg-dark-950/30 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-dark-800/40">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {initials}
            </div>
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-dark-900 rounded-full" />
          </div>
          <div className="flex-1 text-right overflow-hidden">
            <p className="text-sm font-bold text-dark-50 truncate">{user?.name || '—'}</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <RoleIcon className={`w-3 h-3 ${isAdmin ? 'text-amber-400' : 'text-primary-400'}`} />
              <p className={`text-[11px] font-bold ${isAdmin ? 'text-amber-400' : 'text-primary-400'}`}>
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-dark-400 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all text-sm font-bold"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

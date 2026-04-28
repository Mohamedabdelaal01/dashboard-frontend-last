/**
 * SalesRepDashboardView — Personal dashboard for sales rep users.
 * Shows only their own leads, calls, gamification, and reception desk.
 * No global analytics, no rep selector, no branch-level KPIs.
 */
import { useState, useEffect } from 'react';
import {
  Phone, UserCheck, Trophy, ScanLine, RefreshCw,
  Wifi, WifiOff, Star, Target, Zap,
} from 'lucide-react';
import DailyCallList     from '../components/DailyCallList';
import MyLeadsPanel      from '../components/MyLeadsPanel';
import GamificationPanel from '../components/GamificationPanel';
import CallSession       from '../components/CallSession';
import ReceptionDesk     from '../components/ReceptionDesk';
import NotificationBell  from '../components/NotificationBell';
import AlertToast        from '../components/AlertToast';
import { fetchDashboard } from '../services/api';
import useSmartPolling   from '../hooks/useSmartPolling';
import useLeadAlerts     from '../hooks/useLeadAlerts';
import { useAlerts }     from '../contexts/AlertsContext';
import { useAuth }       from '../contexts/AuthContext';
import useAssignments    from '../hooks/useAssignments';
import useCallSession    from '../hooks/useCallSession';
import useGamification   from '../hooks/useGamification';

// ── Relative time indicator ───────────────────────────────────────────────────
const RelativeTime = ({ lastUpdated }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!lastUpdated) return null;
  const s    = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
  const text = s < 5 ? 'الآن' : s < 60 ? `منذ ${s} ثانية` : `منذ ${Math.floor(s / 60)} دقيقة`;
  return <span>{text}</span>;
};

// ── Personal quick-stat card ──────────────────────────────────────────────────
const StatChip = ({ icon: Icon, label, value, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-500/10 border-primary-500/20 text-primary-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[color]}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="text-right">
        <p className="text-xs font-bold opacity-70">{label}</p>
        <p className="text-lg font-black leading-none">{value}</p>
      </div>
    </div>
  );
};

// ── Tab definitions (sales rep sees only personal tools) ─────────────────────
const REP_TABS = [
  { id: 'calls',     label: 'مكالمات اليوم', icon: Phone     },
  { id: 'my',        label: 'عملائي',        icon: UserCheck },
  { id: 'gamify',    label: 'إنجازاتي',      icon: Trophy    },
  { id: 'reception', label: 'الاستقبال',     icon: ScanLine  },
];

const SalesRepDashboardView = () => {
  const { user }                = useAuth();
  const [activeTab, setActiveTab] = useState('calls');

  // ── Data polling (shared endpoint — filtering is done server-side) ─────────
  const { data, prevData, loading, lastUpdated, refresh, isVisible } =
    useSmartPolling(fetchDashboard, { activeInterval: 20000, backgroundInterval: 90000 });

  // ── Alerts ────────────────────────────────────────────────────────────────
  const { alerts, toasts, unreadCount, dismiss, clear, markAllRead, dismissToast } =
    useLeadAlerts(data?.recent_hot_leads, prevData?.recent_hot_leads);

  const { pushAlerts } = useAlerts();
  useEffect(() => { pushAlerts(alerts, unreadCount); }, [alerts, unreadCount, pushAlerts]);

  // ── Rep identity — always the logged-in user ──────────────────────────────
  const repName    = user?.name || 'مندوب';
  const [assignments] = useAssignments();
  const session    = useCallSession(repName);
  const gamification = useGamification(repName, session.log);

  // All leads from the API (already filtered server-side for this rep)
  const leads = data?.recent_hot_leads || [];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-1 bg-primary-600 rounded-full" />
            <span className="text-primary-500 font-black text-xs uppercase tracking-[0.2em]">
              Sales Rep Dashboard
            </span>
          </div>
          <h1 className="text-4xl font-black text-white">أهلاً، {repName}</h1>
          <p className="text-dark-400 mt-1">
            Level <span className="text-primary-400 font-bold">{gamification.level.level}</span>
            {' • '}
            <span className="text-amber-400 font-bold">{gamification.totalXp} XP</span>
            {' • '}مندوب مبيعات
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Connection status */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
              isVisible
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                : 'bg-dark-800/50 border-dark-700 text-dark-400'
            }`}
          >
            {isVisible ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isVisible ? 'متصل' : 'في الخلفية'}</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-40" />
            <RelativeTime lastUpdated={lastUpdated} />
          </div>

          <NotificationBell
            alerts={alerts} unreadCount={unreadCount}
            onDismiss={dismiss} onClear={clear}
            onMarkAllRead={markAllRead} onAlertClick={() => {}}
          />

          <button onClick={session.startSession} className="btn-primary">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">ابدأ جلسة</span>
          </button>

          <button onClick={refresh} className="btn-secondary group" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Toasts */}
      <AlertToast toasts={toasts} onDismiss={dismissToast} onClick={() => {}} />

      {/* ── Personal quick stats ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatChip
          icon={Target}
          label="العملاء المعيّنين"
          value={leads.length}
          color="primary"
        />
        <StatChip
          icon={Zap}
          label="مكالمات اليوم"
          value={session.log?.filter(l => {
            const today = new Date().toDateString();
            return l.timestamp && new Date(l.timestamp).toDateString() === today;
          }).length ?? 0}
          color="amber"
        />
        <StatChip
          icon={Star}
          label="المستوى الحالي"
          value={`Level ${gamification.level.level}`}
          color="emerald"
        />
      </div>

      {/* ── Tab bar ───────────────────────────────────── */}
      <div className="card p-2 flex flex-wrap gap-1 sticky top-4 z-30 backdrop-blur-md">
        {REP_TABS.map((t) => {
          const Icon   = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
                active
                  ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────────── */}
      {activeTab === 'calls'     && (
        <DailyCallList
          leads={leads}
          currentRep={repName}
          onStartSession={session.startSession}
        />
      )}
      {activeTab === 'my'        && (
        <MyLeadsPanel
          leads={leads}
          currentRep={repName}
          onStartSession={session.startSession}
        />
      )}
      {activeTab === 'gamify'    && (
        <GamificationPanel
          gamification={gamification}
          currentRep={repName}
        />
      )}
      {activeTab === 'reception' && <ReceptionDesk />}

      {/* ── Footer ────────────────────────────────────── */}
      <div className="text-center text-xs text-dark-500">
        آخر تحديث: <RelativeTime lastUpdated={lastUpdated} />
        <span className="mx-2 text-dark-700">•</span>
        {lastUpdated?.toLocaleTimeString('ar-EG')}
      </div>

      {/* ── Call Session modal ─────────────────────────── */}
      {session.active && (
        <CallSession
          leads={leads}
          assignments={assignments}
          currentRep={repName}
          session={session}
          onClose={session.endSession}
          onlyAssignedToMe={activeTab === 'my'}
        />
      )}
    </div>
  );
};

export default SalesRepDashboardView;

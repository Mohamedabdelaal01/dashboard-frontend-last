/**
 * AdminDashboardView — Global dashboard for admin users.
 * Shows full KPIs, charts, all leads, campaigns, and rep-selector.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Flame, CheckCircle, Activity, MapPin, TrendingUp, RefreshCw,
  Wifi, WifiOff, BarChart3, Layers, Phone, UserCheck, Trophy,
  ScanLine, Megaphone, BookOpen,
} from 'lucide-react';
import KPICard               from '../components/KPICard';
import LeadDistributionChart from '../components/LeadDistributionChart';
import ProductsChart         from '../components/ProductsChart';
import BranchAnalysisChart   from '../components/BranchDemandChart';
import FunnelChart           from '../components/FunnelChart';
import HotLeadsTable         from '../components/HotLeadsTable';
import NotificationBell      from '../components/NotificationBell';
import AlertToast            from '../components/AlertToast';
import RepSelector           from '../components/RepSelector';
import LeadGroups            from '../components/LeadGroups';
import DailyCallList         from '../components/DailyCallList';
import MyLeadsPanel          from '../components/MyLeadsPanel';
import GamificationPanel     from '../components/GamificationPanel';
import CallSession           from '../components/CallSession';
import WeeklyForecast        from '../components/WeeklyForecast';
import ReceptionDesk         from '../components/ReceptionDesk';
import CampaignPerformance   from '../components/CampaignPerformance';
import ManyChatGuide         from '../components/ManyChatGuide';
import { fetchDashboard }    from '../services/api';
import useSmartPolling       from '../hooks/useSmartPolling';
import useLeadAlerts         from '../hooks/useLeadAlerts';
import { useAlerts }         from '../contexts/AlertsContext';
import { useAuth }           from '../contexts/AuthContext';
import useAssignments        from '../hooks/useAssignments';
import useCurrentRep         from '../hooks/useCurrentRep';
import useCallSession        from '../hooks/useCallSession';
import useGamification       from '../hooks/useGamification';

// ── Skeleton loader ───────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800 rounded-xl ${className}`}
    style={{ animation: 'shimmer 1.8s infinite', backgroundSize: '200% 100%' }}
  />
);
const KPICardSkeleton = () => (
  <div className="card p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-2.5 w-32 rounded" />
      </div>
      <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
    </div>
  </div>
);

// ── Relative time indicator ───────────────────────────────────────────────────
const RelativeTime = ({ lastUpdated }) => {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (!lastUpdated) return null;
  const s = Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
  const text = s < 5 ? 'الآن' : s < 60 ? `منذ ${s} ثانية` : `منذ ${Math.floor(s / 60)} دقيقة`;
  return <span>{text}</span>;
};

// ── Tab definitions (admin sees all tabs) ─────────────────────────────────────
const ADMIN_TABS = [
  { id: 'overview',  label: 'نظرة عامة',     icon: BarChart3  },
  { id: 'groups',    label: 'مجموعات',       icon: Layers     },
  { id: 'calls',     label: 'مكالمات اليوم', icon: Phone      },
  { id: 'my',        label: 'عملاء المندوب', icon: UserCheck  },
  { id: 'gamify',    label: 'الإنجازات',     icon: Trophy     },
  { id: 'reception', label: 'الاستقبال',     icon: ScanLine   },
  { id: 'campaigns', label: 'الحملات',       icon: Megaphone  },
  { id: 'guide',     label: 'دليل ManyChat', icon: BookOpen   },
];

const AdminDashboardView = () => {
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // ── Data polling ──────────────────────────────────────────────────────────
  const { data, prevData, loading, error, lastUpdated, refresh, isVisible } =
    useSmartPolling(fetchDashboard, { activeInterval: 15000, backgroundInterval: 60000 });

  // ── Alerts ────────────────────────────────────────────────────────────────
  const { alerts, toasts, unreadCount, dismiss, clear, markAllRead, dismissToast } =
    useLeadAlerts(data?.recent_hot_leads, prevData?.recent_hot_leads);

  const { pushAlerts } = useAlerts();
  useEffect(() => { pushAlerts(alerts, unreadCount); }, [alerts, unreadCount, pushAlerts]);

  // ── Rep management ────────────────────────────────────────────────────────
  const [currentRep, setCurrentRep] = useCurrentRep();
  // Admin always acts under their own name — currentRep is only for VIEWING
  const effectiveRep = user?.name || currentRep;
  const viewingRep   = currentRep;            // the rep whose data is displayed

  const [assignments]  = useAssignments();
  const session        = useCallSession(effectiveRep);
  const gamification   = useGamification(effectiveRep, session.log);

  const handleAlertClick = (alert) => {
    if (alert?.lead?.user_id) navigate(`/leads/${alert.lead.user_id}`);
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const summary = data?.summary  || {};
    const prev    = prevData?.summary || {};
    const calcTrend = (cur, prv) =>
      !prv || prv === 0 ? null : parseFloat((((cur - prv) / prv) * 100).toFixed(1));

    const totalLeads      = summary.total_leads        || 0;
    const hotToday        = summary.hot_leads_today    || 0;
    const visitsConfirmed = summary.visits_confirmed   || 0;
    const visitsToday     = summary.visits_today       || 0;
    const convRate        = summary.conversion_to_visit|| 0;
    const todayStr        = new Date().toISOString().split('T')[0];
    const totalEventsToday =
      data?.weekly_activity?.find(d => d.day === todayStr)?.events || 0;

    return {
      totalLeads:      { value: totalLeads,      trend: calcTrend(totalLeads,      prev.total_leads) },
      hotToday:        { value: hotToday,        trend: calcTrend(hotToday,        prev.hot_leads_today) },
      visitsConfirmed: { value: visitsConfirmed, trend: calcTrend(visitsConfirmed, prev.visits_confirmed) },
      visitsToday:     { value: visitsToday,     trend: null },
      convRate:        { value: convRate,         trend: calcTrend(convRate,         prev.conversion_to_visit) },
      eventsToday:     { value: totalEventsToday, trend: null },
    };
  }, [data, prevData]);

  // ── Error State ───────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card p-10 text-center max-w-md border-rose-500/20 bg-rose-500/5">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-white mb-3">عذراً، حدث خطأ في الاتصال</h3>
          <p className="text-dark-400 mb-8 text-sm leading-relaxed">{error}</p>
          <button onClick={refresh} className="btn-primary w-full py-4">إعادة محاولة الاتصال</button>
        </div>
      </div>
    );
  }

  const summary    = data?.summary || {};
  const isFirstLoad = loading && !data;
  const leads      = data?.recent_hot_leads || [];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:hidden">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-1 bg-amber-500 rounded-full" />
            <span className="text-amber-400 font-black text-xs uppercase tracking-[0.2em]">
              Admin — Sales Intelligence
            </span>
          </div>
          <h1 className="text-4xl font-black text-white">لوحة تحكم المدير</h1>
          <p className="text-dark-400 mt-2">
            <span className="text-emerald-400 font-bold">{effectiveRep}</span>
            {viewingRep && viewingRep !== effectiveRep && (
              <span className="mr-2 text-[11px] bg-dark-800 border border-dark-600 text-dark-300 rounded-lg px-2 py-0.5">
                تعرض بيانات: <span className="text-amber-400 font-bold">{viewingRep}</span>
              </span>
            )}
            {' • '}مدير النظام
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Rep selector — admin-only tool */}
          <RepSelector currentRep={currentRep} onChange={setCurrentRep} />

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
            onMarkAllRead={markAllRead} onAlertClick={handleAlertClick}
          />

          <button onClick={session.startSession} className="btn-primary" title="ابدأ جلسة اتصال">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">ابدأ جلسة</span>
          </button>

          <button onClick={refresh} className="btn-secondary group" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* Toasts */}
      <AlertToast toasts={toasts} onDismiss={dismissToast} onClick={handleAlertClick} />

      {/* ── Tab bar ───────────────────────────────────── */}
      <div className="card p-2 flex flex-wrap gap-1 print:hidden sticky top-4 z-30 backdrop-blur-md">
        {ADMIN_TABS.map((t) => {
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
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
            {isFirstLoad
              ? Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
              : (
                <>
                  <KPICard icon={Users}       label="إجمالي العملاء"  value={kpis.totalLeads.value}      trend={kpis.totalLeads.trend}      onClick={() => navigate('/leads')} />
                  <KPICard icon={Flame}       label="ساخنين اليوم"    value={kpis.hotToday.value}        trend={kpis.hotToday.trend}        color="danger" onClick={() => navigate('/leads?class=hot')} />
                  <KPICard icon={CheckCircle} label="زيارات مؤكدة"    value={kpis.visitsConfirmed.value} trend={kpis.visitsConfirmed.trend} onClick={() => navigate('/leads?class=visited')} />
                  <KPICard icon={MapPin}      label="زيارات اليوم"    value={kpis.visitsToday.value}     onClick={() => navigate('/leads?class=visited')} />
                  <KPICard icon={TrendingUp}  label="Conversion"      value={`${kpis.convRate.value}%`}  trend={kpis.convRate.trend} />
                  <KPICard icon={Activity}    label="Events Today"    value={kpis.eventsToday.value} />
                </>
              )
            }
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <LeadDistributionChart data={summary.lead_distribution} />
            <FunnelChart           data={data?.funnel_stages} />
            <WeeklyForecast />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProductsChart    data={data?.top_products} gapData={data?.product_gap} />
            <BranchAnalysisChart demandData={data?.branch_demand} visitsData={data?.branch_visits} />
          </div>

          <HotLeadsTable leads={leads} />
        </div>
      )}

      {activeTab === 'groups'    && <LeadGroups leads={leads} />}
      {activeTab === 'calls'     && <DailyCallList  leads={leads} currentRep={viewingRep} onStartSession={session.startSession} />}
      {activeTab === 'my'        && <MyLeadsPanel   leads={leads} currentRep={viewingRep} onStartSession={session.startSession} />}
      {activeTab === 'gamify'    && <GamificationPanel gamification={gamification} currentRep={viewingRep} />}
      {activeTab === 'reception' && <ReceptionDesk />}
      {activeTab === 'campaigns' && <div className="space-y-8"><CampaignPerformance data={data?.campaign_performance} /></div>}
      {activeTab === 'guide'     && <ManyChatGuide />}

      {/* ── Footer ────────────────────────────────────── */}
      <div className="text-center text-xs text-dark-500 print:hidden">
        آخر تحديث: <RelativeTime lastUpdated={lastUpdated} />
        <span className="mx-2 text-dark-700">•</span>
        {lastUpdated?.toLocaleTimeString('ar-EG')}
      </div>

      {/* ── Call Session modal ─────────────────────────── */}
      {session.active && (
        <CallSession
          leads={leads}
          assignments={assignments}
          currentRep={effectiveRep}
          session={session}
          onClose={session.endSession}
          onlyAssignedToMe={activeTab === 'my'}
        />
      )}
    </div>
  );
};

export default AdminDashboardView;

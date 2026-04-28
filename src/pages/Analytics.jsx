import { useState, useCallback, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  BarChart3, Users, Flame, MapPin, ShoppingBag,
  Filter, RefreshCw, TrendingUp,
} from 'lucide-react';
import { fetchAnalytics, formatBranch } from '../services/api';
import KPICard              from '../components/KPICard';
import CampaignPerformance  from '../components/CampaignPerformance';

// ── Helpers ────────────────────────────────────────────────────────────────
function isoToday() {
  return new Date().toISOString().split('T')[0];
}
function iso30DaysAgo() {
  return new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
}

const BRANCH_OPTIONS = [
  { value: '',           label: 'كل الفروع'           },
  { value: 'nasr_city',  label: 'نصر سيتي'            },
  { value: 'maadi',      label: 'المعادي'             },
  { value: 'new_cairo',  label: 'القاهرة الجديدة'     },
  { value: 'october',    label: 'أكتوبر'              },
  { value: 'alexandria', label: 'الإسكندرية'          },
  { value: 'helwan',     label: 'حلوان'               },
  { value: 'faisal',     label: 'فيصل'                },
  { value: 'ain_shams',  label: 'عين شمس'             },
];

const EVENT_COLORS = {
  entry_offer:      '#6366f1',
  entry_catalog:    '#8b5cf6',
  entry_location:   '#a78bfa',
  product_details:  '#0ea5e9',
  location_request: '#f59e0b',
  branch_selected:  '#f97316',
  map_click:        '#10b981',
  contact_request:  '#ec4899',
  visit_confirmed:  '#22c55e',
};

// Transform flat eventsSeries into chart-ready rows keyed by day
function buildEventTrend(series) {
  const byDay = {};
  for (const { day, event_type, count } of series) {
    if (!byDay[day]) byDay[day] = { day };
    byDay[day][event_type] = (byDay[day][event_type] || 0) + count;
  }
  return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
}

// Get unique event types seen in the series
function getEventTypes(series) {
  return [...new Set(series.map(r => r.event_type))];
}

// Skeleton card
const Skeleton = () => (
  <div className="animate-pulse bg-dark-800 rounded-xl h-24" />
);

// ── Custom tooltip for events chart ────────────────────────────────────────
function EventsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs space-y-1 shadow-2xl">
      <p className="text-dark-300 font-bold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-dark-400">{p.dataKey}:</span>
          <span className="text-white font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [from,     setFrom]     = useState(iso30DaysAgo());
  const [to,       setTo]       = useState(isoToday());
  const [branch,   setBranch]   = useState('');
  const [campaign, setCampaign] = useState('');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnalytics({ from, to, branch, campaign });
      setData(result);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'فشل تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  }, [from, to, branch, campaign]);

  useEffect(() => { load(); }, []);   // load on mount with defaults

  const funnel      = data?.funnel      || {};
  const eventSeries = buildEventTrend(data?.eventsSeries || []);
  const eventTypes  = getEventTypes(data?.eventsSeries || []);
  const topProducts = data?.topProducts || [];
  const branches    = data?.branches    || [];

  // Build CampaignPerformance-compatible data shape
  const campaignData = (data?.campaigns || []).map(c => ({
    campaign_source:  c.campaign_source,
    total_leads:      c.leads,
    total_visits:     c.visits,
    total_purchases:  c.purchases,
    purchase_rate:    c.leads ? parseFloat(((c.purchases / c.leads) * 100).toFixed(1)) : 0,
  }));

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12" dir="rtl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-1 bg-primary-600 rounded-full" />
          <span className="text-primary-500 font-black text-[10px] uppercase tracking-[0.2em]">التقارير والبيانات</span>
        </div>
        <h1 className="text-3xl font-black text-white">التحليلات المتقدمة</h1>
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-end sticky top-4 z-20 backdrop-blur-md">
        <Filter className="w-4 h-4 text-dark-500 flex-shrink-0 self-center" />

        <div className="space-y-1">
          <label className="text-dark-500 text-[10px] font-black uppercase tracking-wider">من</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-field text-sm py-1.5"
            dir="ltr"
          />
        </div>

        <div className="space-y-1">
          <label className="text-dark-500 text-[10px] font-black uppercase tracking-wider">إلى</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-field text-sm py-1.5"
            dir="ltr"
          />
        </div>

        <div className="space-y-1">
          <label className="text-dark-500 text-[10px] font-black uppercase tracking-wider">الفرع</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="input-field text-sm py-1.5 min-w-[130px]"
          >
            {BRANCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-dark-500 text-[10px] font-black uppercase tracking-wider">الحملة</label>
          <input
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="eid_offer_2025"
            className="input-field text-sm py-1.5 w-40"
            dir="ltr"
          />
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="btn-primary self-end"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><RefreshCw className="w-4 h-4" /> تطبيق</>
          }
        </button>
      </div>

      {error && (
        <div className="card p-4 text-rose-400 text-sm border-rose-500/20 bg-rose-500/5">{error}</div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)
        ) : (
          <>
            <KPICard icon={Users}       label="إجمالي العملاء"  value={funnel.total_leads || 0} />
            <KPICard icon={Flame}       label="ساخنين"          value={funnel.hot         || 0} color="danger" />
            <KPICard icon={MapPin}      label="زيارات المعرض"   value={funnel.visited     || 0} />
            <KPICard icon={ShoppingBag} label="مشتريات"         value={funnel.purchased   || 0} />
          </>
        )}
      </div>

      {/* Events trend */}
      {eventSeries.length > 0 && (
        <div className="card p-6">
          <h3 className="text-white font-black text-lg mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            حركة الأحداث اليومية
          </h3>
          <p className="text-dark-400 text-xs mb-6">
            {data?.meta?.from} — {data?.meta?.to}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={eventSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {eventTypes.map(type => (
                  <linearGradient key={type} id={`grad_${type}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={EVENT_COLORS[type] || '#6366f1'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={EVENT_COLORS[type] || '#6366f1'} stopOpacity={0}   />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<EventsTooltip />} />
              {eventTypes.slice(0, 6).map(type => (
                <Area
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={EVENT_COLORS[type] || '#6366f1'}
                  fill={`url(#grad_${type})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Campaigns + Branch side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Campaign performance — reuse existing component */}
        <CampaignPerformance data={campaignData} />

        {/* Branch breakdown */}
        {branches.length > 0 && (
          <div className="card p-6">
            <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-400" />
              الأداء حسب الفرع
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={branches} layout="vertical" margin={{ right: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="branch"
                  width={90}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(v) => formatBranch(v) || v}
                />
                <Tooltip
                  formatter={(v, n) => [v, n === 'leads' ? 'إجمالي' : 'زيارات']}
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="leads"  fill="#6366f1" radius={[0, 4, 4, 0]} name="leads" />
                <Bar dataKey="visits" fill="#22c55e" radius={[0, 4, 4, 0]} name="visits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top products */}
      {topProducts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-white font-black text-lg mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            أكثر المنتجات مشاهدةً
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 36)}>
            <BarChart data={topProducts} layout="vertical" margin={{ right: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="product"
                width={120}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [v, 'مشاهدات']}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="views" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !data?.eventsSeries?.length && (
        <div className="card p-16 text-center">
          <BarChart3 className="w-12 h-12 text-dark-700 mx-auto mb-4" />
          <p className="text-dark-400 font-bold">لا توجد بيانات في هذه الفترة</p>
          <p className="text-dark-600 text-sm mt-1">جرّب تغيير نطاق التاريخ</p>
        </div>
      )}
    </div>
  );
}

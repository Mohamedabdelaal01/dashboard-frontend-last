import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, MapPin, Package, Calendar, TrendingUp,
  User, Activity, Clock, Megaphone, ShoppingBag, X, Check, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  fetchLeadDetail, fetchLeadPurchases, recordPurchase,
  formatLeadClass, getLeadBadgeClass, formatBranch, formatEventType,
} from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────
const parseSqliteDate = (str) => {
  if (!str) return null;
  return new Date(str.replace(' ', 'T') + 'Z');
};

// ── Purchase Modal ─────────────────────────────────────────────────────────
const PurchaseModal = ({ userId, onClose, onSuccess }) => {
  const [form, setForm]     = useState({ product_id: '', price: '', branch: '', notes: '' });
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await recordPurchase({
        user_id:    userId,
        product_id: form.product_id || undefined,
        price:      form.price ? parseFloat(form.price) : undefined,
        branch:     form.branch || undefined,
        notes:      form.notes || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'فشل تسجيل الشراء');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
            تسجيل عملية شراء
          </h3>
          <button onClick={onClose} className="text-dark-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-400 text-xs font-bold mb-1.5">المنتج</label>
            <input
              value={form.product_id}
              onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
              placeholder="e.g. sofa_berlin"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-bold mb-1.5">السعر (جنيه)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-bold mb-1.5">الفرع</label>
            <select
              value={form.branch}
              onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
              className="input-field w-full"
            >
              <option value="">اختر الفرع</option>
              <option value="nasr_city">نصر سيتي</option>
              <option value="maadi">المعادي</option>
              <option value="helwan">حلوان</option>
              <option value="faisal">فيصل</option>
              <option value="ain_shams">عين شمس</option>
            </select>
          </div>
          <div>
            <label className="block text-dark-400 text-xs font-bold mb-1.5">ملاحظات</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="أي تفاصيل إضافية..."
              className="input-field w-full resize-none"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {busy ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {busy ? 'جاري التسجيل...' : 'تأكيد الشراء'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const LeadDetail = () => {
  const { userId } = useParams();
  const navigate   = useNavigate();

  const [data,      setData]      = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [leadData, purchaseData] = await Promise.all([
        fetchLeadDetail(userId),
        fetchLeadPurchases(userId).catch(() => ({ purchases: [] })),
      ]);
      setData(leadData);
      setPurchases(purchaseData.purchases || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-900/20 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-dark-400 mt-6 font-bold tracking-widest uppercase text-xs">
          جاري تحميل ملف العميل...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card p-10 text-center max-w-md border-rose-500/20">
          <h3 className="text-xl font-black text-white mb-3">خطأ في تحميل البيانات</h3>
          <p className="text-dark-400 mb-8 text-sm leading-relaxed">{error || 'لم يتم العثور على العميل'}</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const history = data.history;

  const handlePurchaseSuccess = () => {
    setShowModal(false);
    load(); // refresh everything
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center bg-dark-900 hover:bg-primary-600 text-dark-400 hover:text-white rounded-2xl border border-dark-800 transition-all active:scale-95 group"
          >
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-primary-600 rounded-full" />
              <span className="text-primary-500 font-black text-[10px] uppercase tracking-[0.2em]">
                تفاصيل العميل
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">ملف العميل</h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-dark-900 rounded-xl border border-dark-800">
          <Clock className="w-4 h-4 text-dark-500" />
          <span className="text-dark-400 text-xs font-bold">
            آخر نشاط:{' '}
            {profile.last_activity
              ? format(parseSqliteDate(profile.last_activity), 'd MMM yyyy', { locale: ar })
              : 'غير متوفر'}
          </span>
        </div>
      </div>

      {/* ── Profile Card ───────────────────────────────────────────────── */}
      <div className="card overflow-hidden relative">
        <div className="p-8 md:p-10 relative z-10">
          <div className="flex flex-col md:flex-row items-start gap-8">

            <div className="w-28 h-28 rounded-3xl bg-dark-800 border border-dark-700 flex items-center justify-center text-white text-4xl font-black">
              {profile.first_name?.charAt(0) || <User className="w-12 h-12" />}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white mb-1">
                    {profile.first_name || 'غير معروف'}
                  </h2>
                  <div className="flex items-center gap-2 text-dark-500 font-bold text-xs uppercase tracking-wider">
                    <span>المعرف: {profile.user_id}</span>
                    <span className="w-1 h-1 rounded-full bg-dark-700" />
                    <span>
                      تاريخ الانضمام:{' '}
                      {profile.created_at
                        ? format(parseSqliteDate(profile.created_at), 'MMM yyyy', { locale: ar })
                        : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`badge ${getLeadBadgeClass(profile.lead_class)}`}>
                    {formatLeadClass(profile.lead_class)}
                  </span>
                  {profile.lead_class !== 'purchased' && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-bold transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      تسجيل شراء
                    </button>
                  )}
                </div>
              </div>

              {/* Core stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-dark-500 text-xs">النقاط</p>
                  <p className="text-white font-bold">{profile.total_score}</p>
                </div>
                <div>
                  <p className="text-dark-500 text-xs">مشاهدات</p>
                  <p className="text-white font-bold">{profile.product_view_count}</p>
                </div>
                <div>
                  <p className="text-dark-500 text-xs">جلسات</p>
                  <p className="text-white font-bold">{profile.session_count}</p>
                </div>
                <div>
                  <p className="text-dark-500 text-xs">الفرع</p>
                  <p className="text-white font-bold">
                    {profile.preferred_branch ? formatBranch(profile.preferred_branch) : '—'}
                  </p>
                </div>
              </div>

              {/* O2O Attribution row */}
              {(profile.campaign_source || profile.ad_id || profile.visit_code) && (
                <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-dark-900/60 border border-dark-800">
                  <div>
                    <p className="text-dark-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
                      <Megaphone className="w-3 h-3" />
                      الحملة
                    </p>
                    <p className="text-primary-300 text-sm font-bold">
                      {profile.campaign_source || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                      Ad ID
                    </p>
                    <p className="text-dark-300 text-sm font-mono">
                      {profile.ad_id || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-dark-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                      كود الزيارة
                    </p>
                    <p className="text-emerald-400 text-sm font-mono font-bold tracking-widest">
                      {profile.visit_code || '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extra flags */}
          <div className="mt-6 grid grid-cols-3 gap-6">
            <div>
              <p className="text-dark-500 text-xs">آخر منتج</p>
              <p className="text-white">{profile.last_product || '—'}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">طلب موقع</p>
              <p className="text-white">{profile.location_requested ? '✔' : '—'}</p>
            </div>
            <div>
              <p className="text-dark-500 text-xs">زيارة</p>
              <p className="text-white">
                {profile.visit_confirmed ? (
                  profile.visit_at
                    ? format(parseSqliteDate(profile.visit_at), 'd MMM yyyy', { locale: ar })
                    : '✔'
                ) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Purchases ──────────────────────────────────────────────────── */}
      {purchases.length > 0 && (
        <div className="card p-8">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-violet-400" />
            سجل المشتريات
          </h3>
          <div className="space-y-3">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-dark-800 last:border-0">
                <div>
                  <p className="text-white font-bold">
                    {p.product_id ? p.product_id.replace(/_/g, ' ') : 'منتج غير محدد'}
                  </p>
                  <p className="text-dark-400 text-xs">
                    {p.branch ? formatBranch(p.branch) : ''}{p.rep ? ` • ${p.rep}` : ''}
                  </p>
                </div>
                <div className="text-left">
                  {p.price && (
                    <p className="text-violet-400 font-black tabular-nums">
                      {p.price.toLocaleString()} ج
                    </p>
                  )}
                  <p className="text-dark-500 text-xs">
                    {format(parseSqliteDate(p.created_at), 'd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity Timeline ───────────────────────────────────────────── */}
      <div className="card p-8">
        <h3 className="text-xl font-black text-white mb-6">سجل النشاط</h3>

        {history?.length > 0 ? (
          <div className="space-y-4">
            {history.map((event, index) => (
              <div key={index} className="border-b border-dark-800 pb-4">
                <div className="flex justify-between">
                  <span className="text-white font-bold">
                    {formatEventType(event.event_type)}
                  </span>
                  <span className="text-dark-400 text-xs">
                    {format(
                      parseSqliteDate(event.created_at),
                      'd MMMM yyyy، hh:mm a',
                      { locale: ar }
                    )}
                  </span>
                </div>
                {event.event_value && (
                  <p className="text-dark-300 text-sm mt-1">{event.event_value}</p>
                )}
                <p className="text-emerald-400 text-xs mt-1">
                  +{event.score_delta} نقطة
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400">لا يوجد نشاط</p>
        )}
      </div>

      {/* ── Purchase Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <PurchaseModal
          userId={profile.user_id}
          onClose={() => setShowModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
};

export default LeadDetail;

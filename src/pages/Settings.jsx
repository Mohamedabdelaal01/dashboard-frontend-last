import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Settings2, Users, Key, Building2, Eye, EyeOff,
  Save, Plus, Edit2, Check, AlertTriangle, X, Trash2,
} from 'lucide-react';
import {
  fetchSettings, updateSetting,
  fetchUsers, createUser, updateUser,
  fetchBranches, updateBranches,
} from '../services/api';

// ── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',  label: 'الإعدادات العامة', icon: Settings2  },
  { id: 'api',      label: 'مفاتيح API',        icon: Key        },
  { id: 'users',    label: 'المستخدمون',        icon: Users      },
  { id: 'branches', label: 'الفروع',            icon: Building2  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function SaveStatus({ status }) {
  if (status === 'saving') return <span className="text-primary-400 text-xs animate-pulse">جاري الحفظ…</span>;
  if (status === 'saved')  return <span className="text-emerald-400 text-xs flex items-center gap-1"><Check className="w-3 h-3" />تم الحفظ</span>;
  if (status === 'error')  return <span className="text-rose-400 text-xs">فشل الحفظ</span>;
  return null;
}

// ── General Settings tab ─────────────────────────────────────────────────────
function GeneralTab({ settings, onSave }) {
  const [companyName,    setCompanyName]    = useState(settings.company_name        || '');
  const [msgLimit,       setMsgLimit]       = useState(settings.weekly_message_limit || '2');
  const [expiryDays,     setExpiryDays]     = useState(settings.lead_expiry_days    || '30');
  const [hotThreshold,   setHotThreshold]   = useState(settings.scoring_hot_threshold  || '40');
  const [warmThreshold,  setWarmThreshold]  = useState(settings.scoring_warm_threshold || '15');
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    setStatus('saving');
    const tId = toast.loading('جاري الحفظ...');
    try {
      await Promise.all([
        onSave('company_name',           companyName),
        onSave('weekly_message_limit',   msgLimit),
        onSave('lead_expiry_days',       expiryDays),
        onSave('scoring_hot_threshold',  hotThreshold),
        onSave('scoring_warm_threshold', warmThreshold),
      ]);
      setStatus('saved');
      toast.success('تم حفظ الإعدادات بنجاح', { id: tId });
      setTimeout(() => setStatus(''), 3000);
    } catch {
      setStatus('error');
      toast.error('فشل الحفظ', { id: tId });
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Field label="اسم الشركة" hint="يظهر في الرسائل والتقارير">
        <input value={companyName} onChange={e => setCompanyName(e.target.value)}
          className="input-field w-full" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="الحد الأسبوعي للرسائل" hint="أقصى رسائل لكل عميل / أسبوع">
          <input type="number" min={1} max={10} value={msgLimit}
            onChange={e => setMsgLimit(e.target.value)} className="input-field w-full" />
        </Field>
        <Field label="أيام انتهاء صلاحية العميل" hint="بعدها يُعتبر العميل غير نشط">
          <input type="number" min={7} max={365} value={expiryDays}
            onChange={e => setExpiryDays(e.target.value)} className="input-field w-full" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="حد تصنيف HOT (نقاط)" hint="فوق هذا الحد العميل ساخن">
          <input type="number" min={1} value={hotThreshold}
            onChange={e => setHotThreshold(e.target.value)} className="input-field w-full" />
        </Field>
        <Field label="حد تصنيف WARM (نقاط)" hint="فوق هذا الحد العميل دافئ">
          <input type="number" min={1} value={warmThreshold}
            onChange={e => setWarmThreshold(e.target.value)} className="input-field w-full" />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          حفظ الإعدادات
        </button>
        <SaveStatus status={status} />
      </div>
    </div>
  );
}

// ── API Keys tab ─────────────────────────────────────────────────────────────
function ApiTab({ settings, onSave }) {
  const sections = [
    {
      title: 'مفاتيح ManyChat',
      fields: [
        { key: 'manychat_api_key', label: 'ManyChat API Key', hint: 'من ManyChat → Settings → API → Access Token' },
        { key: 'manychat_page_id', label: 'ManyChat Page ID', hint: 'معرّف صفحة الفيسبوك في ManyChat' },
      ],
    },
    {
      title: 'Flows — أحداث تلقائية',
      hint: 'بتتبعت تلقائياً عند حدث معيّن (زيارة / شراء / تذكير)',
      fields: [
        { key: 'manychat_visit_flow',    label: 'Visit Confirmed Flow',  hint: 'يُرسل عند تأكيد وصول العميل للمعرض' },
        { key: 'manychat_purchase_flow', label: 'Purchase Flow',         hint: 'يُرسل عند تسجيل عملية شراء' },
        { key: 'manychat_reminder_flow', label: 'Location Reminder Flow', hint: 'يُرسل للعملاء الذين طلبوا الموقع ولم يزوروا' },
      ],
    },
    {
      title: 'Flows — الذكاء الاصطناعي (Trigger Engine)',
      hint: 'بتتبعت لما المندوب يضغط "إرسال" على عميل — يختار النظام المناسب تلقائياً',
      fields: [
        { key: 'manychat_flow_immediate',   label: 'Hot Lead — Immediate Flow',  hint: 'للعملاء الساخنين النشطين في آخر 6 ساعات' },
        { key: 'manychat_flow_branch_info', label: 'Branch Info Flow',           hint: 'للعملاء اللي طلبوا موقع الفرع أو زاروا' },
        { key: 'manychat_flow_offer',       label: 'Product Offer Flow',         hint: 'للعملاء اللي شافوا تفاصيل منتج مؤخراً' },
        { key: 'manychat_flow_reengage',    label: 'Re-Engagement Flow',         hint: 'للعملاء الدافئين/الساخنين الغايبين +3 أيام' },
      ],
    },
    {
      title: 'مفاتيح أخرى',
      fields: [
        { key: 'facebook_pixel_id', label: 'Facebook Pixel ID', hint: 'لتتبع تحويلات الإعلانات' },
        { key: 'openai_api_key',    label: 'OpenAI API Key',    hint: 'للميزات المستقبلية بالذكاء الاصطناعي' },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-xl">
      {sections.map(section => (
        <div key={section.title} className="space-y-4">
          <div>
            <h3 className="text-white font-black text-sm">{section.title}</h3>
            {section.hint && <p className="text-dark-500 text-xs mt-0.5">{section.hint}</p>}
          </div>
          <div className="space-y-3">
            {section.fields.map(f => (
              <ApiKeyField
                key={f.key}
                fieldKey={f.key}
                label={f.label}
                hint={f.hint}
                initialValue={settings[f.key] || ''}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApiKeyField({ fieldKey, label, hint, initialValue, onSave }) {
  const [value,   setValue]   = useState(initialValue);
  const [show,    setShow]     = useState(false);
  const [status,  setStatus]  = useState('');

  const handleSave = async () => {
    setStatus('saving');
    const tId = toast.loading('جاري الحفظ...');
    try {
      await onSave(fieldKey, value);
      setStatus('saved');
      toast.success('تم الحفظ بنجاح', { id: tId });
      setTimeout(() => setStatus(''), 3000);
    } catch {
      setStatus('error');
      toast.error('فشل الحفظ', { id: tId });
    }
  };

  const isEmpty = !initialValue;

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-sm">{label}</p>
          <p className="text-dark-500 text-xs mt-0.5">{hint}</p>
        </div>
        {isEmpty && (
          <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> غير مُعَيَّن
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="أدخل المفتاح..."
            className="input-field w-full pl-9 font-mono text-sm"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={handleSave} className="btn-primary px-4">
          <Save className="w-4 h-4" />
        </button>
      </div>
      <SaveStatus status={status} />
    </div>
  );
}

// ── Users tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);  // null | { mode: 'create' | 'edit', user? }

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchUsers();
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (formData) => {
    const tId = toast.loading('جاري الحفظ...');
    try {
      if (modal.mode === 'create') {
        await createUser(formData);
        toast.success('تمت الإضافة بنجاح', { id: tId });
      } else {
        await updateUser(modal.user.id, formData);
        toast.success('تم التعديل بنجاح', { id: tId });
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error('حدث خطأ', { id: tId });
      throw err;
    }
  };

  const roleLabel = (r) => r === 'admin' ? 'مدير' : 'مندوب';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-dark-400 text-sm">{users.length} مستخدم</p>
        <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">
          <Plus className="w-4 h-4" />
          إضافة مستخدم
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-500 border-b border-dark-800 text-right text-[11px] uppercase font-black tracking-wider">
                <th className="py-3 px-5">الاسم</th>
                <th className="py-3 px-5">البريد الإلكتروني</th>
                <th className="py-3 px-5 text-center">الدور</th>
                <th className="py-3 px-5 text-center">تاريخ الإنشاء</th>
                <th className="py-3 px-5 text-center">تعديل</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-dark-800/50 hover:bg-dark-800/20 transition-colors">
                  <td className="py-3 px-5 text-white font-bold">{u.name}</td>
                  <td className="py-3 px-5 text-dark-400 font-mono text-xs">{u.email}</td>
                  <td className="py-3 px-5 text-center">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                      u.role === 'admin'
                        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                        : 'bg-dark-700 text-dark-400 border-dark-600'
                    }`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center text-dark-500 text-xs">
                    {u.created_at?.split('T')[0] || u.created_at?.split(' ')[0]}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <button
                      onClick={() => setModal({ mode: 'edit', user: u })}
                      className="p-1.5 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          user={modal.user}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function UserModal({ mode, user, onSave, onClose }) {
  const [name,     setName]     = useState(user?.name  || '');
  const [email,    setEmail]    = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState(user?.role  || 'rep');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { name, email, role };
      if (password) data.password = password;
      await onSave(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'فشل الحفظ');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-black text-lg">
            {mode === 'create' ? 'إضافة مستخدم جديد' : 'تعديل المستخدم'}
          </h3>
          <button onClick={onClose} className="text-dark-500 hover:text-white p-1 rounded-lg hover:bg-dark-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="الاسم الكامل">
            <input value={name} onChange={e => setName(e.target.value)}
              required className="input-field w-full" />
          </Field>

          <Field label="البريد الإلكتروني">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required dir="ltr" className="input-field w-full" />
          </Field>

          <Field label={mode === 'create' ? 'كلمة المرور' : 'كلمة مرور جديدة (اتركها فارغة للإبقاء على القديمة)'}>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required={mode === 'create'}
                placeholder={mode === 'edit' ? '(اختياري)' : ''}
                className="input-field w-full pl-9"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <Field label="الدور">
            <select value={role} onChange={e => setRole(e.target.value)} className="input-field w-full">
              <option value="rep">مندوب مبيعات</option>
              <option value="admin">مدير النظام</option>
            </select>
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
              {loading
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" />
                : 'حفظ'
              }
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Branches tab ─────────────────────────────────────────────────────────────
function BranchesTab() {
  const [branches, setBranches] = useState([]);   // [{id, name}]
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [editIdx,  setEditIdx]  = useState(null); // index being edited, or null
  const [editBuf,  setEditBuf]  = useState({ id: '', name: '' });
  const [addMode,  setAddMode]  = useState(false);
  const [newBranch, setNewBranch] = useState({ id: '', name: '' });

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBranches()
      .then(setBranches)
      .catch(() => setBranches([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Save full list to DB ───────────────────────────────────────────────────
  const persist = async (list) => {
    setSaving(true);
    const tId = toast.loading('جاري الحفظ...');
    try {
      const saved = await updateBranches(list);
      setBranches(saved);
      toast.success('تم حفظ الفروع بنجاح', { id: tId });
    } catch {
      toast.error('فشل الحفظ', { id: tId });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (idx) => {
    const updated = branches.filter((_, i) => i !== idx);
    persist(updated);
  };

  // ── Start edit ─────────────────────────────────────────────────────────────
  const startEdit = (idx) => {
    setEditIdx(idx);
    setEditBuf({ ...branches[idx] });
  };

  // ── Confirm edit ───────────────────────────────────────────────────────────
  const confirmEdit = () => {
    if (!editBuf.id.trim() || !editBuf.name.trim()) return;
    const updated = branches.map((b, i) =>
      i === editIdx ? { id: editBuf.id.trim(), name: editBuf.name.trim() } : b
    );
    setEditIdx(null);
    persist(updated);
  };

  // ── Add new branch ─────────────────────────────────────────────────────────
  const handleAdd = () => {
    const id   = newBranch.id.trim().replace(/\s+/g, '_').toLowerCase();
    const name = newBranch.name.trim();
    if (!id || !name) {
      toast.error('أدخل معرّف واسم الفرع');
      return;
    }
    if (branches.some(b => b.id === id)) {
      toast.error('المعرّف موجود بالفعل');
      return;
    }
    const updated = [...branches, { id, name }];
    setAddMode(false);
    setNewBranch({ id: '', name: '' });
    persist(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-black text-sm">{branches.length} فرع مُعرَّف</p>
          <p className="text-dark-500 text-xs mt-0.5">
            الفروع تظهر في خيارات العملاء وفلاتر التحليلات
          </p>
        </div>
        <button
          onClick={() => { setAddMode(true); setNewBranch({ id: '', name: '' }); }}
          className="btn-primary"
          disabled={saving}
        >
          <Plus className="w-4 h-4" />
          إضافة فرع
        </button>
      </div>

      {/* Add form */}
      {addMode && (
        <div className="card p-5 border-primary-500/30 bg-primary-500/5 space-y-4">
          <p className="text-primary-300 font-black text-sm">فرع جديد</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المعرّف (بالإنجليزية)" hint="مثال: heliopolis">
              <input
                value={newBranch.id}
                onChange={e => setNewBranch(p => ({ ...p, id: e.target.value }))}
                placeholder="branch_id"
                dir="ltr"
                className="input-field w-full font-mono text-sm"
              />
            </Field>
            <Field label="الاسم العربي" hint="مثال: مصر الجديدة">
              <input
                value={newBranch.name}
                onChange={e => setNewBranch(p => ({ ...p, name: e.target.value }))}
                placeholder="اسم الفرع"
                className="input-field w-full"
              />
            </Field>
          </div>
          <div className="flex gap-3">
            <button onClick={handleAdd} className="btn-primary" disabled={saving}>
              <Plus className="w-4 h-4" /> حفظ
            </button>
            <button onClick={() => setAddMode(false)} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Branches list */}
      {branches.length === 0 ? (
        <div className="card p-10 text-center">
          <Building2 className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">لا توجد فروع — أضف أول فرع</p>
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((branch, idx) => (
            <div
              key={branch.id}
              className="card p-4 flex items-center gap-4"
            >
              {editIdx === idx ? (
                // ── Edit row ──────────────────────────────────────────────
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-dark-500 text-[10px] font-bold uppercase">المعرّف</p>
                      <input
                        value={editBuf.id}
                        onChange={e => setEditBuf(p => ({ ...p, id: e.target.value }))}
                        dir="ltr"
                        className="input-field w-full font-mono text-sm py-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-dark-500 text-[10px] font-bold uppercase">الاسم</p>
                      <input
                        value={editBuf.name}
                        onChange={e => setEditBuf(p => ({ ...p, name: e.target.value }))}
                        className="input-field w-full py-1.5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={confirmEdit}
                      disabled={saving}
                      className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      title="حفظ"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditIdx(null)}
                      className="p-2 rounded-lg bg-dark-700 text-dark-400 hover:text-white transition-colors"
                      title="إلغاء"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                // ── View row ──────────────────────────────────────────────
                <>
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm">{branch.name}</p>
                    <p className="text-dark-500 text-[11px] font-mono">{branch.id}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(idx)}
                      className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      disabled={saving}
                      className="p-2 rounded-lg text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {saving && (
        <p className="text-primary-400 text-xs text-center animate-pulse">
          جاري الحفظ…
        </p>
      )}
    </div>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-dark-300 text-xs font-bold uppercase tracking-wider">{label}</label>
      {hint && <p className="text-dark-600 text-[11px] -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

// ── Main Settings page ────────────────────────────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings,  setSettings]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const s = await fetchSettings();
      setSettings(s);
    } catch (_) {
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async (key, value) => {
    await updateSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: String(value) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12" dir="rtl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-1 bg-primary-600 rounded-full" />
          <span className="text-primary-500 font-black text-[10px] uppercase tracking-[0.2em]">إدارة النظام</span>
        </div>
        <h1 className="text-3xl font-black text-white">الإعدادات</h1>
      </div>

      {/* Tabs */}
      <div className="card p-2 flex gap-1">
        {TABS.map(t => {
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
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'general'  && <GeneralTab  settings={settings} onSave={handleSave} />}
        {activeTab === 'api'      && <ApiTab      settings={settings} onSave={handleSave} />}
        {activeTab === 'users'    && <UsersTab />}
        {activeTab === 'branches' && <BranchesTab />}
      </div>
    </div>
  );
}

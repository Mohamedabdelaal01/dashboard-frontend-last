import { useState, useRef, useEffect } from 'react';
import { ScanLine, CheckCircle, AlertCircle, Megaphone, RotateCcw } from 'lucide-react';
import { confirmVisit, formatBranch } from '../services/api';

// ── State machine: idle → loading → success | error ──────────────────────

const IDLE    = 'idle';
const LOADING = 'loading';
const SUCCESS = 'success';
const ERROR   = 'error';

/**
 * ReceptionDesk — fast-entry screen for showroom receptionists.
 * The receptionist types (or scans) the visit_code printed on the
 * customer's Messenger confirmation message, then hits Enter / تأكيد.
 * On success, the customer's name and campaign source are shown as a
 * welcoming confirmation so staff know who walked in and from which ad.
 */
export default function ReceptionDesk() {
  const [code,   setCode]   = useState('');
  const [state,  setState]  = useState(IDLE);
  const [result, setResult] = useState(null);   // { first_name, campaign_source, lead_class }
  const [errMsg, setErrMsg] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the code input when the tab opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleConfirm = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setState(LOADING);
    setResult(null);
    setErrMsg('');
    try {
      const data = await confirmVisit(trimmed);
      setResult(data);
      setState(SUCCESS);
      setCode('');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setErrMsg('الكود غير موجود — تأكد من الكود وحاول مرة أخرى');
      } else {
        setErrMsg(err?.response?.data?.error || err.message || 'فشل تأكيد الزيارة');
      }
      setState(ERROR);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
  };

  const reset = () => {
    setState(IDLE);
    setCode('');
    setResult(null);
    setErrMsg('');
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-3xl flex items-center justify-center mx-auto">
          <ScanLine className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-2xl font-black text-white">استقبال الزيارات</h2>
        <p className="text-dark-400 text-sm">
          أدخل كود الزيارة الموجود في رسالة المسنجر لتأكيد وصول العميل
        </p>
      </div>

      {/* Input card */}
      <div className="card p-6 space-y-4">
        <label className="block text-dark-400 text-xs font-bold uppercase tracking-wider mb-1">
          كود الزيارة
        </label>

        <div className="flex gap-3">
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="مثال: GF-A3X9"
            maxLength={20}
            disabled={state === LOADING}
            className="input-field flex-1 text-lg font-mono tracking-widest text-center uppercase"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            onClick={handleConfirm}
            disabled={!code.trim() || state === LOADING}
            className="btn-primary px-6 disabled:opacity-50"
          >
            {state === LOADING ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'تأكيد'
            )}
          </button>
        </div>

        <p className="text-dark-600 text-xs text-center">
          اضغط Enter أو انقر تأكيد — الكود غير حساس لحالة الأحرف
        </p>
      </div>

      {/* ── Success ─────────────────────────────── */}
      {state === SUCCESS && result && (
        <div className="card p-6 border-emerald-500/30 bg-emerald-500/5 space-y-4 animate-[fadeIn_0.3s_ease]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
                تأكيد الوصول ✓
              </p>
              <h3 className="text-2xl font-black text-white mb-1">
                أهلاً بك، {result.first_name}!
              </h3>
              {result.campaign_source && (
                <div className="flex items-center gap-1.5 text-xs text-dark-400 font-bold">
                  <Megaphone className="w-3.5 h-3.5 text-primary-400" />
                  <span>عبر حملة:</span>
                  <span className="text-primary-300">{result.campaign_source}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-800/60 hover:bg-dark-800 border border-dark-700 text-dark-300 hover:text-white text-sm font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            تسجيل زيارة أخرى
          </button>
        </div>
      )}

      {/* ── Error ───────────────────────────────── */}
      {state === ERROR && (
        <div className="card p-6 border-rose-500/30 bg-rose-500/5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <p className="text-rose-400 text-xs font-black uppercase tracking-wider mb-1">
                خطأ
              </p>
              <p className="text-white font-bold">{errMsg}</p>
            </div>
          </div>
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-800/60 hover:bg-dark-800 border border-dark-700 text-dark-300 hover:text-white text-sm font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            حاول مرة أخرى
          </button>
        </div>
      )}
    </div>
  );
}

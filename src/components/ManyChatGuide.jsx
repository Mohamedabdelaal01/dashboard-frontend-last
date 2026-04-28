import { useState } from 'react';
import { Copy, Check, BookOpen, Zap, Tag, MapPin, ShoppingBag, ScanLine } from 'lucide-react';

// ── Copy-to-clipboard button ───────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-700 hover:bg-dark-600 text-dark-300 hover:text-white text-xs font-bold transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'تم النسخ' : 'نسخ'}
    </button>
  );
};

// ── Code block ────────────────────────────────────────────────────────────
const CodeBlock = ({ json, title }) => {
  const text = JSON.stringify(json, null, 2);
  return (
    <div className="rounded-xl overflow-hidden border border-dark-700">
      <div className="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-700">
        <span className="text-dark-400 text-xs font-mono font-bold">{title}</span>
        <CopyButton text={text} />
      </div>
      <pre className="p-4 text-xs text-dark-200 font-mono leading-relaxed overflow-x-auto bg-dark-900/80">
        {text}
      </pre>
    </div>
  );
};

// ── Section wrapper ───────────────────────────────────────────────────────
const Section = ({ icon: Icon, color, title, subtitle, children }) => (
  <div className="card p-6 space-y-4">
    <div className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-black text-white">{title}</h3>
        {subtitle && <p className="text-dark-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// ── Snippet definitions ───────────────────────────────────────────────────
const SNIPPETS = {
  basicEvent: {
    user_id:     "{{user id}}",
    first_name:  "{{first name}}",
    event_type:  "product_details",
    event_value: "sofa_berlin",
  },

  withAttribution: {
    user_id:         "{{user id}}",
    first_name:      "{{first name}}",
    event_type:      "product_details",
    event_value:     "sofa_berlin",
    campaign_source: "eid_offer_2025",
    ad_id:           "120208775123456789",
  },

  locationRequest: {
    user_id:         "{{user id}}",
    first_name:      "{{first name}}",
    event_type:      "location_request",
    event_value:     "nasr_city",
    campaign_source: "eid_offer_2025",
    ad_id:           "120208775123456789",
  },

  withVisitCode: {
    user_id:         "{{user id}}",
    first_name:      "{{first name}}",
    event_type:      "branch_selected",
    event_value:     "nasr_city",
    campaign_source: "summer_sale_2025",
    ad_id:           "120208775987654321",
    visit_code:      "GF-{{user id | slice: 0, 4 | upcase}}",
  },

  visitConfirmed: {
    user_id:     "{{user id}}",
    first_name:  "{{first name}}",
    event_type:  "visit_confirmed",
    event_value: "{\"branch\":\"nasr_city\",\"status\":\"arrived\"}",
  },
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function ManyChatGuide() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-1 bg-primary-600 rounded-full" />
          <span className="text-primary-500 font-black text-[10px] uppercase tracking-[0.2em]">
            دليل التكامل
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">دليل إعداد ManyChat</h2>
        <p className="text-dark-400 text-sm mt-1">
          JSON جاهز للنسخ — اربط كل زر في ManyChat بـ webhook يرسل هذه البيانات
        </p>
      </div>

      {/* Webhook URL */}
      <div className="card p-5 border-primary-500/20 bg-primary-500/5">
        <p className="text-primary-400 text-xs font-black uppercase tracking-wider mb-2">
          Webhook URL
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-white font-mono text-sm bg-dark-900/60 px-4 py-2 rounded-xl border border-dark-800 overflow-x-auto">
            POST https://medo-backend-production.up.railway.app/api/events
          </code>
          <CopyButton text="https://medo-backend-production.up.railway.app/api/events" />
        </div>
        <p className="text-dark-500 text-xs mt-2">
          Method: POST — Content-Type: application/json — يُرسل في كل زر أو Flow Action
        </p>
      </div>

      {/* Section 1 — Basic event */}
      <Section
        icon={Zap}
        color="bg-primary-500/10 text-primary-400"
        title="1. حدث بسيط (بدون attribution)"
        subtitle="الحد الأدنى المطلوب — user_id + event_type"
      >
        <CodeBlock json={SNIPPETS.basicEvent} title="POST /api/events — product_details" />
        <div className="bg-dark-900/40 border border-dark-800 rounded-xl p-4 space-y-1.5">
          <p className="text-dark-300 text-xs font-bold">أنواع event_type المقبولة:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'entry_offer','entry_catalog','entry_location',
              'product_details','location_request','contact_request',
              'branch_selected','map_click','visit_confirmed',
            ].map((t) => (
              <code key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-dark-800 border border-dark-700 text-primary-300 font-mono">
                {t}
              </code>
            ))}
          </div>
        </div>
      </Section>

      {/* Section 2 — With attribution */}
      <Section
        icon={Tag}
        color="bg-amber-500/10 text-amber-400"
        title="2. مع بيانات Attribution الإعلان"
        subtitle='أضف campaign_source و ad_id من Custom Fields في ManyChat — يربط العميل بالحملة تلقائياً'
      >
        <CodeBlock json={SNIPPETS.withAttribution} title="POST /api/events — مع attribution" />
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <p className="text-amber-400 text-xs font-black">⚡ كيف تُرسل ManyChat الـ ad_id تلقائياً:</p>
          <ol className="text-dark-300 text-xs space-y-1 list-decimal list-inside">
            <li>في ManyChat → <strong className="text-white">Settings → Custom Fields</strong></li>
            <li>أضف field باسم <code className="text-amber-300">ad_id</code> (نوع Text)</li>
            <li>في Flow Trigger → <strong className="text-white">Ref URL</strong> → اربط ad_id بـ UTM parameter</li>
            <li>في الـ webhook body استخدم: <code className="text-amber-300">{'"ad_id": "{{ad_id}}"'}</code></li>
          </ol>
        </div>
      </Section>

      {/* Section 3 — Location request */}
      <Section
        icon={MapPin}
        color="bg-rose-500/10 text-rose-400"
        title="3. طلب الموقع (location_request)"
        subtitle="عندما يضغط العميل على زر عرض الفروع أو الموقع"
      >
        <CodeBlock json={SNIPPETS.locationRequest} title="POST /api/events — location_request" />
        <p className="text-dark-400 text-xs">
          هذا الحدث يرفع النقاط <strong className="text-white">+40</strong> ويصنّف العميل كـ <span className="text-rose-400 font-bold">HOT</span> إذا كان النقاط ≥ 40.
        </p>
      </Section>

      {/* Section 4 — Visit code */}
      <Section
        icon={ScanLine}
        color="bg-sky-500/10 text-sky-400"
        title="4. كود الزيارة (visit_code)"
        subtitle="أرسل visit_code للعميل عبر ManyChat — الاستقبال يدخله لتأكيد الوصول"
      >
        <CodeBlock json={SNIPPETS.withVisitCode} title="POST /api/events — مع visit_code" />
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 space-y-2">
          <p className="text-sky-400 text-xs font-black">🔑 توليد الكود في ManyChat:</p>
          <ol className="text-dark-300 text-xs space-y-1 list-decimal list-inside">
            <li>استخدم Liquid template: <code className="text-sky-300">GF-{'{{user id | slice: 0, 4 | upcase}}'}</code></li>
            <li>أرسله للعميل في رسالة تأكيد الزيارة</li>
            <li>الاستقبال يُدخله في شاشة <strong className="text-white">استقبال الزيارات</strong> لتأكيد وصول العميل</li>
          </ol>
        </div>
      </Section>

      {/* Section 5 — visit_confirmed */}
      <Section
        icon={ShoppingBag}
        color="bg-emerald-500/10 text-emerald-400"
        title="5. تأكيد الزيارة (visit_confirmed)"
        subtitle="يُرسل من ManyChat بعد أن يؤكد العميل زيارته برسالة أو زر في الـ Flow"
      >
        <CodeBlock json={SNIPPETS.visitConfirmed} title="POST /api/events — visit_confirmed" />
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-emerald-400 text-xs font-black mb-1">
            الفرق بين visit_confirmed و /api/visits/confirm:
          </p>
          <ul className="text-dark-300 text-xs space-y-1 list-disc list-inside">
            <li><strong className="text-white">visit_confirmed event</strong> — يُرسل من ManyChat عندما يؤكد العميل نيّة الزيارة</li>
            <li><strong className="text-white">/api/visits/confirm</strong> — يُستخدم من الاستقبال بعد وصول العميل فعلياً (بالكود)</li>
            <li>كلاهما يُحدّث lead_class إلى <span className="text-sky-400 font-bold">visited</span></li>
          </ul>
        </div>
      </Section>

      {/* Quick reference table */}
      <div className="card p-6">
        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-400" />
          جدول النقاط المرجعي
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-dark-500 border-b border-dark-800 text-right font-black uppercase tracking-wider">
                <th className="py-2 px-3">event_type</th>
                <th className="py-2 px-3 text-center">النقاط</th>
                <th className="py-2 px-3">التأثير</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'entry_offer / entry_catalog',  pts: '+5',   effect: 'يبدأ رحلة العميل' },
                { type: 'entry_location',               pts: '+10',  effect: 'اهتمام بالفروع' },
                { type: 'contact_request',              pts: '+15',  effect: 'يريد التواصل' },
                { type: 'product_details',              pts: '+20',  effect: 'مشاهدة منتج' },
                { type: 'product_details (تكرار)',       pts: '+30',  effect: 'مشاهدة ثانية → bonus' },
                { type: 'branch_selected',              pts: '+30',  effect: 'اختار فرعاً → HOT إذا ≥40' },
                { type: 'location_request',             pts: '+40',  effect: 'طلب الموقع → HOT مباشرة' },
                { type: 'map_click',                    pts: '+25',  effect: 'نقر الخريطة' },
                { type: 'visit_confirmed',              pts: '+100', effect: '→ visited' },
              ].map((r) => (
                <tr key={r.type} className="border-b border-dark-800/50">
                  <td className="py-2.5 px-3">
                    <code className="text-primary-300 font-mono">{r.type}</code>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-emerald-400 font-black">{r.pts}</span>
                  </td>
                  <td className="py-2.5 px-3 text-dark-300">{r.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * VisitActionModals — الـ modals الأربعة لإجراءات الزيارة
 * Phase 3.4/3.5: تحويل لفرصة (مع منع التكرار) · عميل مناسب · متابعة · إغلاق
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { mockPipeline, mockFunds, mockEmployees } from '@/data/mockData';
import type { VisitRecord } from '@/types/visits';
import { pipelineStageLabels } from '@/lib/arabicLabels';
import { formatCurrencyShort, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

// ─── shared helpers ───────────────────────────────────────────
function ModalShell({ title, subtitle, onClose, children, footer }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-watheeq-navy-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="px-6 py-5 border-b border-line/50 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-bold text-watheeq-navy-deep">{title}</h2>
              {subtitle && <p className="text-[12px] text-ink-muted mt-1">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="w-7 h-7 shrink-0 rounded-md flex items-center justify-center text-ink-muted hover:bg-watheeq-bg-cream transition-colors text-[14px]">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        <div className="px-6 py-4 border-t border-line/50 flex gap-3 shrink-0 bg-watheeq-bg-cream/30">{footer}</div>
      </div>
    </div>,
    document.body
  );
}

function FieldGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-bold text-ink-soft flex items-center gap-1">
        {label}{required && <span className="text-state-danger text-[10px]">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full text-[13px] border border-line rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15';

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex-1 py-2.5 border border-line rounded-xl text-[13px] font-bold text-ink-soft hover:bg-watheeq-bg-cream transition-colors">
      إلغاء
    </button>
  );
}

// ─── Success state ─────────────────────────────────────────────
function SuccessState({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="py-10 text-center space-y-4">
      {/* Clean SVG check — no giant emoji */}
      <div className="w-16 h-16 rounded-full bg-state-success-bg border-2 border-state-success/25 flex items-center justify-center mx-auto">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1F8A5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="font-bold text-[15px] text-watheeq-navy-deep">{message}</p>
      <p className="text-[12px] text-ink-muted">إجراء تجريبي، لا يتم حفظ البيانات فعلياً في هذه المرحلة.</p>
      <button type="button" onClick={onClose}
        className="mt-1 px-6 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
        إغلاق
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Convert to Opportunity (with duplicate check)
// ─────────────────────────────────────────────────────────────
export function ConvertToOpportunityModal({ visit, onClose }: { visit: VisitRecord; onClose: () => void }) {
  // Check for existing open opportunity with same client + fund
  const existing = mockPipeline.find((opp) =>
    opp.client_id === visit.client_id &&
    (visit.fund_id ? opp.fund_id === visit.fund_id : true) &&
    opp.stage !== 'Closed' && opp.stage !== 'Lost'
  );

  const [mode, setMode] = useState<'check' | 'new_form' | 'done'>(existing ? 'check' : 'new_form');
  const [doneMsg, setDoneMsg] = useState('');

  // New opportunity form state
  const [amount,     setAmount]     = useState(String(visit.value_estimate ?? ''));
  const [stage,      setStage]      = useState('Lead');
  const [probability,setProbability] = useState('30');
  const [owner,      setOwner]      = useState(visit.owner_name);
  const [nextAction, setNextAction] = useState(visit.next_action ?? '');
  const [dueDate,    setDueDate]    = useState('');

  function confirmLink() { setDoneMsg('تم ربط الزيارة بالفرصة الحالية'); setMode('done'); }
  function confirmNew()  { setDoneMsg('تم إنشاء الفرصة بنجاح'); setMode('done'); }

  if (mode === 'done') {
    return (
      <ModalShell title="تحويل إلى فرصة" onClose={onClose}
        footer={<></>}>
        <SuccessState message={doneMsg} onClose={onClose} />
      </ModalShell>
    );
  }

  // Duplicate detected
  if (mode === 'check' && existing) {
    const fundName = mockFunds.find((f) => f.fund_id === existing.fund_id)?.name_ar ?? existing.fund_id;
    return (
      <ModalShell
        title="فرصة قائمة موجودة"
        subtitle="توجد فرصة مفتوحة لهذا العميل على نفس الصندوق"
        onClose={onClose}
        footer={
          <>
            <CancelBtn onClick={onClose} />
            <button type="button" onClick={() => setMode('new_form')}
              className="flex-1 py-2.5 border border-watheeq-navy/30 rounded-xl text-[13px] font-bold text-watheeq-navy hover:bg-watheeq-navy/5 transition-colors">
              إنشاء فرصة جديدة
            </button>
            <button type="button" onClick={confirmLink}
              className="flex-1 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
              ربط بالفرصة الحالية
            </button>
          </>
        }
      >
        <div className="bg-watheeq-gold/6 border border-watheeq-gold/30 rounded-xl p-4 space-y-2">
          <p className="text-[12px] text-ink-muted mb-2 leading-relaxed">
            هل تريد ربط هذه الزيارة بالفرصة الحالية بدلاً من إنشاء فرصة جديدة؟
          </p>
          {[
            { label: 'العميل',           value: visit.client_name },
            { label: 'الصندوق',          value: fundName },
            { label: 'المرحلة',          value: pipelineStageLabels[existing.stage] },
            { label: 'القيمة المتوقعة', value: formatCurrencyShort(existing.expected_amount) },
            { label: 'الاحتمالية',       value: formatPercent(existing.probability) },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-[13px]">
              <span className="text-ink-muted">{r.label}</span>
              <span className="font-bold text-ink">{r.value}</span>
            </div>
          ))}
        </div>
      </ModalShell>
    );
  }

  // New opportunity form
  return (
    <ModalShell
      title="تحويل الزيارة إلى فرصة"
      subtitle={visit.client_name}
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <button type="button" onClick={confirmNew}
            className="flex-1 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
            إنشاء فرصة
          </button>
        </>
      }
    >
      <FieldGroup label="العميل"><p className="text-[14px] font-bold text-watheeq-navy-deep">{visit.client_name}</p></FieldGroup>
      {visit.fund_name && <FieldGroup label="الصندوق"><p className="text-[14px] font-bold text-watheeq-navy-deep">{visit.fund_name}</p></FieldGroup>}
      <FieldGroup label="القيمة المتوقعة (ر.س)" required>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} placeholder="مثال: 15000000" />
      </FieldGroup>
      <FieldGroup label="المرحلة المبدئية" required>
        <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls}>
          {Object.entries(pipelineStageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </FieldGroup>
      <FieldGroup label="الاحتمالية (%)">
        <input type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} className={inputCls} />
      </FieldGroup>
      <FieldGroup label="المسؤول">
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
          {mockEmployees.filter((e) => e.is_active).map((e) => <option key={e.employee_id} value={e.name_ar}>{e.name_ar}</option>)}
        </select>
      </FieldGroup>
      <FieldGroup label="الخطوة التالية">
        <input type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)} className={inputCls} placeholder="أدخل الخطوة التالية" />
      </FieldGroup>
      <FieldGroup label="تاريخ المتابعة">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
      </FieldGroup>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Suitable Client Modal
// ─────────────────────────────────────────────────────────────
export function SuitableClientModal({ visit, onClose }: { visit: VisitRecord; onClose: () => void }) {
  const [done,    setDone]    = useState(false);
  const [fundId,  setFundId]  = useState(visit.fund_id ?? '');
  const [score,   setScore]   = useState('60');
  const [reason,  setReason]  = useState('');
  const [notes,   setNotes]   = useState('');
  const [followDate, setFollowDate] = useState('');

  if (done) return (
    <ModalShell title="إضافة إلى العملاء المناسبين" onClose={onClose} footer={<></>}>
      <SuccessState message="تمت إضافة العميل إلى قائمة العملاء المناسبين" onClose={onClose} />
    </ModalShell>
  );

  return (
    <ModalShell
      title="إضافة إلى العملاء المناسبين"
      subtitle={`${visit.client_name} — قائمة المستثمرين المناسبين (Watchlist)`}
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <button type="button" onClick={() => setDone(true)}
            className="flex-1 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
            إضافة إلى القائمة
          </button>
        </>
      }
    >
      <FieldGroup label="العميل"><p className="text-[14px] font-bold text-watheeq-navy-deep">{visit.client_name}</p></FieldGroup>
      <FieldGroup label="الصندوق المناسب" required>
        <select value={fundId} onChange={(e) => setFundId(e.target.value)} className={inputCls}>
          <option value="">— اختر الصندوق —</option>
          {mockFunds.map((f) => <option key={f.fund_id} value={f.fund_id}>{f.name_ar}</option>)}
        </select>
      </FieldGroup>
      <FieldGroup label="درجة الملاءمة التقديرية (%)">
        <input type="range" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} className="w-full" />
        <div className="flex justify-between text-[12px] text-ink-muted"><span>0%</span><span className="font-bold text-watheeq-navy-deep num">{score}%</span><span>100%</span></div>
      </FieldGroup>
      <FieldGroup label="سبب الملاءمة">
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="مثال: يتوافق مع ملف المخاطرة والعائد المطلوب" />
      </FieldGroup>
      <FieldGroup label="ملاحظات">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputCls, 'resize-none')} placeholder="أي ملاحظات إضافية…" />
      </FieldGroup>
      <FieldGroup label="تاريخ المتابعة المقترح">
        <input type="date" value={followDate} onChange={(e) => setFollowDate(e.target.value)} className={inputCls} />
      </FieldGroup>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Follow-up Modal
// ─────────────────────────────────────────────────────────────
export function FollowUpModal({ visit, onClose }: { visit: VisitRecord; onClose: () => void }) {
  const [done,     setDone]     = useState(false);
  const [type,     setType]     = useState('');
  const [owner,    setOwner]    = useState(visit.owner_name);
  const [dueDate,  setDueDate]  = useState('');
  const [desc,     setDesc]     = useState('');
  const [err,      setErr]      = useState('');

  const FOLLOW_UP_TYPES = [
    'إرسال مستند', 'اتصال', 'اجتماع جديد', 'رد على استفسار',
    'إرسال محضر', 'إرسال Teaser', 'إرسال عرض معدل',
  ];

  if (done) return (
    <ModalShell title="إنشاء متابعة لاحقة" onClose={onClose} footer={<></>}>
      <SuccessState message="تم إنشاء متابعة ✓" onClose={onClose} />
    </ModalShell>
  );

  function handleSubmit() {
    if (!type) { setErr('اختر نوع المتابعة'); return; }
    if (!dueDate) { setErr('حدد تاريخ الاستحقاق'); return; }
    setDone(true);
  }

  return (
    <ModalShell
      title="إنشاء متابعة لاحقة"
      subtitle={visit.client_name}
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <button type="button" onClick={handleSubmit}
            className="flex-1 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
            إنشاء متابعة
          </button>
        </>
      }
    >
      {err && <p className="text-[12px] text-state-danger font-medium">{err}</p>}
      <FieldGroup label="نوع المتابعة" required>
        <select value={type} onChange={(e) => { setType(e.target.value); setErr(''); }} className={inputCls}>
          <option value="">— اختر النوع —</option>
          {FOLLOW_UP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </FieldGroup>
      <FieldGroup label="المالك">
        <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
          {mockEmployees.filter((e) => e.is_active).map((e) => <option key={e.employee_id} value={e.name_ar}>{e.name_ar}</option>)}
        </select>
      </FieldGroup>
      <FieldGroup label="تاريخ الاستحقاق" required>
        <input type="date" value={dueDate} onChange={(e) => { setDueDate(e.target.value); setErr(''); }} className={inputCls} />
      </FieldGroup>
      <FieldGroup label="وصف المتابعة">
        <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className={cn(inputCls, 'resize-none')} placeholder="ما الذي يجب فعله تحديداً؟" />
      </FieldGroup>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Close Without Opportunity Modal
// ─────────────────────────────────────────────────────────────
export function CloseNoOpportunityModal({ visit, onClose }: { visit: VisitRecord; onClose: () => void }) {
  const [done,   setDone]   = useState(false);
  const [reason, setReason] = useState('');
  const [notes,  setNotes]  = useState('');
  const [err,    setErr]    = useState('');

  const CLOSE_REASONS = [
    'زيارة علاقة فقط', 'غير مناسب حالياً', 'لا يوجد اهتمام',
    'لا يوجد صندوق مناسب', 'العميل غير جاهز', 'سبب آخر',
  ];

  if (done) return (
    <ModalShell title="إغلاق الزيارة بدون فرصة" onClose={onClose} footer={<></>}>
      <SuccessState message="تم إغلاق الزيارة بدون فرصة" onClose={onClose} />
    </ModalShell>
  );

  return (
    <ModalShell
      title="إغلاق الزيارة بدون فرصة"
      subtitle={visit.client_name}
      onClose={onClose}
      footer={
        <>
          <CancelBtn onClick={onClose} />
          <button type="button" onClick={() => { if (!reason) { setErr('اختر سبب الإغلاق'); return; } setDone(true); }}
            className="flex-1 py-2.5 bg-state-danger text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-colors">
            تأكيد الإغلاق
          </button>
        </>
      }
    >
      {err && <p className="text-[12px] text-state-danger font-medium">{err}</p>}
      <div className="bg-state-warning-bg border border-state-warning/25 rounded-xl p-3">
        <p className="text-[12px] text-state-warning font-medium">
          تأكيد: ستُغلق الزيارة بدون أي فرصة استثمارية ناتجة. يمكنك إعادة فتحها لاحقاً.
        </p>
      </div>
      <FieldGroup label="سبب الإغلاق" required>
        {CLOSE_REASONS.map((r) => (
          <label key={r} className="flex items-center gap-2.5 py-2 px-3 rounded-lg border border-line/40 cursor-pointer hover:bg-watheeq-bg-cream/50 mb-1.5">
            <input type="radio" name="close_reason" value={r} checked={reason === r} onChange={() => { setReason(r); setErr(''); }}
              className="accent-watheeq-navy" />
            <span className="text-[13px] text-ink">{r}</span>
          </label>
        ))}
      </FieldGroup>
      <FieldGroup label="ملاحظات إضافية">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(inputCls, 'resize-none')} placeholder="أي تفاصيل مهمة للسجل…" />
      </FieldGroup>
    </ModalShell>
  );
}
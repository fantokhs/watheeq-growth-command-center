/**
 * ReportSetupModal — نموذج إعداد التقرير
 * يعرض فقط الحقول المطلوبة لكل نوع تقرير:
 *   اختيار عميل | اختيار صندوق | فترة زمنية | مسؤول | ملاحظات
 * لا يفتح المعاينة مباشرة — يُرسل النتيجة لـ onSubmit فقط.
 */

import { useState } from 'react';
import {
  mockClients, mockFunds, mockEmployees,
} from '@/data/mockData';
import {
  REPORT_TYPE_LABELS, REPORT_AUDIENCE_LABELS,
} from '@/types/reports';
import type { ReportType } from '@/types/reports';
import type { ReportPreviewState } from '@/hooks/useReportPreview';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Requirements matrix per report type
// ─────────────────────────────────────────────
interface ReportReqs {
  needsClient?: boolean;
  needsFund?: boolean;
  needsDate?: boolean;
  needsOwner?: boolean; // optional owner
}

export const REPORT_REQS: Record<ReportType, ReportReqs> = {
  client_summary:        { needsClient: true },
  pre_visit:             { needsClient: true },
  fund_teaser:           { needsFund: true },
  fund_fundraising:      { needsFund: true, needsDate: true },
  fund_update:           { needsFund: true },
  recommended_investors: { needsFund: true },
  weekly_visits:         { needsDate: true, needsOwner: true },
  management_attention:  { needsDate: true, needsOwner: true },
  ceo_weekly:            { needsDate: true },
  rm_performance:        { needsOwner: true, needsDate: true },
  sla_followup:          { needsDate: true, needsOwner: true },
};

const REPORT_PURPOSE: Record<ReportType, string> = {
  client_summary:        'ملخص شامل لعلاقة الاستثمار مع عميل محدد',
  pre_visit:             'تحضير الفريق قبل اجتماع أو زيارة لعميل',
  fund_teaser:           'ملخص تعريفي بالصندوق لمشاركته مع المستثمرين',
  fund_fundraising:      'تتبع تقدم استقطاب الأموال في صندوق معين',
  fund_update:           'تحديث دوري عن أداء الصندوق وحصة العميل فيه',
  recommended_investors: 'قائمة المستثمرين الموصى بهم لصندوق محدد',
  weekly_visits:         'خطة وملخص زيارات الأسبوع للفريق',
  management_attention:  'فرص تستوجب قراراً أو تدخلاً من الإدارة',
  ceo_weekly:            'ملخص الأسبوع للرئيس التنفيذي والفريق التنفيذي',
  rm_performance:        'تقييم أداء مدير علاقة محدد',
  sla_followup:          'رصد انضباط المتابعة والفرص بدون خطوة تالية',
};

// ─────────────────────────────────────────────
// Requirement badges (small chips shown on cards)
// ─────────────────────────────────────────────
export function ReportReqBadges({ type, size = 'sm' }: { type: ReportType; size?: 'sm' | 'xs' }) {
  const reqs = REPORT_REQS[type];
  const chips: { label: string; color: string }[] = [];
  if (reqs.needsClient) chips.push({ label: 'يتطلب عميل', color: '#2563EB' });
  if (reqs.needsFund)   chips.push({ label: 'يتطلب صندوق', color: '#263F82' });
  if (reqs.needsDate)   chips.push({ label: 'يتطلب فترة', color: '#C88719' });
  if (reqs.needsOwner)  chips.push({ label: 'مسؤول', color: '#5E7AB5' });

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c) => (
        <span key={c.label} className={cn('inline-flex items-center font-semibold rounded border whitespace-nowrap', size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5')}
          style={{ color: c.color, borderColor: c.color + '33', background: c.color + '10' }}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────
interface ReportSetupModalProps {
  reportType: ReportType;
  /** قيم مبدئية (مثلاً من drawer عميل أو صندوق) */
  prefillClientId?: string;
  prefillFundId?: string;
  prefillOwnerId?: string;
  onSubmit: (state: ReportPreviewState) => void;
  onClose: () => void;
}

export function ReportSetupModal({
  reportType,
  prefillClientId,
  prefillFundId,
  prefillOwnerId,
  onSubmit,
  onClose,
}: ReportSetupModalProps) {
  const reqs   = REPORT_REQS[reportType];
  const label  = REPORT_TYPE_LABELS[reportType];

  const [clientId,  setClientId]  = useState(prefillClientId  ?? '');
  const [fundId,    setFundId]    = useState(prefillFundId    ?? '');
  const [ownerId,   setOwnerId]   = useState(prefillOwnerId   ?? '');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [notes,     setNotes]     = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (reqs.needsClient && !clientId) e.client = 'اختر العميل أولاً';
    if (reqs.needsFund   && !fundId)   e.fund   = 'اختر الصندوق أولاً';
    if (reqs.needsDate   && !dateFrom) e.date   = 'حدد الفترة الزمنية أولاً';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({
      reportType,
      clientId:  clientId  || undefined,
      fundId:    fundId    || undefined,
      ownerId:   ownerId   || undefined,
      notes:     notes.trim() || undefined,
      fromContext: false,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-watheeq-navy-deep/55 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-line/60 shrink-0">
          <div>
            <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1">إعداد التقرير</p>
            <h2 className="text-[16px] font-bold text-watheeq-navy-deep leading-tight">{label}</h2>
            <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">{REPORT_PURPOSE[reportType]}</p>
          </div>
          <button type="button" onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-watheeq-bg-cream transition-colors mt-0.5">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Required inputs chip summary */}
          <ReportReqBadges type={reportType} />

          {/* Client selector */}
          {reqs.needsClient && (
            <FieldGroup label="اختيار العميل" required error={errors.client}>
              <select value={clientId} onChange={(e) => { setClientId(e.target.value); setErrors((p) => ({ ...p, client: '' })); }}
                className={selectCls(!!errors.client)}>
                <option value="">— اختر العميل —</option>
                {mockClients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>{c.name_ar}</option>
                ))}
              </select>
            </FieldGroup>
          )}

          {/* Fund selector */}
          {reqs.needsFund && (
            <FieldGroup label="اختيار الصندوق" required error={errors.fund}>
              <select value={fundId} onChange={(e) => { setFundId(e.target.value); setErrors((p) => ({ ...p, fund: '' })); }}
                className={selectCls(!!errors.fund)}>
                <option value="">— اختر الصندوق —</option>
                {mockFunds.map((f) => (
                  <option key={f.fund_id} value={f.fund_id}>{f.name_ar}</option>
                ))}
              </select>
            </FieldGroup>
          )}

          {/* Date range */}
          {reqs.needsDate && (
            <FieldGroup label="الفترة الزمنية" required error={errors.date}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-ink-muted block mb-1">من</label>
                  <input type="date" value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setErrors((p) => ({ ...p, date: '' })); }}
                    className={selectCls(!!errors.date)} />
                </div>
                <div>
                  <label className="text-[11px] text-ink-muted block mb-1">إلى</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className={selectCls(false)} />
                </div>
              </div>
            </FieldGroup>
          )}

          {/* Owner selector (optional) */}
          {reqs.needsOwner && (
            <FieldGroup label="المسؤول (اختياري)">
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}
                className={selectCls(false)}>
                <option value="">— جميع المسؤولين —</option>
                {mockEmployees.filter((e) => e.is_active).map((e) => (
                  <option key={e.employee_id} value={e.employee_id}>{e.name_ar}</option>
                ))}
              </select>
            </FieldGroup>
          )}

          {/* Notes */}
          <FieldGroup label="ملاحظات اختيارية تظهر في التقرير">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="أضف أي ملاحظات خاصة أو تعليمات للتقرير…"
              className="w-full text-[13px] border border-line rounded-lg px-3 py-2 leading-relaxed resize-none focus:outline-none focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15"
            />
          </FieldGroup>

          {/* Report meta */}
          <div className="bg-watheeq-bg-cream/60 rounded-xl px-4 py-3 border border-line/50 text-[12px] text-ink-muted space-y-1">
            <div className="flex justify-between"><span>نوع التقرير</span><span className="font-bold text-ink">{label}</span></div>
            <div className="flex justify-between"><span>الجمهور</span><span className="font-medium text-ink">{REPORT_AUDIENCE_LABELS[REPORT_AUDIENCE_MAP[reportType] ?? 'internal']}</span></div>
            <div className="flex justify-between"><span>مصدر البيانات</span><span className="text-state-warning font-medium">بيانات تجريبية</span></div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-line/50 flex gap-3 shrink-0 bg-watheeq-bg-cream/30">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-line rounded-xl text-[13px] font-bold text-ink-soft hover:bg-watheeq-bg-cream transition-colors">
            إلغاء
          </button>
          <button type="button" onClick={handleSubmit}
            className="flex-1 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
            استعراض التقرير
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function FieldGroup({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-bold text-ink-soft flex items-center gap-1">
        {label}
        {required && <span className="text-state-danger text-[10px]">*</span>}
      </label>
      {children}
      {error && <p className="text-[12px] text-state-danger font-medium">{error}</p>}
    </div>
  );
}

const selectCls = (hasError: boolean) =>
  cn(
    'w-full text-[13px] border rounded-lg px-3 py-2 bg-white focus:outline-none transition-colors',
    hasError
      ? 'border-state-danger focus:border-state-danger focus:ring-2 focus:ring-state-danger/15'
      : 'border-line focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15'
  );

const REPORT_AUDIENCE_MAP: Record<ReportType, import('@/types/reports').ReportAudience> = {
  client_summary:        'client',
  pre_visit:             'internal',
  fund_teaser:           'client',
  fund_fundraising:      'management',
  fund_update:           'client',
  recommended_investors: 'bd_team',
  weekly_visits:         'management',
  management_attention:  'ceo',
  ceo_weekly:            'ceo',
  rm_performance:        'management',
  sla_followup:          'management',
};

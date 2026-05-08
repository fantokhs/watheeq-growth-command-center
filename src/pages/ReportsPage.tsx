import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FilterSearch } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/States';
import { ReportGate } from '@/components/reports/ReportGate';
import { ReportSetupModal, REPORT_REQS, ReportReqBadges } from '@/components/reports/ReportSetupModal';
import { useReportPreview } from '@/hooks/useReportPreview';
import { mockReportRecords, mockDeliveryLog } from '@/data/mockReports';
import {
  REPORT_TYPE_LABELS, REPORT_AUDIENCE_LABELS,
  REPORT_STATUS_LABELS, DELIVERY_STATUS_LABELS,
  STATUS_TONE,
} from '@/types/reports';
import type { ReportRecord, ReportType } from '@/types/reports';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Report catalogue grouped by audience
// ─────────────────────────────────────────────
interface CatalogueEntry {
  type: ReportType;
  purpose: string;
}

const CATALOGUE: Array<{ groupTitle: string; icon: string; entries: CatalogueEntry[] }> = [
  {
    groupTitle: 'تقارير العملاء',
    icon: '👤',
    entries: [
      { type: 'client_summary', purpose: 'ملخص شامل للعلاقة والاستثمارات مع عميل محدد' },
      { type: 'pre_visit',      purpose: 'تحضير الفريق قبل اجتماع أو زيارة — للاستخدام الداخلي' },
    ],
  },
  {
    groupTitle: 'تقارير الصناديق',
    icon: '🏦',
    entries: [
      { type: 'fund_teaser',           purpose: 'وثيقة تعريفية بالصندوق تُشارك مع المستثمرين المحتملين' },
      { type: 'fund_fundraising',      purpose: 'تقدم الاستقطاب والبايبلاين والفرص المفتوحة' },
      { type: 'recommended_investors', purpose: 'قائمة المستثمرين الأنسب بناءً على نموذج المطابقة' },
    ],
  },
  {
    groupTitle: 'تقارير تطوير الأعمال',
    icon: '📈',
    entries: [
      { type: 'weekly_visits',       purpose: 'خطة زيارات الأسبوع وتوزيع المسؤوليات' },
      { type: 'management_attention', purpose: 'فرص تستوجب قراراً أو تدخلاً فورياً من الإدارة' },
    ],
  },
  {
    groupTitle: 'تقارير الإدارة',
    icon: '📊',
    entries: [
      { type: 'ceo_weekly',      purpose: 'ملخص الأسبوع للرئيس التنفيذي والفريق التنفيذي' },
      { type: 'rm_performance',  purpose: 'تقييم أداء مدير العلاقة — شهري أو دوري' },
      { type: 'sla_followup',    purpose: 'رصد الفرص بدون متابعة والعملاء المهملين' },
    ],
  },
];

const REGULATORY = [
  { title: 'حزمة تقرير الصندوق للجهات التنظيمية', icon: '🏛' },
  { title: 'تقرير الإفصاحات الدورية',              icon: '📋' },
  { title: 'تقرير الاشتراكات والاستردادات',         icon: '💹' },
  { title: 'تقرير التغيرات الجوهرية',              icon: '🔄' },
  { title: 'تقرير المخاطر والالتزام',              icon: '⚖️' },
];

// badge tone helpers
const statusTone = (s: ReportRecord['status']) =>
  s === 'approved' ? 'success' : s === 'ready' ? 'info' : s === 'sent' ? 'navy' : s === 'needs_update' ? 'warning' : 'neutral';

const deliveryTone = (s: ReportRecord['delivery_status']) =>
  s === 'downloaded' ? 'success' : s === 'sent_email' ? 'info' : s === 'sent_whatsapp' ? 'navy' : s === 'scheduled' ? 'gold' : s === 'pending' ? 'warning' : 'neutral';

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export function ReportsPage() {
  const { state: rptState, openReport, close: closeReport } = useReportPreview();
  const [setupType, setSetupType] = useState<ReportType | null>(null);

  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState<'catalogue' | 'library' | 'log' | 'regulatory'>('catalogue');

  const reports = mockReportRecords;
  const log     = mockDeliveryLog;

  const filteredReports = useMemo(() => reports.filter((r) =>
    !search || r.title.includes(search) || REPORT_TYPE_LABELS[r.report_type].includes(search)
  ), [reports, search]);

  // Open from catalogue → setup modal always
  function handleCatalogueOpen(type: ReportType) {
    setSetupType(type);
  }

  // Open from library card → setup modal with prefill from record
  function handleLibraryOpen(r: ReportRecord) {
    setSetupType(r.report_type);
  }

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي التقارير',      value: reports.length },
          { label: 'جاهز / معتمد',          value: reports.filter((r) => r.status === 'ready' || r.status === 'approved').length },
          { label: 'لم يُرسل بعد',         value: reports.filter((r) => r.delivery_status === 'not_sent').length },
          { label: 'أُرسل هذا الشهر',      value: reports.filter((r) => r.delivery_status === 'sent_email' || r.delivery_status === 'sent_whatsapp').length },
        ].map((s) => (
          <div key={s.label} className="surface-card px-4 py-4">
            <p className="text-[12px] text-ink-muted mb-1">{s.label}</p>
            <p className="num font-bold text-[22px] text-watheeq-navy-deep">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-line/60 bg-watheeq-bg-paper rounded-t-xl">
        {([
          ['catalogue', 'إنشاء تقرير'],
          ['library',   'مكتبة التقارير'],
          ['log',       'سجل الإرسال'],
          ['regulatory','تنظيمية / حوكمة'],
        ] as const).map(([key, lbl]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={cn('px-5 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-px',
              tab === key
                ? 'text-watheeq-navy-deep border-watheeq-gold bg-watheeq-gold/5 rounded-t-lg'
                : 'text-ink-muted border-transparent hover:text-ink hover:bg-watheeq-bg-cream/50'
            )}>
            {lbl}
            {key === 'catalogue' && (
              <span className={cn('ms-1.5 num text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                tab === 'catalogue' ? 'bg-watheeq-navy/15 text-watheeq-navy' : 'bg-watheeq-navy/8 text-watheeq-navy/60')}>
                {CATALOGUE.reduce((s, g) => s + g.entries.length, 0)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Catalogue ────────────────────────────────────── */}
      {tab === 'catalogue' && (
        <div className="space-y-6">
          {CATALOGUE.map((group) => (
            <div key={group.groupTitle}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[18px]">{group.icon}</span>
                <h3 className="text-[14px] font-bold text-watheeq-navy-deep">{group.groupTitle}</h3>
                <div className="flex-1 h-px bg-gradient-to-l from-line/60 to-transparent ms-1" />
              </div>

              {/* Report cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.entries.map(({ type, purpose }) => (
                  <CatalogueCard
                    key={type}
                    type={type}
                    purpose={purpose}
                    onSetup={() => handleCatalogueOpen(type)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Library ──────────────────────────────────────── */}
      {tab === 'library' && (
        <>
          <div className="flex items-center gap-3">
            <FilterSearch value={search} onChange={setSearch} placeholder="ابحث في التقارير…" />
            <span className="text-[13px] text-ink-muted whitespace-nowrap">
              <span className="num font-bold text-ink">{filteredReports.length}</span> تقرير
            </span>
          </div>

          {filteredReports.length === 0
            ? <EmptyState title="لا توجد نتائج" message="جرب مصطلحاً آخر." />
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((r) => (
                  <LibraryCard key={r.report_id} report={r} onOpen={() => handleLibraryOpen(r)} />
                ))}
              </div>
            )
          }
        </>
      )}

      {/* ── Delivery Log ─────────────────────────────────── */}
      {tab === 'log' && (
        <div className="surface-card overflow-hidden">
          <div className="px-5 py-4 border-b border-line/50">
            <h3 className="font-bold text-[14px] text-watheeq-navy-deep">سجل الإرسال</h3>
            <p className="text-[12px] text-ink-muted mt-0.5">آخر عمليات إرسال واستلام التقارير</p>
          </div>
          {log.length === 0
            ? <EmptyState title="لا توجد سجلات إرسال" minHeight="120px" />
            : (
              <div className="divide-y divide-line/40">
                {log.map((entry) => (
                  <div key={entry.log_id} className="flex items-center gap-4 px-5 py-4 hover:bg-watheeq-bg-cream/40 transition-colors">
                    <span className="text-[22px] shrink-0">
                      {entry.channel === 'email' ? '✉️' : entry.channel === 'whatsapp' ? '💬' : entry.channel === 'download' ? '⬇️' : '⚙️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-watheeq-navy-deep truncate">{entry.report_title}</p>
                      <p className="text-[12px] text-ink-muted">{entry.recipient}</p>
                    </div>
                    <div className="text-end shrink-0 space-y-1">
                      <Badge tone={entry.status === 'sent_test' ? 'success' : entry.status === 'failed' ? 'danger' : 'neutral'} size="sm">
                        {entry.status === 'sent_test' ? 'أرسل تجريبياً' : entry.status === 'failed' ? 'فشل' : entry.status === 'ready' ? 'جاهز' : 'بانتظار التفعيل'}
                      </Badge>
                      <p className="num text-[11px] text-ink-faint">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── Regulatory (locked) ──────────────────────────── */}
      {tab === 'regulatory' && (
        <div className="space-y-4">
          <div className="bg-watheeq-gold/6 border border-watheeq-gold/30 rounded-xl px-5 py-4">
            <p className="text-[13px] font-bold text-watheeq-gold-deep mb-1">ملاحظة تنظيمية</p>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              تحتاج هذه القوالب إلى مواءمة نهائية مع مسؤول الالتزام والمتطلبات التنظيمية المعتمدة.
              ستُفعَّل في مرحلة الالتزام والحوكمة.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGULATORY.map((r) => (
              <div key={r.title} className="surface-card p-4 opacity-55 select-none">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[22px]">{r.icon}</span>
                  <p className="text-[13px] font-bold text-watheeq-navy-deep leading-snug">{r.title}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone="neutral" size="sm">قريباً</Badge>
                  <span className="text-[16px]">🔒</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup modal — opens before preview when from Reports Center */}
      {setupType && (
        <ReportSetupModal
          reportType={setupType}
          onSubmit={(state) => {
            setSetupType(null);
            openReport(state);
          }}
          onClose={() => setSetupType(null)}
        />
      )}

      {/* Report preview */}
      <ReportGate state={rptState} onClose={closeReport} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Catalogue card — clean, no visual noise
// ─────────────────────────────────────────────
function CatalogueCard({ type, purpose, onSetup }: {
  type: ReportType; purpose: string; onSetup: () => void;
}) {
  const reqs = REPORT_REQS[type];
  const needsSetup = reqs.needsClient || reqs.needsFund || reqs.needsDate || reqs.needsOwner;

  return (
    <div className="surface-card p-4 flex flex-col gap-3 hover:shadow-card-hover transition-all">
      <div className="flex-1">
        <p className="text-[14px] font-bold text-watheeq-navy-deep leading-snug mb-1.5">
          {REPORT_TYPE_LABELS[type]}
        </p>
        <p className="text-[12px] text-ink-muted leading-relaxed mb-2">{purpose}</p>
        <ReportReqBadges type={type} size="xs" />
      </div>
      <button type="button" onClick={onSetup}
        className={cn(
          'w-full py-2 rounded-lg text-[13px] font-bold transition-all',
          needsSetup
            ? 'bg-watheeq-navy text-white hover:bg-watheeq-navy-deep'
            : 'bg-watheeq-navy text-white hover:bg-watheeq-navy-deep'
        )}>
        {needsSetup ? '⚙ إعداد التقرير' : '👁 استعراض'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Library card — recent generated reports
// ─────────────────────────────────────────────
function LibraryCard({ report, onOpen }: { report: ReportRecord; onOpen: () => void }) {
  const color = STATUS_TONE[report.status];
  return (
    <div className="surface-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-bold text-watheeq-navy-deep leading-snug flex-1">{report.title}</p>
        <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: color }} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={statusTone(report.status)} size="sm">{REPORT_STATUS_LABELS[report.status]}</Badge>
        <Badge tone={deliveryTone(report.delivery_status)} size="sm">{DELIVERY_STATUS_LABELS[report.delivery_status]}</Badge>
      </div>
      <div className="flex items-center justify-between text-[12px] text-ink-muted">
        <span>{REPORT_AUDIENCE_LABELS[report.audience]}</span>
        <span className="num">{formatDate(report.generated_at)}</span>
      </div>
      <div className="flex gap-2 pt-1 border-t border-line/40">
        <button type="button" onClick={onOpen}
          className="flex-1 py-2 text-[12px] font-bold text-watheeq-navy bg-watheeq-navy/8 hover:bg-watheeq-navy hover:text-white rounded-lg transition-all">
          ⚙ إعداد وعرض
        </button>
        <button type="button" onClick={() => alert('سيتم تفعيل هذه الخاصية في مرحلة الربط والإرسال.')}
          className="py-2 px-3 text-[12px] font-bold text-ink-muted border border-line rounded-lg hover:border-watheeq-navy hover:text-watheeq-navy transition-all">
          ⬇
        </button>
      </div>
    </div>
  );
}

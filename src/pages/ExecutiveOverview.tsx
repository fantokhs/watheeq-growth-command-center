import { useMemo, useState } from 'react';
import { ReportGate } from '@/components/reports/ReportGate';
import { useReportPreview } from '@/hooks/useReportPreview';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
} from 'recharts';

import {
  useDashboard,
  usePipeline,
  useFinancials,
  useBillionPlan,
  useVisits,
  useClients,
  useFunds,
  useEmployees,
} from '@/hooks';
import { KPICard } from '@/components/ui/KPICard';
import { ChartCard } from '@/components/ui/ChartCard';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import {
  formatCurrency,
  formatCurrencyShort,
  formatCurrencyShortParts,
  formatNumber,
  formatPercent,
  formatDateShort,
  clampPct,
} from '@/lib/format';
import {
  pipelineStageLabels,
  kpiLabels,
} from '@/lib/arabicLabels';
import { brandColors, pipelineStageColors } from '@/styles/brandTokens';
import type { PipelineItem, PipelineStage, Visit } from '@/types';

// ============================================================
// Inline icons - أكبر قليلاً وأنحف
// ============================================================
const Icon = {
  vault: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="6" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="18" />
    </svg>
  ),
  trend: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  funnel: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  star: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  briefcase: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  users: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  target: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  calendar: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  alert: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  scale: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 8l9 0M3 8a3 3 0 0 0 6 0M3 8a3 3 0 0 1 6 0" />
      <path d="M21 8l-9 0M15 8a3 3 0 0 0 6 0M15 8a3 3 0 0 1 6 0" />
    </svg>
  ),
  flag: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

// Tooltip style موحد للرسوم
const tooltipStyle = {
  direction: 'rtl' as const,
  fontSize: 13,
  fontFamily: 'HSN Shahd, sans-serif',
  border: `1px solid ${brandColors.line}`,
  borderRadius: 10,
  boxShadow: '0 8px 24px -8px rgba(7, 26, 44, 0.18), 0 2px 4px rgba(7, 26, 44, 0.06)',
  padding: '10px 14px',
  background: 'white',
};

// ============================================================
// Page
// ============================================================
export function ExecutiveOverview() {
  const dashboardQ = useDashboard();
  const pipelineQ = usePipeline();
  const financialsQ = useFinancials();
  const billionPlanQ = useBillionPlan();
  const visitsQ = useVisits();
  const clientsQ = useClients();
  const fundsQ = useFunds();
  const employeesQ = useEmployees();
  const { isOpen: rptOpen, state: rptState, openReport, close: closeReport } = useReportPreview();

  const isLoading =
    dashboardQ.isLoading ||
    pipelineQ.isLoading ||
    financialsQ.isLoading ||
    billionPlanQ.isLoading;

  const isError =
    dashboardQ.isError ||
    pipelineQ.isError ||
    financialsQ.isError ||
    billionPlanQ.isError;

  if (isLoading) {
    return <LoadingState message="جاري تحميل لوحة القيادة…" minHeight="60vh" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="تعذر تحميل لوحة القيادة"
        message="حدث خطأ أثناء جلب البيانات. حاول التحديث مرة أخرى."
        onRetry={() => {
          dashboardQ.refetch();
          pipelineQ.refetch();
          financialsQ.refetch();
        }}
      />
    );
  }

  const dash = dashboardQ.data?.data?.[0];
  const pipeline = pipelineQ.data?.data ?? [];
  const financials = financialsQ.data?.data ?? [];
  const billionPlan = billionPlanQ.data?.data ?? [];
  const visits = visitsQ.data?.data ?? [];
  const clients = clientsQ.data?.data ?? [];
  const funds = fundsQ.data?.data ?? [];
  const employees = employeesQ.data?.data ?? [];

  // ─── Compute live KPIs from actual sheets ───────────────────────
  // These override the placeholder dashboard sheet values
  const liveAum            = funds.reduce((s, f) => s + (f.committed_amount ?? 0), 0);
  const livePipelineTotal    = pipeline.reduce((s, p) => s + (p.expected_amount ?? 0), 0);
  const livePipelineWeighted = pipeline.reduce((s, p) => s + (p.weighted_amount ?? 0), 0);
  const liveActiveFunds      = funds.filter(f => f.stage === 'Fundraising' || f.stage === 'Managed').length;
  const liveActiveClients    = clients.filter(c => c.status === 'existing').length;
  const liveProspects        = clients.filter(c => c.status === 'prospect').length;
  const liveAttentionCount   = pipeline.filter(p => p.ceo_attention_flag).length;
  // Use visits count from pipeline scheduled stage as proxy (visits legacy type has diff status enum)
  const liveUpcomingVisits   = pipeline.filter(p => p.stage !== 'Closed' && p.stage !== 'Lost').length;

  // Compute effectiveDash from live data — overrides placeholder dashboard sheet
  const effectiveDash = {
    total_aum:            liveAum               || dash?.total_aum            || 0,
    revenue_ytd:          dash?.revenue_ytd     || 0,
    net_profit_ytd:       dash?.net_profit_ytd  || 0,
    pipeline_total:       livePipelineTotal     || dash?.pipeline_total       || 0,
    pipeline_weighted:    livePipelineWeighted  || dash?.pipeline_weighted    || 0,
    active_funds_count:   liveActiveFunds       || dash?.active_funds_count   || 0,
    active_clients_count: liveActiveClients     || dash?.active_clients_count || 0,
    prospects_count:      liveProspects         || dash?.prospects_count      || 0,
    ceo_attention_count:  liveAttentionCount    || dash?.ceo_attention_count  || 0,
    upcoming_visits_count:liveUpcomingVisits    || dash?.upcoming_visits_count || 0,
    monthly_target:       dash?.monthly_target  || 0,
    monthly_achieved:     dash?.monthly_achieved || livePipelineTotal * 0.3,
    achievement_pct:      dash?.achievement_pct  || 0,
    billion_progress_pct: dash?.billion_progress_pct || 0,
  };


  if (!dash && clients.length === 0 && funds.length === 0) {
    return (
      <EmptyState
        title="لا توجد بيانات لعرضها"
        message="تأكد من ربط مصدر البيانات أو عرض البيانات التجريبية."
      />
    );
  }

  return (
    <div className="space-y-section">
      {/* زر تقرير الإدارة الأسبوعي */}
      <div className="flex justify-end">
        <button type="button"
          onClick={() => openReport({ reportType: 'ceo_weekly' })}
          className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-2 rounded-lg bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors">
          📊 تقرير الإدارة الأسبوعي
        </button>
      </div>
      <ReportGate state={rptState} onClose={closeReport} />
      {/* ============================================================
          القسم ١: المؤشرات الرئيسية (Featured KPIs)
          ============================================================ */}
      <FeaturedKPIRow dash={effectiveDash as any} />

      {/* ============================================================
          القسم ٢: مؤشرات تشغيلية (Secondary KPIs)
          ============================================================ */}
      <SecondaryKPIGrid dash={effectiveDash as any} />

      {/* ============================================================
          القسم ٣: فرص تحتاج تدخل + تقدم المستهدف الشهري
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-section">
        <CEOAttentionPanel
          pipeline={pipeline}
          clients={clients}
          funds={funds}
          employees={employees}
          className="lg:col-span-2"
        />
        <MonthlyTargetPanel dash={effectiveDash as any} />
      </div>

      {/* ============================================================
          القسم ٤: تحليل البايبلاين + اتجاه الإيرادات والربح
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        <PipelineFunnelChart pipeline={pipeline} />
        <RevenueTrendChart financials={financials} />
      </div>

      {/* ============================================================
          القسم ٥: خطة المليار + زيارات الأسبوع
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-section">
        <BillionPlanPanel billionPlan={billionPlan} className="lg:col-span-2" />
        <UpcomingVisitsPanel
          visits={visits}
          clients={clients}
          employees={employees}
        />
      </div>
    </div>
  );
}

// ============================================================
// Featured KPI Row (the big four) - الآن بحجم XL
// ============================================================
function FeaturedKPIRow({ dash }: { dash: NonNullable<ReturnType<typeof useDashboard>['data']>['data'][number] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <KPICard
        size="xl"
        label={kpiLabels.totalAUM}
        value={formatCurrencyShortParts(dash.total_aum)}
        sub={
          <>
            الإجمالي: <span className="num font-medium text-ink-soft">{formatCurrency(dash.total_aum)}</span>
          </>
        }
        icon={Icon.vault}
        accent="gold"
      />
      <KPICard
        size="xl"
        label={kpiLabels.revenue}
        value={formatCurrencyShortParts(dash.revenue_ytd)}
        sub={
          <span>
            حتى تاريخه <span className="num font-medium">YTD</span>
          </span>
        }
        icon={Icon.trend}
        accent="navy"
      />
      <KPICard
        size="xl"
        label={kpiLabels.netProfit}
        value={formatCurrencyShortParts(dash.net_profit_ytd)}
        sub={
          <span>
            هامش <span className="num font-medium text-ink-soft">{formatPercent(dash.net_profit_ytd / Math.max(dash.revenue_ytd, 1))}</span>
          </span>
        }
        icon={Icon.scale}
        accent="navy"
      />
      <KPICard
        size="xl"
        label={kpiLabels.pipeline}
        value={formatCurrencyShortParts(dash.pipeline_total)}
        sub={
          <span>
            المرجح: <span className="num font-medium text-ink-soft">{formatCurrencyShort(dash.pipeline_weighted)}</span>
          </span>
        }
        icon={Icon.funnel}
        accent="gold"
      />
    </div>
  );
}

// ============================================================
// Secondary KPI Grid
// ============================================================
function SecondaryKPIGrid({ dash }: { dash: NonNullable<ReturnType<typeof useDashboard>['data']>['data'][number] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      <KPICard
        label={kpiLabels.activeFunds}
        value={formatNumber(dash.active_funds_count)}
        sub="صندوق نشط"
        icon={Icon.briefcase}
      />
      <KPICard
        label={kpiLabels.activeClients}
        value={formatNumber(dash.active_clients_count)}
        sub={
          <>
            <span className="num">+ {formatNumber(dash.prospects_count)}</span> عميل محتمل
          </>
        }
        icon={Icon.users}
      />
      <KPICard
        label={kpiLabels.upcomingVisits}
        value={formatNumber(dash.upcoming_visits_count)}
        sub="زيارة هذا الأسبوع"
        icon={Icon.calendar}
      />
      <KPICard
        label={kpiLabels.ceoAttention}
        value={formatNumber(dash.ceo_attention_count)}
        sub="فرصة تحتاج متابعة"
        icon={Icon.alert}
        accent={dash.ceo_attention_count > 0 ? 'gold' : 'none'}
      />
    </div>
  );
}

// ============================================================
// CEO Attention Panel
// ============================================================
function CEOAttentionPanel({
  pipeline,
  clients,
  funds,
  employees,
  className,
}: {
  pipeline: PipelineItem[];
  clients: Array<{ client_id: string; name_ar: string }>;
  funds: Array<{ fund_id: string; name_ar: string }>;
  employees: Array<{ employee_id: string; name_ar: string }>;
  className?: string;
}) {
  const ceoItems = useMemo(
    () =>
      pipeline
        .filter((p) => p.ceo_attention_flag && p.stage !== 'Closed' && p.stage !== 'Lost')
        .sort((a, b) => (b.weighted_amount ?? 0) - (a.weighted_amount ?? 0)),
    [pipeline]
  );

  const clientName = (id: string) => clients.find((c) => c.client_id === id)?.name_ar ?? id;
  const fundName = (id: string) => funds.find((f) => f.fund_id === id)?.name_ar ?? id;
  const employeeName = (id: string) =>
    employees.find((e) => e.employee_id === id)?.name_ar ?? id;

  const columns: Column<PipelineItem>[] = [
    {
      key: 'client',
      header: 'العميل',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-bold text-watheeq-navy-deep text-[14px]">{clientName(row.client_id)}</span>
          <span className="text-[12px] text-ink-muted">{fundName(row.fund_id)}</span>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'المرحلة',
      render: (row) => (
        <Badge tone={stageBadgeTone(row.stage)} dot size="sm">
          {pipelineStageLabels[row.stage]}
        </Badge>
      ),
    },
    {
      key: 'expected_amount',
      header: 'القيمة المتوقعة',
      align: 'end',
      sortAccessor: (row) => row.expected_amount,
      sortable: true,
      render: (row) => {
        const p = formatCurrencyShortParts(row.expected_amount);
        return (
          <span className="font-bold text-watheeq-navy-deep text-[15px]">
            <span className="num">{p.num}</span>
            {p.suffix && <span className="num-suffix text-[11px]">{p.suffix}</span>}
          </span>
        );
      },
    },
    {
      key: 'probability',
      header: 'الاحتمالية',
      align: 'center',
      sortAccessor: (row) => row.probability,
      sortable: true,
      render: (row) => (
        <span className="num font-bold text-[14px] text-ink">
          {formatPercent(row.probability)}
        </span>
      ),
    },
    {
      key: 'next_step',
      header: 'الخطوة التالية',
      render: (row) => (
        <div className="flex flex-col gap-1 max-w-[220px]">
          <span className="text-[13px] text-ink truncate leading-snug">{row.next_step ?? '—'}</span>
          {row.expected_close_date && (
            <span className="text-[12px] text-ink-muted">
              إغلاق: <span className="num">{formatDateShort(row.expected_close_date)}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'المسؤول',
      render: (row) => (
        <span className="text-[13px] text-ink-soft">{employeeName(row.owner_id)}</span>
      ),
    },
  ];

  return (
    <div className={className}>
      <div className="surface-card overflow-hidden relative">
        {/* شريط ذهبي علوي للتمييز - أنحف وأنعم بـ gradient */}
        <span
          className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-l from-watheeq-gold-deep via-watheeq-gold to-watheeq-gold-soft"
          aria-hidden="true"
        />

        <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-section-title font-bold text-watheeq-navy-deep flex items-center gap-2.5">
              <span className="text-watheeq-gold">{Icon.star}</span>
              فرص تحتاج تدخل الإدارة
            </h3>
            <p className="text-[13px] text-ink-muted mt-1.5">
              فرص استراتيجية مرفوعة لاتخاذ قرار من القيادة
            </p>
          </div>
          <Badge tone="gold" size="md">
            <span className="num">{ceoItems.length}</span>
            <span className="ms-1">فرصة</span>
          </Badge>
        </div>

        {ceoItems.length === 0 ? (
          <EmptyState
            title="لا توجد فرص تحتاج تدخل حالياً"
            message="جميع الفرص تسير ضمن المسار المعتاد."
            minHeight="180px"
          />
        ) : (
          <DataTable
            columns={columns}
            data={ceoItems}
            rowKey={(r) => r.opportunity_id}
            density="comfortable"
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Monthly Target Panel
// ============================================================
function MonthlyTargetPanel({ dash }: { dash: NonNullable<ReturnType<typeof useDashboard>['data']>['data'][number] }) {
  const achievement = clampPct(dash.achievement_pct);
  const tone =
    achievement >= 0.85 ? 'success' : achievement >= 0.5 ? 'gold' : 'warning';

  const billionPct = clampPct(dash.billion_progress_pct);
  const achievedParts = formatCurrencyShortParts(dash.monthly_achieved);
  const targetParts = formatCurrencyShortParts(dash.monthly_target);

  return (
    <div className="surface-card p-6 flex flex-col">
      <h3 className="text-section-title font-bold text-watheeq-navy-deep flex items-center gap-2.5">
        <span className="text-watheeq-navy">{Icon.target}</span>
        مستهدف الشهر
      </h3>

      {/* مستهدف الشهر */}
      <div className="mt-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] text-ink-muted">المنجز / المستهدف</span>
          <span className="num font-bold text-[14px] text-watheeq-navy-deep">
            {formatPercent(achievement)}
          </span>
        </div>
        <div className="text-kpi text-watheeq-navy-deep flex items-baseline gap-0">
          <span className="num font-semibold">{achievedParts.num}</span>
          {achievedParts.suffix && <span className="num-suffix text-[0.5em] font-medium">{achievedParts.suffix}</span>}
        </div>
        <div className="text-[13px] text-ink-muted mb-3.5 mt-1">
          من أصل <span className="num font-medium text-ink-soft">{targetParts.num}{targetParts.suffix}</span>
        </div>
        <ProgressBar value={achievement} tone={tone} size="lg" />
      </div>

      <div className="hairline mt-6 mb-5" />

      {/* تقدم خطة المليار */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[13px] text-ink-muted flex items-center gap-1.5">
            <span className="text-watheeq-gold">{Icon.flag}</span>
            تقدم خطة المليار
          </span>
          <span className="num font-bold text-[14px] text-watheeq-navy-deep">
            {formatPercent(billionPct)}
          </span>
        </div>
        <ProgressBar value={billionPct} tone="gold" size="md" />
        <p className="text-[12px] text-ink-muted mt-2.5 leading-relaxed">
          نسبة الوصول للمستهدف الاستراتيجي السنوي للأصول تحت الإدارة.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Pipeline Funnel Chart
// ============================================================
function PipelineFunnelChart({ pipeline }: { pipeline: PipelineItem[] }) {
  const data = useMemo(() => {
    // ترتيب المراحل من Lead إلى Lost — بدون عكس لتجنب مشاكل RTL
    const stages: PipelineStage[] = ['Lead', 'Contacted', 'Meeting', 'Proposal', 'Committed', 'Closed', 'Lost'];
    return stages.map((stage) => {
      const items = pipeline.filter((p) => p.stage === stage);
      const total = items.reduce((sum, p) => sum + p.expected_amount, 0);
      const weighted = items.reduce((sum, p) => sum + (p.weighted_amount ?? 0), 0);
      return {
        stage,
        label: pipelineStageLabels[stage],
        total,
        weighted,
        count: items.length,
        color: pipelineStageColors[stage],
      };
    });
  }, [pipeline]);

  const totalAll = data.reduce((s, d) => s + d.total, 0);
  const weightedAll = data.reduce((s, d) => s + d.weighted, 0);

  return (
    <ChartCard
      title="بايبلاين النمو حسب المرحلة"
      subtitle={
        <>
          الإجمالي: <span className="num font-semibold text-watheeq-navy">{formatCurrencyShort(totalAll)}</span>
          {' · '}
          المرجح: <span className="num font-semibold text-watheeq-gold-deep">{formatCurrencyShort(weightedAll)}</span>
        </>
      }
    >
      {/* ارتفاع صريح بـ px — لا يعتمد على height="100%" لتجنب صفر الارتفاع */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 28, right: 16, bottom: 8, left: 8 }}
          barCategoryGap="28%"
        >
          <CartesianGrid stroke={brandColors.line} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: brandColors.inkSoft, fontWeight: 700 }}
            axisLine={{ stroke: brandColors.line }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: brandColors.inkMuted, fontFamily: 'Inter' }}
            tickFormatter={(v: number) => formatCurrencyShort(v)}
            axisLine={false}
            tickLine={false}
            orientation="right"
            width={64}
          />
          <Tooltip
            cursor={{ fill: 'rgba(38, 63, 130, 0.06)' }}
            contentStyle={tooltipStyle}
            formatter={(value: number, _name: string, props: { payload?: { count?: number } }) => [
              `${formatCurrency(value)}${props.payload?.count ? ` (${props.payload.count} فرصة)` : ''}`,
              'القيمة',
            ]}
            labelFormatter={(label: string) => `المرحلة: ${label}`}
          />
          <Bar dataKey="total" radius={[5, 5, 0, 0]} maxBarSize={56}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={entry.total > 0 ? 1 : 0.25} />
            ))}
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v: number) => (v > 0 ? formatCurrencyShort(v) : '')}
              style={{ fontFamily: 'Inter', fontSize: 10, fontWeight: 700, fill: brandColors.navyDeep }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ============================================================
// Revenue Trend Chart
// ============================================================
function RevenueTrendChart({
  financials,
}: {
  financials: Array<{ period: string; revenue: number; net_profit: number }>;
}) {
  const data = useMemo(() => {
    // فقط السنوات 2023-2025 وترتيب تصاعدي
    return [...financials]
      .filter((f) => ['2023', '2024', '2025'].includes(f.period))
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((f) => ({
        period: f.period,
        revenue: f.revenue,
        profit: f.net_profit,
      }));
  }, [financials]);

  const yoyGrowth = useMemo(() => {
    if (data.length < 2) return null;
    const last = data[data.length - 1].revenue;
    const prev = data[data.length - 2].revenue;
    if (!prev || !isFinite(prev)) return null;
    const growth = ((last - prev) / prev) * 100;
    return isFinite(growth) ? growth : null;
  }, [data]);

  return (
    <ChartCard
      title="الإيرادات وصافي الربح"
      subtitle={
        yoyGrowth !== null
          ? (<>تطور سنوي · نمو <span className="num font-semibold text-state-success">+{yoyGrowth.toFixed(1)}%</span> سنة على سنة</>)
          : 'تطور سنوي'
      }
    >
      {/* ارتفاع صريح بـ px بدل height="100%" */}
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 20, right: 16, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColors.navy} stopOpacity={0.45} />
              <stop offset="95%" stopColor={brandColors.navy} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={brandColors.gold} stopOpacity={0.50} />
              <stop offset="95%" stopColor={brandColors.gold} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={brandColors.line} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 13, fill: brandColors.navyDeep, fontWeight: 700, fontFamily: 'Inter' }}
            axisLine={{ stroke: brandColors.line }}
            tickLine={false}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: brandColors.inkMuted, fontFamily: 'Inter' }}
            tickFormatter={(v: number) => formatCurrencyShort(v)}
            axisLine={false}
            tickLine={false}
            orientation="right"
            width={68}
          />
          <Tooltip
            cursor={{ stroke: brandColors.gold, strokeWidth: 1.5, strokeDasharray: '4 3' }}
            contentStyle={tooltipStyle}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'revenue' ? 'الإيرادات' : 'صافي الربح',
            ]}
            labelFormatter={(label: string) => `السنة: ${label}`}
          />
          <Legend
            verticalAlign="top"
            align="left"
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ fontSize: 13, paddingBottom: 12, fontFamily: 'HSN Shahd, sans-serif' }}
            formatter={(value: string) => (value === 'revenue' ? 'الإيرادات' : 'صافي الربح')}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={brandColors.navy}
            strokeWidth={3}
            fill="url(#gradRevenue)"
            dot={{ r: 5, fill: brandColors.navy, stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: brandColors.navy, stroke: brandColors.gold, strokeWidth: 2.5 }}
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke={brandColors.gold}
            strokeWidth={3}
            fill="url(#gradProfit)"
            dot={{ r: 5, fill: brandColors.gold, stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 7, fill: brandColors.gold, stroke: brandColors.navy, strokeWidth: 2.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ============================================================
// Billion Plan Panel
// ============================================================
function BillionPlanPanel({
  billionPlan,
  className,
}: {
  billionPlan: Array<{
    year: number;
    target_aum: number;
    actual_aum?: number;
    achievement_pct?: number;
    strategic_notes?: string;
  }>;
  className?: string;
}) {
  const sorted = [...billionPlan].sort((a, b) => a.year - b.year);

  return (
    <div className={className}>
      <div className="surface-card p-6">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h3 className="text-section-title font-bold text-watheeq-navy-deep flex items-center gap-2.5">
              <span className="text-watheeq-gold">{Icon.flag}</span>
              خطة المليار · مسار الأصول حتى ٢٠٢٩
            </h3>
            <p className="text-[13px] text-ink-muted mt-1.5">
              تطوّر الأصول تحت الإدارة سنوياً مقابل المستهدف الاستراتيجي
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {sorted.map((row) => {
            const hasActual = row.actual_aum !== undefined;
            const pct = hasActual ? clampPct((row.actual_aum ?? 0) / row.target_aum) : 0;
            const isPast = hasActual;
            const targetParts = formatCurrencyShortParts(row.target_aum);
            const actualParts = hasActual ? formatCurrencyShortParts(row.actual_aum!) : null;

            return (
              <div
                key={row.year}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 ${
                  isPast ? '' : 'opacity-65'
                }`}
              >
                {/* Year badge */}
                <div className="flex items-center gap-3 sm:w-32 shrink-0">
                  <span
                    className={`num inline-flex items-center justify-center w-14 h-14 rounded-lg text-xl font-bold tabular-nums ${
                      isPast
                        ? 'bg-watheeq-navy-deep text-watheeq-gold shadow-md'
                        : 'bg-watheeq-bg-cream text-watheeq-navy/55 border border-line'
                    }`}
                  >
                    {row.year}
                  </span>
                  {isPast && (
                    <Badge tone="gold" size="md">
                      <span className="num">{formatPercent(row.achievement_pct ?? 0)}</span>
                    </Badge>
                  )}
                </div>

                {/* Progress section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="text-[13px] text-ink-muted">
                      {hasActual ? 'محقق / مستهدف' : 'المستهدف'}
                    </span>
                    <span className="text-[15px] font-bold text-watheeq-navy-deep">
                      {actualParts && (
                        <>
                          <span className="text-watheeq-gold-deep num">{actualParts.num}</span>
                          {actualParts.suffix && (
                            <span className="num-suffix text-watheeq-gold-deep text-[12px]">
                              {actualParts.suffix}
                            </span>
                          )}
                          <span className="text-ink-faint mx-2 font-normal">/</span>
                        </>
                      )}
                      <span className="num">{targetParts.num}</span>
                      {targetParts.suffix && <span className="num-suffix text-[12px]">{targetParts.suffix}</span>}
                    </span>
                  </div>
                  <ProgressBar
                    value={hasActual ? pct : 0}
                    tone={isPast ? 'gold' : 'navy'}
                    size="md"
                  />
                  {row.strategic_notes && (
                    <p className="text-[12.5px] text-ink-muted mt-2 leading-relaxed">
                      {row.strategic_notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Upcoming Visits Panel
// ============================================================
function UpcomingVisitsPanel({
  visits,
  clients,
  employees,
}: {
  visits: Visit[];
  clients: Array<{ client_id: string; name_ar: string }>;
  employees: Array<{ employee_id: string; name_ar: string }>;
}) {
  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return [...visits]
      .filter((v) => {
        const d = new Date(v.visit_date);
        return d >= now && v.status !== 'Cancelled';
      })
      .sort((a, b) => a.visit_date.localeCompare(b.visit_date))
      .slice(0, 6);
  }, [visits]);

  const clientName = (id: string) => clients.find((c) => c.client_id === id)?.name_ar ?? id;
  const employeeName = (id: string) =>
    employees.find((e) => e.employee_id === id)?.name_ar ?? id;

  return (
    <div className="surface-card p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-section-title font-bold text-watheeq-navy-deep flex items-center gap-2.5">
          <span className="text-watheeq-navy">{Icon.calendar}</span>
          زيارات الأسبوع
        </h3>
        <Badge tone="navy" size="md">
          <span className="num">{upcoming.length}</span>
        </Badge>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState title="لا توجد زيارات قادمة" minHeight="180px" />
      ) : (
        <ul className="space-y-3 -mx-1">
          {upcoming.map((v) => (
            <li
              key={v.visit_id}
              className="flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-watheeq-bg-cream/60 transition-colors border border-line/40"
            >
              {/* Date pill - أوضح وأكبر */}
              <div className="flex flex-col items-center justify-center bg-watheeq-bg-cream rounded-md px-2.5 py-1.5 min-w-[54px] border border-line/60">
                <span className="text-[10.5px] text-ink-muted leading-none font-medium">
                  {new Intl.DateTimeFormat('ar-SA-u-ca-gregory', { weekday: 'short' }).format(
                    new Date(v.visit_date)
                  )}
                </span>
                <span className="num text-[18px] font-bold text-watheeq-navy-deep tabular-nums leading-tight mt-0.5">
                  {new Date(v.visit_date).getDate()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-ink truncate">
                    {clientName(v.client_id)}
                  </span>
                  {v.is_new_client && (
                    <Badge tone="gold" size="sm">جديد</Badge>
                  )}
                </div>
                <p className="text-[12.5px] text-ink-muted truncate mt-0.5">{v.purpose}</p>
                <div className="flex items-center gap-1.5 text-[12px] text-ink-faint mt-1">
                  {v.city && <span>{v.city}</span>}
                  <span aria-hidden="true">·</span>
                  <span>{employeeName(v.employee_id)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function stageBadgeTone(
  stage: PipelineStage
): 'gold' | 'success' | 'warning' | 'info' | 'neutral' | 'navy' {
  switch (stage) {
    case 'Committed':
      return 'gold';
    case 'Closed':
      return 'success';
    case 'Proposal':
      return 'warning';
    case 'Meeting':
      return 'info';
    case 'Lost':
      return 'neutral';
    default:
      return 'navy';
  }
}

import { useState, useMemo } from 'react';
import { usePipeline, useClients, useFunds, useEmployees, useTargets } from '@/hooks';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, FilterSelect, FilterSearch } from '@/components/ui/FilterBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FundraisingSummary, INTEREST_STATUS_CONFIG } from '@/components/ui/FundraisingSummary';
import { ReportGate } from '@/components/reports/ReportGate';
import { useReportPreview } from '@/hooks/useReportPreview';
import { formatCurrency, formatCurrencyShort, formatPercent, formatDateShort, formatNumber, clampPct, buildFilterOptions } from '@/lib/format';
import { brandColors } from '@/styles/brandTokens';
import { cn } from '@/lib/utils';
import type { PipelineItem, Client, OpportunityInterestStatus } from '@/types';
import { INTEREST_STATUS_WEIGHTS } from '@/types';
import { clientClassificationLabels } from '@/lib/arabicLabels';
import { EntityLink } from '@/components/ui/EntityLink';
import { InputFormLauncher } from '@/components/ui/InputFormLauncher';
import { INPUT_FORMS } from '@/config/inputForms';

// ─── Interest status chip config ──────────────────────────────
const ALL_INTEREST: Array<{ key: OpportunityInterestStatus | 'الكل'; label: string; color: string }> = [
  { key: 'الكل',          label: 'الكل',           color: '#263F82' },
  { key: 'تم التحويل',   label: 'تم التحويل',     color: '#1F8A5B' },
  { key: 'مهتم جدًا',   label: 'مهتم جدًا',      color: '#2D6A4F' },
  { key: 'مهتم',         label: 'مهتم',            color: '#2563EB' },
  { key: 'اهتمام متوسط', label: 'اهتمام متوسط',   color: '#C8A45D' },
  { key: 'غير مهتم',    label: 'غير مهتم',        color: '#6B7280' },
];

// ─────────────────────────────────────────────
// 11 Kanban stages as required
// ─────────────────────────────────────────────
type KStage = 'Lead'|'Contacted'|'Meeting'|'InfoRequest'|'Proposal'|'OpenQuery'|'Committed'|'KYC'|'Closed'|'Postponed'|'Lost';

interface StageConfig { key: KStage; label: string; color: string; dbKey: string; }

const KANBAN_STAGES: StageConfig[] = [
  { key:'Lead',        label:'عميل مناسب',          color:'#6B7280', dbKey:'Lead'      },
  { key:'Contacted',   label:'تم التواصل',          color:'#5E7AB5', dbKey:'Contacted' },
  { key:'Meeting',     label:'تمت الزيارة',         color:'#2563EB', dbKey:'Meeting'   },
  { key:'InfoRequest', label:'طلب معلومات',         color:'#0E4C5A', dbKey:'Meeting'   },
  { key:'Proposal',    label:'عرض مرسل',            color:'#C88719', dbKey:'Proposal'  },
  { key:'OpenQuery',   label:'استفسارات مفتوحة',   color:'#B45309', dbKey:'Proposal'  },
  { key:'Committed',   label:'التزام مبدئي',        color:'#C8A45D', dbKey:'Committed' },
  { key:'KYC',         label:'مستندات / KYC',       color:'#7C3AED', dbKey:'Committed' },
  { key:'Closed',      label:'مكتتب',               color:'#263F82', dbKey:'Closed'    },
  { key:'Postponed',   label:'مؤجل',                color:'#92400E', dbKey:'Proposal'  },
  { key:'Lost',        label:'خاسر',                color:'#B42318', dbKey:'Lost'      },
];

// Map DB stages to display stages (first match wins)
const DB_TO_DISPLAY: Record<string, KStage> = {
  Lead: 'Lead', Contacted: 'Contacted', Meeting: 'Meeting',
  Proposal: 'Proposal', Committed: 'Committed', Closed: 'Closed', Lost: 'Lost',
};

const stageColor = (dbStage: string) =>
  KANBAN_STAGES.find((s) => s.dbKey === dbStage)?.color ?? brandColors.navy;

const stageTone = (dbStage: string): 'gold'|'success'|'warning'|'info'|'neutral'|'navy'|'danger' => {
  switch (dbStage) {
    case 'Committed': return 'gold';
    case 'Closed':    return 'success';
    case 'Proposal':  return 'warning';
    case 'Meeting':   return 'info';
    case 'Lost':      return 'danger';
    default:          return 'navy';
  }
};

const STAGE_LABEL: Record<string, string> = {
  Lead: 'عميل مناسب', Contacted: 'تم التواصل', Meeting: 'تمت الزيارة',
  Proposal: 'عرض مرسل', Committed: 'التزام مبدئي', Closed: 'مكتتب', Lost: 'خاسر',
};

type ViewMode = 'kanban' | 'table';

// ─────────────────────────────────────────────
// Management Attention Reasons
// ─────────────────────────────────────────────
function getAttentionReasons(item: PipelineItem, clientSensitive: boolean): string[] {
  const reasons: string[] = [];
  const now = Date.now();

  if (item.next_step_date) {
    const days = Math.floor((now - new Date(item.next_step_date).getTime()) / 86_400_000);
    if (days > 5) reasons.push(`تأخر المتابعة (${days} يوم)`);
  } else {
    reasons.push('تأخر المتابعة');
  }

  if (item.expected_amount > 15_000_000)             reasons.push('قيمة عالية');
  if (clientSensitive)                                reasons.push('عميل حساس');
  if (item.expected_close_date) {
    const daysLeft = Math.floor((new Date(item.expected_close_date).getTime() - now) / 86_400_000);
    if (daysLeft >= 0 && daysLeft < 14)               reasons.push(`تاريخ الإغلاق بعد ${daysLeft} يوم`);
    if (daysLeft < 0)                                 reasons.push('تجاوز تاريخ الإغلاق');
  }
  if (item.notes?.includes('اعتراض'))                reasons.push('اعتراض مفتوح');
  if (item.probability >= 0.7 && !item.next_step)     reasons.push('احتمالية عالية بدون خطوة تالية');
  if (item.ceo_attention_flag)                        reasons.push('مرفوع لرادار الإدارة');

  return reasons;
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export function PipelinePage() {
  const pipelineQ = usePipeline();
  const clientsQ  = useClients();
  const fundsQ    = useFunds();
  const empQ      = useEmployees();
  const targetsQ  = useTargets();
  const { state: rptState, openReport, close: closeReport } = useReportPreview();

  const [view,          setView]          = useState<ViewMode>('kanban');
  const [search,        setSearch]        = useState('');
  const [fFund,         setFFund]         = useState('');
  const [fEmployee,     setFEmployee]     = useState('');
  const [fStage,        setFStage]        = useState('');
  const [fAttention,    setFAttention]    = useState('');
  const [fCity,         setFCity]         = useState('');
  const [selectedInterest, setSelectedInterest] = useState<Set<OpportunityInterestStatus>>(new Set());

  function toggleInterest(key: OpportunityInterestStatus) {
    setSelectedInterest((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const pipeline  = pipelineQ.data?.data ?? [];
  const clients   = clientsQ.data?.data  ?? [];
  const funds     = fundsQ.data?.data    ?? [];
  const employees = empQ.data?.data      ?? [];

  const clientById  = (id: string) => clients.find((c) => c.client_id === id);
  const clientName  = (id: string) => clientById(id)?.name_ar ?? id;
  const fundName    = (id: string) => funds.find((f) => f.fund_id === id)?.name_ar ?? id;
  const empName     = (id: string) => employees.find((e) => e.employee_id === id)?.name_ar ?? id;

  const cities = useMemo(() => {
    const s = new Set<string>();
    pipeline.forEach((p) => { const c = clientById(p.client_id); if (c?.city) s.add(c.city); });
    return [...s];
  }, [pipeline, clients]);

  const activeFilters = [fFund, fEmployee, fStage, fAttention, fCity].filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    // Base filter (by default, hide غير مهتم from active list unless explicitly selected)
    const showUninterested = selectedInterest.has('غير مهتم') || selectedInterest.size === 0;
    return pipeline.filter((p) => {
      if (search && !clientName(p.client_id).includes(search) && !fundName(p.fund_id).includes(search)) return false;
      if (fFund     && p.fund_id  !== fFund)     return false;
      if (fEmployee && p.owner_id !== fEmployee) return false;
      if (fStage    && p.stage    !== fStage)    return false;
      if (fAttention === 'yes' && !p.ceo_attention_flag) return false;
      if (fCity) { const c = clientById(p.client_id); if (c?.city !== fCity) return false; }
      // Interest chip filter
      if (selectedInterest.size > 0) {
        if (!selectedInterest.has(p.interestStatus as OpportunityInterestStatus)) return false;
      } else {
        // Default: hide غير مهتم from active view
        if (p.interestStatus === 'غير مهتم') return false;
      }
      return true;
    });
  }, [pipeline, search, fFund, fEmployee, fStage, fAttention, fCity, selectedInterest]);

  // Interest-chip total calculation
  const interestChipTotal = useMemo(() => {
    const base = selectedInterest.size > 0
      ? pipeline.filter((p) => selectedInterest.has(p.interestStatus as OpportunityInterestStatus))
      : pipeline.filter((p) => p.interestStatus !== 'غير مهتم');
    return base.reduce((s, p) => s + p.expected_amount, 0);
  }, [pipeline, selectedInterest]);

  const clearFilters = () => { setSearch(''); setFFund(''); setFEmployee(''); setFStage(''); setFAttention(''); setFCity(''); setSelectedInterest(new Set()); };

  // Attention items with reasons
  const attentionItems = useMemo(() => {
    const now = Date.now();
    return pipeline
      .filter((p) => {
        if (p.stage === 'Closed' || p.stage === 'Lost') return false;
        const client = clientById(p.client_id);
        const daysSince = p.next_step_date
          ? Math.floor((now - new Date(p.next_step_date).getTime()) / 86_400_000)
          : 99;
        const closesSoon = p.expected_close_date
          ? Math.floor((new Date(p.expected_close_date).getTime() - now) / 86_400_000) < 14
          : false;
        return p.ceo_attention_flag || daysSince > 5 || closesSoon
          || client?.status === 'sensitive' || p.expected_amount > 15_000_000
          || (p.probability >= 0.7 && !p.next_step);
      })
      .map((p) => ({
        item: p,
        reasons: getAttentionReasons(p, clientById(p.client_id)?.status === 'sensitive'),
      }))
      .sort((a, b) => b.item.expected_amount - a.item.expected_amount)
      .slice(0, 6);
  }, [pipeline]);

  // Totals
  const totalPipeline = filtered.reduce((s, p) => s + p.expected_amount, 0);
  const totalWeighted = filtered.reduce((s, p) => s + (p.weighted_amount ?? 0), 0);
  const committed     = filtered.filter((p) => p.stage === 'Committed' || p.stage === 'Closed')
    .reduce((s, p) => s + p.expected_amount, 0);

  // Monthly target
  const monthlyT = targetsQ.data?.data?.find((t) => t.period_type === 'Monthly' && t.metric === 'Sales');
  const monthlyPct = monthlyT ? clampPct((monthlyT.achieved_value ?? 0) / monthlyT.target_value) : null;

  // Kanban cols (use DB stage for filtering)
  const kanbanCols = KANBAN_STAGES.map((s) => {
    const items = filtered.filter((p) => (DB_TO_DISPLAY[p.stage] ?? p.stage) === s.key || p.stage === s.dbKey)
      .filter((p, _, arr) => {
        // de-duplicate — each item only appears in the first matching column
        const firstMatch = KANBAN_STAGES.find((ks) => ks.dbKey === p.stage);
        return firstMatch?.key === s.key;
      });
    return { ...s, count: items.length, total: items.reduce((sum, p) => sum + p.expected_amount, 0), items };
  });

  if (pipelineQ.isLoading) return <LoadingState message="جاري تحميل البايبلاين…" minHeight="60vh" />;
  if (pipelineQ.isError)   return <ErrorState title="تعذر تحميل البايبلاين" onRetry={() => pipelineQ.refetch()} />;

  const tableColumns: Column<PipelineItem>[] = [
    {
      key:'client', header:'العميل / الصندوق',
      render:(r)=>(
        <div className="flex flex-col gap-1">
          <EntityLink type="client" id={r.client_id} label={clientName(r.client_id)} className="font-bold text-[14px] text-watheeq-navy-deep" />
          <EntityLink type="fund"   id={r.fund_id}   label={fundName(r.fund_id)}     className="text-[12px] text-ink-muted truncate max-w-[180px]" />
        </div>
      ),
    },
    {
      key:'stage', header:'المرحلة',
      render:(r)=><Badge tone={stageTone(r.stage)} dot size="sm">{STAGE_LABEL[r.stage]??r.stage}</Badge>,
    },
    {
      key:'interestStatus', header:'الاهتمام',
      render:(r)=> r.interestStatus ? (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded border whitespace-nowrap"
          style={{ color: INTEREST_STATUS_CONFIG[r.interestStatus as OpportunityInterestStatus]?.color ?? '#6B7280', background: INTEREST_STATUS_CONFIG[r.interestStatus as OpportunityInterestStatus]?.bg ?? '#F1F2F4', borderColor: INTEREST_STATUS_CONFIG[r.interestStatus as OpportunityInterestStatus]?.border ?? '#6B728033' }}>
          {r.interestStatus}
        </span>
      ) : <span className="text-ink-faint text-[12px]">—</span>,
    },
    {
      key:'accountManager', header:'مدير الحساب',
      render:(r)=> r.accountManager
        ? <div><p className="text-[12px] text-ink">{r.accountManager}</p>{r.brokerName && r.brokerName !== r.accountManager && <p className="text-[11px] text-ink-muted">{r.brokerName}</p>}</div>
        : <span className="text-ink-faint text-[12px]">—</span>,
    },
    {
      key:'expected_amount', header:'القيمة', align:'end',
      sortable:true, sortAccessor:(r)=>r.expected_amount,
      render:(r)=>(
        <div className="text-end">
          <p className="num font-bold text-[14px] text-watheeq-navy-deep">{formatCurrencyShort(r.expected_amount)}</p>
          <p className="num text-[11px] text-ink-muted">{formatPercent(r.probability)} مرجح</p>
        </div>
      ),
    },
    {
      key:'next_step', header:'الخطوة التالية',
      render:(r)=>(
        <div className="max-w-[200px]">
          <p className="text-[13px] text-ink truncate">{r.next_step??'—'}</p>
          {r.expected_close_date&&<p className="num text-[11px] text-ink-muted">إغلاق: {formatDateShort(r.expected_close_date)}</p>}
        </div>
      ),
    },
    {
      key:'owner_id', header:'المسؤول',
      render:(r)=><span className="text-[13px] text-ink-soft">{empName(r.owner_id)}</span>,
    },
    {
      key:'flags', header:'تنبيهات', align:'center',
      render:(r)=>{
        const c = clientById(r.client_id);
        return(
          <div className="flex flex-col gap-1 items-center">
            {r.ceo_attention_flag && <Badge tone="gold" size="sm">إدارة</Badge>}
            {c?.status==='sensitive' && <Badge tone="danger" size="sm">حساس</Badge>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* أزرار الإجراءات والتقارير */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <InputFormLauncher url={INPUT_FORMS.OPPORTUNITY_FORM_URL} label="إضافة فرصة" icon="+" variant="primary" />
          <InputFormLauncher url={INPUT_FORMS.STAGE_UPDATE_FORM_URL} label="تحديث مرحلة" icon="🔄" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => openReport({ reportType: 'weekly_visits' })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg border border-line bg-white hover:bg-watheeq-bg-cream text-ink-soft transition-colors">
            📅 تقرير الزيارات الأسبوعي
          </button>
          <button type="button" onClick={() => openReport({ reportType: 'management_attention' })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg border border-line bg-white hover:bg-watheeq-bg-cream text-ink-soft transition-colors">
            ⚡ تقرير فرص الإدارة
          </button>
          <button type="button" onClick={() => openReport({ reportType: 'fund_fundraising', fundId: funds.find((f) => f.stage === 'Fundraising')?.fund_id })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors">
            📊 تقرير تعبئة الصندوق
          </button>
        </div>
      </div>
      <ReportGate state={rptState} onClose={closeReport} />
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'إجمالي البايبلاين', value: formatCurrencyShort(totalPipeline) },
          { label:'المرجح',            value: formatCurrencyShort(totalWeighted) },
          { label:'الالتزامات',        value: formatCurrencyShort(committed) },
          { label:'إجمالي الفرص',     value: formatNumber(filtered.length) },
        ].map((s)=>(
          <div key={s.label} className="surface-card px-4 py-4">
            <p className="text-[12px] text-ink-muted mb-1">{s.label}</p>
            <p className="num font-bold text-[20px] text-watheeq-navy-deep">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly target */}
      {monthlyPct !== null && monthlyT && (
        <div className="surface-card px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-bold text-watheeq-navy-deep">المستهدف الشهري للمبيعات</span>
            <div className="flex items-center gap-3 text-[13px]">
              <span className="num font-bold text-watheeq-navy-deep">{formatCurrencyShort(monthlyT.achieved_value ?? 0)}</span>
              <span className="text-ink-muted">/</span>
              <span className="num text-ink-muted">{formatCurrencyShort(monthlyT.target_value)}</span>
              <Badge tone={monthlyPct >= 0.85 ? 'success' : monthlyPct >= 0.5 ? 'gold' : 'warning'} size="sm">
                <span className="num">{formatPercent(monthlyPct)}</span>
              </Badge>
            </div>
          </div>
          <ProgressBar value={monthlyPct} tone={monthlyPct >= 0.85 ? 'success' : monthlyPct >= 0.5 ? 'gold' : 'warning'} size="lg" />
        </div>
      )}

      {/* ── Interest classification chips — controls everything below ── */}
      <div className="surface-card px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className="text-[13px] font-bold text-watheeq-navy-deep">تصنيف الاهتمام:</span>
          <div className="flex flex-wrap gap-2">
            {ALL_INTEREST.map(({ key, label, color }) => {
              const isAll   = key === 'الكل';
              const active  = isAll ? selectedInterest.size === 0 : selectedInterest.has(key as OpportunityInterestStatus);
              return (
                <button key={key} type="button"
                  onClick={() => isAll ? setSelectedInterest(new Set()) : toggleInterest(key as OpportunityInterestStatus)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5"
                  style={{
                    background:  active ? color : 'white',
                    color:       active ? 'white' : '#6B7280',
                    borderColor: active ? color   : '#E2DCCE',
                    boxShadow:   active ? `0 2px 6px ${color}44` : 'none',
                  }}>
                  {active && !isAll && <span className="text-[10px]">✓</span>}
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global total across all fundraising funds */}
        <div className="flex items-center justify-between bg-watheeq-bg-cream/60 rounded-xl px-4 py-3 border border-line/50">
          <div>
            <p className="text-[12px] text-ink-muted">إجمالي البايبلاين عبر كل الصناديق</p>
            <p className="text-[11px] text-ink-faint mt-0.5">
              {selectedInterest.size > 0
                ? `التصنيفات المحددة: ${[...selectedInterest].join(' + ')}`
                : 'جميع التصنيفات النشطة (عدا غير مهتم)'}
            </p>
          </div>
          <span className="num font-bold text-[18px] text-watheeq-navy-deep">{formatCurrencyShort(interestChipTotal)}</span>
        </div>
      </div>

      {/* Per-fund summaries — each responds to selectedInterest chips */}
      {funds.filter((f) => f.stage === 'Fundraising').map((fund) => (
        <div key={fund.fund_id} className="surface-card overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-line/40 flex items-center justify-between">
            <h3 className="font-bold text-[14px] text-watheeq-navy-deep">
              📊 {fund.name_ar}
            </h3>
            {selectedInterest.size > 0 && (
              <span className="text-[11px] text-ink-muted">
                يعرض: {[...selectedInterest].join(' + ')}
              </span>
            )}
          </div>
          <div className="px-5 py-4">
            <FundraisingSummary
              fund={fund}
              pipeline={pipeline}
              compact={true}
              selectedFilter={selectedInterest}
            />
          </div>
        </div>
      ))}

      {/* Management Attention */}
      {attentionItems.length > 0 && (
        <div className="surface-card overflow-hidden relative">
          <span className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-l from-watheeq-gold-deep via-watheeq-gold to-watheeq-gold-soft" />
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-line/40">
            <div>
              <h3 className="text-section-title font-bold text-watheeq-navy-deep flex items-center gap-2">
                <span className="text-watheeq-gold text-[20px]">⚡</span>
                فرص تحتاج تدخل الإدارة
              </h3>
              <p className="text-[13px] text-ink-muted mt-1">
                فرص تحتاج اهتماماً فورياً — مرتّبة حسب القيمة
              </p>
            </div>
            <Badge tone="gold"><span className="num">{attentionItems.length}</span></Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
            {attentionItems.map(({ item, reasons }) => {
              const client = clientById(item.client_id);
              const daysLeft = item.expected_close_date
                ? Math.floor((new Date(item.expected_close_date).getTime() - Date.now()) / 86_400_000)
                : null;
              return (
                <div key={item.opportunity_id}
                  className="rounded-xl border border-watheeq-gold/25 bg-watheeq-gold/3 p-4 flex flex-col gap-2.5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <EntityLink type="client" id={item.client_id} label={clientName(item.client_id)} className="font-bold text-[13px] text-watheeq-navy-deep truncate block" />
                      <EntityLink type="fund"   id={item.fund_id}   label={fundName(item.fund_id)}     className="text-[11px] text-ink-muted truncate block" />
                    </div>
                    <Badge tone={stageTone(item.stage)} size="sm">{STAGE_LABEL[item.stage]??item.stage}</Badge>
                  </div>
                  {/* Amount + probability */}
                  <div className="flex items-center justify-between">
                    <span className="num font-bold text-[15px] text-watheeq-navy-deep">{formatCurrencyShort(item.expected_amount)}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-line overflow-hidden">
                        <div className="h-full rounded-full bg-watheeq-gold" style={{ width: `${item.probability * 100}%` }} />
                      </div>
                      <span className="num text-[11px] text-ink-muted">{formatPercent(item.probability)}</span>
                    </div>
                  </div>
                  {/* Reasons + interest status */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.interestStatus && (() => {
                      const cfg = INTEREST_STATUS_CONFIG[item.interestStatus as OpportunityInterestStatus];
                      return cfg ? <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{item.interestStatus}</span> : null;
                    })()}
                    {reasons.map((r, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-watheeq-gold/12 text-watheeq-gold-deep rounded-md border border-watheeq-gold/25 font-bold">
                        {r}
                      </span>
                    ))}
                  </div>
                  {/* Next step + owner + broker */}
                  <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1 border-t border-line/40">
                    <span className="truncate max-w-[130px]">{item.next_step ?? 'لا توجد خطوة محددة'}</span>
                    <div className="text-end">
                      <span>{empName(item.owner_id)}</span>
                      {item.brokerName && <p className="text-ink-faint">{item.brokerName}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar onClear={clearFilters} activeCount={activeFilters}>
        <FilterSearch value={search} onChange={setSearch} placeholder="ابحث بالعميل أو الصندوق…" />
        <FilterSelect label="المرحلة" value={fStage} onChange={setFStage}
          options={buildFilterOptions(pipeline, p => p.stage, STAGE_LABEL)} />
        <FilterSelect label="الصندوق" value={fFund} onChange={setFFund}
          options={buildFilterOptions(pipeline, p => p.fund_id,
            Object.fromEntries(funds.map(f => [f.fund_id, f.name_ar])))} />
        <FilterSelect label="المسؤول" value={fEmployee} onChange={setFEmployee}
          options={buildFilterOptions(pipeline, p => p.owner_id,
            Object.fromEntries(employees.map(e => [e.employee_id, e.name_ar])))} />
        <FilterSelect label="المدينة" value={fCity} onChange={setFCity}
          options={buildFilterOptions(pipeline, p => clientById(p.client_id)?.city ?? null)} />
        <FilterSelect label="رادار الإدارة" value={fAttention} onChange={setFAttention}
          options={[{value:'yes',label:'يحتاج متابعة'}]} />
      </FilterBar>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-muted">
          <span className="num font-bold text-ink">{filtered.length}</span> فرصة · مجموع <span className="num font-bold">{formatCurrencyShort(totalPipeline)}</span>
        </p>
        <div className="flex items-center gap-1 border border-line rounded-lg p-1 bg-white">
          {(['kanban','table'] as ViewMode[]).map((v)=>(
            <button key={v} type="button" onClick={()=>setView(v)}
              className={cn('px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
                view===v?'bg-watheeq-navy text-white shadow-sm':'text-ink-muted hover:text-ink')}>
              {v==='kanban'?'كانبان':'جدول'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد فرص" message="جرب تغيير معايير الفلترة." />
      ) : view === 'kanban' ? (
        <KanbanView stages={kanbanCols} clientName={clientName} fundName={fundName} empName={empName} clientById={clientById} />
      ) : (
        <div className="surface-card overflow-hidden">
          <DataTable columns={tableColumns} data={filtered} rowKey={(r)=>r.opportunity_id} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Kanban View
// ─────────────────────────────────────────────
function KanbanView({ stages, clientName, fundName, empName, clientById }: {
  stages: Array<StageConfig & { items: PipelineItem[]; total: number; count: number }>;
  clientName: (id: string) => string;
  fundName: (id: string) => string;
  empName: (id: string) => string;
  clientById: (id: string) => Client | undefined;
}) {
  return (
    <div className="overflow-x-auto pb-4 -mx-0">
      <div className="flex gap-3 min-w-max px-0">
        {stages.map((col) => (
          <div key={col.key} className="w-[220px] shrink-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between px-2.5 py-2 rounded-t-xl mb-2 border-b-2"
              style={{ background: col.color + '14', borderColor: col.color }}>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight" style={{ color: col.color }}>{col.label}</p>
                {col.total > 0 && (
                  <p className="num text-[10px] font-medium" style={{ color: col.color + 'AA' }}>
                    {formatCurrencyShort(col.total)}
                  </p>
                )}
              </div>
              <span className="num text-[11px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: col.color + '22', color: col.color }}>
                {col.count}
              </span>
            </div>
            {/* Cards */}
            <div className="flex-1 space-y-2 min-h-[80px]">
              {col.items.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-line py-6 flex items-center justify-center">
                  <span className="text-[11px] text-ink-faint">—</span>
                </div>
              ) : col.items.map((item) => (
                <KanbanCard key={item.opportunity_id} item={item}
                  client={clientName(item.client_id)}
                  fund={fundName(item.fund_id)}
                  owner={empName(item.owner_id)}
                  isNew={clientById(item.client_id)?.status === 'prospect'}
                  isSensitive={clientById(item.client_id)?.status === 'sensitive'}
                  color={col.color}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Kanban Card — compact, all key info visible
// ─────────────────────────────────────────────
function KanbanCard({ item, client, fund, owner, isNew, isSensitive, color }: {
  item: PipelineItem; client: string; fund: string; owner: string;
  isNew?: boolean; isSensitive?: boolean; color: string;
}) {
  const now = Date.now();
  const daysTillClose = item.expected_close_date
    ? Math.floor((new Date(item.expected_close_date).getTime() - now) / 86_400_000)
    : null;
  const daysSinceStep = item.next_step_date
    ? Math.floor((now - new Date(item.next_step_date).getTime()) / 86_400_000)
    : null;
  const slaSlow = daysSinceStep !== null && daysSinceStep > 5;

  return (
    <div className="bg-white rounded-xl border border-line shadow-card p-3 space-y-2 relative overflow-hidden">
      {/* Stage color top strip */}
      <span className="absolute top-0 inset-x-0 h-[2.5px]" style={{ background: color }} />

      {/* Client + fund + attention */}
      <div className="flex items-start justify-between gap-1.5 pt-0.5">
        <div className="min-w-0 flex-1">
          <EntityLink type="client" id={item.client_id} label={client} className="font-bold text-[12.5px] text-watheeq-navy-deep truncate leading-tight block" />
          <EntityLink type="fund"   id={item.fund_id}   label={fund}   className="text-[11px] text-ink-muted truncate block" />
        </div>
        {item.ceo_attention_flag && (
          <span className="shrink-0 text-[12px] text-watheeq-gold" title="رادار الإدارة">⚡</span>
        )}
      </div>

      {/* Amount + probability */}
      <div className="flex items-center justify-between gap-1">
        <span className="num font-bold text-[13px] text-watheeq-navy-deep">{formatCurrencyShort(item.expected_amount)}</span>
        <div className="flex items-center gap-1">
          <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: color + '22' }}>
            <div className="h-full rounded-full" style={{ width: `${item.probability * 100}%`, background: color }} />
          </div>
          <span className="num text-[10px] text-ink-muted">{formatPercent(item.probability)}</span>
        </div>
      </div>

      {/* Next step */}
      {item.next_step && (
        <p className="text-[11px] text-ink bg-watheeq-bg-cream/60 rounded px-2 py-1 leading-snug truncate">
          {item.next_step}
        </p>
      )}

      {/* Footer: owner + SLA + close date */}
      <div className="flex items-center justify-between text-[10.5px] gap-1">
        <span className="text-ink-faint truncate">{owner}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {slaSlow && (
            <span className="num text-state-warning font-bold" title="تأخر المتابعة">+{daysSinceStep}د</span>
          )}
          {daysTillClose !== null && (
            <span className={cn('num font-medium', daysTillClose < 0 ? 'text-state-danger' : daysTillClose < 7 ? 'text-state-warning' : 'text-ink-faint')}>
              {daysTillClose < 0 ? 'تجاوز' : `${daysTillClose}ي`}
            </span>
          )}
        </div>
      </div>

      {/* Flags + interest status */}
      <div className="flex flex-wrap gap-1">
        {item.interestStatus && (() => {
          const cfg = INTEREST_STATUS_CONFIG[item.interestStatus as OpportunityInterestStatus];
          return cfg ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
              {item.interestStatus}
            </span>
          ) : null;
        })()}
        {isSensitive && <Badge tone="danger" size="sm">حساس</Badge>}
        {isNew       && <Badge tone="gold"   size="sm">جديد</Badge>}
      </div>
    </div>
  );
}

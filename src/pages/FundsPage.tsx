import { useState, useMemo, useEffect } from 'react';
import { useFunds, useClients, useEmployees, usePipeline } from '@/hooks';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FilterBar, FilterSelect, FilterSearch } from '@/components/ui/FilterBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { Drawer, DrawerSection, DrawerRow } from '@/components/ui/Drawer';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { FundraisingSummary } from '@/components/ui/FundraisingSummary';
import { formatCurrency, formatCurrencyShort, formatPercent, formatDate, formatDateShort, clampPct, buildFilterOptions } from '@/lib/format';
import { fundStageLabels, assetClassLabels, clientClassificationLabels } from '@/lib/arabicLabels';
import { brandColors, fundStageColors } from '@/styles/brandTokens';
import { getRecommendedInvestors } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import type { Fund, Client, PipelineItem } from '@/types';
import { ReportGate } from '@/components/reports/ReportGate';
import { EntityLink } from '@/components/ui/EntityLink';
import { InputFormLauncher } from '@/components/ui/InputFormLauncher';
import { INPUT_FORMS } from '@/config/inputForms';
import { useReportPreview } from '@/hooks/useReportPreview';

const STAGES = ['Idea','Structuring','Approvals','Fundraising','Closed','Managed','Exited'] as const;
type Stage = typeof STAGES[number];

const STAGE_ICONS: Record<Stage, string> = {
  Idea: '💡', Structuring: '⚙️', Approvals: '📋', Fundraising: '📈',
  Closed: '✅', Managed: '🏦', Exited: '🚀',
};

const fundStageTone = (stage: Stage) => {
  if (stage === 'Fundraising') return 'gold';
  if (stage === 'Managed')     return 'success';
  if (stage === 'Exited')      return 'neutral';
  if (stage === 'Approvals')   return 'info';
  return 'navy';
};

export function FundsPage({ autoOpenFundId, onAutoOpenConsumed }: {
  autoOpenFundId?: string;
  onAutoOpenConsumed?: () => void;
} = {}) {
  const fundsQ    = useFunds();
  const clientsQ  = useClients();
  const empQ      = useEmployees();
  const pipelineQ = usePipeline();
  const { state: rptState, openReport, close: closeReport } = useReportPreview();

  const [fAsset,    setFAsset]    = useState('');
  const [fStage,    setFStage]    = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fManager,  setFManager]  = useState('');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<Fund | null>(null);

  const funds     = fundsQ.data?.data    ?? [];
  const clients   = clientsQ.data?.data  ?? [];
  const employees = empQ.data?.data      ?? [];
  const pipeline  = pipelineQ.data?.data ?? [];
  const empName   = (id?: string) => employees.find((e) => e.employee_id === id)?.name_ar ?? '—';

  // Auto-open fund drawer from navigation context (works with both cached + lazy-loaded data)
  useEffect(() => {
    if (!autoOpenFundId) return;
    if (funds.length === 0) return;
    const target = funds.find((f) => f.fund_id === autoOpenFundId);
    if (target) {
      setSelected(target);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenFundId, funds]);

  const managers = useMemo(() => [...new Set(funds.map((f) => f.fund_manager_id).filter(Boolean))] as string[], [funds]);
  const activeFilters = [fAsset, fStage, fPriority, fManager].filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => funds.filter((f) => {
    if (search    && !f.name_ar.includes(search))             return false;
    if (fAsset    && f.asset_class !== fAsset)                 return false;
    if (fStage    && f.stage !== fStage)                       return false;
    if (fPriority && f.priority !== fPriority)                 return false;
    if (fManager  && f.fund_manager_id !== fManager)           return false;
    return true;
  }), [funds, search, fAsset, fStage, fPriority, fManager]);

  const clearFilters = () => { setSearch(''); setFAsset(''); setFStage(''); setFPriority(''); setFManager(''); };

  if (fundsQ.isLoading) return <LoadingState message="جاري تحميل بيانات الصناديق…" minHeight="60vh" />;
  if (fundsQ.isError)   return <ErrorState title="تعذر تحميل الصناديق" onRetry={() => fundsQ.refetch()} />;

  const activeFunds      = funds.filter((f) => f.stage === 'Fundraising' || f.stage === 'Managed').length;
  const totalCommitted   = funds.reduce((s, f) => s + (f.committed_amount ?? 0), 0);
  const totalTarget      = funds.reduce((s, f) => s + (f.target_size ?? 0), 0);
  const fundraisingFunds = funds.filter((f) => f.stage === 'Fundraising').length;

  return (
    <div className="space-y-5">
      {/* أزرار الإجراءات والتقارير */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <InputFormLauncher url={INPUT_FORMS.FUND_FORM_URL} label="إضافة صندوق" icon="+" variant="primary" />
        </div>
        {(() => {
          const fundraisingFundId = funds.find((f) => f.stage === 'Fundraising')?.fund_id;
          return (
            <button type="button"
              disabled={!fundraisingFundId}
              onClick={() => fundraisingFundId && openReport({ reportType: 'fund_fundraising', fundId: fundraisingFundId })}
              className="text-[12px] font-bold px-4 py-2 rounded-lg bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-watheeq-navy">
              📊 تقرير تعبئة الصندوق
            </button>
          );
        })()}
      </div>
      <ReportGate state={rptState} onClose={closeReport} />
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الصناديق',         value: String(funds.length) },
          { label: 'صناديق نشطة',             value: String(activeFunds) },
          { label: 'تحت الاستقطاب',           value: String(fundraisingFunds) },
          { label: 'نسبة التغطية الإجمالية',  value: totalTarget > 0 ? formatPercent(totalCommitted / totalTarget) : '—' },
        ].map((s) => (
          <div key={s.label} className="surface-card px-4 py-4">
            <p className="text-[12px] text-ink-muted mb-1">{s.label}</p>
            <p className="num font-bold text-[22px] text-watheeq-navy-deep">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar onClear={clearFilters} activeCount={activeFilters}>
        <FilterSearch value={search} onChange={setSearch} placeholder="ابحث باسم الصندوق…" />
        <FilterSelect label="فئة الأصول" value={fAsset} onChange={setFAsset}
          options={buildFilterOptions(funds, f => f.asset_class, assetClassLabels as Record<string,string>)} />
        <FilterSelect label="المرحلة" value={fStage} onChange={setFStage}
          options={buildFilterOptions(funds, f => f.stage, fundStageLabels as Record<string,string>)} />
        <FilterSelect label="الأولوية" value={fPriority} onChange={setFPriority}
          options={buildFilterOptions(funds, f => f.priority ?? null, {High:'عالية',Medium:'متوسطة',Low:'منخفضة'})} />
        <FilterSelect label="مدير الصندوق" value={fManager} onChange={setFManager}
          options={buildFilterOptions(funds, f => f.fund_manager_id ?? null,
            Object.fromEntries(employees.map(e => [e.employee_id, e.name_ar])))} />
      </FilterBar>

      <p className="text-[13px] text-ink-muted">
        <span className="num font-bold text-ink">{filtered.length}</span> صندوق
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد صناديق" message="جرب تغيير معايير الفلترة." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((fund) => (
            <FundCard key={fund.fund_id} fund={fund} empName={empName} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected && (
        <FundDrawer fund={selected} clients={clients} pipeline={pipeline} empName={empName} onClose={() => setSelected(null)} onOpenReport={openReport} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Fund Card — clean executive look
// ─────────────────────────────────────────────
function FundCard({ fund, empName, onSelect }: { fund: Fund; empName: (id?: string) => string; onSelect: (f: Fund) => void }) {
  const progress   = clampPct(fund.fundraising_progress_pct ?? 0);
  const stageIdx   = STAGES.indexOf(fund.stage as Stage);
  const color      = fundStageColors[fund.stage] ?? brandColors.navy;
  const isFundraising = fund.stage === 'Fundraising';
  const remaining  = fund.remaining_amount ?? ((fund.target_size ?? 0) - (fund.committed_amount ?? 0));

  return (
    <button type="button" onClick={() => onSelect(fund)}
      className="surface-card p-5 text-start hover:shadow-card-hover transition-all duration-200 hover:-translate-y-px group flex flex-col gap-4 w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] text-watheeq-navy-deep leading-snug">{fund.name_ar}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge tone={fundStageTone(fund.stage as Stage)} size="sm">{fundStageLabels[fund.stage]}</Badge>
            <Badge tone="neutral" size="sm">{assetClassLabels[fund.asset_class]}</Badge>
            {fund.priority === 'High' && <Badge tone="gold" size="sm">أولوية عالية</Badge>}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 bg-watheeq-bg-cream border border-line/50">
          {STAGE_ICONS[fund.stage as Stage]}
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <MetricCell label="حجم الصندوق"   value={formatCurrencyShort(fund.target_size)} />
        <MetricCell label="الالتزامات"    value={formatCurrencyShort(fund.committed_amount)} />
        <MetricCell label="العائد المتوقع" value={formatPercent(fund.expected_return_pct)} color="success" />
        <MetricCell label="المستثمرون"    value={String(fund.investors_count ?? 0)} />
      </div>

      {/* Fundraising progress */}
      {isFundraising && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-muted">نسبة الاستقطاب</span>
            <span className="num font-bold text-watheeq-gold-deep">{formatPercent(progress)}</span>
          </div>
          <ProgressBar value={progress} tone="gold" size="md" />
          <p className="num text-[11px] text-ink-muted">المتبقي: {formatCurrencyShort(remaining)}</p>
        </div>
      )}

      {/* Stage dots */}
      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => (
          <div key={s} title={fundStageLabels[s]}
            className={cn('flex-1 rounded-full transition-all', i < stageIdx ? 'h-2' : i === stageIdx ? 'h-2' : 'h-1.5')}
            style={{
              background: i < stageIdx ? color : i === stageIdx ? color : brandColors.line,
              opacity: i < stageIdx ? 0.7 : i === stageIdx ? 1 : 1,
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[12px] text-ink-muted pt-0.5 border-t border-line/40">
        <span>{empName(fund.fund_manager_id)}</span>
        {fund.duration_years && <span className="num">{fund.duration_years} سنوات</span>}
      </div>
    </button>
  );
}

function MetricCell({ label, value, color }: { label: string; value: string; color?: 'success' }) {
  return (
    <div>
      <p className="text-[11px] text-ink-muted mb-0.5">{label}</p>
      <p className={cn('num font-bold text-[14px]', color === 'success' ? 'text-state-success' : 'text-watheeq-navy-deep')}>
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Fund Details Drawer
// ─────────────────────────────────────────────
function FundDrawer({ fund, clients, pipeline, empName, onClose, onOpenReport }: {
  fund: Fund; clients: Client[]; pipeline: PipelineItem[]; empName: (id?: string) => string;
  onClose: () => void;
  onOpenReport: (s: import('@/hooks/useReportPreview').ReportPreviewState) => void;
}) {
  /** Local session-only removed client IDs — resets on page refresh */
  const [removedClients, setRemovedClients] = useState<Set<string>>(new Set());
  const [removeTarget, setRemoveTarget]     = useState<Client | null>(null);

  const recommended = useMemo(
    () => getRecommendedInvestors(fund, clients).filter(({ client }) => !removedClients.has(client.client_id)),
    [fund, clients, removedClients]
  );
  const stageIdx    = STAGES.indexOf(fund.stage as Stage);
  const color       = fundStageColors[fund.stage] ?? brandColors.navy;

  return (
    <>
    <Drawer open={true} onClose={onClose} title={fund.name_ar}
      subtitle={`${assetClassLabels[fund.asset_class]} · ${fundStageLabels[fund.stage]}`} width="xl">

      {/* Status + priority badges */}
      <div className="flex flex-wrap gap-2">
        <Badge tone={fundStageTone(fund.stage as Stage)}>{fundStageLabels[fund.stage]}</Badge>
        <Badge tone="neutral">{assetClassLabels[fund.asset_class]}</Badge>
        {fund.priority && (
          <Badge tone={fund.priority === 'High' ? 'gold' : 'neutral'}>
            أولوية {fund.priority === 'High' ? 'عالية' : fund.priority === 'Medium' ? 'متوسطة' : 'منخفضة'}
          </Badge>
        )}
      </div>

      {/* Report buttons */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onOpenReport({ reportType: 'fund_teaser', fundId: fund.fund_id })}
          className="text-[12px] font-bold px-3 py-2 rounded-lg border border-watheeq-navy/20 bg-watheeq-bg-cream/60 text-watheeq-navy hover:bg-watheeq-navy hover:text-white transition-all flex items-center gap-1.5">
          📄 تيزر الصندوق
        </button>
        <button type="button" onClick={() => onOpenReport({ reportType: 'fund_fundraising', fundId: fund.fund_id })}
          className="text-[12px] font-bold px-3 py-2 rounded-lg border border-watheeq-navy/20 bg-watheeq-bg-cream/60 text-watheeq-navy hover:bg-watheeq-navy hover:text-white transition-all flex items-center gap-1.5">
          📊 تقرير التعبئة
        </button>
        <button type="button" onClick={() => onOpenReport({ reportType: 'recommended_investors', fundId: fund.fund_id })}
          className="text-[12px] font-bold px-3 py-2 rounded-lg border border-watheeq-navy/20 bg-watheeq-bg-cream/60 text-watheeq-navy hover:bg-watheeq-navy hover:text-white transition-all flex items-center gap-1.5">
          ⭐ العملاء الموصى بهم
        </button>
      </div>

      {/* Data entry launchers */}
      <div className="flex flex-wrap gap-2">
        <InputFormLauncher url={INPUT_FORMS.STAGE_UPDATE_FORM_URL}  label="تحديث مرحلة الصندوق" icon="🔄" />
        <InputFormLauncher url={INPUT_FORMS.OPPORTUNITY_FORM_URL}   label="إضافة فرصة للصندوق"  icon="➕" />
      </div>

      {/* Stage timeline — readable version */}
      <DrawerSection title="مسار الصندوق">
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start min-w-max gap-0">
            {STAGES.map((s, i) => {
              const done   = i < stageIdx;
              const active = i === stageIdx;
              const c      = fundStageColors[s] ?? brandColors.navy;
              return (
                <div key={s} className="flex items-center">
                  {/* Stage node */}
                  <div className="flex flex-col items-center gap-2 w-24">
                    <div
                      className={cn('w-9 h-9 rounded-full flex items-center justify-center text-[16px] border-2 bg-white transition-all', active && 'scale-110 shadow-md')}
                      style={{ borderColor: (done || active) ? c : brandColors.line }}
                    >
                      {done ? '✓' : STAGE_ICONS[s]}
                    </div>
                    <p className="text-[11px] font-bold text-center leading-tight w-20"
                      style={{ color: (done || active) ? c : brandColors.inkMuted }}>
                      {fundStageLabels[s]}
                    </p>
                  </div>
                  {/* Connector */}
                  {i < STAGES.length - 1 && (
                    <div className="w-4 h-0.5 -mt-4 shrink-0"
                      style={{ background: i < stageIdx ? color : brandColors.line }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DrawerSection>

      {/* Financial details */}
      <DrawerSection title="التفاصيل المالية">
        <DrawerRow label="حجم الصندوق"        value={<span className="num">{formatCurrency(fund.target_size)}</span>} />
        <DrawerRow label="الالتزامات الحالية" value={<span className="num font-bold text-state-success">{formatCurrency(fund.committed_amount)}</span>} />
        <DrawerRow label="المبلغ المتبقي"      value={<span className="num text-state-warning">{formatCurrency(fund.remaining_amount)}</span>} />
        <DrawerRow label="نسبة الاستقطاب"
          value={
            <div className="flex items-center gap-3 flex-1">
              <ProgressBar value={clampPct(fund.fundraising_progress_pct ?? 0)} tone="gold" size="sm" className="flex-1" />
              <span className="num font-bold text-[13px] text-watheeq-gold-deep shrink-0">
                {formatPercent(fund.fundraising_progress_pct)}
              </span>
            </div>
          }
        />
        <DrawerRow label="العائد المتوقع"     value={<span className="num font-bold text-state-success">{formatPercent(fund.expected_return_pct)}</span>} />
        <DrawerRow label="مدة الصندوق"        value={fund.duration_years ? <span className="num">{fund.duration_years} سنوات</span> : undefined} />
        <DrawerRow label="عدد المستثمرين"     value={<span className="num">{fund.investors_count ?? 0}</span>} />
        <DrawerRow label="مدير الصندوق"       value={empName(fund.fund_manager_id)} />
      </DrawerSection>

      {/* Fundraising summary — only for fundraising funds */}
      {(fund.stage === 'Fundraising' || fund.stage === 'Approvals') && (
        <DrawerSection title="ملخص الاستقطاب">
          <FundraisingSummary fund={fund} pipeline={pipeline} compact={false} />
        </DrawerSection>
      )}

      {/* ⭐ Recommended investors — the core product feature */}
      <div className="border-2 border-watheeq-gold/30 rounded-xl overflow-hidden">
        {/* Section header */}
        <div className="bg-gradient-to-l from-watheeq-gold/8 to-watheeq-navy/4 px-5 py-4 border-b border-watheeq-gold/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[15px] text-watheeq-navy-deep flex items-center gap-2">
                <span className="text-watheeq-gold">★</span>
                العملاء الموصى بهم لهذا الصندوق
              </h3>
              <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
                تم الترتيب بناءً على التوافق مع نوع الصندوق، سجل الاستثمار، حجم التذكرة، حداثة التواصل، وتفضيلات العميل.
              </p>
            </div>
            {recommended.length > 0 && (
              <Badge tone="gold"><span className="num">{recommended.length}</span></Badge>
            )}
          </div>
        </div>

        {/* Investor cards */}
        <div className="p-4">
          {recommended.length === 0 ? (
            <p className="text-[13px] text-ink-muted text-center py-6">
              لا توجد توصيات متاحة لهذا الصندوق حالياً.
            </p>
          ) : (
            <div className="space-y-4">
              {recommended.map(({ client, match }, rank) => (
                <RecommendedCard
                  key={client.client_id}
                  client={client}
                  match={match}
                  empName={empName}
                  rank={rank + 1}
                  fund={fund}
                  onRemove={() => setRemoveTarget(client)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>

    {/* Remove recommendation modal — portal-level */}
    {removeTarget && (
      <RemoveRecommendationModal
        client={removeTarget}
        fundName={fund.name_ar}
        onConfirm={() => {
          setRemovedClients((prev) => new Set([...prev, removeTarget.client_id]));
          setRemoveTarget(null);
        }}
        onClose={() => setRemoveTarget(null)}
      />
    )}
  </>
  );
}

// ─────────────────────────────────────────────
// Recommended Investor Card — core feature
// ─────────────────────────────────────────────
import type { MatchScore } from '@/lib/scoring';

function RecommendedCard({ client, match, empName, rank, fund, onRemove }: {
  client: Client;
  match: MatchScore;
  empName: (id?: string) => string;
  rank: number;
  fund: Fund;
  onRemove: () => void;
}) {
  const [added, setAdded] = useState(false);
  const days = client.last_contact_date
    ? Math.floor((Date.now() - new Date(client.last_contact_date).getTime()) / 86_400_000)
    : null;

  // Qualification check: غير مؤهل + ticket above limit
  const isUnqualified = client.qualificationStatus === 'غير مؤهل';
  const exceedsLimit  = isUnqualified && client.qualificationLimit
    ? match.expectedTicket > client.qualificationLimit
    : false;
  // Soft capacity warning for qualified clients
  const capacity = client.investmentCapacity;
  const exceedsCapacity = !isUnqualified && capacity ? match.expectedTicket > capacity * 1.5 : false;
  const withinCapacity  = !isUnqualified && capacity ? match.expectedTicket <= capacity : false;

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      exceedsLimit    ? 'border-state-danger/30 bg-state-danger-bg/10' :
      exceedsCapacity ? 'border-state-warning/25 bg-state-warning-bg/8' :
      rank === 1      ? 'border-watheeq-gold/50 bg-watheeq-gold/4' : 'border-line/60 bg-watheeq-bg-paper'
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        {/* Rank badge */}
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0',
          rank === 1 ? 'bg-watheeq-gold text-white' : rank === 2 ? 'bg-watheeq-navy/15 text-watheeq-navy' : 'bg-watheeq-bg-cream text-ink-muted'
        )}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <EntityLink type="client" id={client.client_id} label={client.name_ar} className="font-bold text-[14px] text-watheeq-navy-deep" />
                {/* Qualification badge */}
                {isUnqualified ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-state-danger-bg text-state-danger border-state-danger/25">
                    غير مؤهل
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-state-success-bg text-state-success border-state-success/25">
                    ✓ مؤهل
                  </span>
                )}
              </div>
              <p className="text-[12px] text-ink-muted mt-0.5">
                {clientClassificationLabels[client.classification]} · {client.city ?? '—'}
              </p>
            </div>
            <div className="text-end shrink-0">
              <p className="num font-bold text-[15px] text-watheeq-navy-deep">{formatCurrencyShort(match.expectedTicket)}</p>
              <p className="text-[11px] text-ink-muted">تذكرة متوقعة</p>
            </div>
          </div>
          {/* Unqualified limit warning — hard block */}
          {exceedsLimit && (
            <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-state-danger-bg rounded-lg border border-state-danger/25">
              <span className="text-[12px]">⚠</span>
              <p className="text-[11px] font-bold text-state-danger">
                غير مؤهل لهذا الحجم — الحد النظامي 200,000 ر.س
              </p>
            </div>
          )}
          {/* Capacity soft warnings — qualified clients */}
          {exceedsCapacity && !exceedsLimit && (
            <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-state-warning-bg rounded-lg border border-state-warning/25">
              <span className="text-[12px]">↑</span>
              <p className="text-[11px] font-bold text-state-warning">
                أعلى من التذكرة المناسبة ({capacity ? formatCurrencyShort(capacity) : '—'})
              </p>
            </div>
          )}
          {withinCapacity && (
            <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-state-success-bg rounded-lg border border-state-success/25">
              <span className="text-[12px]">✓</span>
              <p className="text-[11px] font-bold text-state-success">
                متوافق مع التذكرة المناسبة ({capacity ? formatCurrencyShort(capacity) : '—'})
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="mb-3">
        <ScoreBar score={match.score} label="درجة التوافق مع الصندوق" />
      </div>

      {/* Top reason */}
      {match.reasons.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {match.reasons.slice(0, 3).map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-state-success-bg text-state-success rounded-md border border-state-success/20 font-medium">
              <span>✓</span> {r}
            </span>
          ))}
        </div>
      )}

      {/* Flags */}
      {match.flags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {match.flags.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-state-warning-bg text-state-warning rounded-md border border-state-warning/25 font-medium">
              <span>⚠</span> {f}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-line/40">
        <div className="text-[12px] text-ink-muted space-y-0.5">
          <p>{empName(client.relationship_owner_id)}</p>
          {days !== null && (
            <p className={cn('num', days > 30 ? 'text-state-warning' : 'text-ink-faint')}>
              آخر تواصل: {days} يوم
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setAdded(true)}
          disabled={added}
          className={cn(
            'text-[12px] font-bold px-4 py-2 rounded-lg transition-all',
            added
              ? 'bg-state-success-bg text-state-success border border-state-success/20 cursor-default'
              : 'bg-watheeq-navy text-white hover:bg-watheeq-navy-deep'
          )}
        >
          {added ? '✓ تم الإضافة للبايبلاين' : 'إضافة إلى مسار التواصل'}
        </button>
      </div>

      {/* Remove button — secondary destructive */}
      <div className="pt-2 border-t border-line/30 flex justify-end">
        <button type="button" onClick={onRemove}
          className="text-[11px] font-medium text-ink-faint hover:text-state-danger transition-colors">
          إزالة من الترشيحات
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Remove Recommendation Confirmation Modal
// ─────────────────────────────────────────────
import { createPortal } from 'react-dom';

function RemoveRecommendationModal({ client, fundName, onConfirm, onClose }: {
  client: Client; fundName: string; onConfirm: () => void; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [done,   setDone]   = useState(false);

  const REASONS = [
    'غير مؤهل لهذا الحجم',
    'لا توجد رغبة حاليًا',
    'يحتاج متابعة لاحقة',
    'تكرار',
    'سبب آخر',
  ];

  const modal = done ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-watheeq-navy-deep/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-state-success-bg border-2 border-state-success/25 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F8A5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="font-bold text-[15px] text-watheeq-navy-deep">تمت إزالة العميل من الترشيحات تجريبيًا</p>
        <p className="text-[12px] text-ink-muted">لن يظهر هذا العميل في قائمة ترشيحات الصندوق حتى إعادة تحميل الصفحة.</p>
        <button type="button" onClick={onClose}
          className="px-6 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors">
          إغلاق
        </button>
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-watheeq-navy-deep/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="px-6 py-5 border-b border-line/50">
          <h2 className="text-[15px] font-bold text-watheeq-navy-deep">إزالة العميل من الترشيحات</h2>
          <p className="text-[12px] text-ink-muted mt-1">{client.name_ar} · {fundName}</p>
        </div>
        <div className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          <p className="text-[13px] text-ink-soft leading-relaxed">
            سيتم إخفاء هذا العميل من قائمة الترشيحات لهذا الصندوق في هذه النسخة التجريبية.
          </p>
          <div className="space-y-1.5">
            <p className="text-[13px] font-bold text-ink-soft">سبب الإزالة (اختياري)</p>
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2.5 py-2 px-3 rounded-lg border border-line/40 cursor-pointer hover:bg-watheeq-bg-cream/50">
                <input type="radio" name="remove_reason" value={r} checked={reason === r}
                  onChange={() => setReason(r)} className="accent-watheeq-navy" />
                <span className="text-[13px] text-ink">{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-line/50 flex gap-3 bg-watheeq-bg-cream/30">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-line rounded-xl text-[13px] font-bold text-ink-soft hover:bg-watheeq-bg-cream transition-colors">
            إلغاء
          </button>
          <button type="button" onClick={() => { onConfirm(); setDone(true); }}
            className="flex-1 py-2.5 bg-state-danger text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-colors">
            إزالة تجريبية
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

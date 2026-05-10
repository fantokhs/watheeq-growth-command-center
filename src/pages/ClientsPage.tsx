import { useState, useMemo, useEffect } from 'react';
import { EntityLink } from '@/components/ui/EntityLink';
import { InputFormLauncher } from '@/components/ui/InputFormLauncher';
import { INPUT_FORMS } from '@/config/inputForms';
import { useClients, useEmployees, useFunds, useHoldings, usePipeline } from '@/hooks';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, FilterSelect, FilterSearch } from '@/components/ui/FilterBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { Drawer, DrawerSection, DrawerRow } from '@/components/ui/Drawer';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ReportGate } from '@/components/reports/ReportGate';
import { useReportPreview } from '@/hooks/useReportPreview';
import {
  formatCurrency, formatCurrencyShort, formatDate, formatDateShort,
  formatPercent, formatNumber, clampPct, buildFilterOptions,
} from '@/lib/format';
import {
  clientStatusLabels, clientClassificationLabels, riskProfileLabels,
  assetClassLabels, pipelineStageLabels,
} from '@/lib/arabicLabels';
import { brandColors } from '@/styles/brandTokens';
import { cn } from '@/lib/utils';
import type { Client, Fund, Holding, PipelineItem } from '@/types';

type ViewMode = 'table' | 'cards';

// ─────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────
const statusTone = (s: Client['status']) =>
  s === 'existing' ? 'navy' : s === 'prospect' ? 'gold' : s === 'sensitive' ? 'danger' : 'neutral';

const daysSince = (dateStr?: string) =>
  dateStr ? Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000) : null;

function ContactRecency({ days }: { days: number | null }) {
  if (days === null) return <span className="text-ink-faint text-[12px]">—</span>;
  const stale = days > 30;
  return (
    <span className={cn('num text-[12px] font-medium', stale ? 'text-state-warning' : 'text-ink-muted')}>
      {days === 0 ? 'اليوم' : `${days} يوم`}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export function ClientsPage({ autoOpenClientId, onAutoOpenConsumed }: {
  autoOpenClientId?: string;
  onAutoOpenConsumed?: () => void;
} = {}) {
  const clientsQ  = useClients();
  const empQ      = useEmployees();
  const fundsQ    = useFunds();
  const holdingsQ = useHoldings();
  const pipelineQ = usePipeline();
  const { state: rptState, openReport, close: closeReport } = useReportPreview();

  const [view, setView]               = useState<ViewMode>('cards');
  const [search, setSearch]           = useState('');
  const [fClass, setFClass]           = useState('');
  const [fCity, setFCity]             = useState('');
  const [fOwner, setFOwner]           = useState('');
  const [fStatus, setFStatus]         = useState('');
  const [fRisk, setFRisk]             = useState('');
  const [fAsset, setFAsset]           = useState('');
  const [fQualification, setFQualification] = useState('');
  const [fFund, setFFund]             = useState('');
  const [selected, setSelected]       = useState<Client | null>(null);

  const clients   = clientsQ.data?.data  ?? [];
  const employees = empQ.data?.data      ?? [];
  const funds     = fundsQ.data?.data    ?? [];
  const holdings  = holdingsQ.data?.data ?? [];
  const pipeline  = pipelineQ.data?.data ?? [];

  // Resolve "صندوق رتال" from live funds (Sheets first, mock fallback via useFunds).
  // Matches against name_ar / name_en / project_name with both Arabic and English aliases.
  const retalFund = useMemo(() => {
    const AR_KEYWORDS = ['رتال', 'رويا الحرم'];
    const EN_KEYWORDS = ['retal', 'roya'];
    return funds.find((f) => {
      const ar = `${f.name_ar ?? ''} ${f.project_name ?? ''}`;
      const en = `${f.name_en ?? ''} ${f.project_name ?? ''}`.toLowerCase();
      return AR_KEYWORDS.some((kw) => ar.includes(kw))
          || EN_KEYWORDS.some((kw) => en.includes(kw));
    });
  }, [funds]);

  const empName  = (id?: string) => employees.find((e) => e.employee_id === id)?.name_ar ?? '—';
  const fundName = (id?: string) => funds.find((f) => f.fund_id === id)?.name_ar ?? '—';
  const clientOpps = (id: string) => pipeline.filter((p) => p.client_id === id && p.stage !== 'Closed' && p.stage !== 'Lost');

  // Auto-open drawer from navigation context (works with both cached + lazy-loaded data)
  useEffect(() => {
    if (!autoOpenClientId) return;
    if (clients.length === 0) return; // wait for data to load
    const target = clients.find((c) => c.client_id === autoOpenClientId);
    if (target) {
      setSelected(target);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenClientId, clients]); // re-fires when clients loads if it was empty on mount

  const cities = useMemo(() => [...new Set(clients.map((c) => c.city).filter(Boolean))] as string[], [clients]);
  const owners = useMemo(() => [...new Set(clients.map((c) => c.relationship_owner_id).filter(Boolean))] as string[], [clients]);
  const activeFilters = [fClass, fCity, fOwner, fStatus, fRisk, fAsset, fQualification, fFund].filter(Boolean).length + (search ? 1 : 0);

  const filtered = useMemo(() => {
    const selectedFund = fFund ? funds.find((f) => f.fund_id === fFund) : undefined;
    const linkedSet    = new Set(selectedFund?.linked_client_ids ?? []);
    return clients.filter((c) => {
      if (search         && !c.name_ar.includes(search))               return false;
      if (fClass         && c.classification !== fClass)               return false;
      if (fCity          && c.city?.trim() !== fCity.trim())           return false;
      if (fOwner         && c.relationship_owner_id !== fOwner)        return false;
      if (fStatus        && c.status !== fStatus)                      return false;
      if (fRisk          && c.risk_profile !== fRisk)                  return false;
      if (fAsset         && c.preferred_asset_class !== fAsset)        return false;
      if (fQualification && c.qualificationStatus !== fQualification)  return false;
      if (fFund) {
        const viaHolding = holdings.some((h) => h.client_id === c.client_id && h.fund_id === fFund);
        const viaLinked  = linkedSet.has(c.client_id);
        if (!viaHolding && !viaLinked) return false;
      }
      return true;
    });
  }, [clients, funds, holdings, search, fClass, fCity, fOwner, fStatus, fRisk, fAsset, fQualification, fFund]);

  const clearFilters = () => { setSearch(''); setFClass(''); setFCity(''); setFOwner(''); setFStatus(''); setFRisk(''); setFAsset(''); setFQualification(''); setFFund(''); };

  if (clientsQ.isLoading) return <LoadingState message="جاري تحميل بيانات العملاء…" minHeight="60vh" />;
  if (clientsQ.isError)   return <ErrorState title="تعذر تحميل العملاء" onRetry={() => clientsQ.refetch()} />;

  // Stats
  const totalInvested    = clients.filter((c) => c.status === 'existing').reduce((s, c) => s + (c.total_invested ?? 0), 0);
  const qualifiedCount   = clients.filter((c) => c.qualificationStatus === 'مؤهل').length;
  const withOppsCount    = clients.filter((c) => clientOpps(c.client_id).length > 0).length;

  // Table columns
  const columns: Column<Client>[] = [
    {
      key: 'name_ar', header: 'العميل', sortable: true, sortAccessor: (r) => r.name_ar,
      render: (r) => (
        <div className="flex items-center gap-3 py-0.5">
          <ClientAvatar name={r.name_ar} status={r.status} size="sm" />
          <div>
            <p className="font-bold text-[14px] text-watheeq-navy-deep leading-tight">{r.name_ar}</p>
            <p className="text-[12px] text-ink-muted mt-0.5">{clientClassificationLabels[r.classification]}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'الحالة',
      render: (r) => (
        <div className="flex flex-col gap-1">
          <Badge tone={statusTone(r.status)} size="sm">{clientStatusLabels[r.status]}</Badge>
          {r.city && <span className="text-[12px] text-ink-muted">{r.city}</span>}
        </div>
      ),
    },
    {
      key: 'total_invested', header: 'الاستثمار', align: 'end',
      sortable: true, sortAccessor: (r) => r.total_invested ?? 0,
      render: (r) => r.total_invested ? (
        <div className="text-end">
          <p className="num font-bold text-[14px] text-watheeq-navy-deep">{formatCurrencyShort(r.total_invested)}</p>
          {r.total_profit && <p className="num text-[12px] text-state-success">+{formatCurrencyShort(r.total_profit)}</p>}
        </div>
      ) : <span className="text-ink-faint text-[13px]">محتمل</span>,
    },
    {
      key: 'preferred_asset_class', header: 'الأصول المفضلة',
      render: (r) => r.preferred_asset_class ? (
        <div className="flex flex-col gap-1">
          <Badge tone="info" size="sm">{assetClassLabels[r.preferred_asset_class]}</Badge>
          {r.risk_profile && <span className="text-[11px] text-ink-muted">{riskProfileLabels[r.risk_profile]}</span>}
        </div>
      ) : <span className="text-ink-faint">—</span>,
    },
    {
      key: 'last_contact_date', header: 'آخر تواصل',
      sortable: true, sortAccessor: (r) => r.last_contact_date ?? '',
      render: (r) => {
        const days = daysSince(r.last_contact_date);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="num text-[13px] text-ink">{formatDateShort(r.last_contact_date)}</span>
            <ContactRecency days={days} />
          </div>
        );
      },
    },
    {
      key: 'relationship_owner_id', header: 'المسؤول',
      render: (r) => <span className="text-[13px] text-ink-soft">{empName(r.relationship_owner_id)}</span>,
    },
    {
      key: 'qualificationStatus', header: 'التأهيل', align: 'center',
      render: (r) => (
        <div className="space-y-1">
          {r.qualificationStatus
            ? <QualificationBadge status={r.qualificationStatus} limit={r.qualificationLimit} size="sm" />
            : <span className="text-ink-faint text-[12px]">—</span>}
          {r.investmentCapacity && (
            <p className="num text-[10px] text-ink-faint">{formatCurrencyShort(r.investmentCapacity)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'opps', header: 'فرص', align: 'center',
      render: (r) => {
        const n = clientOpps(r.client_id).length;
        return n > 0
          ? <Badge tone="gold" size="sm"><span className="num">{n}</span></Badge>
          : <span className="text-ink-faint text-[13px]">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* أزرار الإجراءات والتقارير */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <InputFormLauncher url={INPUT_FORMS.CLIENT_FORM_URL} label="إضافة عميل" icon="+" variant="primary" />
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => openReport({ reportType: 'sla_followup' })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg border border-line bg-white hover:bg-watheeq-bg-cream text-ink-soft transition-colors">
            📋 تقرير SLA
          </button>
          <button type="button"
            onClick={() => openReport({ reportType: 'rm_performance' })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors">
            📊 تقرير أداء الفريق
          </button>
        </div>
      </div>
      <ReportGate state={rptState} onClose={closeReport} />
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي العملاء',       value: formatNumber(clients.length) },
          { label: 'عملاء قائمون',         value: formatNumber(clients.filter((c)=>c.status==='existing').length) },
          { label: 'مؤهلون للاستثمار',     value: formatNumber(qualifiedCount) },
          { label: 'لديهم فرص مفتوحة',     value: formatNumber(withOppsCount) },
          { label: 'أصول العملاء القائمين', value: formatCurrencyShort(totalInvested), gold: true },
        ].map((s) => (
          <div key={s.label} className="surface-card px-4 py-4">
            <p className="text-[12px] text-ink-muted mb-1">{s.label}</p>
            <p className={cn('num font-bold text-[22px] text-watheeq-navy-deep', s.gold && 'text-watheeq-gold-deep')}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar onClear={clearFilters} activeCount={activeFilters}>
        <FilterSearch value={search} onChange={setSearch} placeholder="ابحث باسم العميل…" />
        <FilterSelect label="الحالة" value={fStatus} onChange={setFStatus}
          options={buildFilterOptions(clients, c => c.status, clientStatusLabels as Record<string,string>)} />
        <FilterSelect label="التصنيف" value={fClass} onChange={setFClass}
          options={buildFilterOptions(clients, c => c.classification, clientClassificationLabels as Record<string,string>)} />
        <FilterSelect label="المدينة" value={fCity} onChange={setFCity}
          options={buildFilterOptions(clients, c => c.city ?? null)} />
        <FilterSelect label="فئة الأصول" value={fAsset} onChange={setFAsset}
          options={buildFilterOptions(clients, c => c.preferred_asset_class ?? null, assetClassLabels as Record<string,string>)} />
        <FilterSelect label="المخاطرة" value={fRisk} onChange={setFRisk}
          options={buildFilterOptions(clients, c => c.risk_profile ?? null, riskProfileLabels as Record<string,string>)} />
        <FilterSelect label="المسؤول" value={fOwner} onChange={setFOwner}
          options={buildFilterOptions(clients, c => c.relationship_owner_id ?? null,
            Object.fromEntries(employees.map(e => [e.employee_id, e.name_ar])))} />
        <FilterSelect label="التأهيل" value={fQualification} onChange={setFQualification}
          options={buildFilterOptions(clients, c => c.qualificationStatus ?? null)} />
        <FilterSelect label="الصندوق" value={fFund} onChange={setFFund}
          options={funds.map((f) => ({ value: f.fund_id, label: f.name_ar }))} />
      </FilterBar>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-muted">
          <span className="num font-bold text-ink">{filtered.length}</span> عميل
          {activeFilters > 0 && <span className="text-ink-faint"> (من {clients.length})</span>}
        </p>
        <div className="flex items-center gap-1 border border-line rounded-lg p-1 bg-white">
          {(['cards','table'] as ViewMode[]).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)}
              className={cn('px-3 py-1.5 rounded-md text-[13px] font-medium transition-all',
                view===v ? 'bg-watheeq-navy text-white shadow-sm' : 'text-ink-muted hover:text-ink')}>
              {v==='cards' ? 'بطاقات' : 'جدول'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج" message="جرب تغيير معايير الفلترة." />
      ) : view === 'cards' ? (
        <ClientCardsGrid clients={filtered} empName={empName} clientOpps={clientOpps} onSelect={setSelected} />
      ) : (
        <div className="surface-card overflow-hidden">
          <DataTable columns={columns} data={filtered} rowKey={(r) => r.client_id} onRowClick={setSelected} />
        </div>
      )}

      {selected && (
        <ClientDrawer
          client={selected}
          empName={empName}
          fundName={fundName}
          opportunities={clientOpps(selected.client_id)}
          retalFund={retalFund}
          retalHolding={
            retalFund
              ? holdings.find((h) => h.client_id === selected.client_id && h.fund_id === retalFund.fund_id) ?? null
              : null
          }
          onClose={() => setSelected(null)}
          onOpenReport={openReport}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Avatar component
// ─────────────────────────────────────────────
// ─── Qualification Badge ──────────────────────────────────────
function QualificationBadge({ status, limit, size = 'md' }: {
  status: 'مؤهل' | 'غير مؤهل';
  limit?: number | null;
  size?: 'sm' | 'md';
}) {
  const isQ = status === 'مؤهل';
  const base = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[12px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded border whitespace-nowrap ${base}`}
      style={{ color: isQ ? '#1F8A5B' : '#B42318', background: isQ ? '#E7F5EE' : '#FBEAE8', borderColor: isQ ? '#1F8A5B33' : '#B4231833' }}>
      {isQ ? '✓ مؤهل' : '⚠ غير مؤهل'}
      {!isQ && limit && <span style={{ opacity: 0.75, fontWeight: 500 }}> · حد 200K</span>}
    </span>
  );
}

function ClientAvatar({ name, status, size = 'md' }: { name: string; status: Client['status']; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('');
  const bg = status === 'existing' ? 'bg-watheeq-navy/10' : status === 'prospect' ? 'bg-watheeq-gold/15' : status === 'sensitive' ? 'bg-state-danger-bg' : 'bg-watheeq-bg-cream';
  const text = status === 'existing' ? 'text-watheeq-navy' : status === 'prospect' ? 'text-watheeq-gold-deep' : status === 'sensitive' ? 'text-state-danger' : 'text-ink-muted';
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-[13px]' : size === 'lg' ? 'w-14 h-14 text-[18px]' : 'w-11 h-11 text-[14px]';
  return (
    <div className={cn('rounded-xl flex items-center justify-center font-bold shrink-0 border border-line/50', sizeClass, bg, text)}>
      {initials || name[0]}
    </div>
  );
}

// ─────────────────────────────────────────────
// Cards grid
// ─────────────────────────────────────────────
function ClientCardsGrid({ clients, empName, clientOpps, onSelect }: {
  clients: Client[];
  empName: (id?: string) => string;
  clientOpps: (id: string) => PipelineItem[];
  onSelect: (c: Client) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {clients.map((c) => {
        const opps = clientOpps(c.client_id);
        const days = daysSince(c.last_contact_date);
        const stale = days !== null && days > 30;

        return (
          <button key={c.client_id} type="button" onClick={() => onSelect(c)}
            className="surface-card p-4 text-start group hover:shadow-card-hover transition-all duration-200 hover:-translate-y-px flex flex-col gap-3 w-full">

            {/* Top row: avatar + status */}
            <div className="flex items-start gap-3">
              <ClientAvatar name={c.name_ar} status={c.status} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[14px] text-watheeq-navy-deep leading-snug line-clamp-2">{c.name_ar}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <Badge tone={statusTone(c.status)} size="sm">{clientStatusLabels[c.status]}</Badge>
                  {c.is_ceo_attention && <Badge tone="warning" size="sm">رادار</Badge>}
                </div>
              </div>
            </div>

            {/* Classification + City */}
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink-muted font-medium">{clientClassificationLabels[c.classification]}</span>
              {c.city && <span className="text-ink-faint">{c.city}</span>}
            </div>

            {/* Financials */}
            {c.total_invested ? (
              <div className="bg-watheeq-bg-cream/60 rounded-lg px-3 py-2.5 border border-line/40">
                <p className="text-[11px] text-ink-muted mb-0.5">إجمالي الاستثمار</p>
                <p className="num font-bold text-[16px] text-watheeq-navy-deep">{formatCurrencyShort(c.total_invested)}</p>
                {c.total_profit && (
                  <p className="num text-[12px] text-state-success mt-0.5">ربح: {formatCurrencyShort(c.total_profit)}</p>
                )}
              </div>
            ) : (
              <div className="bg-watheeq-gold/5 rounded-lg px-3 py-2.5 border border-watheeq-gold/20">
                <p className="text-[12px] text-watheeq-gold-deep font-medium">عميل محتمل</p>
              </div>
            )}

            {/* Asset class */}
            {c.preferred_asset_class && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-muted">يفضّل:</span>
                <Badge tone="info" size="sm">{assetClassLabels[c.preferred_asset_class]}</Badge>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[12px]">
              <span className="text-ink-muted truncate max-w-[120px]">{empName(c.relationship_owner_id)}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {stale && <span className="w-1.5 h-1.5 rounded-full bg-state-warning" title="تواصل متأخر" />}
                <ContactRecency days={days} />
              </div>
            </div>

            {/* Open opps + qualification */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/40">
              {opps.length > 0
                ? <Badge tone="gold" size="sm"><span className="num">{opps.length}</span> فرصة مفتوحة</Badge>
                : <span />}
              <div className="text-end space-y-0.5">
                {c.qualificationStatus && <QualificationBadge status={c.qualificationStatus} limit={c.qualificationLimit} size="sm" />}
                {c.investmentCapacity && (
                  <p className="num text-[10px] text-ink-faint">
                    التذكرة: {formatCurrencyShort(c.investmentCapacity)}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Client Profile Drawer — executive summary
// ─────────────────────────────────────────────
function ClientDrawer({ client, empName, fundName, opportunities, retalFund, retalHolding, onClose, onOpenReport }: {
  client: Client;
  empName: (id?: string) => string;
  fundName: (id?: string) => string;
  opportunities: PipelineItem[];
  retalFund?: Fund;
  retalHolding: Holding | null;
  onClose: () => void;
  onOpenReport: (s: import('@/hooks/useReportPreview').ReportPreviewState) => void;
}) {
  const invested = client.total_invested ?? 0;
  const profit   = client.total_profit   ?? 0;
  const returnPct = invested > 0 ? profit / invested : 0;
  const days = daysSince(client.last_contact_date);

  // Next recommended action logic
  const nextAction = useMemo((): string => {
    if (!client.last_contact_date) return 'ابدأ التواصل وتعرّف على الاحتياجات الاستثمارية';
    const d = daysSince(client.last_contact_date)!;
    if (d > 60) return 'تواصل عاجل — مضى أكثر من شهرين على آخر تواصل';
    if (d > 30) return 'حدد موعد متابعة — مضى أكثر من شهر';
    if (opportunities.length === 0 && client.status === 'existing') return 'عرض الصناديق الجديدة المتوافقة مع تفضيلاته';
    if (opportunities.some((o) => o.stage === 'Proposal')) return 'متابعة العرض المرسل وتلقّي الملاحظات';
    if (opportunities.some((o) => o.stage === 'Committed')) return 'المتابعة لإتمام الاكتتاب والتوثيق';
    return 'متابعة دورية والتحقق من الرضا';
  }, [client, opportunities]);

  return (
    <Drawer open={true} onClose={onClose} title={client.name_ar}
      subtitle={`${clientClassificationLabels[client.classification]} · ${client.city ?? ''}`} width="lg">

      {/* Status row */}
      <div className="flex flex-wrap gap-2">
        <Badge tone={statusTone(client.status)}>{clientStatusLabels[client.status]}</Badge>
        {client.risk_profile      && <Badge tone="neutral">{riskProfileLabels[client.risk_profile]}</Badge>}
        {client.preferred_asset_class && <Badge tone="info">{assetClassLabels[client.preferred_asset_class]}</Badge>}
        {client.is_ceo_attention  && <Badge tone="warning" dot>تحت رادار الإدارة</Badge>}
      </div>

      {/* Report action buttons */}
      <div className="flex gap-2 flex-wrap">
        <ReportDrawerBtn label="تقرير العميل" icon="📄" onClick={() => onOpenReport({ reportType: 'client_summary', clientId: client.client_id })} />
        <ReportDrawerBtn label="تقرير قبل الزيارة" icon="📋" onClick={() => onOpenReport({ reportType: 'pre_visit', clientId: client.client_id })} />
        {(() => {
          const reportReady = (retalFund?.report_ready ?? '').trim().toUpperCase() === 'YES';
          const enabled = !!retalFund && reportReady;
          const label = !retalFund
            ? 'تحديث صندوق رتال'
            : reportReady
              ? `تحديث ${retalFund.name_ar}`
              : 'لم يجهز التقرير بعد';
          const tooltip = !retalFund
            ? 'بيانات صندوق رتال غير متاحة في المصدر حالياً'
            : reportReady
              ? undefined
              : 'لم يجهز التقرير بعد';
          return (
            <ReportDrawerBtn
              label={label}
              icon="🏗"
              disabled={!enabled}
              disabledTitle={tooltip}
              onClick={() => {
                if (!enabled || !retalFund) return;
                onOpenReport({
                  reportType: 'fund_update',
                  fundId: retalFund.fund_id,
                  clientId: client.client_id,
                  liveFund: retalFund,
                  liveClient: client,
                  liveHolding: retalHolding,
                });
              }}
            />
          );
        })()}
      </div>

      {/* Data entry launchers */}
      <div className="flex gap-2 flex-wrap">
        <InputFormLauncher url={INPUT_FORMS.CLIENT_REQUEST_FORM_URL} label="إضافة طلب عميل"   icon="➕" />
        <InputFormLauncher url={INPUT_FORMS.FOLLOW_UP_FORM_URL}       label="إضافة متابعة"     icon="📅" />
      </div>

      {/* Next recommended action — الأبرز في الدرور */}
      <div className="bg-watheeq-navy-deep rounded-xl p-4 flex items-start gap-3">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-watheeq-gold/20 flex items-center justify-center text-watheeq-gold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] text-white/50 mb-1 font-medium uppercase tracking-wider">الإجراء الموصى به</p>
          <p className="text-[14px] text-white font-semibold leading-snug">{nextAction}</p>
        </div>
      </div>

      {/* Financial summary */}
      {invested > 0 && (
        <DrawerSection title="ملخص الاستثمار">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'إجمالي الاستثمار', value: <span className="num">{formatCurrency(invested)}</span> },
              { label: 'إجمالي الأرباح',   value: <span className="num text-state-success">{formatCurrency(profit)}</span> },
              { label: 'العائد الإجمالي',  value: <span className="num text-state-success font-bold">{formatPercent(returnPct)}</span> },
            ].map((s) => (
              <div key={s.label} className="bg-watheeq-bg-cream rounded-lg p-3 text-center">
                <p className="text-[11px] text-ink-muted mb-1 leading-tight">{s.label}</p>
                <p className="text-[14px] font-bold text-watheeq-navy-deep">{s.value}</p>
              </div>
            ))}
          </div>
        </DrawerSection>
      )}

      {/* Relationship summary */}
      <DrawerSection title="ملخص العلاقة">
        <DrawerRow label="المسؤول عن العلاقة" value={empName(client.relationship_owner_id)} />
        <DrawerRow label="آخر تواصل"
          value={<span className={cn('num', days !== null && days > 30 ? 'text-state-warning font-bold' : '')}>
            {formatDate(client.last_contact_date)}
            {days !== null && ` (${days} يوم)`}
          </span>} />
        <DrawerRow label="آخر زيارة"     value={formatDate(client.last_visit_date)} />
        <DrawerRow label="آخر تقرير"    value={formatDate(client.last_report_date)} />
        <DrawerRow label="متابعة قادمة"
          value={client.next_follow_up_date
            ? <span className="text-state-warning num font-bold">{formatDate(client.next_follow_up_date)}</span>
            : <span className="text-ink-faint">لم تُحدد</span>} />
      </DrawerSection>

      {/* Preferences */}
      <DrawerSection title="التفضيلات الاستثمارية">
        <DrawerRow label="فئة الأصول المفضلة"
          value={client.preferred_asset_class ? assetClassLabels[client.preferred_asset_class] : undefined} />
        <DrawerRow label="ملف المخاطرة"
          value={client.risk_profile ? riskProfileLabels[client.risk_profile] : undefined} />
        <DrawerRow label="مستوى الحساسية"
          value={client.status === 'sensitive'
            ? <Badge tone="danger" size="sm">عميل حساس</Badge>
            : <span className="text-ink-muted text-[13px]">عادي</span>} />
        {client.qualificationStatus && (
          <>
            <DrawerRow label="الحالة النظامية"
              value={<QualificationBadge status={client.qualificationStatus} limit={client.qualificationLimit} />} />
            <DrawerRow label="الحد النظامي للاستثمار"
              value={client.qualificationLimit
                ? <span className="num font-bold text-state-danger">200,000 ر.س</span>
                : <span className="text-ink-muted">مفتوح — لا يوجد حد نظامي</span>} />
            {client.investmentCapacity && (
              <DrawerRow label="التذكرة الاستثمارية المناسبة"
                value={<span className="num font-bold text-watheeq-navy-deep">{formatCurrencyShort(client.investmentCapacity)}</span>} />
            )}
          </>
        )}
      </DrawerSection>

      {/* Open opportunities */}
      {opportunities.length > 0 && (
        <DrawerSection title={`الفرص المفتوحة (${opportunities.length})`}>
          <div className="space-y-2.5">
            {opportunities.map((opp) => {
              const tone = opp.stage === 'Committed' ? 'gold' : opp.stage === 'Proposal' ? 'warning' : 'navy';
              return (
                <div key={opp.opportunity_id} className="flex items-center gap-3 p-3 rounded-xl border border-line/60 bg-watheeq-bg-cream/40 hover:bg-watheeq-bg-cream/80 transition-colors">
                  <div className="flex-1 min-w-0">
                    <EntityLink type="fund" id={opp.fund_id} label={fundName(opp.fund_id)} className="text-[13px] font-bold text-watheeq-navy-deep truncate block" />
                    <div className="flex items-center gap-2 mt-1">
                      <Badge tone={tone} size="sm">{pipelineStageLabels[opp.stage]}</Badge>
                      {opp.next_step && <span className="text-[11px] text-ink-muted truncate max-w-[150px]">{opp.next_step}</span>}
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="num font-bold text-[14px] text-watheeq-navy-deep">{formatCurrencyShort(opp.expected_amount)}</p>
                    <p className="num text-[11px] text-ink-muted">{formatPercent(opp.probability)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DrawerSection>
      )}

      {/* Notes */}
      {client.notes && (
        <DrawerSection title="ملاحظات">
          <p className="text-[14px] text-ink leading-relaxed bg-watheeq-bg-cream/50 rounded-xl p-3.5">{client.notes}</p>
        </DrawerSection>
      )}
    </Drawer>
  );
}

function ReportDrawerBtn({ label, icon, onClick, disabled, disabledTitle }: {
  label: string; icon: string; onClick: () => void;
  disabled?: boolean; disabledTitle?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={disabled ? disabledTitle : undefined}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 px-3 rounded-lg border transition-all',
        disabled
          ? 'border-line/40 bg-watheeq-bg-cream/30 text-ink-faint cursor-not-allowed'
          : 'border-watheeq-navy/20 bg-watheeq-bg-cream/60 text-watheeq-navy hover:bg-watheeq-navy hover:text-white'
      )}>
      <span>{icon}</span> {label}
    </button>
  );
}

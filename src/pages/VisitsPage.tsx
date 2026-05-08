import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { FilterBar, FilterSelect, FilterSearch } from '@/components/ui/FilterBar';
import { EmptyState } from '@/components/ui/States';
import { Drawer, DrawerSection, DrawerRow } from '@/components/ui/Drawer';
import { ReportGate } from '@/components/reports/ReportGate';
import { useReportPreview } from '@/hooks/useReportPreview';
import {
  ConvertToOpportunityModal,
  SuitableClientModal,
  FollowUpModal,
  CloseNoOpportunityModal,
} from '@/components/visits/VisitActionModals';
import { mockVisitRecords } from '@/data/mockVisits';
import { useVisitRecords } from '@/hooks';
import { EntityLink } from '@/components/ui/EntityLink';
import { InputFormLauncher } from '@/components/ui/InputFormLauncher';
import { INPUT_FORMS } from '@/config/inputForms';
import {
  VISIT_TYPE_LABELS, VISIT_STATUS_LABELS, INTEREST_LEVEL_LABELS,
  MEETING_MINUTES_LABELS, INTERNAL_REPORT_LABELS, CLIENT_REQUEST_LABELS,
  STATUS_COLORS, INTEREST_COLORS, daysSince, daysUntil,
} from '@/types/visits';
import type { VisitRecord, VisitStatus } from '@/types/visits';
import { formatCurrencyShort, formatDateShort, formatDate, formatNumber, buildFilterOptions } from '@/lib/format';
import { cn } from '@/lib/utils';
import { brandColors } from '@/styles/brandTokens';

// ─── view type ───────────────────────────────────────────────
type ViewMode  = 'cards' | 'table' | 'kanban';
type TimeRange = 'week' | 'day' | 'month' | 'needs_followup' | 'converted' | 'history';

// ─── Kanban stages for visits ────────────────────────────────
const KANBAN_STAGES: Array<{ key: VisitStatus; label: string; color: string }> = [
  { key: 'scheduled',     label: 'مجدولة',             color: STATUS_COLORS.scheduled },
  { key: 'completed',     label: 'تمت',                color: STATUS_COLORS.completed },
  { key: 'needs_followup',label: 'تحتاج متابعة',      color: STATUS_COLORS.needs_followup },
  { key: 'converted',     label: 'تحولت إلى فرصة',    color: STATUS_COLORS.converted },
  { key: 'needs_mgmt',    label: 'تدخل الإدارة',       color: STATUS_COLORS.needs_mgmt },
  { key: 'closed_no_opp', label: 'مغلقة',              color: STATUS_COLORS.closed_no_opp },
];

// ─── Status badge tone ───────────────────────────────────────
function statusTone(s: VisitStatus): 'success'|'info'|'warning'|'danger'|'gold'|'neutral'|'navy' {
  switch (s) {
    case 'completed':     return 'success';
    case 'scheduled':     return 'info';
    case 'needs_followup':return 'warning';
    case 'needs_mgmt':    return 'danger';
    case 'converted':     return 'gold';
    case 'postponed':     return 'warning';
    case 'cancelled':     return 'neutral';
    case 'closed_no_opp': return 'neutral';
    default:              return 'navy';
  }
}

// ─── Alert detection ─────────────────────────────────────────
interface VisitAlert {
  visit: VisitRecord;
  type: string;
  severity: 'high' | 'medium';
  action: string;
  age: number; // days
}

function detectAlerts(visits: VisitRecord[]): VisitAlert[] {
  const alerts: VisitAlert[] = [];

  for (const v of visits) {
    // محضر غير مرسل بعد زيارة مكتملة
    if (v.status === 'completed' && (v.meeting_minutes_status === 'overdue' || v.meeting_minutes_status === 'not_created')) {
      const age = daysSince(v.visit_date);
      alerts.push({ visit: v, type: 'زيارة تمت بدون محضر اجتماع', severity: age > 1 ? 'high' : 'medium', action: 'إنشاء وإرسال محضر الاجتماع', age });
    }
    // طلب عميل متأخر
    for (const req of (v.client_requests ?? [])) {
      if (req.status === 'overdue') {
        const age = daysSince(req.due_date);
        alerts.push({ visit: v, type: `طلب عميل متأخر: ${req.type.substring(0, 28)}`, severity: age > 2 ? 'high' : 'medium', action: 'إنجاز الطلب فوراً', age });
      }
    }
    // فرصة عالية الاهتمام لم تتحول
    if (v.interest_level === 'very_high' && !v.linkedOpportunityId && v.conversionDecision === 'لم يقرر'
        && (v.status === 'completed' || v.status === 'needs_followup')) {
      alerts.push({ visit: v, type: 'زيارة عالية الاهتمام لم تتحول إلى فرصة', severity: 'high', action: 'تحويل إلى فرصة الآن', age: daysSince(v.visit_date) });
    }
    // عميل مناسب بدون متابعة
    if (v.recommendedClientStatus === 'عميل مناسب' && v.followUpStatus === 'لا يوجد') {
      alerts.push({ visit: v, type: 'عميل مناسب بدون متابعة مجدولة', severity: 'medium', action: 'إنشاء متابعة لاحقة', age: daysSince(v.visit_date) });
    }
    // مرتبطة بفرصة لكن لا توجد خطوة تالية
    if (v.linkedOpportunityId && !v.next_action) {
      alerts.push({ visit: v, type: 'زيارة مرتبطة بفرصة بدون خطوة تالية', severity: 'medium', action: 'تحديد الخطوة التالية', age: daysSince(v.visit_date) });
    }
    // يحتاج تدخل الإدارة
    if (v.management_attention && v.status !== 'closed_no_opp') {
      alerts.push({ visit: v, type: 'يحتاج تدخل الإدارة', severity: 'high', action: 'رفع للإدارة أو تحديد موعد', age: daysSince(v.visit_date) });
    }
    // متابعة متأخرة
    if (v.followUpStatus === 'متأخرة') {
      alerts.push({ visit: v, type: 'متابعة متأخرة', severity: 'medium', action: 'إنجاز المتابعة المتأخرة', age: daysSince(v.visit_date) });
    }
  }

  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = `${a.visit.visit_id}-${a.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0) || b.age - a.age);
}

// ─── Main Page ────────────────────────────────────────────────
export function VisitsPage() {
  const [viewMode,   setViewMode]   = useState<ViewMode>('cards');
  const [timeRange,  setTimeRange]  = useState<TimeRange>('week');
  const [search,     setSearch]     = useState('');
  const [fOwner,     setFOwner]     = useState('');
  const [fType,      setFType]      = useState('');
  const [fStatus,    setFStatus]    = useState('');
  const [fCity,      setFCity]      = useState('');
  const [selected,   setSelected]   = useState<VisitRecord | null>(null);
  const { state: rptState, openReport, close: closeReport } = useReportPreview();

  const visitRecordsQ = useVisitRecords();
  const visits = visitRecordsQ.data?.data ?? mockVisitRecords;
  const alerts = useMemo(() => detectAlerts(visits), [visits]);

  // All unique filter options
  const owners = useMemo(() => [...new Set(visits.map((v) => v.owner_name))], [visits]);
  const cities  = useMemo(() => [...new Set(visits.map((v) => v.city))], [visits]);

  // Time range filter
  const byTime = useMemo(() => {
    const now = Date.now();
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0,0,0,0);
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    switch (timeRange) {
      case 'week':        return visits.filter((v) => { const d = new Date(v.visit_date).getTime(); return d >= weekStart.getTime() && d < weekEnd.getTime(); });
      case 'day':         return visits.filter((v) => daysSince(v.visit_date) === 0);
      case 'month':       return visits.filter((v) => daysSince(v.visit_date) <= 30);
      case 'needs_followup': return visits.filter((v) => v.status === 'needs_followup' || v.status === 'needs_mgmt');
      case 'converted':   return visits.filter((v) => v.converted_to_pipeline || v.status === 'converted');
      case 'history':     return [...visits].sort((a, b) => b.visit_date.localeCompare(a.visit_date));
      default:            return visits;
    }
  }, [visits, timeRange]);

  // Field filters
  const filtered = useMemo(() => byTime.filter((v) => {
    if (search && !v.client_name.includes(search) && !(v.fund_name ?? '').includes(search)) return false;
    if (fOwner  && v.owner_name  !== fOwner)  return false;
    if (fType   && v.visit_type  !== fType)   return false;
    if (fStatus && v.status      !== fStatus) return false;
    if (fCity   && v.city        !== fCity)   return false;
    return true;
  }), [byTime, search, fOwner, fType, fStatus, fCity]);

  const clearFilters = () => { setSearch(''); setFOwner(''); setFType(''); setFStatus(''); setFCity(''); };
  const activeFilters = [fOwner, fType, fStatus, fCity].filter(Boolean).length + (search ? 1 : 0);

  // KPI calculations
  const kpis = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const thisWeek = visits.filter((v) => {
      const t = new Date(v.visit_date).getTime();
      return isFinite(t) && t >= weekStart.getTime() && t < weekEnd.getTime();
    });
    return {
      total:          thisWeek.length,
      completed:      thisWeek.filter((v) => v.status === 'completed').length,
      upcoming:       thisWeek.filter((v) => v.status === 'scheduled').length,
      needsFollowup:  visits.filter((v) => v.status === 'needs_followup').length,
      minutesOverdue: visits.filter((v) => (v.status === 'completed') && (v.meeting_minutes_status === 'overdue' || v.meeting_minutes_status === 'not_created')).length,
      requestsOverdue:visits.flatMap((v) => (v.client_requests ?? [])).filter((r) => r.status === 'overdue').length,
      converted:      visits.filter((v) => v.converted_to_pipeline).length,
      needsMgmt:      visits.filter((v) => v.management_attention && v.status !== 'closed_no_opp').length,
    };
  }, [visits]);

  return (
    <div className="space-y-5">
      {/* أزرار الإجراءات والتقارير */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <InputFormLauncher url={INPUT_FORMS.VISIT_FORM_URL} label="تسجيل زيارة" icon="+" variant="primary" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => openReport({ reportType: 'weekly_visits' })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg border border-line bg-white hover:bg-watheeq-bg-cream text-ink-soft transition-colors">
            📅 تقرير الزيارات الأسبوعي
          </button>
          <button type="button" onClick={() => openReport({ reportType: 'management_attention' })}
            className="text-[12px] font-bold px-3 py-2 rounded-lg bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors">
            ⚡ تقرير فرص الإدارة
          </button>
        </div>
      </div>
      <ReportGate state={rptState} onClose={closeReport} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label:'الأسبوع',             value:kpis.total,           color:'' },
          { label:'تمت',                  value:kpis.completed,       color:'success' },
          { label:'قادمة',                value:kpis.upcoming,        color:'info' },
          { label:'تحتاج متابعة',        value:kpis.needsFollowup,   color:kpis.needsFollowup>0?'warning':'' },
          { label:'محاضر متأخرة',        value:kpis.minutesOverdue,  color:kpis.minutesOverdue>0?'danger':'' },
          { label:'طلبات متأخرة',        value:kpis.requestsOverdue, color:kpis.requestsOverdue>0?'danger':'' },
          { label:'تحولت لفرص',          value:kpis.converted,       color:'gold' },
          { label:'تدخل الإدارة',        value:kpis.needsMgmt,       color:kpis.needsMgmt>0?'danger':'' },
        ].map((k) => (
          <div key={k.label} className="surface-card px-3 py-3 text-center">
            <p className="text-[11px] text-ink-muted mb-1 leading-tight">{k.label}</p>
            <p className={cn('num font-bold text-[22px] text-watheeq-navy-deep',
              k.color === 'success' && 'text-state-success',
              k.color === 'info'    && 'text-state-info',
              k.color === 'warning' && 'text-state-warning',
              k.color === 'danger'  && 'text-state-danger',
              k.color === 'gold'    && 'text-watheeq-gold-deep',
            )}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Critical alerts */}
      {alerts.length > 0 && <CriticalAlertsSection alerts={alerts.slice(0, 6)} />}

      {/* Time range tabs + View mode + Filters */}
      <div className="surface-card overflow-hidden">
        {/* Time range */}
        <div className="flex items-center gap-0 border-b border-line/50 px-1">
          {([
            ['week',          'هذا الأسبوع'],
            ['day',           'اليوم'],
            ['month',         'الشهر'],
            ['needs_followup','تحتاج متابعة'],
            ['converted',     'تحولت لفرص'],
            ['history',       'سجل الزيارات'],
          ] as const).map(([key, lbl]) => (
            <button key={key} type="button" onClick={() => setTimeRange(key)}
              className={cn('px-4 py-3 text-[13px] font-medium transition-colors border-b-2 -mb-px',
                timeRange === key ? 'text-watheeq-navy border-watheeq-gold bg-watheeq-gold/5' : 'text-ink-muted border-transparent hover:text-ink')}>
              {lbl}
              {key === 'needs_followup' && kpis.needsFollowup > 0 && (
                <span className="ms-1 num text-[10px] px-1 py-0.5 bg-state-warning text-white rounded">{kpis.needsFollowup}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters + view toggle */}
        <div className="p-3 flex items-center gap-3 flex-wrap border-b border-line/30">
          <FilterSearch value={search} onChange={setSearch} placeholder="بحث بالعميل أو الصندوق…" />
          <FilterSelect label="المسؤول" value={fOwner} onChange={setFOwner}
            options={buildFilterOptions(visits, v => v.owner_name || null)} />
          <FilterSelect label="النوع"   value={fType}  onChange={setFType}
            options={buildFilterOptions(visits, v => v.visit_type, VISIT_TYPE_LABELS)} />
          <FilterSelect label="الحالة" value={fStatus} onChange={setFStatus}
            options={buildFilterOptions(visits, v => v.status, VISIT_STATUS_LABELS)} />
          <FilterSelect label="المدينة" value={fCity}  onChange={setFCity}
            options={buildFilterOptions(visits, v => v.city || null)} />
          {activeFilters > 0 && <button type="button" onClick={clearFilters} className="text-[12px] text-watheeq-navy hover:text-watheeq-gold-deep font-medium">مسح ({activeFilters})</button>}

          <div className="ms-auto flex items-center gap-1 border border-line rounded-lg p-1 bg-white">
            {(['cards','table','kanban'] as ViewMode[]).map((v) => (
              <button key={v} type="button" onClick={() => setViewMode(v)}
                className={cn('px-3 py-1.5 rounded-md text-[12px] font-medium transition-all',
                  viewMode===v ? 'bg-watheeq-navy text-white' : 'text-ink-muted hover:text-ink')}>
                {v==='cards'?'بطاقات':v==='table'?'جدول':'كانبان'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-1 px-4 py-2 text-[12px] text-ink-muted">
          <span className="num font-bold text-ink">{filtered.length}</span> زيارة
        </div>
      </div>

      {/* Main content */}
      {filtered.length === 0 ? (
        <EmptyState title="لا توجد زيارات" message="جرب تغيير معايير الفلترة." />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => <VisitCard key={v.visit_id} visit={v} onSelect={setSelected} />)}
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView visits={filtered} onSelect={setSelected} />
      ) : (
        <VisitTable visits={filtered} onSelect={setSelected} />
      )}

      {/* Escalation rules placeholder */}
      <EscalationRulesSection />

      {/* Visit drawer */}
      {selected && <VisitDrawer visit={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Critical Alerts Section ──────────────────────────────────
function CriticalAlertsSection({ alerts }: { alerts: VisitAlert[] }) {
  return (
    <div className="surface-card overflow-hidden relative">
      <span className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-l from-state-danger via-state-warning to-state-warning" />
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-section-title font-bold text-watheeq-navy-deep flex items-center gap-2">
            🔴 مؤشرات المتابعة الحرجة
          </h3>
          <p className="text-[13px] text-ink-muted mt-1">تنبيهات تستوجب إجراءً فورياً</p>
        </div>
        <Badge tone="danger"><span className="num">{alerts.length}</span> تنبيه</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-5 pb-5">
        {alerts.map((a, i) => (
          <div key={i} className={cn('rounded-xl border p-4 space-y-2',
            a.severity === 'high' ? 'border-state-danger/30 bg-state-danger-bg/40' : 'border-state-warning/30 bg-state-warning-bg/40')}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-bold text-ink">{a.type}</p>
              <span className={cn('shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded', a.severity === 'high' ? 'bg-state-danger text-white' : 'bg-state-warning text-white')}>{a.severity === 'high' ? 'عاجل' : 'تنبيه'}</span>
            </div>
            <p className="text-[12px] text-watheeq-navy-deep font-bold">{a.visit.client_name}</p>
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>{a.visit.owner_name}</span>
              <span className="num">{a.age === 0 ? 'اليوم' : `${a.age} يوم`}</span>
            </div>
            <p className="text-[11px] text-ink bg-white/70 rounded px-2 py-1">الإجراء: {a.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Visit Card ───────────────────────────────────────────────
function VisitCard({ visit: v, onSelect }: { visit: VisitRecord; onSelect: (v: VisitRecord) => void }) {
  const color = STATUS_COLORS[v.status];
  const interestColor = INTEREST_COLORS[v.interest_level] ?? INTEREST_COLORS['medium'];
  const openReqs = (v.client_requests ?? []).filter((r) => r.status !== 'done').length;
  const overdueReqs = (v.client_requests ?? []).filter((r) => r.status === 'overdue').length;
  const minutesAlert = v.status === 'completed' && (v.meeting_minutes_status === 'overdue' || v.meeting_minutes_status === 'not_created');
  const daysToDue = v.due_date ? daysUntil(v.due_date) : null;

  return (
    <button type="button" onClick={() => onSelect(v)}
      className="surface-card p-4 text-start group hover:shadow-card-hover transition-all duration-200 hover:-translate-y-px w-full flex flex-col gap-3">
      {/* Status strip */}
      <span className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl" style={{ background: color }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mt-0.5">
        <div className="min-w-0 flex-1">
            <EntityLink type="client" id={v.client_id} label={v.client_name} className="font-bold text-[14px] text-watheeq-navy-deep truncate block" />
          <p className="text-[12px] text-ink-muted">{v.client_classification} · {v.city}</p>
        </div>
        {v.management_attention && <span className="text-watheeq-gold text-[14px] shrink-0" title="يحتاج تدخل الإدارة">⚡</span>}
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={statusTone(v.status)} size="sm" dot>{VISIT_STATUS_LABELS[v.status]}</Badge>
        <Badge tone="neutral" size="sm">{VISIT_TYPE_LABELS[v.visit_type]}</Badge>
      </div>

      {/* Date + fund */}
      <div className="text-[12px] space-y-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px]">📅</span>
          <span className="num text-ink">{formatDateShort(v.visit_date)}</span>
          {v.visit_time && <span className="num text-ink-muted">{v.visit_time}</span>}
        </div>
        {v.fund_name && <p className="text-ink-muted truncate">🏦 {v.fund_name}</p>}
      </div>

      {/* Interest level + value */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold rounded px-2 py-0.5" style={{ color: interestColor, background: interestColor + '14' }}>
          {INTEREST_LEVEL_LABELS[v.interest_level]}
        </span>
        {v.value_estimate ? (
          <span className="num text-[13px] font-bold text-watheeq-navy-deep">{formatCurrencyShort(v.value_estimate)}</span>
        ) : null}
      </div>

      {/* Alert + relationship badges */}
      <div className="flex flex-wrap gap-1">
        {v.linkedOpportunityId         && <AlertBadge label="مرتبطة بفرصة"       color="success" />}
        {v.recommendedClientStatus === 'عميل مناسب' && !v.linkedOpportunityId && <AlertBadge label="عميل مناسب" color="gold" />}
        {v.can_convert && !v.linkedOpportunityId && v.conversionDecision !== 'إغلاق بدون فرصة' && <AlertBadge label="فرصة محتملة" color="gold" />}
        {v.followUpStatus === 'مفتوحة'  && <AlertBadge label="متابعة مفتوحة"      color="gold" />}
        {v.followUpStatus === 'متأخرة'  && <AlertBadge label="متابعة متأخرة"      color="danger" />}
        {v.conversionDecision === 'إغلاق بدون فرصة' && <AlertBadge label="مغلقة بدون فرصة" color="gray" />}
        {minutesAlert                   && <AlertBadge label="محضر غير مرسل"      color="danger" />}
        {overdueReqs > 0                && <AlertBadge label={`${overdueReqs} طلبات متأخرة`} color="warning" />}
        {v.management_attention         && <AlertBadge label="تدخل الإدارة"       color="danger" />}
        {daysToDue !== null && daysToDue <= 0 && daysToDue > -30 && <AlertBadge label="متأخر" color="danger" />}
        {daysToDue !== null && daysToDue >= 0 && daysToDue <= 1 && v.followUpStatus !== 'مكتملة' && <AlertBadge label="متابعة اليوم" color="warning" />}
      </div>

      {/* Next action */}
      {v.next_action && (
        <p className="text-[12px] text-ink bg-watheeq-bg-cream/60 rounded px-2.5 py-1.5 border border-line/40 truncate">
          ← {v.next_action}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-ink-muted border-t border-line/40 pt-2">
        <div className="min-w-0">
          <span>{v.owner_name}</span>
          {v.brokerName && v.brokerName !== v.owner_name && (
            <span className="text-ink-faint"> · {v.brokerName}</span>
          )}
        </div>
        {openReqs > 0 && <span className="num shrink-0"><span className="text-state-warning font-bold">{openReqs}</span> طلب مفتوح</span>}
      </div>
    </button>
  );
}

function AlertBadge({ label, color }: { label: string; color: 'danger'|'warning'|'gold'|'success'|'gray' }) {
  const styles = {
    danger:  { bg: '#FBEAE8', text: '#B42318', border: '#B4231822' },
    warning: { bg: '#FBF1DF', text: '#C88719', border: '#C8871922' },
    gold:    { bg: 'rgba(200,164,93,0.10)', text: '#A1813E', border: 'rgba(200,164,93,0.3)' },
    success: { bg: '#E7F5EE', text: '#1F8A5B', border: '#1F8A5B22' },
    gray:    { bg: '#F1F2F4', text: '#6B7280', border: '#6B728022' },
  }[color];
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border" style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}>
      {label}
    </span>
  );
}

// ─── Kanban View ──────────────────────────────────────────────
function KanbanView({ visits, onSelect }: { visits: VisitRecord[]; onSelect: (v: VisitRecord) => void }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {KANBAN_STAGES.map((col) => {
          const colVisits = visits.filter((v) => v.status === col.key);
          return (
            <div key={col.key} className="w-[240px] shrink-0 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl mb-2 border-b-2"
                style={{ background: col.color + '14', borderColor: col.color }}>
                <span className="text-[12px] font-bold" style={{ color: col.color }}>{col.label}</span>
                <span className="num text-[11px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: col.color + '22', color: col.color }}>{colVisits.length}</span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {colVisits.length === 0
                  ? <div className="rounded-xl border-2 border-dashed border-line py-6 flex items-center justify-center"><span className="text-[11px] text-ink-faint">—</span></div>
                  : colVisits.map((v) => (
                    <button key={v.visit_id} type="button" onClick={() => onSelect(v)}
                      className="w-full bg-white rounded-xl border border-line shadow-card p-3 text-start space-y-2 hover:shadow-card-hover transition-all">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[12.5px] font-bold text-watheeq-navy-deep truncate">{v.client_name}</p>
                        {v.management_attention && <span className="text-watheeq-gold text-[12px]">⚡</span>}
                      </div>
                      <p className="text-[11px] text-ink-muted">{VISIT_TYPE_LABELS[v.visit_type]}</p>
                      <div className="flex flex-wrap gap-1">
                        {v.linkedOpportunityId && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-state-success-bg text-state-success border border-state-success/20">مرتبطة بفرصة</span>}
                        {v.recommendedClientStatus === 'عميل مناسب' && !v.linkedOpportunityId && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-watheeq-gold/10 text-watheeq-gold-deep border border-watheeq-gold/25">عميل مناسب</span>}
                        {v.can_convert && !v.linkedOpportunityId && v.conversionDecision !== 'إغلاق بدون فرصة' && !v.recommendedClientStatus.includes('مناسب') && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-watheeq-gold/10 text-watheeq-gold-deep border border-watheeq-gold/25">فرصة محتملة</span>}
                        {v.followUpStatus === 'متأخرة' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-state-danger-bg text-state-danger border border-state-danger/20">متابعة متأخرة</span>}
                        {v.followUpStatus === 'مفتوحة' && !v.linkedOpportunityId && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-state-info-bg text-state-info border border-state-info/20">متابعة مفتوحة</span>}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="num text-ink-muted">{formatDateShort(v.visit_date)}</span>
                        {v.value_estimate ? <span className="num font-bold text-watheeq-navy-deep">{formatCurrencyShort(v.value_estimate)}</span> : null}
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────
function VisitTable({ visits, onSelect }: { visits: VisitRecord[]; onSelect: (v: VisitRecord) => void }) {
  const columns: Column<VisitRecord>[] = [
    {
      key: 'client_name', header: 'العميل', sortable: true, sortAccessor: (r) => r.client_name,
      render: (r) => <div><EntityLink type="client" id={r.client_id} label={r.client_name} className="font-bold text-[14px] text-watheeq-navy-deep" /><p className="text-[11px] text-ink-muted">{r.city}</p></div>,
    },
    { key: 'visit_date', header: 'التاريخ', sortable: true, sortAccessor: (r) => r.visit_date,
      render: (r) => <span className="num text-[13px]">{formatDateShort(r.visit_date)}</span> },
    { key: 'visit_type', header: 'النوع', render: (r) => <Badge tone="neutral" size="sm">{VISIT_TYPE_LABELS[r.visit_type]}</Badge> },
    { key: 'owner_name', header: 'المسؤول', render: (r) => <span className="text-[13px]">{r.owner_name}</span> },
    { key: 'fund_name', header: 'الصندوق', render: (r) => r.fund_id
        ? <EntityLink type="fund" id={r.fund_id} label={r.fund_name ?? r.fund_id} className="text-[12px] text-ink-muted truncate max-w-[150px] block" />
        : <span className="text-ink-faint text-[12px]">—</span> },
    { key: 'status', header: 'الحالة', render: (r) => <Badge tone={statusTone(r.status)} size="sm" dot>{VISIT_STATUS_LABELS[r.status]}</Badge> },
    { key: 'meeting_minutes_status', header: 'المحضر', render: (r) => {
      const overdue = r.status === 'completed' && (r.meeting_minutes_status === 'overdue' || r.meeting_minutes_status === 'not_created');
      return <span className={cn('text-[12px] font-medium', overdue && 'text-state-danger')}>{MEETING_MINUTES_LABELS[r.meeting_minutes_status]}</span>;
    }},
    { key: 'client_requests', header: 'الطلبات', align: 'center', render: (r) => {
      const open = r.client_requests.filter((req) => req.status !== 'done').length;
      const overdue = r.client_requests.filter((req) => req.status === 'overdue').length;
      return open > 0 ? <Badge tone={overdue > 0 ? 'danger' : 'warning'} size="sm"><span className="num">{open}</span></Badge> : <span className="text-ink-faint">—</span>;
    }},
    { key: 'next_action', header: 'الخطوة التالية', render: (r) => <span className="text-[12px] text-ink truncate block max-w-[180px]">{r.next_action ?? '—'}</span> },
    { key: 'alerts', header: 'تنبيهات', align: 'center', render: (r) => (
      <div className="flex gap-1 justify-center flex-wrap">
        {r.linkedOpportunityId && <span title="مرتبطة بفرصة" className="text-[11px]">🔗</span>}
        {r.management_attention && <span title="تدخل الإدارة" className="text-[12px]">⚡</span>}
        {(r.meeting_minutes_status === 'overdue' || (r.status === 'completed' && r.meeting_minutes_status === 'not_created')) && <span title="محضر متأخر" className="text-[12px]">📄</span>}
        {r.followUpStatus === 'متأخرة' && <span title="متابعة متأخرة" className="text-[12px]">⏰</span>}
        {r.recommendedClientStatus === 'عميل مناسب' && <span title="عميل مناسب" className="text-[12px]">⭐</span>}
      </div>
    )},
    { key: 'relation', header: 'القرار', render: (r) => {
      if (r.linkedOpportunityId) return <Badge tone="success" size="sm">مرتبطة بفرصة</Badge>;
      if (r.conversionDecision === 'إغلاق بدون فرصة') return <Badge tone="neutral" size="sm">مغلقة</Badge>;
      if (r.recommendedClientStatus === 'عميل مناسب') return <Badge tone="gold" size="sm">عميل مناسب</Badge>;
      if (r.conversionDecision === 'لم يقرر' && (r.status === 'completed' || r.status === 'needs_followup')) return <Badge tone="warning" size="sm">لم يقرر</Badge>;
      return <span className="text-ink-faint text-[12px]">—</span>;
    }},
  ];

  return (
    <div className="surface-card overflow-hidden">
      <DataTable columns={columns} data={visits} rowKey={(r) => r.visit_id} onRowClick={onSelect} density="comfortable" />
    </div>
  );
}

// ─── Escalation Rules Section ─────────────────────────────────
function EscalationRulesSection() {
  const [open, setOpen] = useState(false);
  const rules = [
    { trigger: 'لم يُرسل محضر الاجتماع خلال 24 ساعة',         badge: 'تنبيه موظف',  tone: 'warning' as const },
    { trigger: 'تأخر طلب العميل أكثر من 48 ساعة',              badge: 'تنبيه مدير',  tone: 'danger'  as const },
    { trigger: 'فرصة عالية القيمة بدون متابعة لأكثر من 5 أيام', badge: 'تقرير الإدارة', tone: 'danger' as const },
    { trigger: 'لا توجد خطوة تالية بعد زيارة مكتملة',           badge: 'تنبيه متابعة', tone: 'warning' as const },
  ];

  return (
    <div className="surface-card overflow-hidden">
      <button type="button" onClick={() => setOpen((p) => !p)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-watheeq-bg-cream/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="text-[18px]">⚙️</span>
          <div className="text-start">
            <p className="font-bold text-[14px] text-watheeq-navy-deep">قواعد التصعيد</p>
            <p className="text-[12px] text-ink-muted">منطق التنبيهات والإشعارات التلقائية (UI placeholder)</p>
          </div>
        </div>
        <span className="text-ink-muted text-[12px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2.5">
          <div className="bg-watheeq-gold/5 border border-watheeq-gold/25 rounded-xl px-4 py-3 mb-3">
            <p className="text-[12px] text-watheeq-gold-deep leading-relaxed">
              هذه القواعد ستُفعَّل في مرحلة الربط الآلي. حالياً تعمل كـ UI placeholder لعرض المنطق المخطط.
            </p>
          </div>
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-line/50 bg-watheeq-bg-cream/30">
              <span className="text-[16px]">🔔</span>
              <p className="flex-1 text-[13px] text-ink">إذا {r.trigger}</p>
              <Badge tone={r.tone} size="sm">{r.badge}</Badge>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {['تنبيه موظف','تنبيه مدير','يظهر في تقرير الإدارة','يؤثر على SLA'].map((lbl) => (
              <span key={lbl} className="text-[11px] px-2 py-1 rounded-md border border-line text-ink-muted bg-white">{lbl}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Visit Drawer ─────────────────────────────────────────────
function VisitDrawer({ visit: v, onClose }: { visit: VisitRecord; onClose: () => void }) {
  type ActiveModal = 'convert' | 'suitable' | 'followup' | 'close' | null;
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const minutesAlert = v.status === 'completed' && (v.meeting_minutes_status === 'overdue' || v.meeting_minutes_status === 'not_created');
  const isClosed    = v.conversionDecision === 'إغلاق بدون فرصة';
  const hasLinked   = !!v.linkedOpportunityId;

  return (
    <>
      <Drawer open={true} onClose={onClose} title="تذكرة الزيارة" subtitle={v.client_name} width="xl">

        {/* ── Status + relationship badges ── */}
        <div className="flex flex-wrap gap-2">
          <Badge tone={statusTone(v.status)}>{VISIT_STATUS_LABELS[v.status]}</Badge>
          <Badge tone="neutral">{VISIT_TYPE_LABELS[v.visit_type]}</Badge>
          <span className="inline-flex items-center text-[12px] font-bold px-2.5 py-1 rounded-md border"
            style={{ color: INTEREST_COLORS[v.interest_level] ?? '#2563EB', background: (INTEREST_COLORS[v.interest_level] ?? '#2563EB') + '14', borderColor: (INTEREST_COLORS[v.interest_level] ?? '#2563EB') + '33' }}>
            {INTEREST_LEVEL_LABELS[v.interest_level]}
          </span>
          {/* Phase 3.4 relationship badges */}
          {hasLinked && <Badge tone="success" dot>مرتبطة بفرصة</Badge>}
          {v.recommendedClientStatus === 'عميل مناسب' && <Badge tone="gold" dot>عميل مناسب</Badge>}
          {v.followUpStatus === 'مفتوحة'  && <Badge tone="info"    dot>متابعة مفتوحة</Badge>}
          {v.followUpStatus === 'متأخرة'  && <Badge tone="danger"  dot>متابعة متأخرة</Badge>}
          {isClosed                        && <Badge tone="neutral" dot>مغلقة بدون فرصة</Badge>}
          {v.management_attention          && <Badge tone="warning" dot>يحتاج تدخل الإدارة</Badge>}
        </div>

        {/* ── Linked opportunity details (when visit is already linked) ── */}
        {hasLinked && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-state-success/30 bg-state-success-bg/20">
            <span className="text-[20px] shrink-0">🔗</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[13px] text-watheeq-navy-deep mb-1">مرتبطة بفرصة</p>
              <p className="text-[13px] text-ink truncate">{v.linkedOpportunityName}</p>
              <p className="text-[11px] text-ink-muted mt-0.5 num">{v.linkedOpportunityId}</p>
            </div>
            <button type="button"
              onClick={() => alert('سيُوجَّه إلى صفحة البايبلاين — يُفعَّل في مرحلة الربط.')}
              className="shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors">
              عرض الفرصة
            </button>
          </div>
        )}

        {/* ── Suitable client details ── */}
        {v.recommendedClientStatus === 'عميل مناسب' && v.recommendedForFundName && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-watheeq-gold/30 bg-watheeq-gold/5">
            <span className="text-[18px]">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-watheeq-gold-deep">عميل مناسب للصندوق</p>
              {v.recommendedForFundId
                ? <EntityLink type="fund" id={v.recommendedForFundId} label={v.recommendedForFundName} className="text-[13px] text-watheeq-navy-deep truncate block" />
                : <p className="text-[13px] text-watheeq-navy-deep truncate">{v.recommendedForFundName}</p>}
            </div>
          </div>
        )}

        {/* ── Follow-up details ── */}
        {(v.followUpStatus === 'مفتوحة' || v.followUpStatus === 'متأخرة') && v.next_action && (
          <div className={cn('flex items-start gap-3 p-3 rounded-xl border',
            v.followUpStatus === 'متأخرة' ? 'border-state-danger/30 bg-state-danger-bg/15' : 'border-state-info/30 bg-state-info-bg/15')}>
            <span className="text-[18px] shrink-0">{v.followUpStatus === 'متأخرة' ? '⏰' : '📅'}</span>
            <div>
              <p className={cn('text-[12px] font-bold', v.followUpStatus === 'متأخرة' ? 'text-state-danger' : 'text-state-info')}>
                متابعة {v.followUpStatus}
              </p>
              <p className="text-[13px] text-ink mt-0.5">{v.next_action}</p>
              {v.due_date && <p className="num text-[11px] text-ink-muted mt-0.5">الاستحقاق: {formatDate(v.due_date)}</p>}
            </div>
          </div>
        )}

        {/* ── Closed-no-opp notice ── */}
        {isClosed && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-line/50 bg-watheeq-bg-cream/50">
            <span className="text-[18px]">🔒</span>
            <div className="flex-1">
              <p className="text-[12px] font-bold text-ink-soft">مغلقة بدون فرصة</p>
              {v.closeReason && <p className="text-[13px] text-ink-muted">السبب: {v.closeReason}</p>}
            </div>
            <button type="button"
              onClick={() => alert('ستُعاد الزيارة للوضع المفتوح — يُفعَّل في مرحلة الربط.')}
              className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-line text-ink-muted hover:text-watheeq-navy hover:border-watheeq-navy transition-colors">
              إعادة فتح
            </button>
          </div>
        )}

        {/* ── Interest classification ── */}
        <InterestClassificationBanner visit={v} />

        {/* ── Group A: مخرجات الزيارة ── */}
        <ActionGroup title="مخرجات الزيارة">
          <InputFormLauncher url={INPUT_FORMS.MEETING_MINUTES_FORM_URL} label="إنشاء محضر اجتماع"
            icon="📝" variant={minutesAlert ? 'primary' : 'secondary'} className={minutesAlert ? '!bg-state-danger !border-state-danger text-white hover:opacity-90' : ''} />
          <InputFormLauncher url={INPUT_FORMS.VISIT_FORM_URL} label="تقرير زيارة داخلي"
            icon="📋" />
        </ActionGroup>

        {/* ── Group B: المتابعة ── */}
        <ActionGroup title="المتابعة">
          <InputFormLauncher url={INPUT_FORMS.CLIENT_REQUEST_FORM_URL} label="إضافة طلب عميل"  icon="➕" />
          <ActionBtn icon="📅" label="إنشاء متابعة لاحقة"    onClick={() => setActiveModal('followup')} />
          <ActionBtn icon="⚡" label="يحتاج تدخل الإدارة"    onClick={() => alert('تم الإشارة لتدخل الإدارة — يُفعَّل في مرحلة الربط.')} />
        </ActionGroup>

        {/* ── Group C: قرار التحويل ── */}
        <ActionGroup title="قرار التحويل">
          {hasLinked ? (
            <ActionBtn icon="🔗" label="عرض الفرصة المرتبطة"
              onClick={() => alert('سيُوجَّه إلى صفحة البايبلاين — يُفعَّل في مرحلة الربط.')} />
          ) : !isClosed && (
            <ActionBtn icon="🚀" label="تحويل إلى فرصة"
              onClick={() => setActiveModal('convert')} />
          )}
          {!isClosed && (
            <ActionBtn icon="⭐" label="إضافة إلى العملاء المناسبين"
              onClick={() => setActiveModal('suitable')} />
          )}
          {!isClosed && (
            <ActionBtn icon="🔒" label="إغلاق بدون فرصة"
              onClick={() => setActiveModal('close')} />
          )}
          {isClosed && (
            <ActionBtn icon="↩" label="إعادة فتح الزيارة"
              onClick={() => alert('ستُعاد الزيارة للوضع المفتوح — يُفعَّل في مرحلة الربط.')} />
          )}
        </ActionGroup>

        {/* ── A. بيانات الزيارة ── */}
        <DrawerSection title="بيانات الزيارة">
          <DrawerRow label="العميل"
            value={<EntityLink type="client" id={v.client_id} label={v.client_name} className="font-bold text-[14px] text-watheeq-navy-deep" />} />
          <DrawerRow label="المسؤول"          value={v.owner_name} />
          {v.accountManager && v.accountManager !== v.owner_name && (
            <DrawerRow label="مدير الحساب" value={v.accountManager} />
          )}
          {v.brokerName && (
            <DrawerRow label="الوسيط / مصدر الفرصة" value={v.brokerName} />
          )}
          <DrawerRow label="الصندوق المرتبط"
            value={v.fund_id && v.fund_name
              ? <EntityLink type="fund" id={v.fund_id} label={v.fund_name} className="text-[13px] text-ink-muted" />
              : v.fund_name ?? '—'} />
          <DrawerRow label="المدينة"          value={v.city} />
          <DrawerRow label="التاريخ والوقت"  value={<span className="num">{formatDate(v.visit_date)}{v.visit_time ? ` — ${v.visit_time}` : ''}</span>} />
          <DrawerRow label="نوع الزيارة"     value={VISIT_TYPE_LABELS[v.visit_type]} />
          <DrawerRow label="الحالة"           value={<Badge tone={statusTone(v.status)} size="sm">{VISIT_STATUS_LABELS[v.status]}</Badge>} />
          {v.value_estimate ? <DrawerRow label="القيمة التقديرية" value={<span className="num font-bold">{formatCurrencyShort(v.value_estimate)}</span>} /> : null}
          <DrawerRow label="قرار التحويل"    value={v.conversionDecision !== 'لم يقرر'
            ? <span className="font-medium text-watheeq-navy-deep">{v.conversionDecision}</span>
            : <span className="text-ink-faint">لم يقرر</span>} />
        </DrawerSection>

        {/* ── B. هدف الزيارة ── */}
        {v.visit_objective && (
          <DrawerSection title="هدف الزيارة">
            <p className="text-[14px] text-ink leading-relaxed bg-watheeq-bg-cream/50 rounded-xl p-3.5">{v.visit_objective}</p>
          </DrawerSection>
        )}

        {/* ── C. ملخص الاجتماع ── */}
        {v.meeting_summary && (
          <DrawerSection title="ملخص الاجتماع">
            <p className="text-[14px] text-ink leading-relaxed bg-watheeq-bg-cream/50 rounded-xl p-3.5 border-r-4 border-watheeq-gold">{v.meeting_summary}</p>
          </DrawerSection>
        )}

        {/* ── D. طلبات العميل ── */}
        <DrawerSection title={`طلبات العميل (${(v.client_requests ?? []).length})`}>
          {(v.client_requests ?? []).length === 0 ? (
            <p className="text-[13px] text-ink-muted">لا توجد طلبات.</p>
          ) : (
            <div className="space-y-2">
              {(v.client_requests ?? []).map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-line/50 bg-watheeq-bg-cream/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-ink">{req.type}</p>
                    <p className="text-[12px] text-ink-muted">{req.owner} · <span className="num">{formatDateShort(req.due_date)}</span></p>
                  </div>
                  <Badge tone={req.status==='done'?'success':req.status==='overdue'?'danger':req.status==='in_progress'?'info':'warning'} size="sm">
                    {CLIENT_REQUEST_LABELS[req.status]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DrawerSection>

        {/* ── E. مخرجات ما بعد الزيارة ── */}
        <DrawerSection title="مخرجات ما بعد الزيارة">
          <div className={cn('p-4 rounded-xl border mb-3', minutesAlert ? 'border-state-danger/40 bg-state-danger-bg/20' : 'border-line/50 bg-watheeq-bg-cream/30')}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-bold text-[13px] text-ink flex items-center gap-2">
                📧 محضر اجتماع للعميل
                {minutesAlert && <Badge tone="danger" size="sm">متأخر</Badge>}
              </p>
              <Badge tone={v.meeting_minutes_status==='sent'?'success':v.meeting_minutes_status==='ready'?'info':v.meeting_minutes_status==='overdue'?'danger':'neutral'} size="sm">
                {MEETING_MINUTES_LABELS[v.meeting_minutes_status]}
              </Badge>
            </div>
            <p className="text-[12px] text-ink-muted leading-relaxed">
              وثيقة رسمية تُرسل للعميل بعد الاجتماع تتضمن: شكر مختصر، ملخص النقاشات، ما اتُّفق عليه، الخطوات القادمة.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-line/50 bg-watheeq-bg-cream/30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-bold text-[13px] text-ink">📊 تقرير زيارة داخلي</p>
              <Badge tone={v.internal_report_status==='complete'?'success':v.internal_report_status==='needs_review'?'warning':'neutral'} size="sm">
                {INTERNAL_REPORT_LABELS[v.internal_report_status]}
              </Badge>
            </div>
            <p className="text-[12px] text-ink-muted leading-relaxed">
              تقييم داخلي: مستوى الجدية، الاعتراضات، تقدير الفرصة، هل يُحوَّل للبايبلاين.
            </p>
            {v.value_estimate && v.value_estimate > 0 && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="bg-white/80 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-ink-muted">القيمة التقديرية</p>
                  <p className="num font-bold text-[13px] text-watheeq-navy-deep">{formatCurrencyShort(v.value_estimate)}</p>
                </div>
                <div className="bg-white/80 rounded-lg px-3 py-2">
                  <p className="text-[11px] text-ink-muted">يُحوَّل للبايبلاين</p>
                  <p className="font-bold text-[13px] text-watheeq-navy-deep">
                    {v.linkedOpportunityId ? 'تم التحويل' : v.can_convert ? 'نعم — موصى به' : 'لا'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DrawerSection>
      </Drawer>

      {/* ── 4 action modals — rendered via portals ── */}
      {activeModal === 'convert'  && <ConvertToOpportunityModal visit={v} onClose={() => setActiveModal(null)} />}
      {activeModal === 'suitable' && <SuitableClientModal       visit={v} onClose={() => setActiveModal(null)} />}
      {activeModal === 'followup' && <FollowUpModal             visit={v} onClose={() => setActiveModal(null)} />}
      {activeModal === 'close'    && <CloseNoOpportunityModal   visit={v} onClose={() => setActiveModal(null)} />}
    </>
  );
}

// ─── ActionGroup wrapper ──────────────────────────────────────
function ActionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

// ─── Interest Classification Banner ──────────────────────────
function InterestClassificationBanner({ visit: v }: { visit: VisitRecord }) {
  const configs = {
    very_high: {
      bg: 'bg-state-success-bg border-state-success/25',
      text: 'text-state-success',
      label: 'مهتم جدًا',
      hint: 'فرصة قوية — يُنصح بالتحويل إلى بايبلاين فوراً إذا لم يتم بعد.',
    },
    high: {
      bg: 'bg-state-info-bg border-state-info/25',
      text: 'text-state-info',
      label: 'مهتم',
      hint: 'متابعة نشطة — حدد موعداً قريباً للاجتماع التالي.',
    },
    medium: {
      bg: 'bg-watheeq-gold/6 border-watheeq-gold/30',
      text: 'text-watheeq-gold-deep',
      label: 'اهتمام متوسط',
      hint: 'متابعة لاحقاً — قد يتحول عند تقدم جمع التمويل أو وصول الصندوق لمبلغ محدد.',
    },
    low: {
      bg: 'bg-slate-50 border-slate-200',
      text: 'text-slate-500',
      label: 'غير مهتم',
      hint: 'يُقترح إغلاق الزيارة بدون فرصة وجدولة إعادة تواصل في المستقبل.',
    },
  } as const;

  const cfg = configs[v.interest_level] ?? configs['medium'];

  return (
    <div className={cn('flex items-start gap-3 p-3.5 rounded-xl border', cfg.bg)}>
      <div className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold', cfg.text, 'bg-white border border-current/25')}>
        {v.interest_level === 'very_high' ? '🔥' : v.interest_level === 'high' ? '✦' : v.interest_level === 'medium' ? '◎' : '○'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-bold text-[13px]', cfg.text)}>{cfg.label}</p>
        <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed">{cfg.hint}</p>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, urgent, disabled }: {
  icon: string; label: string; onClick: () => void; urgent?: boolean; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={!disabled ? onClick : undefined} disabled={disabled}
      className={cn(
        'flex-1 min-w-[120px] flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 px-3 rounded-lg border transition-all',
        disabled ? 'border-line text-ink-faint cursor-not-allowed opacity-50' :
        urgent ? 'border-state-danger/50 bg-state-danger-bg text-state-danger hover:bg-state-danger hover:text-white' :
        'border-watheeq-navy/20 bg-watheeq-bg-cream/60 text-watheeq-navy hover:bg-watheeq-navy hover:text-white'
      )}>
      <span>{icon}</span>{label}
    </button>
  );
}

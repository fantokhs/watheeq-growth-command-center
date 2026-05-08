/**
 * FundraisingSummary — ملخص تعبئة الصندوق حسب تصنيف الاهتمام
 * Phase 3.6: يُستخدم في صفحة البايبلاين ودرور الصندوق
 */

import { useMemo } from 'react';
import type { PipelineItem, Fund, OpportunityInterestStatus } from '@/types';
import { INTEREST_STATUS_WEIGHTS } from '@/types';
import { formatCurrencyShort, formatPercent } from '@/lib/format';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<OpportunityInterestStatus, string> = {
  'تم التحويل':    '#1F8A5B',
  'مهتم جدًا':    '#2D6A4F',
  'مهتم':          '#2563EB',
  'اهتمام متوسط': '#C8A45D',
  'غير مهتم':      '#6B7280',
};

interface FundraisingSummaryProps {
  fund: Fund;
  pipeline: PipelineItem[];
  compact?: boolean;
  /** Optional chip filter — shows selected total alongside full breakdown */
  selectedFilter?: Set<OpportunityInterestStatus>;
}

export function FundraisingSummary({ fund, pipeline, compact = false, selectedFilter }: FundraisingSummaryProps) {
  const fundPipeline = pipeline.filter(
    (p) => p.fund_id === fund.fund_id && p.stage !== 'Lost'
  );

  const totals = useMemo(() => {
    const byStatus = (s: OpportunityInterestStatus) =>
      fundPipeline.filter((p) => p.interestStatus === s).reduce((sum, p) => sum + p.expected_amount, 0);

    const converted     = byStatus('تم التحويل');
    const highlyInt     = byStatus('مهتم جدًا');
    const interested    = byStatus('مهتم');
    const mediumInt     = byStatus('اهتمام متوسط');
    const notInterested = byStatus('غير مهتم');

    const weighted = fundPipeline
      .filter((p) => p.interestStatus !== 'غير مهتم')
      .reduce((sum, p) => sum + p.expected_amount * (INTEREST_STATUS_WEIGHTS[p.interestStatus ?? 'اهتمام متوسط']), 0);

    const target    = fund.target_size ?? 0;
    const remaining = Math.max(0, target - converted);
    const daysLeft  = fund.fund_close_date
      ? Math.floor((new Date(fund.fund_close_date).getTime() - Date.now()) / 86_400_000)
      : null;

    return { converted, highlyInt, interested, mediumInt, notInterested, weighted, remaining, daysLeft, target };
  }, [fundPipeline, fund]);

  // Selected-filter total for this specific fund
  const selectedTotal = useMemo(() => {
    if (!selectedFilter || selectedFilter.size === 0) return null;
    return fundPipeline
      .filter((p) => selectedFilter.has(p.interestStatus as OpportunityInterestStatus))
      .reduce((sum, p) => sum + p.expected_amount, 0);
  }, [fundPipeline, selectedFilter]);

  const coveragePct = totals.target > 0 ? Math.min(1, totals.converted / totals.target) : 0;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Selected filter total — shown when chips are active */}
        {selectedTotal !== null && (
          <div className="flex items-center justify-between bg-watheeq-navy/6 rounded-xl px-3 py-2 border border-watheeq-navy/15">
            <span className="text-[11px] font-bold text-watheeq-navy-deep">إجمالي التصنيفات المحددة</span>
            <span className="num font-bold text-[14px] text-watheeq-navy-deep">{formatCurrencyShort(selectedTotal)}</span>
          </div>
        )}
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[12px] mb-1.5">
            <span className="text-ink-muted font-medium">تقدم الاستقطاب</span>
            <span className="num font-bold text-watheeq-navy-deep">{formatPercent(coveragePct)}</span>
          </div>
          {/* Stacked bar */}
          <div className="h-3 rounded-full overflow-hidden bg-watheeq-bg-cream border border-line/40 flex">
            {(
              [
                ['تم التحويل', totals.converted],
                ['مهتم جدًا',  totals.highlyInt],
                ['مهتم',       totals.interested],
                ['اهتمام متوسط', totals.mediumInt],
              ] as [OpportunityInterestStatus, number][]
            ).map(([status, amt]) => {
              const pct = totals.target > 0 ? (amt / totals.target) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div key={status} title={`${status}: ${formatCurrencyShort(amt)}`}
                  style={{ width: `${pct}%`, background: STATUS_COLORS[status], minWidth: 4 }} />
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] text-ink-faint mt-1">
            <span className="num">{formatCurrencyShort(totals.converted)} محوَّل</span>
            <span className="num">المستهدف {formatCurrencyShort(totals.target)}</span>
          </div>
        </div>
        {/* 3 key numbers */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'المرجح',    value: formatCurrencyShort(totals.weighted),  sub: '' },
            { label: 'المتبقي',   value: formatCurrencyShort(totals.remaining), sub: '' },
            { label: 'أيام الإغلاق', value: totals.daysLeft !== null ? String(totals.daysLeft) : '—', sub: totals.daysLeft !== null ? 'يوم' : '' },
          ].map((s) => (
            <div key={s.label} className="bg-watheeq-bg-cream/60 rounded-lg px-2.5 py-2 text-center border border-line/40">
              <p className="text-[10px] text-ink-muted mb-0.5">{s.label}</p>
              <p className="num font-bold text-[13px] text-watheeq-navy-deep">{s.value}<span className="text-[10px] text-ink-muted ms-0.5">{s.sub}</span></p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="space-y-4">
      {/* Stacked progress */}
      <div>
        <div className="flex justify-between text-[13px] mb-2">
          <span className="font-bold text-ink">تقدم الاستقطاب</span>
          <span className="num font-bold text-watheeq-navy-deep">{formatCurrencyShort(totals.converted)} / {formatCurrencyShort(totals.target)}</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden bg-watheeq-bg-cream border border-line/40 flex">
          {(
            [
              ['تم التحويل', totals.converted],
              ['مهتم جدًا',  totals.highlyInt],
              ['مهتم',       totals.interested],
              ['اهتمام متوسط', totals.mediumInt],
            ] as [OpportunityInterestStatus, number][]
          ).map(([status, amt]) => {
            const pct = totals.target > 0 ? (amt / totals.target) * 100 : 0;
            if (pct < 0.5) return null;
            return (
              <div key={status} title={`${status}: ${formatCurrencyShort(amt)}`}
                className="transition-all"
                style={{ width: `${pct}%`, background: STATUS_COLORS[status], minWidth: 6 }} />
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          {(Object.entries(STATUS_COLORS) as [OpportunityInterestStatus, string][]).filter(([s]) => s !== 'غير مهتم').map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[11px] text-ink-muted">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail rows */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'تم التحويل',   value: totals.converted,  color: '#1F8A5B', bold: true },
          { label: 'مهتم جدًا',   value: totals.highlyInt,  color: '#2D6A4F' },
          { label: 'مهتم',         value: totals.interested, color: '#2563EB' },
          { label: 'اهتمام متوسط', value: totals.mediumInt,  color: '#C8A45D' },
          { label: 'المتوقع بالوزن', value: totals.weighted, color: '#263F82', bold: true },
          { label: 'المتبقي',      value: totals.remaining,  color: '#B45309', bold: true },
        ].map((row) => (
          <div key={row.label} className={cn('flex flex-col gap-0.5 p-3 rounded-xl border border-line/40 bg-watheeq-bg-cream/40', row.bold && 'border-line/60')}>
            <p className="text-[11px] text-ink-muted">{row.label}</p>
            <p className="num font-bold text-[15px]" style={{ color: row.color }}>{formatCurrencyShort(row.value)}</p>
          </div>
        ))}
      </div>

      {/* Days remaining */}
      {totals.daysLeft !== null && (
        <div className={cn(
          'flex items-center gap-3 p-3 rounded-xl border',
          totals.daysLeft < 30 ? 'border-state-danger/30 bg-state-danger-bg/20' :
          totals.daysLeft < 60 ? 'border-state-warning/30 bg-state-warning-bg/20' :
          'border-line/40 bg-watheeq-bg-cream/40'
        )}>
          <span className="text-[20px]">📅</span>
          <div>
            <p className="text-[12px] text-ink-muted">الأيام المتبقية للإغلاق</p>
            <p className={cn('num font-bold text-[18px]', totals.daysLeft < 30 ? 'text-state-danger' : totals.daysLeft < 60 ? 'text-state-warning' : 'text-watheeq-navy-deep')}>
              {totals.daysLeft} يوم
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Helper: calculate interest-based weighted total for a set of pipeline items */
export function calcWeightedByInterest(items: PipelineItem[]): number {
  return items
    .filter((p) => p.interestStatus !== 'غير مهتم')
    .reduce((sum, p) => sum + p.expected_amount * (INTEREST_STATUS_WEIGHTS[p.interestStatus ?? 'اهتمام متوسط']), 0);
}

/** Color + label for interest status badge */
export const INTEREST_STATUS_CONFIG: Record<OpportunityInterestStatus, { color: string; bg: string; border: string; tone: 'success'|'info'|'warning'|'neutral'|'gold' }> = {
  'تم التحويل':    { color: '#1F8A5B', bg: '#E7F5EE', border: '#1F8A5B33', tone: 'success' },
  'مهتم جدًا':    { color: '#2D6A4F', bg: '#D4EDDA', border: '#2D6A4F33', tone: 'success' },
  'مهتم':          { color: '#2563EB', bg: '#E5EDFD', border: '#2563EB33', tone: 'info' },
  'اهتمام متوسط': { color: '#A1813E', bg: 'rgba(200,164,93,0.10)', border: 'rgba(200,164,93,0.3)', tone: 'gold' },
  'غير مهتم':      { color: '#6B7280', bg: '#F1F2F4', border: '#6B728033', tone: 'neutral' },
};

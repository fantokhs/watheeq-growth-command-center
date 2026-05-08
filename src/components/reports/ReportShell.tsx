/**
 * Report Shell Components — قالب التقارير المميزة
 * مصمم ليبدو كتقرير مُعدّ يدوياً من مؤسسة استثمارية عالمية.
 * RTL | Navy + Gold | A4 feel | Print-ready
 */

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { brandColors } from '@/styles/brandTokens';
import type { ReportType, ReportAudience, ReportStatus } from '@/types/reports';
import { REPORT_TYPE_LABELS, REPORT_AUDIENCE_LABELS, REPORT_STATUS_LABELS } from '@/types/reports';
import { formatDate } from '@/lib/format';
import { DeliveryModal } from './DeliveryModal';

// ─────────────────────────────────────────────
// Report Actions Bar
// ─────────────────────────────────────────────
interface ReportActionsProps {
  reportType: ReportType;
  audience: ReportAudience;
  status: ReportStatus;
  clientName?: string;
  fundName?: string;
  reportTitle: string;
  onClose: () => void;
}

function showComingSoon() {
  alert('سيتم تفعيل هذه الخاصية في مرحلة الربط والإرسال.');
}

export function ReportActionsBar({
  reportType, audience, status, clientName, fundName, reportTitle, onClose,
}: ReportActionsProps) {
  const [deliveryModal, setDeliveryModal] = useState<'whatsapp' | 'email' | null>(null);

  return (
    <>
      {/* Two-row toolbar: meta row + actions row */}
      <div className="sticky top-0 z-30 bg-watheeq-navy-deep border-b border-white/10 print:hidden">
        {/* Row 1: Meta info — compact */}
        <div className="px-5 py-1.5 border-b border-white/[0.07] flex items-center gap-4 flex-wrap">
          <MetaChip label="نوع التقرير" value={REPORT_TYPE_LABELS[reportType]} gold />
          <MetaChip label="الجمهور"    value={REPORT_AUDIENCE_LABELS[audience]} />
          <MetaChip label="الحالة"     value={REPORT_STATUS_LABELS[status]} />
          <MetaChip label="المصدر"     value="بيانات تجريبية" warn />
        </div>

        {/* Row 2: Action buttons grouped */}
        <div className="px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
          {/* Primary: Send actions — gold highlighted */}
          <div className="flex items-center gap-2.5">
            <PrimaryBtn icon="💬" label="إرسال واتساب"  onClick={() => setDeliveryModal('whatsapp')} />
            <PrimaryBtn icon="✉️"  label="إرسال بالبريد" onClick={() => setDeliveryModal('email')} />
          </div>

          {/* Secondary: Download + Utilities + Close */}
          <div className="flex items-center gap-1.5">
            <SecondaryBtn icon="⬇" label="PDF"    onClick={showComingSoon} />
            <SecondaryBtn icon="⬇" label="Excel"  onClick={showComingSoon} />
            <SecondaryBtn icon="🗓" label="جدولة"  onClick={showComingSoon} />
            <SecondaryBtn icon="🔗" label="رابط"   onClick={showComingSoon} />
            <div className="w-px h-5 bg-white/15 mx-0.5" />
            <button type="button" onClick={onClose}
              className="text-[12px] px-3.5 py-1.5 rounded-md bg-white/10 border border-white/25 text-white font-semibold hover:bg-white/18 hover:border-white/40 transition-all flex items-center gap-1.5">
              إغلاق <span className="text-[11px]">✕</span>
            </button>
          </div>
        </div>
      </div>

      {deliveryModal && (
        <DeliveryModal
          channel={deliveryModal}
          reportTitle={reportTitle}
          reportType={reportType}
          clientName={clientName}
          fundName={fundName}
          onClose={() => setDeliveryModal(null)}
        />
      )}
    </>
  );
}

function MetaChip({ label, value, gold, warn }: { label: string; value: string; gold?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-white/45">{label}:</span>
      <span className={cn(
        'text-[11px] font-bold',
        gold ? 'text-watheeq-gold-soft' : warn ? 'text-state-warning' : 'text-white/80'
      )}>{value}</span>
    </div>
  );
}

function PrimaryBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="text-[12px] px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 bg-watheeq-gold/20 text-watheeq-gold-soft border border-watheeq-gold/35 hover:bg-watheeq-gold/32 hover:border-watheeq-gold/55">
      <span>{icon}</span>{label}
    </button>
  );
}

function SecondaryBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="text-[11px] px-2 py-1.5 rounded-md transition-all flex items-center gap-1 border border-white/12 text-white/55 hover:text-white/85 hover:border-white/28 font-medium">
      <span className="text-[10px]">{icon}</span>{label}
    </button>
  );
}

// ─────────────────────────────────────────────
// Report Shell — outer wrapper (white A4-like background)
// ─────────────────────────────────────────────
export function ReportShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#F0EDE6] min-h-screen" dir="rtl">
      <div className="max-w-[860px] mx-auto px-4 py-8 space-y-0 print:px-0 print:py-0">
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Report Cover — premium header for each report
// ─────────────────────────────────────────────
interface ReportCoverProps {
  title: string;
  subtitle?: string;
  reportType: ReportType;
  audience: ReportAudience;
  generatedAt?: string;
  clientName?: string;
  fundName?: string;
}

export function ReportCover({ title, subtitle, reportType, audience, generatedAt, clientName, fundName }: ReportCoverProps) {
  return (
    <div className="bg-watheeq-navy-deep rounded-t-2xl overflow-hidden relative"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'><g fill='none' stroke='%23C8A45D' stroke-width='0.4' opacity='0.06'><path d='M30 1l25 14.5v29L30 59 5 44.5v-29z'/><path d='M30 11l16 9.3v18.6L30 48.2l-16-9.3V20.3z'/></g></svg>")`,
        backgroundSize: '60px 52px',
      }}>
      {/* Gold top stripe */}
      <div className="h-1 bg-gradient-to-l from-watheeq-gold-deep via-watheeq-gold to-watheeq-gold-soft" />

      <div className="px-10 py-10">
        {/* Logo + company */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-watheeq-gold font-bold text-[18px] tracking-wide">وثيق المالية</p>
            <p className="text-white/50 text-[12px] mt-0.5 num">Watheeq Capital · CMA 32-18189</p>
          </div>
          <div className="text-end">
            <p className="text-[11px] text-white/40 num">{formatDate(generatedAt ?? new Date().toISOString())}</p>
            <p className="text-[11px] text-white/40">{REPORT_AUDIENCE_LABELS[audience]}</p>
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-[11px] font-bold text-watheeq-gold/70 uppercase tracking-widest mb-2">
            {REPORT_TYPE_LABELS[reportType]}
          </p>
          <h1 className="text-[28px] font-bold text-white leading-tight mb-2">{title}</h1>
          {subtitle && <p className="text-[15px] text-white/65 leading-relaxed">{subtitle}</p>}
        </div>

        {/* Context tags */}
        {(clientName || fundName) && (
          <div className="flex gap-2 mt-5">
            {clientName && (
              <span className="text-[12px] px-3 py-1 rounded-full border border-watheeq-gold/30 text-watheeq-gold-soft bg-watheeq-gold/10 font-medium">
                {clientName}
              </span>
            )}
            {fundName && (
              <span className="text-[12px] px-3 py-1 rounded-full border border-white/20 text-white/70 font-medium">
                {fundName}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Report Section container
// ─────────────────────────────────────────────
export function ReportSection({ title, subtitle, children, gold }: {
  title?: string; subtitle?: string; children: ReactNode; gold?: boolean;
}) {
  return (
    <div className="bg-white px-10 py-7 border-b border-[#E8E4DB]">
      {title && (
        <div className="flex items-center gap-3 mb-5">
          {gold && <span className="w-3 h-3 rounded-full bg-watheeq-gold shrink-0" />}
          <div>
            <h2 className="text-[15px] font-bold text-watheeq-navy-deep tracking-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-muted mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-line/60 to-transparent ms-2" />
        </div>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero Numbers row
// ─────────────────────────────────────────────
export function ReportHeroNumbers({ items }: {
  items: Array<{ label: string; value: string; sub?: string; color?: 'gold' | 'success' | 'danger' | 'default' }>;
}) {
  const colorMap = {
    gold:    'text-watheeq-gold-deep',
    success: 'text-state-success',
    danger:  'text-state-danger',
    default: 'text-watheeq-navy-deep',
  };
  return (
    <div className={cn('grid gap-4', items.length <= 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
      {items.map((item, i) => (
        <div key={i} className="bg-watheeq-bg-cream/60 rounded-xl p-4 border border-line/50">
          <p className="text-[12px] text-ink-soft mb-2 leading-tight font-medium">{item.label}</p>
          <p className={cn('num font-bold text-[26px] leading-none', colorMap[item.color ?? 'default'])}>
            {item.value}
          </p>
          {item.sub && <p className="text-[12px] text-ink-muted mt-1.5">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Report Metric Card (inline, smaller)
// ─────────────────────────────────────────────
export function ReportMetricCard({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[#F0EDE6] last:border-0">
      <span className="text-[13px] text-ink-soft w-48 shrink-0">{label}</span>
      <div className="text-end flex-1">
        <span className="text-[14px] font-bold text-ink">{value ?? '—'}</span>
        {note && <p className="text-[12px] text-ink-muted">{note}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Report Table
// ─────────────────────────────────────────────
export function ReportTable({ headers, rows }: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  if (rows.length === 0) return <p className="text-[13px] text-ink-muted py-2">لا توجد بيانات.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-watheeq-bg-cream border-y border-[#E8E4DB]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-start font-bold text-ink-soft text-[12px] tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn('border-b border-[#F0EDE6]', ri % 2 === 1 && 'bg-watheeq-bg-cream/25')}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-ink leading-snug">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Executive Summary Box
// ─────────────────────────────────────────────
export function ReportExecutiveSummary({ text }: { text: string }) {
  return (
    <div className="border-r-4 border-watheeq-gold rounded-r-none rounded-l-xl bg-watheeq-gold/5 px-5 py-4">
      <p className="text-[11px] font-bold text-watheeq-gold-deep uppercase tracking-wider mb-1.5">الملخص التنفيذي</p>
      <p className="text-[14px] text-ink leading-relaxed">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Insight Box (كبسولة ملاحظة)
// ─────────────────────────────────────────────
export function ReportInsight({ icon, label, text, tone = 'default' }: {
  icon?: string; label: string; text: string; tone?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const bg = tone === 'warning' ? 'bg-state-warning-bg border-state-warning/20' :
             tone === 'success' ? 'bg-state-success-bg border-state-success/20' :
             tone === 'danger'  ? 'bg-state-danger-bg  border-state-danger/20'  :
             'bg-watheeq-bg-cream border-line/60';
  const textColor = tone === 'warning' ? 'text-state-warning' :
                    tone === 'success' ? 'text-state-success' :
                    tone === 'danger'  ? 'text-state-danger'  : 'text-ink-muted';
  return (
    <div className={cn('rounded-xl border px-4 py-3 flex items-start gap-3', bg)}>
      {icon && <span className="text-[18px] shrink-0">{icon}</span>}
      <div>
        <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-0.5', textColor)}>{label}</p>
        <p className="text-[13px] text-ink leading-snug">{text}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Report Footer
// ─────────────────────────────────────────────
export function ReportFooter({ disclaimer }: { disclaimer?: boolean }) {
  return (
    <div className="bg-watheeq-navy-deep px-10 py-6 rounded-b-2xl">
      {disclaimer && (
        <div className="border border-white/20 rounded-xl px-4 py-3 mb-4 bg-white/6">
          <p className="text-[12px] text-white/80 leading-relaxed">
            <span className="font-bold text-white/90">تنويه:</span> هذا التقرير لأغراض المعلومات ولا يُعدّ توصية استثمارية أو عرضاً ملزماً.
            جميع الأرقام والمؤشرات الواردة مأخوذة من بيانات النظام الداخلي وقابلة للتحديث.
          </p>
        </div>
      )}
      <p className="text-[12px] text-white/60 text-center leading-relaxed">
        تم إنشاء هذا التقرير آليًا بناءً على البيانات المتاحة في النظام
        &nbsp;·&nbsp; وثيق المالية
        &nbsp;·&nbsp; <span className="num">{formatDate(new Date().toISOString())}</span>
        &nbsp;·&nbsp; هذه النسخة تجريبية — البيانات عينة فقط
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Print page break
// ─────────────────────────────────────────────
export function PageBreak() {
  return <div className="hidden print:block" style={{ pageBreakBefore: 'always' }} />;
}

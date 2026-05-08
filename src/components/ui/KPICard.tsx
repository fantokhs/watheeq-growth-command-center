import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import type { ReactNode } from 'react';
import type { FormattedParts } from '@/lib/format';

interface KPICardProps {
  /** التسمية العربية */
  label: string;
  /**
   * القيمة الرئيسية. يمكن تمريرها بإحدى صيغتين:
   *  - string: يُعرض كاملاً
   *  - FormattedParts ({num, suffix}): يُعرض الـ num ضخماً والـ suffix أصغر وأخف
   *  - ReactNode: للحالات المخصصة
   */
  value: string | FormattedParts | ReactNode;
  /** نص ثانوي تحت القيمة - أوضح من السابق */
  sub?: ReactNode;
  /** أيقونة في الزاوية */
  icon?: ReactNode;
  /** تغير عن الفترة السابقة */
  delta?: { text: string; positive: boolean };
  /** نوع التميز */
  accent?: 'gold' | 'navy' | 'none';
  /** حالة تحميل */
  loading?: boolean;
  /** نقرة تنقل */
  onClick?: () => void;
  className?: string;
  /** حجم الرقم - lg الافتراضي، xl للبطاقات الرئيسية */
  size?: 'lg' | 'xl';
}

/**
 * يفحص إذا كانت القيمة من النوع FormattedParts
 */
function isFormattedParts(v: unknown): v is FormattedParts {
  return (
    typeof v === 'object' &&
    v !== null &&
    'num' in v &&
    typeof (v as Record<string, unknown>).num === 'string'
  );
}

export function KPICard({
  label,
  value,
  sub,
  icon,
  delta,
  accent = 'none',
  loading = false,
  onClick,
  className,
  size = 'lg',
}: KPICardProps) {
  const isInteractive = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative bg-watheeq-bg-paper rounded-xl group overflow-hidden',
        'flex flex-col justify-between',
        // تباعد أكبر للهرم البصري
        'px-5 py-5',
        size === 'xl' ? 'min-h-[170px]' : 'min-h-[150px]',
        // ظل واضح + اعتماد على الـ accent
        accent === 'gold' && 'shadow-kpi-accent',
        accent !== 'gold' && 'shadow-kpi',
        isInteractive && 'cursor-pointer interactive-card',
        className
      )}
    >
      {/* شريط دلالة على الحافة العلوية - أنحف وأنعم */}
      {accent !== 'none' && (
        <span
          className={cn(
            'absolute top-0 inset-x-0 h-[3px]',
            accent === 'gold' && 'bg-gradient-to-l from-watheeq-gold-deep via-watheeq-gold to-watheeq-gold-soft',
            accent === 'navy' && 'bg-gradient-to-l from-watheeq-navy-deep via-watheeq-navy to-watheeq-navy-soft'
          )}
          aria-hidden="true"
        />
      )}

      {/* Header: label + icon */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-muted leading-tight tracking-tight">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'shrink-0 transition-colors duration-200',
              accent === 'gold' ? 'text-watheeq-gold' : 'text-watheeq-navy/35',
              'group-hover:text-watheeq-gold'
            )}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value block - تباعد سخي */}
      <div className="mt-4">
        {loading ? (
          <div className={cn('shimmer rounded', size === 'xl' ? 'h-12 w-36' : 'h-10 w-32')} />
        ) : (
          <div
            className={cn(
              'kpi-value text-watheeq-navy-deep flex items-baseline gap-0',
              size === 'xl' ? 'text-kpi-xl' : 'text-kpi-lg'
            )}
          >
            {isFormattedParts(value) ? (
              <>
                <span className="num font-semibold">{value.num}</span>
                {value.suffix && <span className="num-suffix text-[0.42em] font-medium">{value.suffix}</span>}
              </>
            ) : typeof value === 'string' ? (
              <span className="num font-semibold">{value}</span>
            ) : (
              value
            )}
          </div>
        )}

        {/* Subtitle row */}
        {(sub || delta) && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {delta && !loading && (
              <Badge tone={delta.positive ? 'success' : 'danger'} size="sm" dot>
                <span className="num">{delta.text}</span>
              </Badge>
            )}
            {sub && (
              <span className="text-[13px] text-ink-muted leading-snug">{sub}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

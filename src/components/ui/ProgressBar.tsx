import { cn } from '@/lib/utils';
import { clampPct, formatPercent } from '@/lib/format';

interface ProgressBarProps {
  /** النسبة بين 0 و 1 */
  value: number;
  showLabel?: boolean;
  label?: string;
  tone?: 'navy' | 'gold' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const toneStyles = {
  navy: 'bg-gradient-to-l from-watheeq-navy-deep via-watheeq-navy to-watheeq-navy-soft',
  gold: 'bg-gradient-to-l from-watheeq-gold-deep via-watheeq-gold to-watheeq-gold-soft',
  success: 'bg-state-success',
  warning: 'bg-state-warning',
  danger: 'bg-state-danger',
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-3.5',
};

export function ProgressBar({
  value,
  showLabel = false,
  label,
  tone = 'navy',
  size = 'md',
  className,
}: ProgressBarProps) {
  const pct = clampPct(value);
  const widthPct = (pct * 100).toFixed(1);

  return (
    <div className={cn('w-full', className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between text-[13px] mb-2">
          {label && <span className="text-ink-muted">{label}</span>}
          {showLabel && (
            <span className="num font-bold text-ink">
              {formatPercent(pct)}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-watheeq-bg-cream rounded-full overflow-hidden',
          'border border-line/50',
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={pct * 100}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            toneStyles[tone]
          )}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

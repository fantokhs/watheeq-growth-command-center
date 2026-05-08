import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: ReactNode;
  /** عنصر يعرض في الزاوية اليسرى (filter, legend, etc) */
  action?: ReactNode;
  children: ReactNode;
  /** ارتفاع الـ chart المضمون */
  height?: number;
  className?: string;
  /** خلفية داكنة للـ chart - يستخدم لمواضع متميزة */
  dark?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  height,
  className,
  dark = false,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        dark
          ? 'surface-dark navy-pattern'
          : 'surface-card',
        'p-6 flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'text-section-title font-bold leading-tight tracking-tight',
              dark ? 'text-white' : 'text-watheeq-navy-deep'
            )}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className={cn(
                'text-[13px] mt-1.5',
                dark ? 'text-white/65' : 'text-ink-muted'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Body — الـ ResponsiveContainer داخل children يحمل ارتفاعه بـ px صريح */}
      <div className={height ? undefined : undefined} style={height ? { height: `${height}px` } : undefined}>
        {children}
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeTone =
  | 'default'
  | 'navy'
  | 'gold'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  /** نقطة دلالية صغيرة قبل النص */
  dot?: boolean;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  default: 'bg-watheeq-bg-cream text-ink-soft border-line',
  navy: 'bg-watheeq-navy/10 text-watheeq-navy border-watheeq-navy/20',
  gold: 'bg-watheeq-gold/14 text-watheeq-gold-deep border-watheeq-gold/35',
  success: 'bg-state-success-bg text-state-success border-state-success/25',
  warning: 'bg-state-warning-bg text-state-warning border-state-warning/30',
  danger: 'bg-state-danger-bg text-state-danger border-state-danger/25',
  info: 'bg-state-info-bg text-state-info border-state-info/25',
  neutral: 'bg-state-neutral-bg text-state-neutral border-state-neutral/25',
};

const dotStyles: Record<BadgeTone, string> = {
  default: 'bg-ink-muted',
  navy: 'bg-watheeq-navy',
  gold: 'bg-watheeq-gold',
  success: 'bg-state-success',
  warning: 'bg-state-warning',
  danger: 'bg-state-danger',
  info: 'bg-state-info',
  neutral: 'bg-state-neutral',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[12px] px-2 py-0.5 gap-1.5',
  md: 'text-[13px] px-2.5 py-1 gap-1.5',
};

export function Badge({
  children,
  tone = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-md border whitespace-nowrap leading-none',
        toneStyles[tone],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('inline-block w-1.5 h-1.5 rounded-full', dotStyles[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  /** آخر وقت تحديث - يعرض كنص ثانوي */
  lastUpdated?: Date | string;
  /** حجم */
  size?: 'sm' | 'md';
  /** متغير - فاتح للأماكن الداكنة */
  variant?: 'light' | 'dark';
  className?: string;
}

export function RefreshButton({
  onRefresh,
  lastUpdated,
  size = 'md',
  variant = 'light',
  className,
}: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      // ضمان دوران الأيقونة لأقل ٦٠٠ms حتى لو كان الجلب أسرع
      setTimeout(() => setSpinning(false), 600);
    }
  };

  const formattedTime = lastUpdated
    ? formatRelativeTime(typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated)
    : null;

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {formattedTime && (
        <span
          className={cn(
            'text-[12px] flex items-center gap-1.5',
            variant === 'dark' ? 'text-white/65' : 'text-ink-muted'
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-state-success" aria-hidden="true" />
          آخر تحديث: <span className="num">{formattedTime}</span>
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={spinning}
        className={cn(
          'inline-flex items-center gap-2 rounded-md font-semibold transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-watheeq-gold/40',
          variant === 'light'
            ? 'border border-line bg-white hover:bg-watheeq-bg-cream text-ink-soft hover:text-watheeq-navy hover:border-watheeq-gold/35'
            : 'border border-white/15 bg-white/5 hover:bg-white/10 text-white/85 hover:text-white',
          size === 'sm' ? 'text-[13px] px-3 py-1.5' : 'text-[13px] px-3.5 py-2',
          spinning && 'opacity-70 cursor-wait'
        )}
        title="تحديث البيانات"
        aria-label="تحديث البيانات"
      >
        <svg
          width={size === 'sm' ? '13' : '14'}
          height={size === 'sm' ? '13' : '14'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(spinning && 'animate-spin')}
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        تحديث البيانات
      </button>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

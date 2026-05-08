import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

// ============================================================
// LoadingState
// ============================================================
interface LoadingStateProps {
  /** نص يعرض تحت الـ spinner */
  message?: string;
  /** ارتفاع المحتوى */
  minHeight?: string;
  className?: string;
}

export function LoadingState({
  message = 'جاري التحميل…',
  minHeight = '200px',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-watheeq-navy/10" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-watheeq-gold animate-spin" />
      </div>
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}

/**
 * Loading skeleton - shimmer block للاستخدام في بطاقات/جداول.
 */
export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded', className)} />;
}

// ============================================================
// ErrorState
// ============================================================
interface ErrorStateProps {
  /** عنوان الخطأ */
  title?: string;
  /** وصف تفصيلي */
  message?: string;
  /** زر إعادة المحاولة */
  onRetry?: () => void;
  /** ارتفاع */
  minHeight?: string;
  className?: string;
}

export function ErrorState({
  title = 'تعذر تحميل البيانات',
  message,
  onRetry,
  minHeight = '200px',
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center px-4',
        className
      )}
      style={{ minHeight }}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-state-danger-bg flex items-center justify-center">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-state-danger"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {message && (
          <p className="text-xs text-ink-muted mt-1 max-w-md">{message}</p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-1 text-xs font-medium px-3 py-1.5 rounded',
            'bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors'
          )}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// ============================================================
// EmptyState
// ============================================================
interface EmptyStateProps {
  title?: string;
  message?: string;
  /** أيقونة مخصصة */
  icon?: ReactNode;
  /** زر إجراء اختياري */
  action?: { label: string; onClick: () => void };
  minHeight?: string;
  className?: string;
}

export function EmptyState({
  title = 'لا توجد بيانات',
  message,
  icon,
  action,
  minHeight = '200px',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-center px-4',
        className
      )}
      style={{ minHeight }}
    >
      <div className="w-12 h-12 rounded-full bg-watheeq-bg-cream border border-line/60 flex items-center justify-center text-watheeq-navy/40">
        {icon ?? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        {message && (
          <p className="text-xs text-ink-muted mt-1 max-w-md">{message}</p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 text-xs font-medium px-3 py-1.5 rounded bg-watheeq-navy text-white hover:bg-watheeq-navy-deep transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

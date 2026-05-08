import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

const widthMap = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export function Drawer({ open, onClose, title, subtitle, children, width = 'lg' }: DrawerProps) {
  // إغلاق بـ Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // منع scroll الـ body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const panel = (
    <div className="fixed inset-0 z-[9990] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-watheeq-navy-deep/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel — starts below TopBar (~72px) so content is never hidden behind it */}
      <div
        className={cn(
          'relative flex flex-col bg-watheeq-bg-paper shadow-2xl',
          'animate-fade-in',
          widthMap[width]
        )}
        style={{ animationDuration: '200ms', marginTop: 0, width: '100%', maxHeight: '100vh', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line/60 bg-white shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-section-title font-bold text-watheeq-navy-deep truncate">{title}</h2>
            {subtitle && <p className="text-[13px] text-ink-muted mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-watheeq-bg-cream transition-colors"
            aria-label="إغلاق"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Scrollable body — always fits within viewport */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

/** قسم داخل الـ drawer */
export function DrawerSection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('', className)}>
      {title && (
        <h3 className="text-[12px] font-bold text-ink-muted uppercase tracking-wider mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}

/** صف معلومات داخل الـ drawer */
export function DrawerRow({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5 border-b border-line/40 last:border-0', className)}>
      <span className="text-[13px] text-ink-muted shrink-0 w-40">{label}</span>
      <span className="text-[14px] text-ink font-medium text-start flex-1">{value ?? '—'}</span>
    </div>
  );
}

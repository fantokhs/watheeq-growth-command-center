/**
 * InputFormLauncher
 * ─────────────────────────────────────────────────────────────
 * زر لفتح نموذج إدخال بيانات خارجي.
 *
 * - إذا كان الرابط '#': يعرض مودال تجريبي
 * - إذا كان الرابط حقيقياً: يفتح في تبويب جديد
 *
 * لا يُظهر للمستخدم أي كلمات تقنية (Google Sheets، CSV، database).
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface InputFormLauncherProps {
  url: string;
  label: string;
  icon?: string;
  /** 'primary' = navy button | 'secondary' = outlined | 'ghost' = text-only */
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

export function InputFormLauncher({
  url, label, icon, variant = 'secondary', size = 'sm', className,
}: InputFormLauncherProps) {
  const [showModal, setShowModal] = useState(false);
  const isPlaceholder = !url || url === '#';

  function handleClick() {
    if (isPlaceholder) {
      setShowModal(true);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  const baseSize = size === 'sm'
    ? 'text-[12px] px-3 py-1.5'
    : 'text-[13px] px-4 py-2';

  const variantCls = variant === 'primary'
    ? 'bg-watheeq-navy text-white hover:bg-watheeq-navy-deep'
    : variant === 'secondary'
    ? 'border border-line bg-white text-ink-soft hover:bg-watheeq-bg-cream hover:text-watheeq-navy hover:border-watheeq-navy/30'
    : 'text-watheeq-navy hover:text-watheeq-navy-deep underline-offset-2 hover:underline';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'font-bold rounded-lg transition-all inline-flex items-center gap-1.5 whitespace-nowrap',
          baseSize,
          variantCls,
          className
        )}
      >
        {icon && <span className="text-[13px]">{icon}</span>}
        {label}
      </button>

      {showModal && createPortal(
        <PlaceholderFormModal label={label} onClose={() => setShowModal(false)} />,
        document.body
      )}
    </>
  );
}

// ─── Placeholder modal ─────────────────────────────────────────
function PlaceholderFormModal({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-watheeq-navy-deep/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 text-center space-y-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-watheeq-gold/10 border-2 border-watheeq-gold/25 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C8A45D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>

        {/* Message */}
        <div>
          <p className="font-bold text-[15px] text-watheeq-navy-deep">{label}</p>
          <p className="text-[13px] text-ink-muted mt-2 leading-relaxed">
            نموذج الإدخال غير مفعّل حالياً.
          </p>
          <p className="text-[12px] text-ink-faint mt-1 leading-relaxed">
            سيتم ربط هذا الزر بنموذج إدخال البيانات في المرحلة التالية.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold hover:bg-watheeq-navy-deep transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}

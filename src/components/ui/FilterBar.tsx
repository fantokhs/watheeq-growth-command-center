import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface FilterBarProps {
  /** عناصر الفلاتر (Selects, Inputs) */
  children: ReactNode;
  /** زر مسح الفلاتر */
  onClear?: () => void;
  /** عداد الفلاتر النشطة */
  activeCount?: number;
  className?: string;
}

export function FilterBar({
  children,
  onClear,
  activeCount = 0,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'surface-card px-4 py-3 flex items-center gap-3 flex-wrap',
        className
      )}
    >
      <span className="text-xs font-bold text-ink-soft">الفلاتر</span>
      <span className="hairline-vertical h-5 w-px bg-line" />

      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        {children}
      </div>

      {activeCount > 0 && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-watheeq-navy hover:text-watheeq-gold-deep transition-colors font-medium"
        >
          مسح الفلاتر ({activeCount})
        </button>
      )}
    </div>
  );
}

/**
 * عنصر اختيار بسيط متناسق مع التصميم.
 */
interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'الكل',
}: FilterSelectProps) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-ink-muted whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'bg-white border border-line rounded text-sm px-2.5 py-1.5',
          'text-ink focus:outline-none focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15',
          'cursor-pointer min-w-[120px]'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * حقل بحث بسيط.
 */
interface FilterSearchProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function FilterSearch({
  value,
  onChange,
  placeholder = 'بحث…',
}: FilterSearchProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'bg-white border border-line rounded text-sm px-3 py-1.5 min-w-[200px]',
        'text-ink placeholder:text-ink-faint',
        'focus:outline-none focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15'
      )}
    />
  );
}

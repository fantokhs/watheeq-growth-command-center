import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { formatDate } from '@/lib/format';
import { brand } from '@/styles/brandTokens';
import type { ReactNode } from 'react';

interface TopBarProps {
  pageTitle: string;
  pageSubtitle?: string;
  /** هل البيانات المعروضة هي mock fallback */
  isFallback?: boolean;
  /** هل تم تحميل البيانات (لتجنب الوميض) */
  isDataReady?: boolean;
  /** آخر وقت تحديث */
  lastUpdated?: Date | string;
  onRefresh: () => Promise<void> | void;
  rightSlot?: ReactNode;
  className?: string;
}

export function TopBar({
  pageTitle,
  pageSubtitle,
  isFallback = false,
  isDataReady = true,
  lastUpdated,
  onRefresh,
  rightSlot,
  className,
}: TopBarProps) {
  const today = new Date();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 print:hidden',
        'bg-watheeq-bg-warm/85 backdrop-blur-md',
        'border-b border-line/50',
        className
      )}
    >
      <div className="px-page py-5 flex items-center gap-4">
        {/* Page title block */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-page-title font-bold text-watheeq-navy-deep truncate tracking-tight">
              {pageTitle}
            </h1>
            {isFallback ? (
              <Badge tone="warning" size="sm" dot>
                بيانات تجريبية
              </Badge>
            ) : (
              <Badge tone="success" size="sm" dot>
                Google Sheets
              </Badge>
            )}          </div>
          <p className="text-[13px] text-ink-muted mt-1.5 flex items-center gap-2">
            <span>{brand.name.ar}</span>
            <span className="text-line" aria-hidden="true">·</span>
            <span className="num">{pageSubtitle ?? formatDate(today)}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {rightSlot}
          <RefreshButton
            onRefresh={onRefresh}
            lastUpdated={lastUpdated}
            variant="light"
          />
        </div>
      </div>
    </header>
  );
}

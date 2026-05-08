import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
  count: number;
  total?: number;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  renderColumn: (col: KanbanColumn) => ReactNode;
  className?: string;
}

export function KanbanBoard({ columns, renderColumn, className }: KanbanBoardProps) {
  return (
    <div className={cn('overflow-x-auto pb-4', className)}>
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => (
          <div key={col.key} className="w-[260px] shrink-0 flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-t-lg mb-2"
              style={{ background: col.color + '18', borderBottom: `2px solid ${col.color}` }}>
              <span className="text-[13px] font-bold" style={{ color: col.color }}>{col.label}</span>
              <span className="num text-[11px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: col.color + '20', color: col.color }}>
                {col.count}
              </span>
            </div>
            {/* Column content */}
            <div className="flex-1 space-y-2.5">
              {renderColumn(col)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

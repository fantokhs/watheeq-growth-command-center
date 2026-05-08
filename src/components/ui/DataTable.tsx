import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  sortAccessor?: (row: T) => string | number;
  align?: 'start' | 'center' | 'end';
  width?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  striped?: boolean;
  density?: 'comfortable' | 'compact';
  className?: string;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyText = 'لا توجد بيانات',
  striped = false,
  density = 'comfortable',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortAccessor) return data;
    const acc = col.sortAccessor;
    return [...data].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortDir, columns]);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !col.sortAccessor) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('desc');
    }
  };

  // أحجام أوضح للقراءة
  const cellPad = density === 'compact' ? 'py-2.5 px-3.5' : 'py-3.5 px-4';
  const textSize = density === 'compact' ? 'text-[13px]' : 'text-[14px]';

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className={cn('w-full', textSize)}>
        <thead>
          <tr className="bg-watheeq-bg-cream/70 border-y border-line/70">
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    cellPad,
                    'font-bold text-ink-soft text-[12px] uppercase tracking-[0.05em]',
                    col.align === 'end' && 'text-end',
                    col.align === 'center' && 'text-center',
                    !col.align && 'text-start',
                    col.sortable && 'cursor-pointer select-none hover:text-watheeq-navy transition-colors'
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span
                        className={cn(
                          'text-[10px] transition-opacity',
                          isSorted ? 'opacity-100 text-watheeq-gold' : 'opacity-30'
                        )}
                      >
                        {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '◇'}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-14 text-center text-ink-muted text-[14px]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-line/40 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-watheeq-bg-cream/60',
                  striped && i % 2 === 1 && 'bg-watheeq-bg-cream/30'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      cellPad,
                      'text-ink leading-snug',
                      col.align === 'end' && 'text-end',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render
                      ? col.render(row, i)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

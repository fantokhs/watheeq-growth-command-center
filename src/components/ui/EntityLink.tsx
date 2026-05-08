import { useAppNav } from '@/context/AppNavContext';
import { cn } from '@/lib/utils';
import type { PageKey } from '@/components/layout/Sidebar';

interface EntityLinkProps {
  type: 'client' | 'fund';
  id?: string | null;
  label: string;
  className?: string;
}

/**
 * EntityLink — renders a clickable entity name using <span role="button">
 * so it nests safely inside <button> parent containers (Kanban cards, table rows).
 * Nested <button><button> is invalid HTML and breaks click events in all browsers.
 */
export function EntityLink({ type, id, label, className }: EntityLinkProps) {
  const { navigateTo } = useAppNav();

  if (!id) return <span className={className}>{label}</span>;

  const page: PageKey = type === 'client' ? 'clients' : 'funds';

  function handleClick(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return;
    if (type === 'client') navigateTo(page, id ?? undefined, undefined);
    else                    navigateTo(page, undefined, id ?? undefined);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick as (e: React.MouseEvent) => void}
      onKeyDown={handleClick as (e: React.KeyboardEvent) => void}
      className={cn(
        'cursor-pointer transition-colors select-text',
        'hover:underline hover:underline-offset-2 decoration-1',
        type === 'client' ? 'hover:text-watheeq-navy' : 'hover:text-watheeq-gold-deep',
        className
      )}
      title={`عرض ${type === 'client' ? 'العميل' : 'الصندوق'}: ${label}`}
    >
      {label}
    </span>
  );
}

import { cn } from '@/lib/utils';
import { Sidebar, type PageKey } from './Sidebar';
import { TopBar } from './TopBar';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  activePage: PageKey;
  pageTitle: string;
  pageSubtitle?: string;
  onNavigate: (key: PageKey) => void;
  isFallback?: boolean;
  isDataReady?: boolean;
  lastUpdated?: Date | string;
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

export function AppLayout({
  activePage,
  pageTitle,
  pageSubtitle,
  onNavigate,
  isFallback,
  isDataReady,
  lastUpdated,
  onRefresh,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar active={activePage} onSelect={onNavigate} />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          isFallback={isFallback}
          isDataReady={isDataReady}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
        />

        <main
          className={cn(
            'flex-1 px-page py-page',
            'animate-fade-up'
          )}
        >
          {children}
        </main>

        <footer className="px-page py-5 border-t border-line/40 text-[12px] text-ink-faint flex items-center justify-between print:hidden">
          <span>© وثيق المالية · Watheeq Capital</span>
          <span className="num font-medium tracking-wide">
            Growth Command Center · Phase 1 Vertical Slice
          </span>
        </footer>
      </div>
    </div>
  );
}

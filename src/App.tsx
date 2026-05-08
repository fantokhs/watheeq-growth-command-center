import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExecutiveOverview } from '@/pages/ExecutiveOverview';
import { ClientsPage } from '@/pages/ClientsPage';
import { FundsPage } from '@/pages/FundsPage';
import { PipelinePage } from '@/pages/PipelinePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { VisitsPage } from '@/pages/VisitsPage';
import { AppNavProvider, useAppNav } from '@/context/AppNavContext';
import { useRefreshAll, useDashboard, useClients, useFunds, usePipeline } from '@/hooks';
import { pageLabels } from '@/lib/arabicLabels';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

function AppShell() {
  const { navState, navigateTo, clearAutoOpen } = useAppNav();
  const { activePage, autoOpenClientId, autoOpenFundId } = navState;

  const refreshAll  = useRefreshAll();
  const dashboardQ  = useDashboard();
  const clientsQ    = useClients();
  const fundsQ      = useFunds();
  const pipelineQ   = usePipeline();

  // Show "Google Sheets" indicator if at least one core sheet loaded live
  const isFallback = (
    (clientsQ.data?.isFallback  ?? true) &&
    (fundsQ.data?.isFallback    ?? true) &&
    (pipelineQ.data?.isFallback ?? true)
  );
  const isDataReady = !!(clientsQ.data || fundsQ.data || pipelineQ.data);
  const lastUpdated = clientsQ.data?.fetchedAt ?? dashboardQ.data?.fetchedAt;
  const pageTitle   = useMemo(() => pageLabels[activePage] ?? '', [activePage]);

  function renderPage() {
    switch (activePage) {
      case 'overview':  return <ExecutiveOverview />;
      case 'clients':   return <ClientsPage autoOpenClientId={autoOpenClientId} onAutoOpenConsumed={clearAutoOpen} />;
      case 'funds':     return <FundsPage   autoOpenFundId={autoOpenFundId}     onAutoOpenConsumed={clearAutoOpen} />;
      case 'pipeline':  return <PipelinePage />;
      case 'reports':   return <ReportsPage />;
      case 'visits':    return <VisitsPage />;
      default:
        return (
          <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-watheeq-bg-cream border border-line mb-5 text-watheeq-gold">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h2 className="text-page-title font-bold text-watheeq-navy-deep mb-2">صفحة {pageTitle} قيد الإنشاء</h2>
              <p className="text-sm text-ink-muted leading-relaxed">هذه الصفحة ستكون جزءاً من الإصدار القادم.</p>
            </div>
          </div>
        );
    }
  }

  return (
    <AppLayout
      activePage={activePage}
      pageTitle={pageTitle}
      onNavigate={(page) => navigateTo(page)}
      isFallback={isFallback}
      isDataReady={isDataReady}
      lastUpdated={lastUpdated}
      onRefresh={refreshAll}
    >
      {renderPage()}
    </AppLayout>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppNavProvider>
        <AppShell />
      </AppNavProvider>
    </QueryClientProvider>
  );
}


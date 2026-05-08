import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PageKey } from '@/components/layout/Sidebar';

interface AppNavState {
  activePage: PageKey;
  autoOpenClientId?: string;
  autoOpenFundId?: string;
}

interface AppNavContextValue {
  navState: AppNavState;
  navigateTo: (page: PageKey, clientId?: string, fundId?: string) => void;
  clearAutoOpen: () => void;
}

const AppNavContext = createContext<AppNavContextValue | null>(null);

export function AppNavProvider({ children, initialPage = 'overview' }: { children: ReactNode; initialPage?: PageKey }) {
  const [navState, setNavState] = useState<AppNavState>({ activePage: initialPage });

  const navigateTo = useCallback((page: PageKey, clientId?: string, fundId?: string) => {
    setNavState({ activePage: page, autoOpenClientId: clientId, autoOpenFundId: fundId });
  }, []);

  const clearAutoOpen = useCallback(() => {
    setNavState((prev) => ({ activePage: prev.activePage }));
  }, []);

  return (
    <AppNavContext.Provider value={{ navState, navigateTo, clearAutoOpen }}>
      {children}
    </AppNavContext.Provider>
  );
}

export function useAppNav() {
  const ctx = useContext(AppNavContext);
  if (!ctx) throw new Error('useAppNav must be used within AppNavProvider');
  return ctx;
}

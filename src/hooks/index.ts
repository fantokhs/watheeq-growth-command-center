/**
 * Hooks جاهزة للاستخدام في الصفحات.
 * كل hook يستخدم React Query لتخزين البيانات في الكاش.
 *
 * staleTime: 5 دقائق - البيانات تعتبر فريش لـ ٥ دقائق
 * cacheTime: 30 دقيقة - تبقى في الكاش حتى بعد unmount
 *
 * useRefreshAll: زر التحديث الشامل في الـ TopBar
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getClients, getFunds, getHoldings, getEmployees, getPipeline,
  getVisits, getVisitRecords, getReports, getTargets, getBillionPlan,
  getFinancials, getDashboard, getSources, getLookups,
  getClientRequests, getRecommendedInvestors, getReportsLog,
  getFundUpdates, getMeetingMinutes,
} from '@/services/repositories';

const FIVE_MIN = 1000 * 60 * 5;
const THIRTY_MIN = 1000 * 60 * 30;

export const queryKeys = {
  clients: ['clients'] as const,
  funds: ['funds'] as const,
  holdings: ['holdings'] as const,
  employees: ['employees'] as const,
  pipeline: ['pipeline'] as const,
  visits: ['visits'] as const,
  reports: ['reports'] as const,
  targets: ['targets'] as const,
  billionPlan: ['billionPlan'] as const,
  financials: ['financials'] as const,
  dashboard: ['dashboard'] as const,
  sources: ['sources'] as const,
  lookups: ['lookups'] as const,
};

const sharedOpts = {
  staleTime: FIVE_MIN,
  gcTime: THIRTY_MIN,
  retry: 1,
};

export const useClients = () => useQuery({ queryKey: queryKeys.clients, queryFn: getClients, ...sharedOpts });
export const useFunds = () => useQuery({ queryKey: queryKeys.funds, queryFn: getFunds, ...sharedOpts });
export const useHoldings = () => useQuery({ queryKey: queryKeys.holdings, queryFn: getHoldings, ...sharedOpts });
export const useEmployees = () => useQuery({ queryKey: queryKeys.employees, queryFn: getEmployees, ...sharedOpts });
export const usePipeline = () => useQuery({ queryKey: queryKeys.pipeline, queryFn: getPipeline, ...sharedOpts });
export const useVisits       = () => useQuery({ queryKey: queryKeys.visits,    queryFn: getVisits,    ...sharedOpts });
export const useVisitRecords = () => useQuery({ queryKey: ['visitRecords'],    queryFn: getVisitRecords, ...sharedOpts });
export const useReports = () => useQuery({ queryKey: queryKeys.reports, queryFn: getReports, ...sharedOpts });
export const useTargets = () => useQuery({ queryKey: queryKeys.targets, queryFn: getTargets, ...sharedOpts });
export const useBillionPlan = () => useQuery({ queryKey: queryKeys.billionPlan, queryFn: getBillionPlan, ...sharedOpts });
export const useFinancials = () => useQuery({ queryKey: queryKeys.financials, queryFn: getFinancials, ...sharedOpts });
export const useDashboard = () => useQuery({ queryKey: queryKeys.dashboard, queryFn: getDashboard, ...sharedOpts });
export const useSources = () => useQuery({ queryKey: queryKeys.sources, queryFn: getSources, ...sharedOpts });
export const useLookups = () => useQuery({ queryKey: queryKeys.lookups, queryFn: getLookups, ...sharedOpts });

// ─── Phase 4.1 new hooks ──────────────────────────────────────
export const useClientRequests     = () => useQuery({ queryKey: ['clientRequests'],      queryFn: getClientRequests,      ...sharedOpts });
export const useRecommendedInvestors = () => useQuery({ queryKey: ['recommendedInvestors'], queryFn: getRecommendedInvestors, ...sharedOpts });
export const useReportsLog         = () => useQuery({ queryKey: ['reportsLog'],          queryFn: getReportsLog,          ...sharedOpts });
export const useFundUpdates        = () => useQuery({ queryKey: ['fundUpdates'],         queryFn: getFundUpdates,         ...sharedOpts });
export const useMeetingMinutes     = () => useQuery({ queryKey: ['meetingMinutes'],      queryFn: getMeetingMinutes,      ...sharedOpts });

/**
 * Hook لتحديث كل البيانات دفعة واحدة.
 * يستخدم في زر التحديث في الـ TopBar.
 */
export function useRefreshAll() {
  const qc = useQueryClient();
  return async () => {
    await qc.invalidateQueries();
  };
}

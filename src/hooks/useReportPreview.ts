import { useState, useCallback } from 'react';
import type { ReportType } from '@/types/reports';
import type { Client, Fund, Holding } from '@/types';

export interface ReportPreviewState {
  reportType: ReportType;
  clientId?: string;
  fundId?: string;
  ownerId?: string;
  /** ملاحظات اختيارية يكتبها المستخدم في نموذج الإعداد */
  notes?: string;
  /** true = فُتح من سياق محدد (drawer عميل/صندوق) فلا يحتاج نموذج إعداد */
  fromContext?: boolean;
  /**
   * بيانات حية مُمرّرة من الصفحة (Google Sheets عبر useFunds/useClients/useHoldings).
   * تُستخدم في تقارير تعتمد على المصدر الحي بدلاً من mockData، مثل fund_update.
   */
  liveFund?: Fund;
  liveClient?: Client;
  liveHolding?: Holding | null;
}

export function useReportPreview() {
  const [state, setState] = useState<ReportPreviewState | null>(null);
  const openReport = useCallback((s: ReportPreviewState) => setState(s), []);
  const close      = useCallback(() => setState(null), []);
  return { isOpen: state !== null, state, openReport, close };
}

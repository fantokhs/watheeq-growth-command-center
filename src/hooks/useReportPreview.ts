import { useState, useCallback } from 'react';
import type { ReportType } from '@/types/reports';

export interface ReportPreviewState {
  reportType: ReportType;
  clientId?: string;
  fundId?: string;
  ownerId?: string;
  /** ملاحظات اختيارية يكتبها المستخدم في نموذج الإعداد */
  notes?: string;
  /** true = فُتح من سياق محدد (drawer عميل/صندوق) فلا يحتاج نموذج إعداد */
  fromContext?: boolean;
}

export function useReportPreview() {
  const [state, setState] = useState<ReportPreviewState | null>(null);
  const openReport = useCallback((s: ReportPreviewState) => setState(s), []);
  const close      = useCallback(() => setState(null), []);
  return { isOpen: state !== null, state, openReport, close };
}

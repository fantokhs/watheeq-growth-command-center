/**
 * ReportPreviewModal
 * يعرض أي قالب تقرير في نافذة معاينة كاملة الشاشة مع شريط الأدوات.
 *
 * إصلاح Phase 3.2:
 * تم فصل backdrop-filter عن الـ container الرئيسي لمنع خلق
 * containing block مزيّف يكسر fixed positioning للـ DeliveryModal.
 */
import { useEffect, type ReactNode } from 'react';
import { ReportActionsBar } from './ReportShell';
import type { ReportType, ReportAudience, ReportStatus } from '@/types/reports';

interface ReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  reportType: ReportType;
  audience: ReportAudience;
  status: ReportStatus;
  reportTitle: string;
  clientName?: string;
  fundName?: string;
  children: ReactNode;
}

export function ReportPreviewModal({
  open, onClose, reportType, audience, status,
  reportTitle, clientName, fundName, children,
}: ReportPreviewModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    /*
     * ⚠️ NO backdropFilter / filter / transform / will-change here.
     * Any of these would create a new "containing block" for position:fixed
     * descendants, breaking DeliveryModal's viewport-level centering.
     * The background + blur are handled by a separate absolutely-positioned
     * child below.
     */
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(7, 26, 44, 0.90)' }}>
      {/* Blur overlay as a separate non-containing child (pointer-events:none) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* Actions Bar — sticky top */}
      <div className="relative z-10 shrink-0">
        <ReportActionsBar
          reportType={reportType}
          audience={audience}
          status={status}
          clientName={clientName}
          fundName={fundName}
          reportTitle={reportTitle}
          onClose={onClose}
        />
      </div>

      {/* Report content — scrollable */}
      <div className="relative z-10 flex-1 overflow-y-auto" id="report-print-area">
        <div
          className="mx-auto my-8 mb-12"
          style={{ maxWidth: 860, boxShadow: '0 12px 48px rgba(0,0,0,0.40)', borderRadius: 4, overflow: 'hidden' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

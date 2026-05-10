import { ReportPreviewModal } from './ReportPreviewModal';
import {
  ClientSummaryReport, PreVisitReport,
  FundTeaserReport, FundFundraisingReport, FundUpdateReport,
  RecommendedInvestorsReport, WeeklyVisitsReport,
  ManagementAttentionReport, CEOWeeklyReport,
  RMPerformanceReport, SLAReport,
} from './ReportTemplates';
import { REPORT_TYPE_LABELS } from '@/types/reports';
import type { ReportPreviewState } from '@/hooks/useReportPreview';
import type { ReportAudience } from '@/types/reports';
import { mockClients, mockFunds } from '@/data/mockData';

interface ReportGateProps {
  state: ReportPreviewState | null;
  onClose: () => void;
}

const AUDIENCE_MAP: Record<string, ReportAudience> = {
  client_summary:        'client',
  pre_visit:             'internal',
  fund_teaser:           'client',
  fund_fundraising:      'management',
  fund_update:           'client',
  recommended_investors: 'bd_team',
  weekly_visits:         'management',
  management_attention:  'ceo',
  ceo_weekly:            'ceo',
  rm_performance:        'management',
  sla_followup:          'management',
};

export function ReportGate({ state, onClose }: ReportGateProps) {
  if (!state) return null;

  const { reportType, clientId, fundId, ownerId, notes, liveFund, liveClient, liveHolding } = state;
  const label    = REPORT_TYPE_LABELS[reportType] ?? reportType;
  const audience = AUDIENCE_MAP[reportType] ?? 'internal';

  // Resolve display names — prefer live entities passed from page, fallback to mock lookup
  const clientName =
    liveClient?.name_ar ??
    (clientId ? mockClients.find((c) => c.client_id === clientId)?.name_ar : undefined);
  const fundName =
    liveFund?.name_ar ??
    (fundId ? mockFunds.find((f) => f.fund_id === fundId)?.name_ar : undefined);

  function renderTemplate() {
    switch (reportType) {
      case 'client_summary':        return <ClientSummaryReport clientId={clientId} notes={notes} />;
      case 'pre_visit':             return <PreVisitReport clientId={clientId} notes={notes} />;
      case 'fund_teaser':           return <FundTeaserReport fundId={fundId} notes={notes} />;
      case 'fund_fundraising':      return <FundFundraisingReport fundId={fundId} notes={notes} />;
      case 'fund_update': {
        if (!liveFund) {
          return (
            <div className="flex items-center justify-center" style={{ minHeight: 300, background: '#fff' }}>
              <div className="text-center px-6">
                <p className="text-[32px] mb-3">⚠️</p>
                <p className="text-[16px] font-bold text-watheeq-navy-deep mb-1">تعذر تحميل التقرير</p>
                <p className="text-[13px] text-ink-muted">بيانات الصندوق غير متاحة حالياً.</p>
              </div>
            </div>
          );
        }
        return <FundUpdateReport fund={liveFund} client={liveClient} holding={liveHolding} notes={notes} />;
      }
      case 'recommended_investors': return <RecommendedInvestorsReport fundId={fundId} notes={notes} />;
      case 'weekly_visits':         return <WeeklyVisitsReport notes={notes} />;
      case 'management_attention':  return <ManagementAttentionReport notes={notes} />;
      case 'ceo_weekly':            return <CEOWeeklyReport notes={notes} />;
      case 'rm_performance':        return <RMPerformanceReport ownerId={ownerId} notes={notes} />;
      case 'sla_followup':          return <SLAReport notes={notes} />;
      default:
        return (
          <div className="flex items-center justify-center" style={{ minHeight: 300, background: '#fff' }}>
            <div className="text-center px-6">
              <p className="text-[32px] mb-3">⚠️</p>
              <p className="text-[16px] font-bold text-watheeq-navy-deep mb-1">تعذر تحميل التقرير</p>
              <p className="text-[13px] text-ink-muted">نوع التقرير غير معروف: {reportType}</p>
            </div>
          </div>
        );
    }
  }

  return (
    <ReportPreviewModal
      open={true}
      onClose={onClose}
      reportType={reportType}
      audience={audience}
      status="approved"
      reportTitle={label}
      clientName={clientName}
      fundName={fundName}
    >
      {renderTemplate()}
    </ReportPreviewModal>
  );
}

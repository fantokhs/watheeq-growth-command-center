/**
 * أنواع نظام التقارير — Phase 3
 */

export type ReportType =
  | 'client_summary'
  | 'pre_visit'
  | 'fund_teaser'
  | 'fund_fundraising'
  | 'recommended_investors'
  | 'weekly_visits'
  | 'management_attention'
  | 'ceo_weekly'
  | 'rm_performance'
  | 'sla_followup';

export type ReportAudience =
  | 'client'
  | 'internal'
  | 'management'
  | 'ceo'
  | 'bd_team'
  | 'compliance';

export type ReportStatus =
  | 'draft'
  | 'ready'
  | 'approved'
  | 'sent'
  | 'needs_update';

export type DeliveryStatus =
  | 'not_sent'
  | 'sent_email'
  | 'sent_whatsapp'
  | 'downloaded'
  | 'scheduled'
  | 'pending';

export interface ReportRecord {
  report_id: string;
  report_type: ReportType;
  title: string;
  title_en?: string;
  audience: ReportAudience;
  related_client_id?: string;
  related_fund_id?: string;
  related_owner_id?: string;
  generated_at: string;
  status: ReportStatus;
  delivery_status: DeliveryStatus;
  last_sent_at?: string;
  created_by: string;
  source_data_status: 'live' | 'mock';
}

export interface DeliveryLogEntry {
  log_id: string;
  report_id: string;
  date: string;
  channel: 'email' | 'whatsapp' | 'download' | 'system';
  recipient: string;
  report_title: string;
  status: 'ready' | 'sent_test' | 'failed' | 'pending';
}

export interface MessageTemplate {
  subject?: string;
  body: string;
}

// ─────────────────────────────────────────────
// Arabic UI labels
// ─────────────────────────────────────────────
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  client_summary:          'تقرير ملخص العميل',
  pre_visit:               'تقرير ما قبل الزيارة',
  fund_teaser:             'تيزر الصندوق',
  fund_fundraising:        'تقرير تعبئة الصندوق',
  recommended_investors:   'تقرير العملاء الموصى بهم',
  weekly_visits:           'تقرير الزيارات الأسبوعي',
  management_attention:    'فرص تحتاج تدخل الإدارة',
  ceo_weekly:              'تقرير الإدارة الأسبوعي',
  rm_performance:          'تقرير أداء مدير العلاقة',
  sla_followup:            'تقرير SLA والمتابعة',
};

export const REPORT_AUDIENCE_LABELS: Record<ReportAudience, string> = {
  client:     'العميل',
  internal:   'داخلي',
  management: 'الإدارة',
  ceo:        'الرئيس التنفيذي',
  bd_team:    'فريق تطوير الأعمال',
  compliance: 'الالتزام',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft:         'مسودة',
  ready:         'جاهز للمراجعة',
  approved:      'معتمد',
  sent:          'مرسل',
  needs_update:  'يحتاج تحديث',
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  not_sent:       'لم يرسل',
  sent_email:     'أرسل بالبريد',
  sent_whatsapp:  'أرسل واتساب',
  downloaded:     'تم التحميل',
  scheduled:      'مجدول',
  pending:        'بانتظار التفعيل',
};

export const STATUS_TONE: Record<ReportStatus, string> = {
  draft:        '#6B7280',
  ready:        '#2563EB',
  approved:     '#1F8A5B',
  sent:         '#263F82',
  needs_update: '#C88719',
};

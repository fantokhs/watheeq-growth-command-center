// ─── Visit Domain Types ───────────────────────────────────────

export type VisitType =
  | 'intro'
  | 'followup'
  | 'fund_pitch'
  | 'client_inquiry'
  | 'closing'
  | 'non_investment'
  | 'problem_resolution'
  | 'post_investment'
  | 'relationship_renewal';

export type VisitStatus =
  | 'scheduled'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'needs_followup'
  | 'converted'
  | 'needs_mgmt'
  | 'closed_no_opp';

export type InterestLevel = 'low' | 'medium' | 'high' | 'very_high';

export type MeetingMinutesStatus = 'not_created' | 'ready' | 'sent' | 'overdue';
export type InternalReportStatus = 'incomplete' | 'complete' | 'needs_review';

export type ClientRequestStatus = 'open' | 'in_progress' | 'done' | 'overdue';

export type RecommendedClientStatus =
  | 'غير محدد'
  | 'عميل مناسب'
  | 'قيد المتابعة'
  | 'غير مناسب حالياً';

export type FollowUpStatus =
  | 'لا يوجد'
  | 'مفتوحة'
  | 'متأخرة'
  | 'مكتملة';

export type ConversionDecision =
  | 'لم يقرر'
  | 'تحويل إلى فرصة'
  | 'إضافة إلى العملاء المناسبين'
  | 'متابعة لاحقة'
  | 'إغلاق بدون فرصة';

export interface ClientRequest {
  id: string;
  type: string;
  owner: string;
  due_date: string;
  status: ClientRequestStatus;
}

export interface VisitRecord {
  visit_id: string;
  client_id: string;
  client_name: string;
  client_classification?: string;
  fund_id?: string;
  fund_name?: string;
  owner_id: string;
  owner_name: string;
  city: string;
  visit_date: string;       // YYYY-MM-DD
  visit_time?: string;      // HH:MM
  visit_type: VisitType;
  status: VisitStatus;
  interest_level: InterestLevel;
  next_action?: string;
  due_date?: string;
  meeting_minutes_status: MeetingMinutesStatus;
  internal_report_status: InternalReportStatus;
  client_requests: ClientRequest[];
  management_attention: boolean;
  converted_to_pipeline: boolean;
  can_convert: boolean;
  value_estimate?: number;
  visit_objective?: string;
  meeting_summary?: string;
  week_number?: number;
  // ─── Phase 3.4: Relationship fields ───────────────────────
  linkedOpportunityId?: string;
  linkedOpportunityName?: string;
  recommendedForFundId?: string;
  recommendedForFundName?: string;
  recommendedClientStatus: RecommendedClientStatus;
  followUpStatus: FollowUpStatus;
  conversionDecision: ConversionDecision;
  closeReason?: string;
  /** مدير الحساب — BD team or senior relationship manager */
  accountManager?: string;
  /** الوسيط / مصدر الفرصة — person who sourced or introduced the client */
  brokerName?: string;
}

// ─── Label maps ───────────────────────────────────────────────

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  intro:                'زيارة تعريفية',
  followup:             'زيارة متابعة',
  fund_pitch:           'عرض صندوق',
  client_inquiry:       'استفسارات عميل',
  closing:              'إغلاق / توقيع',
  non_investment:       'علاقة غير استثمارية',
  problem_resolution:   'معالجة مشكلة',
  post_investment:      'ما بعد الاستثمار',
  relationship_renewal: 'تجديد علاقة',
};

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled:     'مجدولة',
  completed:     'تمت',
  postponed:     'مؤجلة',
  cancelled:     'ملغاة',
  needs_followup:'تحتاج متابعة',
  converted:     'تحولت إلى فرصة',
  needs_mgmt:    'تحتاج تدخل الإدارة',
  closed_no_opp: 'مغلقة بدون فرصة',
};

export const INTEREST_LEVEL_LABELS: Record<InterestLevel, string> = {
  very_high: 'مهتم جدًا',
  high:      'مهتم',
  medium:    'اهتمام متوسط',
  low:       'غير مهتم',
};

export const MEETING_MINUTES_LABELS: Record<MeetingMinutesStatus, string> = {
  not_created: 'غير منشأ',
  ready:       'جاهز للإرسال',
  sent:        'مرسل',
  overdue:     'متأخر',
};

export const INTERNAL_REPORT_LABELS: Record<InternalReportStatus, string> = {
  incomplete:    'غير مكتمل',
  complete:      'مكتمل',
  needs_review:  'يحتاج مراجعة',
};

export const CLIENT_REQUEST_LABELS: Record<ClientRequestStatus, string> = {
  open:        'مفتوح',
  in_progress: 'قيد التنفيذ',
  done:        'مكتمل',
  overdue:     'متأخر',
};

// ─── Status colors ────────────────────────────────────────────

export const STATUS_COLORS: Record<VisitStatus, string> = {
  scheduled:     '#2563EB',
  completed:     '#1F8A5B',
  postponed:     '#C88719',
  cancelled:     '#6B7280',
  needs_followup:'#B45309',
  converted:     '#C8A45D',
  needs_mgmt:    '#B42318',
  closed_no_opp: '#374151',
};

export const INTEREST_COLORS: Record<InterestLevel, string> = {
  low:      '#6B7280',
  medium:   '#2563EB',
  high:     '#C88719',
  very_high:'#B42318',
};

// ─── Helper: days since a date ────────────────────────────────
export function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export function daysUntil(dateStr: string): number {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

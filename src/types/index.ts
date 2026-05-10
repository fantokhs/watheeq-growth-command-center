/**
 * أنواع البيانات (Schema) لكل كيانات قاعدة البيانات
 * --------------------------------------------------
 * أسماء الحقول داخلياً بالإنجليزية لمطابقة Google Sheet.
 * عرض المستخدم بالعربية يحدث في طبقة الـ UI.
 *
 * هذه الـ types تطابق التبويبات الـ ١٣ في:
 * Watheeq_Growth_Command_Center_Database_v0_2_AR
 */

// ============================================================
// Common types
// ============================================================
export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'

export type ClientStatus = 'existing' | 'prospect' | 'sensitive' | 'churned' | 'archived';
export type ClientClassification = 'HNW' | 'UHNW' | 'Family Office' | 'Institution' | 'Retail';
export type RiskProfile = 'Conservative' | 'Balanced' | 'Growth' | 'Aggressive';
export type AssetClass =
  | 'Real Estate'
  | 'Private Equity'
  | 'Venture Capital'
  | 'Public Equities'
  | 'Sukuk'
  | 'Money Market'
  | 'Mixed';

export type FundStage =
  | 'Idea'
  | 'Structuring'
  | 'Approvals'
  | 'Fundraising'
  | 'Closed'
  | 'Managed'
  | 'Exited';

export type PipelineStage =
  | 'Lead'
  | 'Contacted'
  | 'Meeting'
  | 'Proposal'
  | 'Committed'
  | 'Closed'
  | 'Lost';

export type ReportType = 'Monthly' | 'Quarterly' | 'Annual' | 'Ad-hoc' | 'Performance';
export type ReportChannel = 'Email' | 'WhatsApp' | 'Portal' | 'In-person';
export type DeliveryStatus = 'Sent' | 'Delivered' | 'Opened' | 'Pending' | 'Failed';

// ============================================================
// Clients
// ============================================================
export interface Client {
  client_id: ID;
  name_ar: string;
  name_en?: string;
  classification: ClientClassification;
  status: ClientStatus;
  city?: string;
  risk_profile?: RiskProfile;
  preferred_asset_class?: AssetClass;
  total_invested?: number;
  total_profit?: number;
  relationship_owner_id?: ID;
  last_contact_date?: ISODate;
  last_visit_date?: ISODate;
  last_report_date?: ISODate;
  next_follow_up_date?: ISODate;
  notes?: string;
  recommended_funds?: ID[];
  is_ceo_attention?: boolean;
  /** Phase 3.6: تصنيف التأهيل */
  qualificationStatus?: 'مؤهل' | 'غير مؤهل';
  /** Phase 3.6: الحد الأقصى للاستثمار — null = مفتوح، 200000 = غير مؤهل */
  qualificationLimit?: number | null;
  /** Phase 3.8: التذكرة الاستثمارية المناسبة (تقدير، ليس حداً نظامياً للمؤهلين) */
  investmentCapacity?: number;
}

// ============================================================
// Funds
// ============================================================
export interface Fund {
  fund_id: ID;
  name_ar: string;
  name_en?: string;
  asset_class: AssetClass;
  stage: FundStage;
  status: 'Active' | 'Inactive';
  priority?: 'High' | 'Medium' | 'Low';
  fund_manager_id?: ID;
  target_size?: number;
  committed_amount?: number;
  remaining_amount?: number;
  expected_return_pct?: number;
  duration_years?: number;
  investors_count?: number;
  fundraising_progress_pct?: number; // 0..1
  last_stage_changed_at?: ISODate;
  notes?: string;
  /** Phase 3.6: تاريخ الإغلاق المستهدف */
  fund_close_date?: ISODate;

  // ─── 02_Funds — Report payload fields ────────────────────────────
  // All optional. Drive the FundUpdateReport when present, fall back
  // to the generic fields above otherwise.
  report_ready?: string;
  report_status?: string;
  report_title?: string;
  report_period?: string;
  project_name?: string;
  project_location?: string;
  /** نص حر يصف القرب من الحرم (مثلاً: "حوالي 2.5 كم من المسجد الحرام") */
  near_haram?: string;
  asset_type?: string;
  units_count?: number;
  land_area?: number;
  built_up_area?: number;
  sellable_area?: number;
  far?: number;
  project_value?: number;
  duration?: string;
  sales_model?: string;
  pre_construction_progress?: number; // 0..1
  overall_progress?: number;          // 0..1
  executive_summary?: string;
  achievements?: string;
  jan_summary?: string;
  feb_summary?: string;
  mar_summary?: string;
  approvals_completed?: string;
  approvals_pending?: string;
  investor_meaning?: string;
  next_steps?: string;
  disclaimer?: string;
  linked_client_ids?: string[];
  last_updated?: ISODate;
}

// ============================================================
// Client_Fund_Holdings (M:M junction)
// ============================================================
export interface Holding {
  client_id: ID;
  fund_id: ID;
  invested_amount: number;
  invested_at?: ISODate;
  current_value?: number;
  realized_profit?: number;
}

// ============================================================
// Employees
// ============================================================
export interface Employee {
  employee_id: ID;
  name_ar: string;
  name_en?: string;
  role: string;
  department?: 'Business Development' | 'Investor Relations' | 'Fund Management' | 'Other';
  email?: string;
  phone?: string;
  is_active?: boolean;
}

// ============================================================
// Pipeline (Opportunities)
// ============================================================
export type OpportunityInterestStatus =
  | 'تم التحويل'
  | 'مهتم جدًا'
  | 'مهتم'
  | 'اهتمام متوسط'
  | 'غير مهتم';

/** وزن كل تصنيف لحساب المبلغ المرجح */
export const INTEREST_STATUS_WEIGHTS: Record<OpportunityInterestStatus, number> = {
  'تم التحويل':    1.00,
  'مهتم جدًا':    0.85,
  'مهتم':          0.60,
  'اهتمام متوسط': 0.30,
  'غير مهتم':      0.00,
};

export interface PipelineItem {
  opportunity_id: ID;
  client_id: ID;
  fund_id: ID;
  stage: PipelineStage;
  expected_amount: number;
  probability: number; // 0..1
  weighted_amount?: number;
  owner_id: ID;
  next_step?: string;
  next_step_date?: ISODate;
  expected_close_date?: ISODate;
  ceo_attention_flag?: boolean;
  created_at?: ISODate;
  notes?: string;
  /** Phase 3.6: تصنيف اهتمام المستثمر */
  interestStatus?: OpportunityInterestStatus;
  /** Phase 3.6: مدير الحساب */
  accountManager?: string;
  /** Phase 3.6: الوسيط / مصدر الفرصة */
  brokerName?: string;
}

// ============================================================
// Visits
// ============================================================
export interface Visit {
  visit_id: ID;
  visit_date: ISODate;
  week_number?: number;
  client_id: ID;
  is_new_client: boolean;
  employee_id: ID;
  fund_id?: ID;
  city?: string;
  purpose: string;
  expected_amount?: number;
  prep_required?: boolean;
  report_required?: boolean;
  management_note?: string;
  next_action?: string;
  status?: 'Planned' | 'Done' | 'Cancelled';
}

// ============================================================
// Reports_Log
// ============================================================
export interface ReportLog {
  report_id: ID;
  client_id: ID;
  fund_id?: ID;
  report_type: ReportType;
  report_date: ISODate;
  channel: ReportChannel;
  delivery_status: DeliveryStatus;
  follow_up_required?: boolean;
  attachment_url?: string;
  sent_by_id?: ID;
}

// ============================================================
// Targets
// ============================================================
export interface Target {
  target_id: ID;
  employee_id?: ID; // null = on department/company level
  period_type: 'Monthly' | 'Quarterly' | 'Yearly';
  period: string; // '2026-05' or '2026-Q2' or '2026'
  metric: 'Sales' | 'Visits' | 'AUM' | 'Revenue' | 'NewClients';
  target_value: number;
  achieved_value?: number;
  achievement_pct?: number; // 0..1
}

// ============================================================
// Billion_Plan
// ============================================================
export interface BillionPlanRow {
  year: number;
  target_valuation?: number;
  target_aum: number;
  target_revenue?: number;
  target_net_profit?: number;
  actual_aum?: number;
  actual_revenue?: number;
  actual_net_profit?: number;
  achievement_pct?: number; // 0..1
  gap?: number;
  strategic_notes?: string;
}

// ============================================================
// Financials
// ============================================================
export interface FinancialPeriod {
  period: string; // '2025' or '2025-Q4' or '2025-12'
  period_type: 'Monthly' | 'Quarterly' | 'Yearly';
  revenue: number;
  cost_of_revenue?: number;
  gross_profit?: number;
  operating_expenses?: number;
  net_profit: number;
  total_assets?: number;
  total_liabilities?: number;
  equity?: number;
  aum?: number;
  yoy_growth_pct?: number; // 0..1
}

// ============================================================
// Dashboard (cached aggregates)
// ============================================================
export interface DashboardSnapshot {
  generated_at: ISODate;
  total_aum: number;
  revenue_ytd: number;
  net_profit_ytd: number;
  active_funds_count: number;
  active_clients_count: number;
  prospects_count: number;
  pipeline_total: number;
  pipeline_weighted: number;
  monthly_target: number;
  monthly_achieved: number;
  achievement_pct: number;
  billion_progress_pct: number;
  upcoming_visits_count: number;
  ceo_attention_count: number;
}

// ============================================================
// Sources & Lookups (meta)
// ============================================================
export interface SourceRecord {
  source_id: ID;
  table_name: string;
  source_type: 'Sheet' | 'Manual' | 'External';
  last_refreshed_at?: string;
  row_count?: number;
  notes?: string;
}

export interface LookupRecord {
  category: string; // e.g. 'pipeline_stage'
  code: string; // e.g. 'Meeting'
  label_ar: string; // e.g. 'اجتماع'
  display_order?: number;
}

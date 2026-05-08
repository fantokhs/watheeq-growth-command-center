/**
 * repositories/index.ts — Phase 4.3 FINAL
 *
 * Column names taken directly from Watheeq_Data_Source_Templates sheets.
 * Every alias covers the EXACT column name from the Google Sheet.
 */

import { sheetsConfig } from '@/config/sheetsConfig';
import {
  fetchCsv,
  parsePercent,
  parseBool,
  parseDate,
  parseString,
  parseRequiredString,
  parseRequiredNumber,
  parseNumber,
  type FetchResult,
} from '../csvFetcher';
import {
  normalizeClientClassification,
  normalizeClientStatus,
  normalizeRiskProfile,
  normalizeAssetClass,
  normalizeFundStage,
  normalizeFundPriority,
  normalizePipelineStage,
  normalizeInterestStatus,
  normalizeInterestLevel,
  normalizeQualificationStatus,
  normalizeVisitType,
  normalizeVisitStatus,
  parseMoneyNumber,
} from '../normalizers';
import {
  mockClients, mockFunds, mockHoldings, mockEmployees, mockPipeline,
  mockVisits, mockReports, mockTargets, mockBillionPlan, mockFinancials,
  mockDashboard, mockSources, mockLookups,
} from '@/data/mockData';
import { mockVisitRecords } from '@/data/mockVisits';
import type {
  Client, Fund, Holding, Employee, PipelineItem, Visit, ReportLog,
  Target, BillionPlanRow, FinancialPeriod, DashboardSnapshot,
  SourceRecord, LookupRecord, OpportunityInterestStatus,
} from '@/types';
import type { VisitRecord } from '@/types/visits';

// ─── 01_Clients ───────────────────────────────────────────────────
// Exact columns: client_id, client_name, client_name_en, client_type,
//   city, region, classification, qualification_status, regulatory_limit_sar,
//   investment_capacity_sar, risk_profile, preferred_asset_class,
//   relationship_manager_id, total_invested_sar, last_contact_date,
//   next_action_due_date, status, notes, account_manager, broker_name
export async function getClients(): Promise<FetchResult<Client>> {
  return fetchCsv<Client>(sheetsConfig.clients, mockClients, (raw) => ({
    client_id: parseRequiredString(raw.client_id),
    name_ar:   parseRequiredString(raw.client_name   ?? raw.name_ar),
    name_en:   parseString(raw.client_name_en        ?? raw.name_en),
    // classification: use sheet 'classification' first, then 'client_type'
    classification: normalizeClientClassification(
      raw.classification ?? raw.client_type
    ),
    status: normalizeClientStatus(raw.status),
    city:   parseString(raw.city),
    risk_profile:          normalizeRiskProfile(raw.risk_profile),
    preferred_asset_class: normalizeAssetClass(raw.preferred_asset_class),
    total_invested:  parseMoneyNumber(
      raw.total_invested_sar  // 01_Clients exact column
      ?? raw.total_invested
      ?? raw.total_investment
      ?? raw.aum
    ),
    total_profit: parseMoneyNumber(raw.total_profit ?? raw.realized_profit),
    relationship_owner_id: parseString(
      raw.relationship_manager_id  // 01_Clients exact column
      ?? raw.owner_id
      ?? raw.rm_id
    ),
    last_contact_date:  parseDate(raw.last_contact_date),
    last_visit_date:    parseDate(raw.last_visit_date),
    last_report_date:   parseDate(raw.last_report_date),
    next_follow_up_date: parseDate(
      raw.next_action_due_date   // 01_Clients exact column
      ?? raw.next_followup_date
      ?? raw.next_follow_up_date
    ),
    notes:          parseString(raw.notes),
    is_ceo_attention:
      v_lower(raw.relationship_sensitivity) === 'استراتيجي' ||
      v_lower(raw.relationship_sensitivity) === 'حساس' ||
      parseBool(raw.is_ceo_attention),
    // Phase 3.6 qualification
    qualificationStatus: normalizeQualificationStatus(raw.qualification_status),
    qualificationLimit:  parseMoneyNumber(
      raw.regulatory_limit_sar   // 01_Clients exact column
      ?? raw.qualification_limit
    ) || undefined,
    investmentCapacity: parseMoneyNumber(
      raw.investment_capacity_sar   // 01_Clients exact column
      ?? raw.investment_capacity
      ?? raw.expected_ticket
    ) || undefined,
  }));
}

function v_lower(raw?: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

// ─── 02_Funds ─────────────────────────────────────────────────────
// Exact columns: fund_id, fund_name, fund_name_en, fund_type, asset_class,
//   fund_manager_id, status, fundraising_stage, target_amount_sar,
//   committed_amount_sar, remaining_amount_sar, expected_return,
//   close_date, priority, days_remaining, notes
export async function getFunds(): Promise<FetchResult<Fund>> {
  return fetchCsv<Fund>(sheetsConfig.funds, mockFunds, (raw) => {
    const target    = parseMoneyNumber(
      raw.target_amount_sar    // 02_Funds exact column
      ?? raw.target_amount ?? raw.target_size ?? raw.fund_size
    );
    const committed = parseMoneyNumber(
      raw.committed_amount_sar  // 02_Funds exact column
      ?? raw.committed_amount
    );
    const remaining = parseMoneyNumber(
      raw.remaining_amount_sar  // 02_Funds exact column
      ?? raw.remaining_amount
    ) || Math.max(0, target - committed);
    const progress  = target > 0 ? Math.min(1, committed / target) : 0;
    return {
      fund_id:  parseRequiredString(raw.fund_id),
      name_ar:  parseRequiredString(raw.fund_name  ?? raw.name_ar),
      name_en:  parseString(raw.fund_name_en       ?? raw.name_en),
      asset_class: normalizeAssetClass(raw.asset_class) ?? 'Mixed',
      stage: normalizeFundStage(
        raw.fundraising_stage  // 02_Funds exact column
        ?? raw.stage
      ),
      status: (parseString(raw.status) as Fund['status']) ?? 'Active',
      priority: normalizeFundPriority(raw.priority) as Fund['priority'],
      fund_manager_id: parseString(raw.fund_manager_id),
      target_size:      target,
      committed_amount: committed,
      remaining_amount: remaining,
      expected_return_pct: typeof raw.expected_return === 'number'
        ? raw.expected_return          // e.g. 0.16 from sheet
        : parsePercent(raw.expected_return ?? raw.expected_yield),
      duration_years:   parseNumber(raw.duration_years),
      investors_count:  parseNumber(raw.investors_count),
      fundraising_progress_pct: progress,
      last_stage_changed_at: parseDate(raw.last_stage_changed_at),
      notes: parseString(raw.notes),
      fund_close_date: parseDate(
        raw.close_date             // 02_Funds exact column
        ?? raw.fund_close_date
      ),
    };
  });
}

// ─── Holdings ─────────────────────────────────────────────────────
export async function getHoldings(): Promise<FetchResult<Holding>> {
  return fetchCsv<Holding>(sheetsConfig.holdings, mockHoldings, (raw) => ({
    client_id:       parseRequiredString(raw.client_id),
    fund_id:         parseRequiredString(raw.fund_id),
    invested_amount: parseMoneyNumber(raw.invested_amount),
    invested_at:     parseDate(raw.invested_at),
    current_value:   parseMoneyNumber(raw.current_value),
    realized_profit: parseMoneyNumber(raw.realized_profit),
  }));
}

// ─── 09_Team_Members ──────────────────────────────────────────────
// Exact columns: team_member_id, full_name, role, department, email,
//   phone, status (نشط), manager_id
export async function getEmployees(): Promise<FetchResult<Employee>> {
  return fetchCsv<Employee>(sheetsConfig.teamMembers ?? sheetsConfig.employees, mockEmployees, (raw) => ({
    employee_id: parseRequiredString(
      raw.team_member_id   // 09_Team_Members exact column
      ?? raw.employee_id
      ?? raw.id
    ),
    name_ar: parseRequiredString(
      raw.full_name        // 09_Team_Members exact column
      ?? raw.name_ar
      ?? raw.name
    ),
    name_en:    parseString(raw.name_en),
    role:       parseRequiredString(raw.role ?? raw.job_title),
    department: parseString(raw.department) as Employee['department'],
    email:      parseString(raw.email),
    phone:      parseString(raw.phone),
    is_active:  v_lower(raw.status) === 'نشط' || parseBool(raw.is_active ?? raw.active ?? 'true'),
  }));
}

// ─── 03_Pipeline ──────────────────────────────────────────────────
// Exact columns: opportunity_id, client_id, fund_id, expected_ticket_sar,
//   interest_status, interest_weight, weighted_expected_sar, stage,
//   probability_percent, account_manager_id, account_manager,
//   broker_name, next_action, next_action_due_date
export async function getPipeline(): Promise<FetchResult<PipelineItem>> {
  return fetchCsv<PipelineItem>(sheetsConfig.pipeline, mockPipeline, (raw) => {
    const expected = parseMoneyNumber(
      raw.expected_ticket_sar    // 03_Pipeline exact column
      ?? raw.expected_ticket_size
      ?? raw.expected_amount
      ?? raw.ticket_size
    );
    // probability_percent: sheet stores 1.0 = 100%, 0.65 = 65%
    const rawProb = raw.probability_percent ?? raw.probability;
    let prob = typeof rawProb === 'number' ? rawProb : parseFloat(String(rawProb ?? '0'));
    if (isNaN(prob)) prob = 0;
    // Values > 1 mean percentage notation (e.g. "65" for 65%)
    if (prob > 1) prob = prob / 100;
    prob = Math.min(1, Math.max(0, prob));
    return {
      opportunity_id: parseRequiredString(raw.opportunity_id ?? raw.id),
      client_id:      parseRequiredString(raw.client_id),
      fund_id:        parseRequiredString(raw.fund_id),
      stage: normalizePipelineStage(raw.stage),
      expected_amount:  expected,
      probability:      prob,
      weighted_amount: parseMoneyNumber(
        raw.weighted_expected_sar   // 03_Pipeline exact column
        ?? raw.weighted_amount
      ) || expected * prob,
      owner_id: parseRequiredString(
        raw.account_manager_id   // 03_Pipeline exact column
        ?? raw.owner_id
        ?? raw.rm_id
      ),
      next_step:      parseString(raw.next_action ?? raw.next_step),
      next_step_date: parseDate(
        raw.next_action_due_date  // 03_Pipeline exact column
        ?? raw.next_step_date
      ),
      expected_close_date: parseDate(raw.close_date ?? raw.expected_close_date),
      ceo_attention_flag: parseBool(raw.requires_management_attention ?? raw.ceo_attention_flag),
      created_at: parseDate(raw.created_at),
      notes:      parseString(raw.notes),
      interestStatus: normalizeInterestStatus(
        raw.interest_status ?? raw.interestStatus
      ),
      accountManager: parseString(
        raw.account_manager ?? raw.accountManager
      ),
      brokerName: parseString(
        raw.broker_name ?? raw.brokerName ?? raw.broker
      ),
    };
  });
}

// ─── 04_Visits ────────────────────────────────────────────────────
// Exact columns: visit_id, client_id, client_name, fund_id, fund_name,
//   linked_opportunity_id, visit_type, visit_date, visit_time, city,
//   owner_id, owner_name, meeting_summary, interest_level,
//   meeting_minutes_status, internal_report_status, client_requests_count,
//   next_action, next_action_due_date, conversion_decision,
//   management_attention_flag (نعم/لا), status
export async function getVisitRecords(): Promise<FetchResult<VisitRecord>> {
  return fetchCsv<VisitRecord>(sheetsConfig.visits, mockVisitRecords, (raw) => ({
    visit_id:    parseRequiredString(raw.visit_id ?? raw.id),
    client_id:   parseRequiredString(raw.client_id),
    client_name: parseRequiredString(raw.client_name ?? raw.name),
    client_classification: parseString(raw.client_type ?? raw.classification),
    fund_id:   parseString(raw.fund_id),
    fund_name: parseString(raw.fund_name),
    owner_id:   parseRequiredString(raw.owner_id ?? raw.rm_id),
    owner_name: parseRequiredString(raw.owner_name ?? raw.rm_name),
    city:        parseString(raw.city) ?? '',
    visit_date:  parseDate(raw.visit_date) ?? String(raw.visit_date ?? ''),
    visit_time:  raw.visit_time ? String(raw.visit_time).substring(0, 5) : undefined,
    visit_type:  normalizeVisitType(raw.visit_type),
    status:      normalizeVisitStatus(raw.status),
    interest_level: normalizeInterestLevel(raw.interest_level),
    next_action: parseString(raw.next_action),
    due_date: parseDate(
      raw.next_action_due_date  // 04_Visits exact column
      ?? raw.due_date
    ),
    meeting_minutes_status: normalizeMeetingMinutesStatus(raw.meeting_minutes_status),
    internal_report_status: (parseString(raw.internal_report_status) as VisitRecord['internal_report_status']) ?? 'incomplete',
    client_requests: [],
    management_attention: parseBool(
      raw.management_attention_flag   // 04_Visits exact column (نعم/لا)
      ?? raw.requires_management_attention
      ?? raw.management_attention
    ),
    converted_to_pipeline: parseBool(raw.converted_to_pipeline),
    can_convert: parseBool(raw.can_convert),
    value_estimate: parseMoneyNumber(raw.value_estimate) || undefined,
    visit_objective: parseString(raw.visit_objective),
    meeting_summary: parseString(
      raw.meeting_summary   // 04_Visits exact column
      ?? raw.summary
      ?? raw.notes
    ),
    week_number: parseNumber(raw.week_number),
    linkedOpportunityId:    parseString(raw.linked_opportunity_id),
    linkedOpportunityName:  parseString(raw.linked_opportunity_name),
    recommendedForFundId:   parseString(raw.recommended_for_fund_id),
    recommendedForFundName: parseString(raw.recommended_for_fund_name),
    recommendedClientStatus:
      (parseString(raw.recommended_client_status) as VisitRecord['recommendedClientStatus']) ?? 'غير محدد',
    followUpStatus:
      (parseString(raw.follow_up_status) as VisitRecord['followUpStatus']) ?? 'لا يوجد',
    conversionDecision:
      (parseString(raw.conversion_decision) as VisitRecord['conversionDecision']) ?? 'لم يقرر',
    closeReason:    parseString(raw.close_reason),
    accountManager: parseString(raw.account_manager),
    brokerName:     parseString(raw.broker_name),
  }));
}

function normalizeMeetingMinutesStatus(raw?: unknown): VisitRecord['meeting_minutes_status'] {
  const s = String(raw ?? '').trim().toLowerCase();
  if (/مرسل|sent|done/i.test(s))        return 'sent';
  if (/متأخر|overdue|late/i.test(s))    return 'overdue';
  if (/مسودة|draft|ready|جاهز/i.test(s)) return 'ready';
  return 'not_created';
}

// ─── Visits legacy ────────────────────────────────────────────────
export async function getVisits(): Promise<FetchResult<Visit>> {
  return fetchCsv<Visit>(sheetsConfig.visits, mockVisits, (raw) => ({
    visit_id:        parseRequiredString(raw.visit_id ?? raw.id),
    visit_date:      parseDate(raw.visit_date) ?? '',
    week_number:     parseNumber(raw.week_number),
    client_id:       parseRequiredString(raw.client_id),
    is_new_client:   parseBool(raw.is_new_client),
    employee_id:     parseRequiredString(raw.owner_id ?? raw.employee_id),
    fund_id:         parseString(raw.fund_id),
    city:            parseString(raw.city),
    purpose:         parseString(raw.visit_type ?? raw.purpose) ?? '',
    expected_amount: parseMoneyNumber(raw.value_estimate ?? raw.expected_amount),
  }));
}

// ─── Reports / legacy types ────────────────────────────────────────
// 07_Reports_Log columns: report_id, report_type, report_title,
//   related_client_id, related_fund_id, status, generated_at, delivery_status
export async function getReports(): Promise<FetchResult<ReportLog>> {
  return fetchCsv<any>(sheetsConfig.reports, mockReports as any, (raw) => ({
    report_id:       parseRequiredString(raw.report_id ?? raw.id),
    client_id:       parseString(raw.related_client_id ?? raw.client_id),
    fund_id:         parseString(raw.related_fund_id   ?? raw.fund_id),
    report_type:     parseRequiredString(raw.report_type),
    generated_at:    parseDate(raw.generated_at) ?? '',
    generated_by_id: parseString(raw.generated_by_id),
    delivery_method: parseString(raw.delivery_channel ?? raw.delivery_method),
    delivery_status: parseString(raw.delivery_status),
    notes:           parseString(raw.notes),
  }));
}

export async function getTargets(): Promise<FetchResult<Target>> {
  return fetchCsv<any>(sheetsConfig.targets, mockTargets as any, (raw) => ({
    target_id:      parseRequiredString(raw.target_id ?? raw.id ?? '—'),
    employee_id:    parseString(raw.employee_id),
    period_type:    parseString(raw.period_type) ?? 'Monthly',
    period:         parseRequiredString(raw.period ?? '—'),
    metric:         parseString(raw.metric) ?? 'Sales',
    target_value:   parseMoneyNumber(raw.target_value),
    achieved_value: parseMoneyNumber(raw.achieved_value),
  }));
}

export async function getBillionPlan(): Promise<FetchResult<BillionPlanRow>> {
  return fetchCsv<any>(sheetsConfig.billionPlan, mockBillionPlan as any, (raw) => ({
    year:       parseNumber(raw.year) ?? 2026,
    target_aum: parseMoneyNumber(raw.target_aum ?? raw.target),
    actual_aum: parseMoneyNumber(raw.actual_aum ?? raw.actual),
  }));
}

export async function getFinancials(): Promise<FetchResult<FinancialPeriod>> {
  return fetchCsv<any>(sheetsConfig.financials, mockFinancials as any, (raw) => ({
    period:      parseRequiredString(raw.period ?? '—'),
    period_type: parseString(raw.period_type) ?? 'Yearly',
    revenue:     parseMoneyNumber(raw.revenue),
    net_profit:  parseMoneyNumber(raw.net_profit),
    aum:         parseMoneyNumber(raw.aum),
  }));
}

export async function getDashboard(): Promise<FetchResult<DashboardSnapshot>> {
  return fetchCsv<any>(sheetsConfig.dashboard, [mockDashboard as any], (raw) => ({
    generated_at:         parseDate(raw.generated_at) ?? new Date().toISOString().split('T')[0],
    total_aum:            parseMoneyNumber(raw.total_aum),
    revenue_ytd:          parseMoneyNumber(raw.revenue_ytd),
    net_profit_ytd:       parseMoneyNumber(raw.net_profit_ytd),
    active_funds_count:   parseRequiredNumber(raw.active_funds_count),
    active_clients_count: parseRequiredNumber(raw.active_clients_count),
    prospects_count:      parseRequiredNumber(raw.prospects_count),
    pipeline_total:       parseMoneyNumber(raw.pipeline_total),
    pipeline_weighted:    parseMoneyNumber(raw.pipeline_weighted),
    monthly_target:       parseMoneyNumber(raw.monthly_target),
    monthly_achieved:     parseMoneyNumber(raw.monthly_achieved),
    achievement_pct:      parsePercent(raw.achievement_pct) ?? 0,
    billion_progress_pct: parsePercent(raw.billion_progress_pct) ?? 0,
    upcoming_visits_count:parseRequiredNumber(raw.upcoming_visits_count),
    ceo_attention_count:  parseRequiredNumber(raw.ceo_attention_count),
  }));
}

export async function getSources(): Promise<FetchResult<SourceRecord>> {
  return fetchCsv<SourceRecord>(sheetsConfig.sources, mockSources, (raw) => ({
    source_id:        parseRequiredString(raw.source_id ?? raw.id),
    table_name:       parseRequiredString(raw.table_name),
    source_type:     (parseString(raw.source_type) as SourceRecord['source_type']) ?? 'Sheet',
    last_refreshed_at:parseString(raw.last_refreshed_at),
    row_count:        parseNumber(raw.row_count),
    notes:            parseString(raw.notes),
  }));
}

// 10_Lookups: lookup_category, code, arabic_label, english_label
export async function getLookups(): Promise<FetchResult<LookupRecord>> {
  return fetchCsv<LookupRecord>(sheetsConfig.lookups, mockLookups, (raw) => ({
    category:     parseRequiredString(raw.lookup_category ?? raw.category),
    code:         parseRequiredString(raw.code),
    label_ar:     parseRequiredString(raw.arabic_label ?? raw.label_ar ?? raw.label),
    display_order:parseNumber(raw.sort_order ?? raw.display_order),
  }));
}

// ─── Phase 4.1 supplementary sheets ─────────────────────────────

export interface ClientRequestRow {
  request_id:string; client_id:string; fund_id?:string; visit_id?:string;
  opportunity_id?:string; type:string; owner?:string; due_date?:string;
  status?:string; notes?:string;
}
// 05_Client_Requests: request_id, client_id, visit_id, request_type,
//   owner_id, due_date, status
export async function getClientRequests(): Promise<FetchResult<ClientRequestRow>> {
  return fetchCsv<ClientRequestRow>(sheetsConfig.clientRequests, [], (raw) => ({
    request_id:     parseRequiredString(raw.request_id ?? raw.id),
    client_id:      parseRequiredString(raw.client_id),
    fund_id:        parseString(raw.fund_id),
    visit_id:       parseString(raw.visit_id),
    opportunity_id: parseString(raw.opportunity_id),
    type:           parseString(raw.request_type ?? raw.type) ?? '',
    owner:          parseString(raw.owner_name ?? raw.owner_id ?? raw.owner),
    due_date:       parseDate(raw.due_date),
    status:         parseString(raw.status),
    notes:          parseString(raw.notes),
  }));
}

export interface RecommendedInvestorRow {
  recommendation_id:string; client_id:string; fund_id:string;
  score?:number; reason?:string; status?:string;
}
// 06_Recommended_Investors: recommendation_id, fund_id, client_id,
//   match_score, recommended_ticket_sar, qualification_status, status
export async function getRecommendedInvestors(): Promise<FetchResult<RecommendedInvestorRow>> {
  return fetchCsv<RecommendedInvestorRow>(sheetsConfig.recommendedInvestors, [], (raw) => ({
    recommendation_id: parseRequiredString(raw.recommendation_id ?? raw.id),
    client_id:  parseRequiredString(raw.client_id),
    fund_id:    parseRequiredString(raw.fund_id),
    score:      typeof raw.match_score === 'number' ? raw.match_score : parseNumber(raw.match_score ?? raw.score),
    reason:     parseString(raw.recommendation_reason ?? raw.reason),
    status:     parseString(raw.status),
  }));
}

export interface ReportsLogRow {
  report_id:string; client_id?:string; fund_id?:string;
  report_type:string; title?:string; generated_at?:string;
  status?:string; audience?:string;
}
export async function getReportsLog(): Promise<FetchResult<ReportsLogRow>> {
  return fetchCsv<ReportsLogRow>(sheetsConfig.reportsLog, [], (raw) => ({
    report_id:   parseRequiredString(raw.report_id ?? raw.id),
    client_id:   parseString(raw.related_client_id ?? raw.client_id),
    fund_id:     parseString(raw.related_fund_id   ?? raw.fund_id),
    report_type: parseString(raw.report_type) ?? '',
    title:       parseString(raw.report_title ?? raw.title),
    generated_at:parseDate(raw.generated_at),
    status:      parseString(raw.status),
    audience:    parseString(raw.recipient_channel ?? raw.audience),
  }));
}

export interface FundUpdateRow {
  update_id:string; fund_id:string; update_type:string;
  content?:string; date?:string; author?:string;
}
// 08_Fund_Updates: update_id, fund_id, update_type, milestone, summary, update_date
export async function getFundUpdates(): Promise<FetchResult<FundUpdateRow>> {
  return fetchCsv<FundUpdateRow>(sheetsConfig.fundUpdates, [], (raw) => ({
    update_id:  parseRequiredString(raw.update_id ?? raw.id),
    fund_id:    parseRequiredString(raw.fund_id),
    update_type:parseString(raw.update_type) ?? '',
    content:    parseString(raw.summary ?? raw.client_message ?? raw.content),
    date:       parseDate(raw.update_date ?? raw.date),
    author:     parseString(raw.owner_name ?? raw.author),
  }));
}

export interface MeetingMinutesRow {
  minutes_id:string; visit_id:string; client_id:string;
  fund_id?:string; content?:string; status?:string; sent_at?:string;
}
// 11_Meeting_Minutes: minutes_id, visit_id, client_id, fund_id,
//   minutes_status, summary_for_client, sent_at
export async function getMeetingMinutes(): Promise<FetchResult<MeetingMinutesRow>> {
  return fetchCsv<MeetingMinutesRow>(sheetsConfig.meetingMinutes, [], (raw) => ({
    minutes_id: parseRequiredString(raw.minutes_id ?? raw.id),
    visit_id:   parseRequiredString(raw.visit_id),
    client_id:  parseRequiredString(raw.client_id),
    fund_id:    parseString(raw.fund_id),
    content:    parseString(raw.summary_for_client ?? raw.content),
    status:     parseString(raw.minutes_status ?? raw.status),
    sent_at:    parseDate(raw.sent_at),
  }));
}

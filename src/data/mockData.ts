/**
 * Mock Data — بيانات تجريبية للتطوير
 * --------------------------------------------------------------
 * ⚠️  هذه ليست بيانات وثيق الفعلية.
 * تُستخدم فقط عندما تكون روابط CSV لم تربط بعد في sheetsConfig.ts.
 * بمجرد لصق رابط CSV حقيقي، النظام يتجاوز هذه البيانات تلقائياً.
 *
 * الأرقام مصممة لتكون متوافقة منطقياً (مجموع holdings = AUM، مجموع pipeline منطقي…)
 * لكن أسماء العملاء وهمية وفقاً لملاحظة README:
 *   "أسماء العملاء والآفاق الاستثمارية المستخدمة في الملف عينات للتجربة فقط"
 */

import type {
  Client,
  Fund,
  Holding,
  Employee,
  PipelineItem,
  Visit,
  ReportLog,
  Target,
  BillionPlanRow,
  FinancialPeriod,
  DashboardSnapshot,
  SourceRecord,
  LookupRecord,
} from '@/types';

// ============================================================
// Employees (٨ موظفين عينة)
// ============================================================
export const mockEmployees: Employee[] = [
  { employee_id: 'EMP-001', name_ar: 'عبدالرحمن الفنتوخ', role: 'مدير التواصل المؤسسي وتطوير الأعمال', department: 'Business Development', is_active: true },
  { employee_id: 'EMP-002', name_ar: 'سلطان العوهلي', role: 'مدير علاقات استثمارية كبير', department: 'Investor Relations', is_active: true },
  { employee_id: 'EMP-003', name_ar: 'فهد الحربي', role: 'مدير علاقات استثمارية', department: 'Investor Relations', is_active: true },
  { employee_id: 'EMP-004', name_ar: 'نورة العبدالكريم', role: 'مدير تطوير أعمال', department: 'Business Development', is_active: true },
  { employee_id: 'EMP-005', name_ar: 'محمد القحطاني', role: 'مدير صندوق', department: 'Fund Management', is_active: true },
  { employee_id: 'EMP-006', name_ar: 'ريم الدوسري', role: 'محلل علاقات استثمارية', department: 'Investor Relations', is_active: true },
  { employee_id: 'EMP-007', name_ar: 'بدر السبيعي', role: 'محلل تطوير أعمال', department: 'Business Development', is_active: true },
  { employee_id: 'EMP-008', name_ar: 'لطيفة الشمري', role: 'مدير صندوق', department: 'Fund Management', is_active: true },
];

// ============================================================
// Funds (٧ صناديق عينة)
// ============================================================
export const mockFunds: Fund[] = [
  {
    fund_id: 'FND-001', name_ar: 'صندوق وثيق العقاري السكني I', asset_class: 'Real Estate',
    stage: 'Managed', status: 'Active', priority: 'High', fund_manager_id: 'EMP-005',
    target_size: 250_000_000, committed_amount: 240_000_000, remaining_amount: 10_000_000,
    expected_return_pct: 0.14, duration_years: 5, investors_count: 38, fundraising_progress_pct: 0.96,
  },
  {
    fund_id: 'FND-002', name_ar: 'صندوق وثيق التطوير العقاري II', asset_class: 'Real Estate',
    stage: 'Fundraising', status: 'Active', priority: 'High', fund_manager_id: 'EMP-005',
    target_size: 350_000_000, committed_amount: 198_000_000, remaining_amount: 152_000_000,
    expected_return_pct: 0.16, duration_years: 6, investors_count: 22, fundraising_progress_pct: 0.566,
    fund_close_date: '2026-08-31',
  },
  {
    fund_id: 'FND-003', name_ar: 'صندوق وثيق للاستثمار الجريء', asset_class: 'Venture Capital',
    stage: 'Fundraising', status: 'Active', priority: 'High', fund_manager_id: 'EMP-008',
    target_size: 150_000_000, committed_amount: 67_500_000, remaining_amount: 82_500_000,
    expected_return_pct: 0.22, duration_years: 7, investors_count: 14, fundraising_progress_pct: 0.45,
    fund_close_date: '2026-09-30',
  },
  {
    fund_id: 'FND-004', name_ar: 'صندوق وثيق للملكية الخاصة', asset_class: 'Private Equity',
    stage: 'Managed', status: 'Active', priority: 'Medium', fund_manager_id: 'EMP-008',
    target_size: 200_000_000, committed_amount: 200_000_000, remaining_amount: 0,
    expected_return_pct: 0.18, duration_years: 6, investors_count: 19, fundraising_progress_pct: 1.0,
  },
  {
    fund_id: 'FND-005', name_ar: 'صندوق وثيق المرابحة', asset_class: 'Money Market',
    stage: 'Managed', status: 'Active', priority: 'Medium', fund_manager_id: 'EMP-005',
    target_size: 120_000_000, committed_amount: 105_000_000, remaining_amount: 15_000_000,
    expected_return_pct: 0.065, duration_years: 1, investors_count: 47, fundraising_progress_pct: 0.875,
  },
  {
    fund_id: 'FND-006', name_ar: 'صندوق وثيق الصكوك', asset_class: 'Sukuk',
    stage: 'Approvals', status: 'Active', priority: 'High', fund_manager_id: 'EMP-008',
    target_size: 180_000_000, committed_amount: 0, remaining_amount: 180_000_000,
    expected_return_pct: 0.085, duration_years: 5, investors_count: 0, fundraising_progress_pct: 0,
  },
  {
    fund_id: 'FND-007', name_ar: 'صندوق وثيق المتعدد الأصول', asset_class: 'Mixed',
    stage: 'Structuring', status: 'Active', priority: 'Low', fund_manager_id: 'EMP-005',
    target_size: 100_000_000, committed_amount: 0, remaining_amount: 100_000_000,
    expected_return_pct: 0.12, duration_years: 4, investors_count: 0, fundraising_progress_pct: 0,
  },
];

// ============================================================
// Clients (١٢ عميل عينة)
// ============================================================
export const mockClients: Client[] = [
  { client_id: 'CL-001', name_ar: 'مكتب عائلة الـ ع', classification: 'Family Office', status: 'existing', city: 'الرياض', risk_profile: 'Balanced', preferred_asset_class: 'Real Estate', total_invested: 45_000_000, total_profit: 6_300_000, relationship_owner_id: 'EMP-002', last_contact_date: '2026-04-28', last_visit_date: '2026-04-15', last_report_date: '2026-04-30', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 25_000_000 },
  { client_id: 'CL-002', name_ar: 'صندوق التقاعد الخاص أ', classification: 'Institution', status: 'existing', city: 'الرياض', risk_profile: 'Conservative', preferred_asset_class: 'Sukuk', total_invested: 80_000_000, total_profit: 5_600_000, relationship_owner_id: 'EMP-003', last_contact_date: '2026-05-01', last_visit_date: '2026-04-20', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 50_000_000 },
  { client_id: 'CL-003', name_ar: 'مستثمر عالي الملاءة - الرياض', classification: 'UHNW', status: 'existing', city: 'الرياض', risk_profile: 'Growth', preferred_asset_class: 'Private Equity', total_invested: 25_000_000, total_profit: 4_500_000, relationship_owner_id: 'EMP-002', last_contact_date: '2026-05-04', is_ceo_attention: true, qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 25_000_000 },
  { client_id: 'CL-004', name_ar: 'شركة استثمارية - جدة', classification: 'Institution', status: 'prospect', city: 'جدة', risk_profile: 'Balanced', preferred_asset_class: 'Real Estate', relationship_owner_id: 'EMP-004', last_contact_date: '2026-05-02', is_ceo_attention: true, qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 10_000_000 },
  { client_id: 'CL-005', name_ar: 'مكتب عائلة الـ س', classification: 'Family Office', status: 'existing', city: 'الرياض', risk_profile: 'Growth', preferred_asset_class: 'Mixed', total_invested: 30_000_000, total_profit: 3_900_000, relationship_owner_id: 'EMP-002', last_contact_date: '2026-04-25', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 15_000_000 },
  { client_id: 'CL-006', name_ar: 'مستثمر عالي الملاءة - الدمام', classification: 'HNW', status: 'existing', city: 'الدمام', risk_profile: 'Balanced', preferred_asset_class: 'Real Estate', total_invested: 12_000_000, total_profit: 1_440_000, relationship_owner_id: 'EMP-003', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 5_000_000 },
  { client_id: 'CL-007', name_ar: 'صندوق وقفي', classification: 'Institution', status: 'sensitive', city: 'الرياض', risk_profile: 'Conservative', preferred_asset_class: 'Sukuk', total_invested: 50_000_000, total_profit: 3_500_000, relationship_owner_id: 'EMP-002', last_contact_date: '2026-04-29', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 30_000_000 },
  { client_id: 'CL-008', name_ar: 'مستثمر مؤسسي - الخبر', classification: 'Institution', status: 'prospect', city: 'الخبر', risk_profile: 'Balanced', preferred_asset_class: 'Private Equity', relationship_owner_id: 'EMP-004', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 10_000_000 },
  { client_id: 'CL-009', name_ar: 'مستثمر فردي - الرياض', classification: 'HNW', status: 'existing', city: 'الرياض', risk_profile: 'Growth', preferred_asset_class: 'Venture Capital', total_invested: 8_500_000, total_profit: 1_870_000, relationship_owner_id: 'EMP-006', qualificationStatus: 'غير مؤهل', qualificationLimit: 200_000, investmentCapacity: 200_000 },
  { client_id: 'CL-010', name_ar: 'مكتب عائلي - جدة', classification: 'Family Office', status: 'prospect', city: 'جدة', risk_profile: 'Balanced', preferred_asset_class: 'Mixed', relationship_owner_id: 'EMP-007', is_ceo_attention: true, qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 5_000_000 },
  { client_id: 'CL-011', name_ar: 'مستثمر مؤسسي - الرياض', classification: 'Institution', status: 'existing', city: 'الرياض', risk_profile: 'Conservative', preferred_asset_class: 'Money Market', total_invested: 35_000_000, total_profit: 2_275_000, relationship_owner_id: 'EMP-003', qualificationStatus: 'مؤهل', qualificationLimit: null, investmentCapacity: 20_000_000 },
  { client_id: 'CL-012', name_ar: 'مستثمر فردي - الدمام', classification: 'UHNW', status: 'prospect', city: 'الدمام', risk_profile: 'Growth', preferred_asset_class: 'Real Estate', relationship_owner_id: 'EMP-002', qualificationStatus: 'غير مؤهل', qualificationLimit: 200_000, investmentCapacity: 200_000 },
];

// ============================================================
// Holdings (تطابق منطقي مع total_invested)
// ============================================================
export const mockHoldings: Holding[] = [
  { client_id: 'CL-001', fund_id: 'FND-001', invested_amount: 25_000_000, current_value: 28_500_000, realized_profit: 3_500_000 },
  { client_id: 'CL-001', fund_id: 'FND-004', invested_amount: 20_000_000, current_value: 22_800_000, realized_profit: 2_800_000 },
  { client_id: 'CL-002', fund_id: 'FND-005', invested_amount: 50_000_000, current_value: 53_250_000, realized_profit: 3_250_000 },
  { client_id: 'CL-002', fund_id: 'FND-001', invested_amount: 30_000_000, current_value: 32_350_000, realized_profit: 2_350_000 },
  { client_id: 'CL-003', fund_id: 'FND-004', invested_amount: 25_000_000, current_value: 29_500_000, realized_profit: 4_500_000 },
  { client_id: 'CL-005', fund_id: 'FND-002', invested_amount: 15_000_000, current_value: 16_950_000, realized_profit: 1_950_000 },
  { client_id: 'CL-005', fund_id: 'FND-005', invested_amount: 15_000_000, current_value: 16_950_000, realized_profit: 1_950_000 },
  { client_id: 'CL-006', fund_id: 'FND-001', invested_amount: 12_000_000, current_value: 13_440_000, realized_profit: 1_440_000 },
  { client_id: 'CL-007', fund_id: 'FND-005', invested_amount: 25_000_000, current_value: 26_625_000, realized_profit: 1_625_000 },
  { client_id: 'CL-007', fund_id: 'FND-001', invested_amount: 25_000_000, current_value: 26_875_000, realized_profit: 1_875_000 },
  { client_id: 'CL-009', fund_id: 'FND-003', invested_amount: 8_500_000, current_value: 10_370_000, realized_profit: 1_870_000 },
  { client_id: 'CL-011', fund_id: 'FND-005', invested_amount: 35_000_000, current_value: 37_275_000, realized_profit: 2_275_000 },
];

// ============================================================
// Pipeline (١٢ فرصة عينة عبر المراحل)
// ============================================================
export const mockPipeline: PipelineItem[] = [
  { opportunity_id: 'OPP-001', client_id: 'CL-004', fund_id: 'FND-002', stage: 'Proposal',  expected_amount: 25_000_000, probability: 0.65, weighted_amount: 16_250_000, owner_id: 'EMP-004', next_step: 'إرسال العرض المعدّل',       expected_close_date: '2026-06-15', ceo_attention_flag: true,  interestStatus: 'مهتم جدًا',    accountManager: 'نورة العبدالكريم', brokerName: 'CEO — محمد الرشيد' },
  { opportunity_id: 'OPP-002', client_id: 'CL-008', fund_id: 'FND-003', stage: 'Meeting',   expected_amount: 18_000_000, probability: 0.40, weighted_amount:  7_200_000, owner_id: 'EMP-004', next_step: 'اجتماع لجنة الاستثمار',      expected_close_date: '2026-07-10', ceo_attention_flag: false, interestStatus: 'مهتم',         accountManager: 'نورة العبدالكريم' },
  { opportunity_id: 'OPP-003', client_id: 'CL-010', fund_id: 'FND-002', stage: 'Committed', expected_amount: 35_000_000, probability: 0.85, weighted_amount: 29_750_000, owner_id: 'EMP-007', next_step: 'توقيع وثيقة الالتزام',         expected_close_date: '2026-05-25', ceo_attention_flag: true,  interestStatus: 'مهتم جدًا',    accountManager: 'بدر السبيعي', brokerName: 'بدر السبيعي' },
  { opportunity_id: 'OPP-004', client_id: 'CL-012', fund_id: 'FND-001', stage: 'Lead',      expected_amount: 15_000_000, probability: 0.15, weighted_amount:  2_250_000, owner_id: 'EMP-002', next_step: 'تواصل أولي',                   expected_close_date: '2026-08-30', ceo_attention_flag: false, interestStatus: 'اهتمام متوسط', accountManager: 'سلطان العوهلي' },
  { opportunity_id: 'OPP-005', client_id: 'CL-003', fund_id: 'FND-003', stage: 'Proposal',  expected_amount: 12_000_000, probability: 0.55, weighted_amount:  6_600_000, owner_id: 'EMP-002', next_step: 'مراجعة الشروط',               expected_close_date: '2026-06-20', ceo_attention_flag: false, interestStatus: 'مهتم',         accountManager: 'سلطان العوهلي', brokerName: 'فهد الحربي' },
  { opportunity_id: 'OPP-006', client_id: 'CL-001', fund_id: 'FND-002', stage: 'Contacted', expected_amount: 20_000_000, probability: 0.30, weighted_amount:  6_000_000, owner_id: 'EMP-002', next_step: 'تنسيق اجتماع',                expected_close_date: '2026-07-05', ceo_attention_flag: false, interestStatus: 'مهتم',         accountManager: 'سلطان العوهلي' },
  { opportunity_id: 'OPP-007', client_id: 'CL-002', fund_id: 'FND-006', stage: 'Meeting',   expected_amount: 30_000_000, probability: 0.45, weighted_amount: 13_500_000, owner_id: 'EMP-003', next_step: 'تقديم العرض الفني',            expected_close_date: '2026-07-15', ceo_attention_flag: false, interestStatus: 'مهتم',         accountManager: 'فهد الحربي' },
  { opportunity_id: 'OPP-008', client_id: 'CL-005', fund_id: 'FND-003', stage: 'Lead',      expected_amount: 10_000_000, probability: 0.20, weighted_amount:  2_000_000, owner_id: 'EMP-002',                                           expected_close_date: '2026-09-01', ceo_attention_flag: false, interestStatus: 'اهتمام متوسط', accountManager: 'سلطان العوهلي' },
  { opportunity_id: 'OPP-009', client_id: 'CL-009', fund_id: 'FND-002', stage: 'Closed',    expected_amount:  5_000_000, probability: 1.00, weighted_amount:  5_000_000, owner_id: 'EMP-006', next_step: '—',                            expected_close_date: '2026-04-28', ceo_attention_flag: false, interestStatus: 'تم التحويل',   accountManager: 'ريم الدوسري' },
  { opportunity_id: 'OPP-010', client_id: 'CL-011', fund_id: 'FND-006', stage: 'Contacted', expected_amount: 22_000_000, probability: 0.35, weighted_amount:  7_700_000, owner_id: 'EMP-003', next_step: 'إرسال ملخص الفرصة',           expected_close_date: '2026-08-15', ceo_attention_flag: false, interestStatus: 'مهتم',         accountManager: 'فهد الحربي' },
  { opportunity_id: 'OPP-011', client_id: 'CL-006', fund_id: 'FND-002', stage: 'Proposal',  expected_amount:  8_000_000, probability: 0.60, weighted_amount:  4_800_000, owner_id: 'EMP-003', next_step: 'الرد على ملاحظات الشروط',     expected_close_date: '2026-06-10', ceo_attention_flag: false, interestStatus: 'مهتم جدًا',    accountManager: 'فهد الحربي' },
  { opportunity_id: 'OPP-012', client_id: 'CL-007', fund_id: 'FND-006', stage: 'Lost',      expected_amount: 15_000_000, probability: 0,    weighted_amount:  0,         owner_id: 'EMP-002',                                           expected_close_date: '2026-04-15', ceo_attention_flag: false, interestStatus: 'غير مهتم',     accountManager: 'سلطان العوهلي', notes: 'اختار منافس' },
];

// ============================================================
// Visits (الأسبوع الحالي)
// ============================================================
export const mockVisits: Visit[] = [
  { visit_id: 'VST-001', visit_date: '2026-05-06', week_number: 19, client_id: 'CL-003', is_new_client: false, employee_id: 'EMP-002', fund_id: 'FND-003', city: 'الرياض', purpose: 'عرض فرصة استثمارية جديدة', expected_amount: 12_000_000, prep_required: true, report_required: true, status: 'Planned' },
  { visit_id: 'VST-002', visit_date: '2026-05-06', week_number: 19, client_id: 'CL-004', is_new_client: true, employee_id: 'EMP-004', fund_id: 'FND-002', city: 'جدة', purpose: 'تعارف وعرض الشركة', expected_amount: 25_000_000, prep_required: true, status: 'Planned' },
  { visit_id: 'VST-003', visit_date: '2026-05-07', week_number: 19, client_id: 'CL-010', is_new_client: true, employee_id: 'EMP-007', fund_id: 'FND-002', city: 'جدة', purpose: 'متابعة الالتزام المبدئي', expected_amount: 35_000_000, prep_required: true, report_required: true, management_note: 'يحتاج حضور المدير', status: 'Planned' },
  { visit_id: 'VST-004', visit_date: '2026-05-08', week_number: 19, client_id: 'CL-002', is_new_client: false, employee_id: 'EMP-003', city: 'الرياض', purpose: 'مراجعة أداء ربعية', report_required: true, status: 'Planned' },
  { visit_id: 'VST-005', visit_date: '2026-05-08', week_number: 19, client_id: 'CL-001', is_new_client: false, employee_id: 'EMP-002', fund_id: 'FND-002', city: 'الرياض', purpose: 'عرض صندوق التطوير', expected_amount: 20_000_000, status: 'Planned' },
  { visit_id: 'VST-006', visit_date: '2026-05-09', week_number: 19, client_id: 'CL-008', is_new_client: true, employee_id: 'EMP-004', fund_id: 'FND-003', city: 'الخبر', purpose: 'تعارف', expected_amount: 18_000_000, prep_required: true, status: 'Planned' },
];

// ============================================================
// Reports (آخر التقارير)
// ============================================================
export const mockReports: ReportLog[] = [
  { report_id: 'RPT-001', client_id: 'CL-001', fund_id: 'FND-001', report_type: 'Quarterly', report_date: '2026-04-30', channel: 'Email', delivery_status: 'Opened', sent_by_id: 'EMP-002' },
  { report_id: 'RPT-002', client_id: 'CL-002', fund_id: 'FND-005', report_type: 'Monthly', report_date: '2026-04-28', channel: 'Portal', delivery_status: 'Delivered', sent_by_id: 'EMP-003' },
  { report_id: 'RPT-003', client_id: 'CL-007', fund_id: 'FND-005', report_type: 'Quarterly', report_date: '2026-04-30', channel: 'Email', delivery_status: 'Sent', follow_up_required: true, sent_by_id: 'EMP-002' },
  { report_id: 'RPT-004', client_id: 'CL-003', fund_id: 'FND-004', report_type: 'Performance', report_date: '2026-05-02', channel: 'In-person', delivery_status: 'Delivered', sent_by_id: 'EMP-002' },
  { report_id: 'RPT-005', client_id: 'CL-005', fund_id: 'FND-002', report_type: 'Ad-hoc', report_date: '2026-05-01', channel: 'WhatsApp', delivery_status: 'Opened', sent_by_id: 'EMP-002' },
];

// ============================================================
// Targets (الشهر الحالي)
// ============================================================
export const mockTargets: Target[] = [
  { target_id: 'TGT-001', period_type: 'Monthly', period: '2026-05', metric: 'Sales', target_value: 50_000_000, achieved_value: 32_500_000, achievement_pct: 0.65 },
  { target_id: 'TGT-002', period_type: 'Monthly', period: '2026-05', metric: 'Visits', target_value: 30, achieved_value: 18, achievement_pct: 0.6 },
  { target_id: 'TGT-003', period_type: 'Monthly', period: '2026-05', metric: 'NewClients', target_value: 5, achieved_value: 2, achievement_pct: 0.4 },
  { target_id: 'TGT-004', period_type: 'Yearly', period: '2026', metric: 'AUM', target_value: 1_200_000_000, achieved_value: 810_500_000, achievement_pct: 0.675 },
];

// ============================================================
// Billion Plan (٢٠٢٦-٢٠٢٩)
// ============================================================
export const mockBillionPlan: BillionPlanRow[] = [
  { year: 2026, target_aum: 850_000_000, actual_aum: 810_500_000, target_revenue: 28_000_000, actual_revenue: 22_400_000, target_net_profit: 12_000_000, actual_net_profit: 9_800_000, achievement_pct: 0.95, gap: 39_500_000, strategic_notes: 'تركيز على إقفال الصندوق العقاري II وإطلاق صندوق الصكوك' },
  { year: 2027, target_aum: 1_000_000_000, target_revenue: 38_000_000, target_net_profit: 17_000_000, strategic_notes: 'أول مرة يتجاوز AUM حاجز المليار' },
  { year: 2028, target_aum: 1_400_000_000, target_revenue: 52_000_000, target_net_profit: 25_000_000, strategic_notes: 'توسيع المحفظة لتشمل صناديق دولية' },
  { year: 2029, target_aum: 1_800_000_000, target_revenue: 70_000_000, target_net_profit: 36_000_000, strategic_notes: 'استعداد للطرح أو شراكة استراتيجية' },
];

// ============================================================
// Financials (السنوات الأخيرة)
// ============================================================
export const mockFinancials: FinancialPeriod[] = [
  { period: '2022', period_type: 'Yearly', revenue: 12_500_000, gross_profit: 7_800_000, net_profit: 4_200_000, total_assets: 320_000_000, total_liabilities: 95_000_000, equity: 225_000_000, aum: 480_000_000, yoy_growth_pct: 0.15 },
  { period: '2023', period_type: 'Yearly', revenue: 15_800_000, gross_profit: 9_900_000, net_profit: 5_600_000, total_assets: 380_000_000, total_liabilities: 110_000_000, equity: 270_000_000, aum: 580_000_000, yoy_growth_pct: 0.264 },
  { period: '2024', period_type: 'Yearly', revenue: 19_400_000, gross_profit: 12_500_000, net_profit: 7_300_000, total_assets: 445_000_000, total_liabilities: 125_000_000, equity: 320_000_000, aum: 695_000_000, yoy_growth_pct: 0.228 },
  { period: '2025', period_type: 'Yearly', revenue: 24_800_000, gross_profit: 16_200_000, net_profit: 9_400_000, total_assets: 510_000_000, total_liabilities: 140_000_000, equity: 370_000_000, aum: 780_000_000, yoy_growth_pct: 0.278 },
];

// ============================================================
// Dashboard Snapshot (مرآة محسوبة)
// ============================================================
export const mockDashboard: DashboardSnapshot = {
  generated_at: '2026-05-06',
  total_aum: 810_500_000,
  revenue_ytd: 9_650_000,
  net_profit_ytd: 3_700_000,
  active_funds_count: 5,
  active_clients_count: 8,
  prospects_count: 4,
  pipeline_total: 215_000_000,
  pipeline_weighted: 101_050_000,
  monthly_target: 50_000_000,
  monthly_achieved: 32_500_000,
  achievement_pct: 0.65,
  billion_progress_pct: 0.8105,
  upcoming_visits_count: 6,
  ceo_attention_count: 3,
};

// ============================================================
// Sources & Lookups (meta)
// ============================================================
export const mockSources: SourceRecord[] = [
  { source_id: 'SRC-001', table_name: 'Clients', source_type: 'Sheet', last_refreshed_at: '2026-05-06T08:00:00', row_count: 12, notes: 'بيانات تجريبية - mock' },
  { source_id: 'SRC-002', table_name: 'Funds', source_type: 'Sheet', last_refreshed_at: '2026-05-06T08:00:00', row_count: 7 },
  { source_id: 'SRC-003', table_name: 'Pipeline', source_type: 'Sheet', last_refreshed_at: '2026-05-06T08:00:00', row_count: 12 },
];

export const mockLookups: LookupRecord[] = [];

/**
 * تسميات عربية مركزية
 * --------------------------------------------------------------
 * كل قيمة Enum في الـ schema لها تسمية عربية هنا.
 * يضمن توحيد المصطلحات عبر كل الصفحات.
 */

import type {
  ClientStatus,
  ClientClassification,
  RiskProfile,
  AssetClass,
  FundStage,
  PipelineStage,
  ReportType,
  ReportChannel,
  DeliveryStatus,
} from '@/types';

export const clientStatusLabels: Record<ClientStatus, string> = {
  existing: 'عميل قائم',
  prospect: 'عميل محتمل',
  sensitive: 'عميل حساس',
  churned: 'عميل مجمد',
  archived: 'عميل مؤرشف',
};

export const clientClassificationLabels: Record<ClientClassification, string> = {
  HNW: 'مستثمر عالي الملاءة',
  UHNW: 'مستثمر فائق الملاءة',
  'Family Office': 'مكتب عائلي',
  Institution: 'مؤسسة',
  Retail: 'فردي',
};

export const riskProfileLabels: Record<RiskProfile, string> = {
  Conservative: 'محافظ',
  Balanced: 'متوازن',
  Growth: 'نمو',
  Aggressive: 'مرتفع المخاطرة',
};

export const assetClassLabels: Record<AssetClass, string> = {
  'Real Estate': 'عقار',
  'Private Equity': 'ملكية خاصة',
  'Venture Capital': 'رأس مال جريء',
  'Public Equities': 'أسهم مدرجة',
  Sukuk: 'صكوك',
  'Money Market': 'أسواق نقد',
  Mixed: 'متعدد',
};

export const fundStageLabels: Record<FundStage, string> = {
  Idea: 'فكرة',
  Structuring: 'تحت الهيكلة',
  Approvals: 'تحت الموافقات',
  Fundraising: 'تحت الاستقطاب',
  Closed: 'إقفال',
  Managed: 'تحت الإدارة',
  Exited: 'تخارج',
};

export const pipelineStageLabels: Record<PipelineStage, string> = {
  Lead: 'عميل محتمل',
  Contacted: 'تم التواصل',
  Meeting: 'اجتماع',
  Proposal: 'عرض مقدم',
  Committed: 'التزام مبدئي',
  Closed: 'مغلق',
  Lost: 'خاسر',
};

export const reportTypeLabels: Record<ReportType, string> = {
  Monthly: 'تقرير شهري',
  Quarterly: 'تقرير ربعي',
  Annual: 'تقرير سنوي',
  'Ad-hoc': 'تقرير خاص',
  Performance: 'تقرير أداء',
};

export const reportChannelLabels: Record<ReportChannel, string> = {
  Email: 'بريد إلكتروني',
  WhatsApp: 'واتساب',
  Portal: 'بوابة العميل',
  'In-person': 'حضوري',
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  Sent: 'مُرسل',
  Delivered: 'وصل',
  Opened: 'مفتوح',
  Pending: 'قيد الإرسال',
  Failed: 'فشل التسليم',
};

/**
 * تسميات صفحات اللوحة
 */
export const pageLabels = {
  overview: 'لوحة القيادة',
  clients: 'العملاء',
  funds: 'الصناديق',
  pipeline: 'بايبلاين النمو',
  visits: 'مركز الزيارات والمتابعة',
  team: 'أداء الفريق',
  billion: 'خطة المليار',
  reports: 'مركز التقارير',
  financials: 'المؤشرات المالية',
  dataQuality: 'جودة البيانات',
} as const;

/**
 * تسميات الـ KPIs المعرّفة في صفحة Executive Overview
 */
export const kpiLabels = {
  totalAUM: 'الأصول تحت الإدارة',
  revenue: 'الإيرادات',
  netProfit: 'صافي الربح',
  activeFunds: 'الصناديق النشطة',
  activeClients: 'العملاء والفرص',
  pipeline: 'البايبلاين الحالي',
  weightedPipeline: 'البايبلاين المرجح',
  monthlyTarget: 'مستهدف الشهر',
  achievement: 'نسبة الإنجاز',
  billionProgress: 'تقدم خطة المليار',
  upcomingVisits: 'زيارات الأسبوع',
  ceoAttention: 'فرص تحتاج تدخل الإدارة',
} as const;

/**
 * نصوص واجهة عامة
 */
export const uiLabels = {
  refresh: 'تحديث البيانات',
  lastUpdated: 'آخر تحديث',
  loading: 'جاري التحميل…',
  error: 'تعذر تحميل البيانات',
  empty: 'لا توجد بيانات',
  retry: 'إعادة المحاولة',
  search: 'بحث',
  filter: 'فلترة',
  filters: 'الفلاتر',
  clearFilters: 'مسح الفلاتر',
  print: 'طباعة',
  export: 'تصدير',
  viewAll: 'عرض الكل',
  details: 'التفاصيل',
  close: 'إغلاق',
  fallbackData: 'بيانات تجريبية',
  liveData: 'بيانات مباشرة',
  notConnected: 'غير مربوط',
} as const;

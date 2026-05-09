/**
 * normalizers.ts — Phase 4.3 Final
 * Source of truth: Watheeq_Data_Source_Templates sheets
 *
 * All values taken directly from sheet samples.
 */

import type {
  ClientClassification, ClientStatus, RiskProfile,
  AssetClass, FundStage, PipelineStage, OpportunityInterestStatus,
} from '@/types';
import type { VisitRecord } from '@/types/visits';

type VisitTypeDef   = VisitRecord['visit_type'];
type VisitStatusDef = VisitRecord['status'];

// ─── Helper ───────────────────────────────────────────────────────
const v = (raw?: unknown): string =>
  String(raw ?? '').trim().replace(/\u200b|\u200c|\u00a0/g, '').toLowerCase();

// ─── 1. ClientClassification ──────────────────────────────────────
// Sheet values: client_type = فرد/فردي/شركة/مؤسسة/مكتب عائلي
//               classification = Corporate/Family Office/HNWI/Individual/Institutional
export function normalizeClientClassification(raw?: unknown): ClientClassification {
  const s = v(raw);
  if (!s) return 'HNW';
  if (/family.?office|مكتب.?عائل/i.test(s))                                          return 'Family Office';
  if (/institutional|institution|مؤسس|صندوق.?تقاعد|صندوق.?وقف|وقف|pension|endow/i.test(s)) return 'Institution';
  if (/^corporate|شركة|company/i.test(s))                                             return 'Institution';
  if (/^uhnw|ultra/i.test(s))                                                         return 'UHNW';
  if (/^hnwi$|^hnw$/i.test(s))                                                        return 'HNW';
  if (/retail|فردي|^فرد$|individual/i.test(s))                                        return 'Retail';
  if (/high.?net|عالي.?الملاءة/i.test(s))                                             return 'HNW';
  return 'HNW';
}

// ─── 2. ClientStatus ──────────────────────────────────────────────
// Sheet values: نشط / قيد المتابعة / مجمد / مؤرشف
// Internally: churned represents مجمد (frozen). منقطع kept for legacy data.
export function normalizeClientStatus(raw?: unknown): ClientStatus {
  const s = v(raw);
  if (/نشط|existing|active|^active$/i.test(s))                  return 'existing';
  if (/sensitive|حساس/i.test(s))                                 return 'sensitive';
  if (/مؤرشف|archived|archive/i.test(s))                         return 'archived';
  if (/مجمد|frozen|churned|منقطع|inactive/i.test(s))             return 'churned';
  if (/قيد.?المتابعة|محتمل|prospect|lead/i.test(s))              return 'prospect';
  return 'prospect'; // empty / unknown
}

// ─── 3. RiskProfile ───────────────────────────────────────────────
// Sheet values: متوسط / محافظ / منخفض / نمو
// منخفض = LOW risk = Conservative; نمو = GROWTH risk
export function normalizeRiskProfile(raw?: unknown): RiskProfile | undefined {
  const s = v(raw);
  if (!s) return undefined;
  if (/محافظ|conservative|منخفض|low.?risk/i.test(s))   return 'Conservative';
  if (/متوسط|balanced|moderate|medium/i.test(s))        return 'Balanced';
  if (/نمو|growth/i.test(s))                             return 'Growth';
  if (/مرتفع|aggressive|high.?risk|عدواني/i.test(s))    return 'Aggressive';
  return undefined;
}

// ─── 4. AssetClass ────────────────────────────────────────────────
// Sheet values: عقاري / صكوك / ملكية خاصة / رأس مال جريء / متعدد
export function normalizeAssetClass(raw?: unknown): AssetClass | undefined {
  const s = v(raw);
  if (!s) return undefined;
  if (/عقار/i.test(s))                             return 'Real Estate';
  if (/private.?equity|ملكية.?خاص/i.test(s))       return 'Private Equity';
  if (/venture|رأس.?مال.?جريء|مغامر/i.test(s))    return 'Venture Capital';
  if (/public.?equit|أسهم.?مدرج/i.test(s))         return 'Public Equities';
  if (/sukuk|صكوك/i.test(s))                        return 'Sukuk';
  if (/money.?market|أسواق.?نقد|نقدي/i.test(s))    return 'Money Market';
  if (/mixed|متعدد|diverse/i.test(s))               return 'Mixed';
  return undefined;
}

// ─── 5. FundStage ─────────────────────────────────────────────────
// Sheet: fundraising_stage = قيد الجمع / تحت الاستقطاب / إقفال
// status = قيد الجمع / تحت الإدارة
export function normalizeFundStage(raw?: unknown): FundStage {
  const s = v(raw);
  if (!s) return 'Idea';
  if (/قيد.?الجمع|تحت.?الاستقطاب|fundrais|subscription|تحت.?الجمع/i.test(s)) return 'Fundraising';
  if (/إقفال|closing|close/i.test(s))                                          return 'Fundraising'; // إقفال = final fundraising stage
  if (/تحت.?الإدارة|managed|under.?management/i.test(s))                       return 'Managed';
  if (/فكرة|idea/i.test(s))                                                    return 'Idea';
  if (/هيكل|structur/i.test(s))                                                return 'Structuring';
  if (/موافق|approv/i.test(s))                                                 return 'Approvals';
  if (/تخارج|exit/i.test(s))                                                   return 'Exited';
  if (/مغلق|^closed/i.test(s))                                                 return 'Closed';
  return 'Idea';
}

// ─── 6. FundPriority ──────────────────────────────────────────────
// Sheet values: عالية / متوسطة / منخفضة
export function normalizeFundPriority(raw?: unknown): 'High' | 'Medium' | 'Low' | undefined {
  const s = v(raw);
  if (/عالية|high/i.test(s))    return 'High';
  if (/متوسطة|medium/i.test(s)) return 'Medium';
  if (/منخفضة|low/i.test(s))    return 'Low';
  return undefined;
}

// ─── 7. PipelineStage ─────────────────────────────────────────────
// Sheet values: تفاوض / تم التحويل / زيارة تمت / عرض مرسل
export function normalizePipelineStage(raw?: unknown): PipelineStage {
  const s = v(raw);
  if (!s) return 'Lead';
  if (/تم.?التحويل|converted|committed|تحويل/i.test(s))             return 'Committed';
  if (/تفاوض|negotiat/i.test(s))                                     return 'Committed';
  if (/زيارة.?تمت|meeting|اجتماع/i.test(s))                          return 'Meeting';
  if (/عرض.?مرسل|proposal|عرض/i.test(s))                             return 'Proposal';
  if (/contact|تواصل|reached/i.test(s))                              return 'Contacted';
  if (/^lost|خاسر|not.?interest|غير.?مهتم|closed.?lost|مغلقة/i.test(s)) return 'Lost';
  if (/^clos|won|مغلق/i.test(s))                                     return 'Closed';
  if (/lead|مناسب|محتمل/i.test(s))                                   return 'Lead';
  return 'Lead';
}

// ─── 8. OpportunityInterestStatus (Arabic labels) ─────────────────
// Sheet values: تم التحويل / مهتم جدًا / مهتم / اهتمام متوسط / غير مهتم
export function normalizeInterestStatus(raw?: unknown): OpportunityInterestStatus | undefined {
  const s = v(raw);
  if (!s) return undefined;
  if (/تم.?التحويل|converted/i.test(s))                              return 'تم التحويل';
  if (/مهتم.?جداً?|مهتم.?جدًا?|very.?interest|highly/i.test(s))    return 'مهتم جدًا';
  if (/اهتمام.?متوسط|medium.?interest/i.test(s))                    return 'اهتمام متوسط';
  if (/غير.?مهتم|not.?interest|uninterest/i.test(s))                return 'غير مهتم';
  if (/^مهتم$|^interested$/i.test(s))                                return 'مهتم';
  return undefined;
}

// ─── 9. QualificationStatus (Arabic labels) ───────────────────────
// Sheet values: مؤهل / غير مؤهل
export function normalizeQualificationStatus(raw?: unknown): 'مؤهل' | 'غير مؤهل' | undefined {
  const s = v(raw);
  if (!s) return undefined;
  if (/^مؤهل$|^qualified$|^yes$|^1$/i.test(s))         return 'مؤهل';
  if (/^غير.?مؤهل$|not.?qual|unqualified|^no$|^0$/i.test(s)) return 'غير مؤهل';
  if (/مؤهل/i.test(s))                                  return 'مؤهل';
  return undefined;
}

// ─── 10. VisitType ────────────────────────────────────────────────
// Sheet values: عرض صندوق / اجتماع تعريفي / متابعة استثمارية / زيارة مكتب / اتصال متابعة
export function normalizeVisitType(raw?: unknown): VisitTypeDef {
  const s = v(raw);
  if (!s) return 'intro';
  if (/عرض.?صندوق|fund.?pitch|pitch/i.test(s))          return 'fund_pitch';
  if (/تعريفي|intro|introduction/i.test(s))              return 'intro';
  if (/متابعة.?استثمارية|follow.?up|متابعة/i.test(s))   return 'followup';
  if (/اتصال|call|phone/i.test(s))                       return 'client_inquiry';
  if (/زيارة.?مكتب|office.?visit/i.test(s))             return 'followup';
  if (/inquiry|استفسار/i.test(s))                        return 'client_inquiry';
  if (/clos|sign|إغلاق|توقيع/i.test(s))                 return 'closing';
  if (/مشكلة|problem/i.test(s))                          return 'problem_resolution';
  if (/ما.?بعد|post.?invest/i.test(s))                   return 'post_investment';
  if (/تجديد|renew/i.test(s))                            return 'relationship_renewal';
  if (/non.?invest|غير.?استثمار/i.test(s))               return 'non_investment';
  return 'intro';
}

// ─── 11. VisitStatus ──────────────────────────────────────────────
// Sheet values: تمت / تحولت إلى فرصة / تحتاج متابعة / مجدولة
export function normalizeVisitStatus(raw?: unknown): VisitStatusDef {
  const s = v(raw);
  if (!s) return 'scheduled';
  if (/تمت|completed|done/i.test(s))                                  return 'completed';
  if (/تحولت.?إلى.?فرصة|converted/i.test(s))                         return 'converted';
  if (/تحتاج.?متابعة|needs.?follow/i.test(s))                        return 'needs_followup';
  if (/مجدولة|scheduled/i.test(s))                                    return 'scheduled';
  if (/مؤجلة|postponed/i.test(s))                                     return 'postponed';
  if (/ملغاة|cancelled/i.test(s))                                     return 'cancelled';
  if (/تدخل.?الإدارة|mgmt|management.?attention/i.test(s))            return 'needs_mgmt';
  if (/مغلقة.?بدون|closed.?no/i.test(s))                              return 'closed_no_opp';
  return 'scheduled';
}

/** Normalize Arabic interest level from visit sheet to internal code */
export function normalizeInterestLevel(raw?: unknown): 'low' | 'medium' | 'high' | 'very_high' {
  const s = String(raw ?? '').trim();
  if (!s) return 'medium';
  // Arabic values from sheet
  if (/مهتم.?جداً?|مهتم.?جدًا?|very.?interest|تم.?التحويل|converted/i.test(s)) return 'very_high';
  if (/^مهتم$|^interested$/i.test(s))                                            return 'high';
  if (/متوسط|medium/i.test(s))                                                   return 'medium';
  if (/غير.?مهتم|not.?interest/i.test(s))                                        return 'low';
  // Internal codes passthrough
  if (s === 'very_high') return 'very_high';
  if (s === 'high')      return 'high';
  if (s === 'low')       return 'low';
  return 'medium';
}

// Sheet formats: "200,000 ر.س" / "20,000,000 ر.س" / 0.16 (raw decimal) / 1.0
export function parseMoneyNumber(raw?: unknown): number {
  if (raw === undefined || raw === null || raw === '') return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  let s = String(raw).trim()
    .replace(/\u200b|\u200c|\u00a0/g, '')  // invisible chars
    .replace(/ر\.?س\.?|SR\b|SAR\b|sar\b/gi, '')
    .replace(/ريال/g, '')
    .trim();
  if (!s) return 0;
  // Handle shorthand: "1.5M", "1.5 مليون", "2B"
  const shortMatch = s.match(/^([\d,.]+)\s*([KkMmBb]|مليون|مليار|ألف)$/i);
  if (shortMatch) {
    const n = parseFloat(shortMatch[1].replace(/[،,]/g, ''));
    const m = shortMatch[2].toLowerCase();
    if (isNaN(n)) return 0;
    if (m === 'k' || m === 'ألف')   return n * 1_000;
    if (m === 'm' || m === 'مليون') return n * 1_000_000;
    if (m === 'b' || m === 'مليار') return n * 1_000_000_000;
    return n;
  }
  const cleaned = s.replace(/،/g, '').replace(/,/g, '').replace(/\s+/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

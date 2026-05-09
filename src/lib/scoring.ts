/**
 * محرك تقييم مطابقة المستثمر للصندوق — منطق قائم على قواعد (mock)
 * ليس AI حقيقي، يحاكي منطق علاقات المستثمرين.
 */

import type { Client, Fund } from '@/types';

export interface MatchScore {
  score: number; // 0-100
  reasons: string[];
  flags: string[];
  expectedTicket: number;
}

/** حساب مطابقة مستثمر لصندوق */
export function calcMatchScore(client: Client, fund: Fund): MatchScore {
  let score = 0;
  const reasons: string[] = [];
  const flags: string[] = [];

  // 1. تطابق فئة الأصول (25 نقطة)
  if (client.preferred_asset_class === fund.asset_class) {
    score += 25;
    reasons.push('فئة الأصول المفضلة تطابق الصندوق');
  } else if (fund.asset_class === 'Mixed') {
    score += 12;
    reasons.push('الصندوق متعدد الأصول');
  }

  // 2. ملاءة الحجم (20 نقطة)
  const invested = client.total_invested ?? 0;
  const minTicket = (fund.target_size ?? 0) * 0.01; // 1% من الحجم كحد أدنى للتذكرة
  if (invested >= 20_000_000) {
    score += 20;
    reasons.push('مستثمر ذو ملاءة عالية');
  } else if (invested >= 5_000_000) {
    score += 12;
    reasons.push('مستثمر ذو ملاءة مناسبة');
  } else if (invested > 0 && invested >= minTicket) {
    score += 6;
  }

  // 3. ملاءة المخاطرة مع الصندوق (20 نقطة)
  const riskFit: Record<string, string[]> = {
    Conservative: ['Money Market', 'Sukuk'],
    Balanced: ['Real Estate', 'Mixed', 'Sukuk', 'Public Equities'],
    Growth: ['Private Equity', 'Real Estate', 'Venture Capital', 'Mixed'],
    Aggressive: ['Venture Capital', 'Private Equity'],
  };
  const profile = client.risk_profile ?? 'Balanced';
  if (riskFit[profile]?.includes(fund.asset_class)) {
    score += 20;
    reasons.push(`ملف المخاطرة (${profile}) يتوافق مع الصندوق`);
  } else {
    score += 5;
  }

  // 4. حداثة آخر تواصل (15 نقطة)
  if (client.last_contact_date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(client.last_contact_date).getTime()) / 86_400_000
    );
    if (daysSince <= 14) { score += 15; reasons.push('تواصل حديث (أقل من أسبوعين)'); }
    else if (daysSince <= 30) { score += 10; reasons.push('تواصل خلال الشهر الماضي'); }
    else if (daysSince <= 90) { score += 5; }
    else { flags.push('آخر تواصل منذ أكثر من ٣ أشهر'); }
  }

  // 5. تصنيف العميل (10 نقطة)
  if (client.classification === 'UHNW') { score += 10; reasons.push('مستثمر فائق الملاءة'); }
  else if (client.classification === 'Family Office') { score += 10; reasons.push('مكتب عائلي'); }
  else if (client.classification === 'Institution') { score += 8; reasons.push('مستثمر مؤسسي'); }
  else if (client.classification === 'HNW') { score += 6; }

  // 6. مرحلة الصندوق (10 نقطة) — لا يجوز اقتراح صندوق مغلق
  if (fund.stage === 'Fundraising') { score += 10; reasons.push('الصندوق في مرحلة الاستقطاب'); }
  else if (fund.stage === 'Approvals') { score += 6; }
  else if (fund.stage === 'Closed' || fund.stage === 'Exited') {
    score = Math.max(0, score - 30);
    flags.push('الصندوق مغلق للاستثمار');
  }

  // Flags إضافية
  if (client.status === 'sensitive') flags.push('عميل حساس — يتطلب تعامل خاص');
  if (client.status === 'churned') flags.push('عميل مجمد');
  if (client.status === 'archived') flags.push('عميل مؤرشف');
  if (client.is_ceo_attention) flags.push('تحت رادار الإدارة');

  // العلاوة على العميل الحالي
  if (client.status === 'existing') { score += 5; reasons.push('عميل قائم وموثوق'); }

  // تقدير التذكرة المتوقعة
  const expectedTicket = calcExpectedTicket(client, fund);

  // تحديد النهائي
  score = Math.min(100, Math.max(0, score));

  return { score, reasons, flags, expectedTicket };
}

function calcExpectedTicket(client: Client, fund: Fund): number {
  const base = client.total_invested ?? 5_000_000;
  const targetSize = fund.target_size ?? 200_000_000;
  // توقع ٥-١٥% من إجمالي استثماراتهم في صندوق جديد
  const pct = client.classification === 'UHNW' ? 0.12 : client.classification === 'Family Office' ? 0.10 : 0.07;
  const fromHistory = base * pct;
  // لا يتجاوز ١٠% من حجم الصندوق
  const cap = targetSize * 0.10;
  return Math.min(fromHistory, cap);
}

/** أفضل مستثمرين لصندوق معين — مرتبين حسب النقاط */
export function getRecommendedInvestors(
  fund: Fund,
  clients: Client[],
  limit = 8
): Array<{ client: Client; match: MatchScore }> {
  return clients
    .filter((c) => c.status !== 'churned' && c.status !== 'archived')
    .map((client) => ({ client, match: calcMatchScore(client, fund) }))
    .filter(({ match }) => match.score >= 35)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}

/**
 * format.ts
 * أدوات تنسيق موحّدة للأرقام، العملة، التواريخ، النسب.
 *
 * نمط جديد لـ Phase 1.1:
 * كل دالة لها نسختان:
 *   - النسخة الأصلية: ترجع نص جاهز (للإستعمال البسيط في tooltips, props نصية)
 *   - "Parts": ترجع كائن { num, suffix } لرسم كل جزء بخط/وزن مختلف
 *     → الأرقام بخط Inter النظيف، اللواحق (ر.س, M, B, %) بحجم/وزن أخف
 */

const CURRENCY_SUFFIX = 'ر.س';

export interface FormattedParts {
  num: string;
  suffix?: string;
}

/* ============================================================
 * Currency
 * ============================================================ */

/** "1,250,000 ر.س" — للنصوص العادية وtooltips */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted} ${CURRENCY_SUFFIX}`;
}

/** يرجع جزأين منفصلين للعرض المُنسّق */
export function formatCurrencyParts(value: number | null | undefined): FormattedParts {
  if (value === null || value === undefined || isNaN(value)) return { num: '—' };
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
  return { num: formatted, suffix: CURRENCY_SUFFIX };
}

/** "5.2B ر.س" — للنصوص فقط */
export function formatCurrencyShort(value: number | null | undefined): string {
  const p = formatCurrencyShortParts(value);
  return p.suffix ? `${p.num}${p.suffix}` : p.num;
}

/**
 * النسخة المهمة لـ KPIs:
 *   formatCurrencyShortParts(5_200_000_000) →
 *     { num: "5.2", suffix: "B ر.س" }
 *
 * يسمح للـ KPICard أن يعرض "5.2" ضخماً ثم "B ر.س" أصغر وأخف.
 */
export function formatCurrencyShortParts(value: number | null | undefined): FormattedParts {
  if (value === null || value === undefined || isNaN(value)) return { num: '—' };
  const abs = Math.abs(value);
  let n: number;
  let unit: string;

  if (abs >= 1e9) {
    n = value / 1e9;
    unit = 'B';
  } else if (abs >= 1e6) {
    n = value / 1e6;
    unit = 'M';
  } else if (abs >= 1e3) {
    n = value / 1e3;
    unit = 'K';
  } else {
    return {
      num: new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value),
      suffix: CURRENCY_SUFFIX,
    };
  }

  const rounded = Math.round(n * 10) / 10;
  const display = rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  return { num: display, suffix: `${unit} ${CURRENCY_SUFFIX}` };
}

/* ============================================================
 * Numbers
 * ============================================================ */

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/* ============================================================
 * Percentages
 * ============================================================ */

/** "45%" - يقبل (0.45) أو (45) */
export function formatPercent(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const pct = Math.abs(value) <= 1 ? value * 100 : value;
  return `${pct.toFixed(decimals)}%`;
}

/** يفصل "45" عن "%" للعرض المنسّق */
export function formatPercentParts(value: number | null | undefined, decimals = 0): FormattedParts {
  if (value === null || value === undefined || isNaN(value)) return { num: '—' };
  const pct = Math.abs(value) <= 1 ? value * 100 : value;
  return { num: pct.toFixed(decimals), suffix: '%' };
}

/* ============================================================
 * Dates
 * ============================================================ */

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/* ============================================================
 * Helpers
 * ============================================================ */

export function clampPct(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function formatDelta(current: number, previous: number): { text: string; positive: boolean } {
  if (!previous) return { text: '—', positive: true };
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta >= 0 ? '+' : '';
  return {
    text: `${sign}${delta.toFixed(1)}%`,
    positive: delta >= 0,
  };
}

/**
 * Build filter options from an array of objects, only including values that exist.
 * @param items     — array of data objects
 * @param accessor  — function to extract the raw value from each item
 * @param labelMap  — optional map from value→Arabic label (uses value as label if absent)
 * @returns         unique, non-empty options sorted by label
 */
export function buildFilterOptions<T>(
  items: T[],
  accessor: (item: T) => string | null | undefined,
  labelMap?: Record<string, string>
): Array<{ value: string; label: string }> {
  const seen = new Set<string>();
  const opts: Array<{ value: string; label: string }> = [];
  for (const item of items) {
    const val = accessor(item);
    if (!val || seen.has(val)) continue;
    seen.add(val);
    opts.push({ value: val, label: labelMap?.[val] ?? val });
  }
  return opts.sort((a, b) => a.label.localeCompare(b.label, 'ar'));
}

/**
 * csvFetcher.ts
 * --------------------------------------------------------------
 * طبقة جلب البيانات الموحّدة من CSV Published.
 *
 * السلوك:
 *  1. إذا الرابط placeholder → يرجع mock data + isFallback: true
 *  2. إذا الرابط حقيقي → يجلب CSV عبر fetch + يحلله بـ PapaParse
 *  3. أي فشل في الجلب → يقع على mock + يرجع isFallback: true مع error
 *
 * هذا التصميم يضمن أن صفحات الـ UI لا تتعطل أبداً، ودائماً
 * تعرف هل البيانات حية أم تجريبية (لعرض شارة في صفحة Data Quality).
 */

import Papa from 'papaparse';
import { isPlaceholder } from '@/config/sheetsConfig';

export interface FetchResult<T> {
  data: T[];
  isFallback: boolean;
  fetchedAt: string;
  error?: string;
}

export async function fetchCsv<T>(
  url: string,
  mockFallback: T[],
  rowMapper?: (raw: Record<string, string>) => T
): Promise<FetchResult<T>> {
  const fetchedAt = new Date().toISOString();

  // الحالة ١: لا رابط حقيقي
  if (isPlaceholder(url)) {
    return {
      data: mockFallback,
      isFallback: true,
      fetchedAt,
    };
  }

  // الحالة ٢: محاولة جلب CSV حقيقي
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const csvText = await response.text();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      console.warn('[csvFetcher] Parse warnings:', parsed.errors);
    }

    const rawRows = parsed.data;

    // Filter out completely empty rows (all values blank) and rows where required ID is missing
    const validRawRows = rawRows.filter((row) => {
      const vals = Object.values(row as Record<string, string>);
      return vals.some((v) => v && String(v).trim() !== '');
    });

    const rows = rowMapper
      ? validRawRows.map(rowMapper).filter((r) => {
          // Remove rows where every string field is empty (mapper returned empty object)
          if (!r || typeof r !== 'object') return false;
          const vals = Object.values(r as object);
          return vals.some((v) => v !== undefined && v !== null && v !== '' && v !== 0);
        })
      : (validRawRows as unknown as T[]);

    // Dev diagnostic: log first row raw keys + mapped result
    if (validRawRows.length > 0) {
      const sheetKey = url.match(/gviz\/tq.*sheet=(\w+)/)?.[1] ?? url.slice(-30);
      console.log(`[Sheets ✓] ${sheetKey}  rows=${rows.length}  keys:`, Object.keys(validRawRows[0] as object));
      if (rowMapper && rows.length > 0) console.log(`[Sheets ✓] first mapped:`, rows[0]);
    }

    return {
      data: rows,
      isFallback: false,
      fetchedAt,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[csvFetcher] Failed to fetch ${url}:`, errorMsg);
    return {
      data: mockFallback,
      isFallback: true,
      fetchedAt,
      error: errorMsg,
    };
  }
}

/**
 * أدوات مساعدة لتحويل خانات CSV إلى أنواع TypeScript صحيحة.
 */

export function parseNumber(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  // إزالة الفواصل والعملات
  const cleaned = String(raw).replace(/[^\d.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

export function parseRequiredNumber(raw: string | undefined): number {
  return parseNumber(raw) ?? 0;
}

/**
 * يقبل: "0.45", "45", "45%" → يرجع 0.45
 */
export function parsePercent(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const hasPctSign = String(raw).includes('%');
  const cleaned = String(raw).replace(/[^\d.\-]/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n)) return undefined;
  if (hasPctSign) return n / 100;
  if (n > 1.5) return n / 100; // افترض أنها رقم وليس عشري
  return n;
}

export function parseBool(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = String(raw).trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'نعم' || v === 'صح';
}

export function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  // Try direct parse
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  // Try DD/MM/YYYY format
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const d2 = new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`);
    if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0];
  }
  return undefined;
}

export function parseString(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  return trimmed === '' ? undefined : trimmed;
}

export function parseRequiredString(raw: string | undefined): string {
  return parseString(raw) ?? '';
}

// Note: parseMoneyNumber lives in normalizers.ts for comprehensive parsing.
// Re-export for backwards compat:
export { parseMoneyNumber } from './normalizers';

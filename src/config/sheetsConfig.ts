/**
 * sheetsConfig.ts — مركزية روابط CSV من Google Sheets
 *
 * النمط: https://docs.google.com/spreadsheets/d/ID/gviz/tq?tqx=out:csv&sheet=data
 *
 * المتطلب: كل Sheet يجب أن يكون Public (Anyone with link can view)
 * وأن يحتوي على تاب اسمه بالضبط "data".
 *
 * عند أي فشل في الجلب → يرجع النظام تلقائياً لـ mock data.
 */

const GS = 'https://docs.google.com/spreadsheets/d';
const TAB = 'gviz/tq?tqx=out:csv&sheet=data';

export const sheetsConfig = {
  clients:             `${GS}/1rQkPU_vF0W0UPe56Eknp19JUSpFUNkpK95zBNgWXCQw/${TAB}`,
  funds:               `${GS}/1yDsXmf7TLtqhSH6pqe_oAm6vqmlhUFcwn28WCTgXxkc/${TAB}`,
  pipeline:            `${GS}/1c8Xuwe1kOHzAfC-h4Je5Fp0knhWQIb5pxyM-Fz9AiWE/${TAB}`,
  visits:              `${GS}/110_bJvLjJ1Y1PeHIgBd3kA4UM2JLofU3poUXXwCdZ30/${TAB}`,
  clientRequests:      `${GS}/1M1olartcuk5nKrgoVc6ZiEnCqodn_BoCfYJn3H-78L4/${TAB}`,
  recommendedInvestors:`${GS}/1hnuFfu3JHSdCSd3GBc2CzUu8POKoUEtH8ZY8AJDqCU4/${TAB}`,
  reportsLog:          `${GS}/1c1I0HCQJT7S11eGApXps8U_wMAeRxqy8AXjq-L4nnE4/${TAB}`,
  fundUpdates:         `${GS}/1lsrweFGoMUQmF5MzGhPX6kHOhlaw_-31wPeWJrWT1IA/${TAB}`,
  teamMembers:         `${GS}/1qDajffTH77wZV4NcpGkp5YsL5jZzfmXJPZYiNJilm-Q/${TAB}`,
  lookups:             `${GS}/17-yGPjtngCm9nPKkqY9NPkC3DwIMDdL_S5KZbvJYrDs/${TAB}`,
  meetingMinutes:      `${GS}/1fRScrlPz50-FzC0OBCjmZ3oLLfRXFyQvzXyxehfKyfY/${TAB}`,
  // Legacy keys kept for existing hooks
  holdings:    'PLACEHOLDER_HOLDINGS',
  employees:   'PLACEHOLDER_EMPLOYEES',
  reports:     'PLACEHOLDER_REPORTS',
  targets:     'PLACEHOLDER_TARGETS',
  billionPlan: 'PLACEHOLDER_BILLION_PLAN',
  financials:  'PLACEHOLDER_FINANCIALS',
  dashboard:   'PLACEHOLDER_DASHBOARD',
  sources:     'PLACEHOLDER_SOURCES',
} as const;

export type SheetKey = keyof typeof sheetsConfig;

/**
 * يفحص ما إذا كان الرابط placeholder (غير مفعّل).
 * الروابط الحقيقية لا تبدأ بـ PLACEHOLDER_.
 */
export function isPlaceholder(url: string): boolean {
  return url.startsWith('PLACEHOLDER_') || url === '#';
}

/** هل حُمِّل شيء من Google Sheets فعلاً (للـ status indicator)؟ */
export function isLiveUrl(url: string): boolean {
  return url.startsWith('https://');
}

export type SheetsConfig = typeof sheetsConfig;
/** للتوافق مع imports قديمة */
export function getMissingConnections(): SheetKey[] {
  return (Object.keys(sheetsConfig) as SheetKey[]).filter((k) => isPlaceholder(sheetsConfig[k]));
}
export function getConnectionStatus() {
  const total = Object.keys(sheetsConfig).length;
  const missing = getMissingConnections().length;
  return { total, connected: total - missing, missing, isFullyConnected: missing === 0 };
}

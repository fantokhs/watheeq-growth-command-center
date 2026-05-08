/**
 * Watheeq Brand Design Tokens
 * --------------------------------------------------------------
 * المصدر الموحّد لقيم الهوية البصرية: ألوان، خطوط، مسافات، ظلال.
 * يُستخدم خارج Tailwind (في Recharts، JS منطق، إلخ).
 * كل تعديل في الهوية يحدث هنا فقط.
 */

export const brandColors = {
  // Navy spectrum
  navy: '#263F82',
  navyDeep: '#071A2C',
  navyDarker: '#040F1C',
  navyCard: '#0B2238',
  navySoft: '#1A3056',

  // Gold accent
  gold: '#C8A45D',
  goldSoft: '#E6D3A3',
  goldDeep: '#A1813E',

  // Supporting brand
  teal: '#0E4C5A',

  // Backgrounds
  bgWarm: '#F7F5F0',
  bgCream: '#FAF8F3',
  bgPaper: '#FDFCF8',

  // Text / Ink
  ink: '#1C1C1C',
  inkSoft: '#3A3A3A',
  inkMuted: '#6B7280',
  inkFaint: '#9CA3AF',
  inkOnDark: '#F8FAFC',
  inkOnDarkMuted: 'rgba(248, 250, 252, 0.65)',

  // Lines
  line: '#E5E1D8',
  lineSoft: '#EFECE5',
  lineDark: 'rgba(255,255,255,0.10)',
} as const;

export const stateColors = {
  success: '#1F8A5B',
  successBg: '#E7F5EE',
  warning: '#C88719',
  warningBg: '#FBF1DF',
  danger: '#B42318',
  dangerBg: '#FBEAE8',
  info: '#2563EB',
  infoBg: '#E5EDFD',
  neutral: '#6B7280',
  neutralBg: '#F1F2F4',
} as const;

/**
 * ألوان الرسوم البيانية - مرتبة حسب الأولوية البصرية
 * تستخدم في Recharts للحفاظ على هوية موحدة
 */
export const chartPalette = [
  brandColors.navy,        // 1 - الأساسي
  brandColors.gold,        // 2 - التميّز
  brandColors.teal,        // 3 - مكمل
  brandColors.navySoft,    // 4 - ظل ناعم
  brandColors.goldDeep,    // 5 - ذهبي عميق
  '#5E7AB5',               // 6 - أزرق فاتح
  '#8FA3C7',               // 7 - أزرق رمادي
  brandColors.goldSoft,    // 8 - ذهبي ناعم
] as const;

/**
 * ألوان دلالية مخصصة لمراحل البايبلاين
 */
export const pipelineStageColors = {
  Lead: '#6B7280',
  Contacted: '#5E7AB5',
  Meeting: '#2563EB',
  Proposal: '#C88719',
  Committed: brandColors.gold,
  Closed: brandColors.navy,
  Lost: brandColors.inkFaint,
} as const;

/**
 * ألوان لمراحل الصناديق
 */
export const fundStageColors = {
  Idea: brandColors.inkFaint,
  Structuring: '#5E7AB5',
  Approvals: brandColors.teal,
  Fundraising: brandColors.gold,
  Closed: brandColors.navy,
  Managed: '#1F8A5B',
  Exited: brandColors.inkMuted,
} as const;

export const fontFamily = {
  brand: '"HSN Shahd", "IBM Plex Sans Arabic", "Tajawal", "Cairo", "Noto Kufi Arabic", system-ui, sans-serif',
} as const;

export const radii = {
  sm: '4px',
  md: '8px',
  lg: '10px',
  xl: '14px',
  '2xl': '18px',
} as const;

export const spacing = {
  page: '32px',
  section: '24px',
} as const;

export const shadows = {
  card: '0 1px 2px rgba(7, 26, 44, 0.04), 0 0 0 1px rgba(7, 26, 44, 0.05)',
  cardHover: '0 4px 12px rgba(7, 26, 44, 0.08), 0 0 0 1px rgba(200, 164, 93, 0.15)',
  kpi: '0 1px 0 rgba(7, 26, 44, 0.04), 0 1px 3px rgba(7, 26, 44, 0.06)',
} as const;

export const brand = {
  name: {
    en: 'Watheeq Capital',
    ar: 'وثيق المالية',
  },
  product: {
    en: 'Growth Command Center',
    ar: 'غرفة قيادة النمو',
  },
  tagline: {
    ar: 'وثيق عن قُرب',
  },
} as const;

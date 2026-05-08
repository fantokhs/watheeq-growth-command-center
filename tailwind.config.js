/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // الخط الأساسي العربي للهوية
        sans: [
          'HSN Shahd',
          'IBM Plex Sans Arabic',
          'Tajawal',
          'Cairo',
          'Noto Kufi Arabic',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'HSN Shahd',
          'IBM Plex Sans Arabic',
          'Tajawal',
          'system-ui',
          'sans-serif',
        ],
        // ⭐ خط الأرقام والاختصارات الإنجليزية - نظيف وأنيق
        // يستخدم لـ KPIs، الجداول، التواريخ، "ر.س"، "M"، "B"، "YTD"
        numeric: [
          'Inter',
          'IBM Plex Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        // ألوان الهوية الأساسية لوثيق
        watheeq: {
          // Navy spectrum
          navy: '#263F82',
          'navy-deep': '#071A2C',
          'navy-darker': '#040F1C',
          'navy-card': '#0B2238',
          'navy-soft': '#1A3056',

          // Gold accent
          gold: '#C8A45D',
          'gold-soft': '#E6D3A3',
          'gold-deep': '#A1813E',

          // Supporting
          teal: '#0E4C5A',

          // Backgrounds
          'bg-warm': '#F5F2EA',
          'bg-cream': '#FAF8F2',
          'bg-paper': '#FFFFFF',
        },
        // Functional palette - تستخدم بحذر فقط للحالات
        state: {
          success: '#1F8A5B',
          'success-bg': '#E7F5EE',
          warning: '#C88719',
          'warning-bg': '#FBF1DF',
          danger: '#B42318',
          'danger-bg': '#FBEAE8',
          info: '#2563EB',
          'info-bg': '#E5EDFD',
          neutral: '#6B7280',
          'neutral-bg': '#F1F2F4',
        },
        // Semantic — تباين أقوى للوضوح
        ink: {
          DEFAULT: '#0F1419',     // أغمق للنصوص الأساسية
          soft: '#2D3340',        // ثانوي
          muted: '#5A6373',       // أوضح من السابق (#6B7280)
          faint: '#8590A2',       // أوضح من السابق (#9CA3AF)
        },
        line: {
          DEFAULT: '#E2DCCE',
          soft: '#EDE8DD',
          dark: 'rgba(255,255,255,0.10)',
        },
      },
      boxShadow: {
        // ظلال متعددة الطبقات لإحساس premium
        'card': '0 1px 2px rgba(7, 26, 44, 0.04), 0 1px 1px rgba(7, 26, 44, 0.03), 0 0 0 1px rgba(7, 26, 44, 0.04)',
        'card-hover': '0 8px 24px -8px rgba(7, 26, 44, 0.12), 0 2px 4px rgba(7, 26, 44, 0.06), 0 0 0 1px rgba(200, 164, 93, 0.20)',
        'kpi': '0 1px 2px rgba(7, 26, 44, 0.04), 0 2px 8px -2px rgba(7, 26, 44, 0.05), 0 0 0 1px rgba(7, 26, 44, 0.05)',
        'kpi-accent': '0 1px 2px rgba(7, 26, 44, 0.04), 0 4px 12px -2px rgba(200, 164, 93, 0.10), 0 0 0 1px rgba(200, 164, 93, 0.18)',
        'inset-line': 'inset 0 -1px 0 rgba(7, 26, 44, 0.06)',
        'gold-ring': '0 0 0 3px rgba(200, 164, 93, 0.20)',
        'sidebar': '4px 0 24px -8px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '14px',
        '2xl': '20px',
      },
      fontSize: {
        // نظام KPI: أكبر وأنحف لإحساس elegant
        'kpi-xl': ['3rem', { lineHeight: '1.0', fontWeight: '600', letterSpacing: '-0.02em' }],
        'kpi-lg': ['2.5rem', { lineHeight: '1.0', fontWeight: '600', letterSpacing: '-0.02em' }],
        'kpi': ['1.875rem', { lineHeight: '1.05', fontWeight: '600', letterSpacing: '-0.015em' }],
        'kpi-sm': ['1.375rem', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.01em' }],
        'page-title': ['1.625rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'section-title': ['1.0625rem', { lineHeight: '1.35', fontWeight: '700' }],
      },
      spacing: {
        'page': '36px',
        'section': '28px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

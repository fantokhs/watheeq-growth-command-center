import { cn } from '@/lib/utils';
import { WatheeqLogo } from '@/components/brand/WatheeqLogo';
import { brand } from '@/styles/brandTokens';

export type PageKey =
  | 'overview'
  | 'clients'
  | 'funds'
  | 'pipeline'
  | 'visits'
  | 'team'
  | 'billion'
  | 'reports'
  | 'financials'
  | 'dataQuality';

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    key: 'overview',
    label: 'لوحة القيادة',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    key: 'clients',
    label: 'العملاء',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'funds',
    label: 'الصناديق',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: 'pipeline',
    label: 'بايبلاين النمو',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="12" x2="2" y2="12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        <line x1="6" y1="16" x2="6.01" y2="16" />
        <line x1="10" y1="16" x2="10.01" y2="16" />
      </svg>
    ),
  },
  {
    key: 'visits',
    label: 'زيارات الأسبوع',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    key: 'team',
    label: 'أداء الفريق',
    comingSoon: true,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    key: 'billion',
    label: 'خطة المليار',
    comingSoon: true,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'مركز التقارير',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    key: 'financials',
    label: 'المؤشرات المالية',
    comingSoon: true,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    key: 'dataQuality',
    label: 'جودة البيانات',
    comingSoon: true,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
];

interface SidebarProps {
  active: PageKey;
  onSelect: (key: PageKey) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="navy-pattern w-[260px] shrink-0 flex flex-col shadow-sidebar print:hidden relative">
      {/* خط ذهبي رفيع على الحافة الداخلية - تطعيم للهوية */}
      <span
        className="absolute inset-y-0 start-0 w-px bg-gradient-to-b from-transparent via-watheeq-gold/25 to-transparent"
        aria-hidden="true"
      />

      {/* Brand block */}
      <div className="px-5 pt-7 pb-6 border-b border-white/[0.06]">
        <WatheeqLogo variant="white" className="h-[34px]" />
        <div className="mt-3.5 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-watheeq-gold" aria-hidden="true" />
          <p className="text-[12px] text-watheeq-gold-soft tracking-wide font-medium leading-none">
            {brand.product.ar}
          </p>
        </div>
        <p className="text-[10.5px] text-white/40 mt-1 num">
          Growth Command Center · v0.1
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="القائمة الرئيسية">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = active === item.key;
            const isDisabled = item.comingSoon;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => !isDisabled && onSelect(item.key)}
                  disabled={isDisabled}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md',
                    'text-[14px] transition-all duration-150 relative',
                    isActive && [
                      // Background: gradient subtle
                      'bg-gradient-to-l from-white/[0.10] to-white/[0.04]',
                      'text-white font-bold',
                      // Top + bottom hairline for definition
                      'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.20)]',
                    ],
                    !isActive &&
                      !isDisabled && [
                        // الـ inactive أوضح (75% بدلاً من 55%)
                        'text-white/75 hover:text-white hover:bg-white/[0.05]',
                        'font-medium',
                      ],
                    isDisabled && 'text-white/35 cursor-not-allowed font-medium'
                  )}
                >
                  {/* خط ذهبي رفيع على الحافة الداخلية للنشط */}
                  {isActive && (
                    <span
                      className="absolute inset-y-1.5 end-0 w-[3px] bg-watheeq-gold rounded-s-full shadow-[0_0_8px_rgba(200,164,93,0.5)]"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      'shrink-0 transition-colors duration-150',
                      isActive
                        ? 'text-watheeq-gold'
                        : 'text-white/55 group-hover:text-white/90'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-start tracking-tight">{item.label}</span>
                  {item.comingSoon && (
                    <span className="num text-[9.5px] text-white/40 border border-white/12 rounded px-1.5 py-px font-medium">
                      قريباً
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer brand */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[11px] text-white/45 leading-relaxed">
          مرخصة من قبل هيئة السوق المالية
        </p>
        <p className="text-[10.5px] text-white/35 mt-0.5 num">
          ترخيص رقم 32-18189
        </p>
      </div>
    </aside>
  );
}

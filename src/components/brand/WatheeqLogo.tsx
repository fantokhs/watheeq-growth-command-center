/**
 * مكوّن شعار وثيق
 * --------------------------------------------------------------
 * variants:
 *   - default:   النسخة الملوّنة (للخلفيات الفاتحة)
 *   - white:     النسخة البيضاء (للخلفيات الداكنة)
 *   - mark:      الأيقونة فقط (W داخل الإطار) - مرسومة inline SVG
 *
 * الارتفاع تحدده الـ className، النسبة محفوظة تلقائياً.
 */

import { cn } from '@/lib/utils';

type LogoVariant = 'default' | 'white' | 'mark';

interface WatheeqLogoProps {
  variant?: LogoVariant;
  className?: string;
  /** نص بديل لقارئ الشاشة */
  alt?: string;
}

export function WatheeqLogo({
  variant = 'default',
  className,
  alt = 'وثيق المالية - Watheeq Capital',
}: WatheeqLogoProps) {
  if (variant === 'mark') {
    return <WatheeqMark className={className} />;
  }

  const src =
    variant === 'white'
      ? '/logo/watheeq-logo-white.png'
      : '/logo/watheeq-logo-colored.png';

  return (
    <img
      src={src}
      alt={alt}
      className={cn('block w-auto select-none', className)}
      draggable={false}
    />
  );
}

/**
 * إصدار SVG للأيقونة فقط — قابل للتلوين بـ currentColor.
 * الشكل: حرف W داخل إطار مستطيل بزوايا منحنية، مع كلمة "وثيق" تحت الـ W.
 */
function WatheeqMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 80"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      role="img"
      aria-label="شعار وثيق"
    >
      {/* الإطار الخارجي */}
      <rect
        x="2"
        y="2"
        width="56"
        height="76"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* حرف W مبسّط */}
      <path
        d="M 14 18 L 22 50 L 30 30 L 38 50 L 46 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* خط تحت W */}
      <line
        x1="16"
        y1="58"
        x2="44"
        y2="58"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.4"
      />
      {/* "وثيق" بحرف صغير - مجرد إشارة شكلية */}
      <text
        x="30"
        y="70"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="currentColor"
        fontFamily="HSN Shahd, sans-serif"
      >
        وثيق
      </text>
    </svg>
  );
}

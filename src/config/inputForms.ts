/**
 * src/config/inputForms.ts
 * ─────────────────────────────────────────────────────────────
 * روابط نماذج إدخال البيانات الخارجية (Google Forms، Typeform، إلخ)
 *
 * لتفعيل نموذج: استبدل '#' بالرابط الحقيقي.
 * كل الأزرار في التطبيق تقرأ من هذا الملف — لا روابط مُضمَّنة في المكوّنات.
 *
 * عند رابط '#': يظهر مودال "النموذج غير مفعّل حالياً"
 * عند رابط حقيقي: يُفتح في تبويب جديد (rel=noopener noreferrer)
 */

export const INPUT_FORMS = {
  /** إضافة عميل جديد */
  CLIENT_FORM_URL: '#',

  /** إضافة صندوق جديد */
  FUND_FORM_URL: '#',

  /** إضافة فرصة / فرصة استثمارية جديدة */
  OPPORTUNITY_FORM_URL: '#',

  /** تسجيل زيارة ميدانية */
  VISIT_FORM_URL: '#',

  /** إضافة متابعة أو خطوة تالية */
  FOLLOW_UP_FORM_URL: '#',

  /** تحديث مرحلة فرصة في البايبلاين */
  STAGE_UPDATE_FORM_URL: '#',

  /** إضافة طلب عميل */
  CLIENT_REQUEST_FORM_URL: '#',

  /** إنشاء محضر اجتماع */
  MEETING_MINUTES_FORM_URL: '#',
} as const;

export type InputFormKey = keyof typeof INPUT_FORMS;

import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ReportType } from '@/types/reports';
import { REPORT_TYPE_LABELS } from '@/types/reports';
import { cn } from '@/lib/utils';

interface DeliveryModalProps {
  channel: 'whatsapp' | 'email';
  reportTitle: string;
  reportType: ReportType;
  clientName?: string;
  fundName?: string;
  onClose: () => void;
}

function generateMessage(type: ReportType, clientName?: string, fundName?: string) {
  const client = clientName ?? 'أ. {الاسم}';
  const fund   = fundName   ?? '{اسم الصندوق}';

  switch (type) {
    case 'client_summary':
      return {
        subject: `تقريركم الاستثماري — وثيق المالية`,
        body: `السلام عليكم ${client}،\n\nنتمنى أن تكونوا بخير.\n\nنرفق لكم تقريركم الاستثماري لدى شركة وثيق المالية، والذي يتضمن ملخصًا محدثًا لاستثماراتكم وأبرز البيانات ذات العلاقة.\n\nنسعد بخدمتكم دائمًا.\n\nفريق وثيق المالية\n\nتم إنشاء هذا التقرير آليًا بناءً على البيانات المتاحة في النظام.`,
      };
    case 'fund_teaser':
      return {
        subject: `ملخص تعريفي — ${fund}`,
        body: `السلام عليكم ${client}،\n\nنتمنى أن تكونوا بخير.\n\nنرفق لكم ملخصًا تعريفيًا عن ${fund}، متضمنًا فكرة الصندوق، أبرز المؤشرات، وملاءمته للمستثمرين المستهدفين.\n\nيسعدنا ترتيب مكالمة أو اجتماع للإجابة عن أي استفسارات.\n\nفريق وثيق المالية\n\nهذا التقرير لأغراض المعلومات ولا يعد توصية استثمارية أو عرضًا ملزمًا.`,
      };
    case 'pre_visit':
      return {
        subject: `تقرير ما قبل الزيارة — ${client}`,
        body: `السلام عليكم،\n\nمرفق تقرير ما قبل الزيارة للعميل ${client}، متضمنًا ملخص العلاقة، الاستثمارات الحالية، الملاحظات المهمة، والفرص المقترحة للنقاش.\n\nيرجى الاطلاع قبل موعد الاجتماع.\n\nتم إنشاء هذا التقرير آليًا بناءً على البيانات المتاحة في النظام.`,
      };
    case 'ceo_weekly':
      return {
        subject: `تقرير الإدارة الأسبوعي — وثيق المالية`,
        body: `السلام عليكم،\n\nمرفق تقرير الإدارة الأسبوعي، متضمنًا أبرز مؤشرات الأداء، تقدم تعبئة الصناديق، الفرص المهمة، والمخاطر التي تتطلب تدخل الإدارة.\n\nتم إنشاء هذا التقرير آليًا بناءً على البيانات المتاحة في النظام.`,
      };
    case 'management_attention':
      return {
        subject: `فرص تحتاج تدخل الإدارة — ${new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}`,
        body: `السلام عليكم،\n\nمرفق تقرير الفرص التي تحتاج تدخل الإدارة، متضمنًا أسباب التصعيد، المبالغ المتوقعة، المسؤولين، والإجراءات المقترحة.\n\nيرجى الاطلاع واتخاذ ما يلزم.\n\nتم إنشاء هذا التقرير آليًا بناءً على البيانات المتاحة في النظام.`,
      };
    default:
      return {
        subject: `${REPORT_TYPE_LABELS[type]} — وثيق المالية`,
        body: `السلام عليكم،\n\nمرفق ${REPORT_TYPE_LABELS[type]}.\n\nنسعد بخدمتكم دائمًا.\n\nفريق وثيق المالية\n\nتم إنشاء هذا التقرير آليًا بناءً على البيانات المتاحة في النظام.`,
      };
  }
}

export function DeliveryModal({ channel, reportTitle, reportType, clientName, fundName, onClose }: DeliveryModalProps) {
  const isWA = channel === 'whatsapp';
  const template = useMemo(() => generateMessage(reportType, clientName, fundName), [reportType, clientName, fundName]);
  const [body,    setBody]    = useState(template.body);
  const [subject, setSubject] = useState(template.subject);
  const [sent,    setSent]    = useState(false);

  const mockRecipient = clientName ?? 'فريق الإدارة';
  const mockContact   = isWA ? '+966 5X XXX XXXX' : 'client@example.com';

  const handleCopy = () => {
    const text = isWA ? body : `الموضوع: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const modal = (
    // z-[9999] ensures it's above everything, rendered at body level via portal
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop — rendered at body level, never clipped */}
      <div className="absolute inset-0 bg-watheeq-navy-deep/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* Panel — max-height + internal scroll on body */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh' }}>
        {/* Header — always visible */}
        <div className={cn('flex items-center justify-between px-5 py-4 shrink-0 rounded-t-2xl', isWA ? 'bg-[#128C7E]' : 'bg-watheeq-navy')}>
          <div className="flex items-center gap-3">
            <span className="text-[22px]">{isWA ? '💬' : '✉️'}</span>
            <div>
              <p className="font-bold text-white text-[14px]">
                {isWA ? 'معاينة رسالة واتساب' : 'معاينة رسالة بريد إلكتروني'}
              </p>
              <p className="text-[11px] text-white/65">هذا عرض تجريبي — لن يتم إرسال رسالة حقيقية</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors text-[15px]">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {sent ? (
            <div className="px-6 py-12 text-center space-y-3">
              <div className="text-[48px]">✅</div>
              <p className="font-bold text-[16px] text-watheeq-navy-deep">تم الإرسال التجريبي</p>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                سيتم تفعيل الإرسال الفعلي في مرحلة الربط والإرسال.
                <br />سيُسجّل هذا الإجراء في سجل التسليم.
              </p>
              <button type="button" onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-watheeq-navy text-white rounded-xl text-[13px] font-bold">
                إغلاق
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Recipient info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="إلى"                           value={mockRecipient} />
                <InfoRow label={isWA ? 'الجوال' : 'البريد'}  value={mockContact} />
                <InfoRow label="التقرير"                       value={reportTitle} className="col-span-2" />
              </div>

              {/* Subject — email only */}
              {!isWA && (
                <div>
                  <label className="text-[12px] text-ink-muted font-bold block mb-1.5">الموضوع</label>
                  <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-[13px] border border-line rounded-xl px-3 py-2 focus:outline-none focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15" />
                </div>
              )}

              {/* Attachment placeholder */}
              <div className="flex items-center gap-2.5 bg-watheeq-bg-cream rounded-xl px-3 py-2.5 border border-line/60">
                <span className="text-[18px]">📎</span>
                <div>
                  <p className="text-[12px] font-bold text-ink">{reportTitle}.pdf</p>
                  <p className="text-[11px] text-ink-muted">مرفق التقرير (سيُولَّد عند التفعيل)</p>
                </div>
              </div>

              {/* Message body */}
              <div>
                <label className="text-[12px] text-ink-muted font-bold block mb-1.5">نص الرسالة</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  className="w-full text-[13px] border border-line rounded-xl px-3 py-2 leading-relaxed focus:outline-none focus:border-watheeq-gold focus:ring-2 focus:ring-watheeq-gold/15 resize-none"
                />
                <p className="text-[11px] text-ink-faint mt-1">يمكنك تعديل نص الرسالة قبل الإرسال.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions — always visible */}
        {!sent && (
          <div className="px-5 py-4 border-t border-line/50 flex gap-2.5 shrink-0 bg-watheeq-bg-cream/30 rounded-b-2xl">
            <button type="button" onClick={handleCopy}
              className="flex-1 py-2.5 border border-line rounded-xl text-[13px] font-bold text-ink-soft hover:bg-watheeq-bg-cream transition-colors">
              📋 نسخ الرسالة
            </button>
            <button type="button" onClick={() => setSent(true)}
              className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition-colors', isWA ? 'bg-[#128C7E] hover:bg-[#0e7065]' : 'bg-watheeq-navy hover:bg-watheeq-navy-deep')}>
              إرسال تجريبي
            </button>
          </div>
        )}

        <p className={cn('text-[11px] text-center text-ink-faint pb-3 shrink-0', sent && 'hidden')}>
          سيتم تفعيل الإرسال الفعلي في مرحلة الربط والإرسال.
        </p>
      </div>
    </div>
  );

  // createPortal renders directly into document.body — bypasses ALL ancestor
  // stacking contexts (backdrop-filter, transform, overflow, etc.)
  return createPortal(modal, document.body);
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('bg-watheeq-bg-cream/60 rounded-xl px-3 py-2.5 border border-line/50', className)}>
      <p className="text-[11px] text-ink-muted mb-0.5">{label}</p>
      <p className="text-[13px] font-bold text-ink">{value}</p>
    </div>
  );
}

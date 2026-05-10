/**
 * قوالب التقارير العشرة — Phase 3
 * كل قالب يُنتج تقريراً مميزاً يعكس قوة وثيق المالية.
 */

import {
  ReportShell, ReportCover, ReportSection, ReportHeroNumbers,
  ReportMetricCard, ReportTable, ReportExecutiveSummary,
  ReportInsight, ReportFooter, PageBreak,
} from './ReportShell';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { ScoreBar } from '@/components/ui/ScoreBar';
import {
  formatCurrency, formatCurrencyShort, formatPercent, formatDate, formatDateShort, clampPct,
} from '@/lib/format';
import {
  clientClassificationLabels, riskProfileLabels, assetClassLabels,
  fundStageLabels, pipelineStageLabels,
} from '@/lib/arabicLabels';
import {
  mockClients, mockFunds, mockPipeline, mockVisits,
  mockEmployees, mockFinancials, mockDashboard, mockBillionPlan,
} from '@/data/mockData';
import { getRecommendedInvestors } from '@/lib/scoring';

// ─────────────────────────────────────────────
// Common helpers
// ─────────────────────────────────────────────
const empName  = (id?: string) => mockEmployees.find((e) => e.employee_id === id)?.name_ar ?? '—';
const fundName = (id?: string) => mockFunds.find((f)  => f.fund_id    === id)?.name_ar ?? '—';
const clientObj= (id: string)  => mockClients.find((c) => c.client_id  === id);
const days     = (d?: string)  => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null;
const WEEK_LABEL = 'الأسبوع 19 · 4 – 10 مايو 2026';

// ─────────────────────────────────────────────
// A. تقرير ملخص العميل
// ─────────────────────────────────────────────
export function ClientSummaryReport({ clientId = 'CL-001', notes }: { clientId?: string; notes?: string }) {
  const client = clientObj(clientId) ?? mockClients[0];
  const opps = mockPipeline.filter((p) => p.client_id === client.client_id && p.stage !== 'Closed' && p.stage !== 'Lost');
  const profit  = client.total_profit   ?? 0;
  const invested = client.total_invested ?? 0;
  const returnPct = invested > 0 ? profit / invested : 0;

  return (
    <ReportShell>
      <ReportCover
        title={`تقرير ملخص العميل`}
        subtitle={`ملخص شامل لعلاقة الاستثمار مع ${client.name_ar} — ${formatDate(new Date().toISOString())}`}
        reportType="client_summary" audience="client"
        clientName={client.name_ar} generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `يُغطّي هذا التقرير ملخص علاقة الاستثمار مع ${client.name_ar}، ${clientClassificationLabels[client.classification]}. ` +
          `إجمالي الاستثمارات القائمة ${formatCurrencyShort(invested)} بعائد إجمالي ${formatPercent(returnPct)}. ` +
          `عدد الفرص المفتوحة: ${opps.length}. آخر تواصل: منذ ${days(client.last_contact_date) ?? '—'} يوم.`
        } />
      </ReportSection>

      <ReportSection title="المؤشرات الرئيسية">
        <ReportHeroNumbers items={[
          { label: 'إجمالي الاستثمار',  value: formatCurrencyShort(invested), color: 'default' },
          { label: 'إجمالي الأرباح',    value: formatCurrencyShort(profit),   color: 'success' },
          { label: 'العائد الإجمالي',   value: formatPercent(returnPct),       color: 'success' },
          { label: 'الفرص المفتوحة',    value: String(opps.length),            color: 'gold' },
        ]} />
      </ReportSection>

      <ReportSection title="ملف العميل">
        <ReportMetricCard label="التصنيف"           value={clientClassificationLabels[client.classification]} />
        <ReportMetricCard label="مستوى المخاطرة"    value={client.risk_profile ? riskProfileLabels[client.risk_profile] : '—'} />
        <ReportMetricCard label="الأصول المفضلة"    value={client.preferred_asset_class ? assetClassLabels[client.preferred_asset_class] : '—'} />
        <ReportMetricCard label="المسؤول عن العلاقة" value={empName(client.relationship_owner_id)} />
        <ReportMetricCard label="آخر تواصل"         value={<span className="num">{formatDate(client.last_contact_date)}</span>} />
        <ReportMetricCard label="آخر زيارة"         value={<span className="num">{formatDate(client.last_visit_date)}</span>} />
        <ReportMetricCard label="آخر تقرير مرسل"    value={<span className="num">{formatDate(client.last_report_date)}</span>} />
        <ReportMetricCard label="متابعة قادمة"      value={<span className="num">{formatDate(client.next_follow_up_date)}</span>} />
      </ReportSection>

      {opps.length > 0 && (
        <ReportSection title="الفرص الاستثمارية المفتوحة">
          <ReportTable
            headers={['الصندوق', 'المرحلة', 'القيمة المتوقعة', 'الاحتمالية', 'الخطوة التالية']}
            rows={opps.map((o) => [
              fundName(o.fund_id),
              pipelineStageLabels[o.stage],
              <span className="num font-bold">{formatCurrencyShort(o.expected_amount)}</span>,
              <span className="num">{formatPercent(o.probability)}</span>,
              o.next_step ?? '—',
            ])}
          />
        </ReportSection>
      )}

      {client.notes && (
        <ReportSection title="ملاحظات العلاقة">
          <p className="text-[14px] text-ink leading-relaxed">{client.notes}</p>
        </ReportSection>
      )}

      <ReportSection title="الإجراء التالي الموصى به" gold>
        <ReportInsight icon="➜" label="إجراء مقترح" tone="success"
          text={opps.length > 0
            ? `متابعة ${opps.length} فرصة مفتوحة وتحديث المرحلة. التواصل خلال ${Math.max(0, 30 - (days(client.last_contact_date) ?? 30))} يوم.`
            : `جدولة اجتماع متابعة وعرض الصناديق الجديدة المتوافقة مع تفضيلات العميل.`}
        />
      </ReportSection>

      <ReportFooter disclaimer />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// B. تقرير قبل الزيارة
// ─────────────────────────────────────────────
export function PreVisitReport({ clientId = 'CL-004', notes }: { clientId?: string; notes?: string }) {
  const client = clientObj(clientId) ?? mockClients[3];
  const opps = mockPipeline.filter((p) => p.client_id === client.client_id);
  const invested = client.total_invested ?? 0;

  return (
    <ReportShell>
      <ReportCover
        title="تقرير ما قبل الزيارة"
        subtitle={`إعداد الفريق لاجتماع مع ${client.name_ar} — استخدام داخلي`}
        reportType="pre_visit" audience="internal" clientName={client.name_ar}
        generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `هذا التقرير معدّ لتجهيز فريق العلاقات قبل الاجتماع مع ${client.name_ar}. ` +
          `العميل في مرحلة ${client.status === 'prospect' ? 'الاستهداف الأولي' : 'قائم ونشط'}. ` +
          `آخر تواصل: منذ ${days(client.last_contact_date) ?? 'لا يوجد'} يوم.`
        } />
      </ReportSection>

      <ReportSection title="ملخص ملف العميل">
        <ReportMetricCard label="تصنيف العميل"      value={clientClassificationLabels[client.classification]} />
        <ReportMetricCard label="مستوى المخاطرة"    value={client.risk_profile ? riskProfileLabels[client.risk_profile] : '—'} />
        <ReportMetricCard label="الأصول المفضلة"    value={client.preferred_asset_class ? assetClassLabels[client.preferred_asset_class] : '—'} />
        <ReportMetricCard label="إجمالي الاستثمار"  value={invested > 0 ? <span className="num">{formatCurrency(invested)}</span> : 'عميل محتمل'} />
        <ReportMetricCard label="المسؤول"           value={empName(client.relationship_owner_id)} />
        <ReportMetricCard label="حالة العميل"       value={client.status === 'sensitive' ? <Badge tone="danger">حساس</Badge> : <span className="text-ink-muted">عادي</span>} />
      </ReportSection>

      {opps.length > 0 && (
        <ReportSection title="الفرص المفتوحة">
          <ReportTable
            headers={['الصندوق', 'المرحلة', 'القيمة', 'الاحتمالية']}
            rows={opps.map((o) => [fundName(o.fund_id), pipelineStageLabels[o.stage], <span className="num font-bold">{formatCurrencyShort(o.expected_amount)}</span>, <span className="num">{formatPercent(o.probability)}</span>])}
          />
        </ReportSection>
      )}

      <ReportSection title="محاور النقاش المقترحة" gold>
        {[
          'عرض الصناديق الجديدة المتوافقة مع تفضيلات العميل',
          `التأكيد على العائد المتوقع ومستوى المخاطر ${client.risk_profile ? riskProfileLabels[client.risk_profile] : ''}`,
          'عرض حجم الحد الأدنى للتذكرة ومرونة الشروط',
          'مناقشة الجدول الزمني للصندوق ومواعيد الإغلاق',
          'الاستفسار عن رغبات التنويع في المحفظة',
        ].map((point, i) => (
          <div key={i} className="flex items-start gap-2 py-2 border-b border-[#F0EDE6] last:border-0">
            <span className="num text-[12px] text-watheeq-gold font-bold shrink-0 mt-0.5">{i + 1}</span>
            <span className="text-[14px] text-ink">{point}</span>
          </div>
        ))}
      </ReportSection>

      <ReportSection title="ما يجب تجنّبه">
        <ReportInsight icon="⚠" tone="warning" label="تنبيه للفريق"
          text={client.status === 'sensitive'
            ? 'العميل حساس — تجنّب الضغط المباشر في الطرح. استخدم أسلوب الاستشارة لا البيع.'
            : 'تجنّب التحدث عن المنافسين أو المقارنة المباشرة بالأسواق. ركّز على الفرصة الخاصة.'} />
      </ReportSection>

      <ReportSection title="هدف الاجتماع" gold>
        <ReportInsight icon="🎯" tone="success" label="الهدف المطلوب"
          text={opps.length > 0
            ? `تحديث حالة الفرصة الحالية والوصول لمرحلة الالتزام المبدئي. القيمة المتوقعة: ${formatCurrencyShort(opps[0]?.expected_amount)}`
            : `بناء علاقة أولية قوية وتحديد الصندوق الأنسب وتقدير حجم التذكرة المحتملة.`}
        />
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// C. تيزر الصندوق
// ─────────────────────────────────────────────
export function FundTeaserReport({ fundId = 'FND-002', notes }: { fundId?: string; notes?: string }) {
  const fund = mockFunds.find((f) => f.fund_id === fundId) ?? mockFunds[1] ?? mockFunds[0];
  const progress = clampPct(fund.fundraising_progress_pct ?? 0);

  return (
    <ReportShell>
      <ReportCover
        title={fund.name_ar}
        subtitle="ملخص تعريفي للمستثمرين — فرصة استثمارية مختارة"
        reportType="fund_teaser" audience="client"
        fundName={fund.name_ar} generatedAt={new Date().toISOString()}
      />

      <ReportSection title="لماذا الآن؟">
        <ReportExecutiveSummary text={
          `${fund.name_ar} صندوق ${assetClassLabels[fund.asset_class]} يستهدف عوائد تتجاوز ${formatPercent(fund.expected_return_pct)} ` +
          `خلال ${fund.duration_years} سنوات. الصندوق حالياً في مرحلة ${fundStageLabels[fund.stage]} ` +
          `بنسبة استقطاب ${formatPercent(progress)} من المستهدف. النافذة المتاحة محدودة.`
        } />
      </ReportSection>

      <ReportSection title="أبرز مؤشرات الصندوق">
        <ReportHeroNumbers items={[
          { label: 'حجم الصندوق',       value: formatCurrencyShort(fund.target_size),      color: 'default' },
          { label: 'العائد المتوقع',     value: formatPercent(fund.expected_return_pct),     color: 'gold' },
          { label: 'مدة الصندوق',       value: `${fund.duration_years} سنوات`,              color: 'default' },
          { label: 'الالتزامات الحالية', value: formatCurrencyShort(fund.committed_amount), color: 'success' },
        ]} />
      </ReportSection>

      <ReportSection title="تفاصيل الصندوق">
        <ReportMetricCard label="فئة الأصول"         value={assetClassLabels[fund.asset_class]} />
        <ReportMetricCard label="مرحلة الصندوق"      value={fundStageLabels[fund.stage]} />
        <ReportMetricCard label="الالتزامات الحالية" value={<span className="num">{formatCurrency(fund.committed_amount)}</span>} />
        <ReportMetricCard label="المبلغ المتبقي"     value={<span className="num text-state-warning">{formatCurrency(fund.remaining_amount)}</span>} />
        <ReportMetricCard label="عدد المستثمرين"     value={<span className="num">{fund.investors_count}</span>} />
        <ReportMetricCard label="مدير الصندوق"       value={empName(fund.fund_manager_id)} />
      </ReportSection>

      <ReportSection title="نسبة الاستقطاب">
        <div className="space-y-2">
          <ProgressBar value={progress} tone="gold" size="lg" />
          <div className="flex justify-between text-[13px]">
            <span className="text-ink-muted num">{formatCurrencyShort(fund.committed_amount)} محقق</span>
            <span className="num font-bold text-watheeq-gold-deep">{formatPercent(progress)}</span>
            <span className="text-ink-muted num">{formatCurrencyShort(fund.target_size)} مستهدف</span>
          </div>
        </div>
      </ReportSection>

      <ReportSection title="الملف الاستثماري المناسب">
        <ReportInsight icon="✓" tone="success" label="المستثمر المناسب"
          text="مستثمرون ذوو ملاءة عالية (HNW/UHNW) أو مكاتب عائلية يبحثون عن تنويع في فئات الأصول الواقعية بعوائد محددة مسبقاً." />
      </ReportSection>

      <ReportFooter disclaimer />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// D. تقرير تعبئة الصندوق
// ─────────────────────────────────────────────
export function FundFundraisingReport({ fundId = 'FND-002', notes }: { fundId?: string; notes?: string }) {
  const fund = mockFunds.find((f) => f.fund_id === fundId) ?? mockFunds[1] ?? mockFunds[0];
  const fundOpps = mockPipeline.filter((p) => p.fund_id === fund.fund_id && p.stage !== 'Lost');
  const atRisk = fundOpps.filter((p) => p.probability < 0.4 || p.ceo_attention_flag);
  const topOpps = [...fundOpps].sort((a, b) => b.expected_amount - a.expected_amount).slice(0, 5);
  const progress = clampPct(fund.fundraising_progress_pct ?? 0);
  const totalPipeline = fundOpps.reduce((s, p) => s + p.expected_amount, 0);
  const weighted = fundOpps.reduce((s, p) => s + (p.weighted_amount ?? 0), 0);

  return (
    <ReportShell>
      <ReportCover
        title="تقرير تعبئة الصندوق"
        subtitle={`تقرير تفصيلي لمتابعة استقطاب المستثمرين — ${fund.name_ar}`}
        reportType="fund_fundraising" audience="management"
        fundName={fund.name_ar} generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `تقدّمت عملية الاستقطاب إلى ${formatPercent(progress)} من مستهدف ${formatCurrencyShort(fund.target_size)}. ` +
          `البايبلاين الإجمالي ${formatCurrencyShort(totalPipeline)} والمرجح ${formatCurrencyShort(weighted)}. ` +
          `${atRisk.length} فرصة تحتاج اهتماماً.`
        } />
      </ReportSection>

      <ReportSection title="مؤشرات التعبئة الرئيسية">
        <ReportHeroNumbers items={[
          { label: 'الالتزامات المحققة', value: formatCurrencyShort(fund.committed_amount),  color: 'success' },
          { label: 'المتبقي للإغلاق',   value: formatCurrencyShort(fund.remaining_amount),   color: 'gold' },
          { label: 'نسبة الإغلاق',      value: formatPercent(progress),                        color: 'default' },
          { label: 'عدد المستثمرين',    value: String(fund.investors_count ?? 0),               color: 'default' },
        ]} />
        <div className="mt-4">
          <ProgressBar value={progress} tone="gold" size="lg" showLabel />
        </div>
      </ReportSection>

      <ReportSection title="أبرز الفرص">
        <ReportTable
          headers={['العميل', 'المرحلة', 'القيمة', 'الاحتمالية', 'المسؤول']}
          rows={topOpps.map((o) => [
            clientObj(o.client_id)?.name_ar ?? o.client_id,
            pipelineStageLabels[o.stage],
            <span className="num font-bold">{formatCurrencyShort(o.expected_amount)}</span>,
            <span className="num">{formatPercent(o.probability)}</span>,
            empName(o.owner_id),
          ])}
        />
      </ReportSection>

      {atRisk.length > 0 && (
        <ReportSection title="فرص تتطلب متابعة">
          {atRisk.map((o) => (
            <ReportInsight key={o.opportunity_id} icon="⚠" tone="warning"
              label={clientObj(o.client_id)?.name_ar ?? ''}
              text={`${formatCurrencyShort(o.expected_amount)} · احتمالية ${formatPercent(o.probability)} · ${o.next_step ?? 'لا توجد خطوة محددة'}`}
            />
          ))}
        </ReportSection>
      )}

      <ReportSection title="قرارات مطلوبة من الإدارة" gold>
        <div className="space-y-3">
          {['مراجعة الفرص عالية القيمة بدون خطوة تالية', 'الموافقة على تمديد الاستقطاب إذا لزم', 'التدخل المباشر في الفرص الحساسة'].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="num text-[12px] text-watheeq-gold font-bold shrink-0">{i + 1}.</span>
              <span className="text-[14px] text-ink">{item}</span>
            </div>
          ))}
        </div>
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// E. تقرير العملاء الموصى بهم
// ─────────────────────────────────────────────
export function RecommendedInvestorsReport({ fundId = 'FND-006', notes }: { fundId?: string; notes?: string }) {
  const fund = mockFunds.find((f) => f.fund_id === fundId) ?? mockFunds[5] ?? mockFunds[0];
  const recommended = getRecommendedInvestors(fund, mockClients);

  return (
    <ReportShell>
      <ReportCover
        title="تقرير العملاء الموصى بهم"
        subtitle={`قائمة المستثمرين الأكثر توافقاً مع ${fund.name_ar}`}
        reportType="recommended_investors" audience="bd_team"
        fundName={fund.name_ar} generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `تم ترتيب ${recommended.length} عميل بناءً على تقييم متعدد المعايير يشمل: التوافق مع فئة الأصول، ` +
          `الملاءة المالية، ملف المخاطرة، حداثة التواصل، وسجل الاستثمار السابق.`
        } />
      </ReportSection>

      <ReportSection title="نظرة عامة على الصندوق">
        <ReportHeroNumbers items={[
          { label: 'حجم الصندوق',   value: formatCurrencyShort(fund.target_size) },
          { label: 'العائد المتوقع', value: formatPercent(fund.expected_return_pct), color: 'gold' },
          { label: 'فئة الأصول',    value: assetClassLabels[fund.asset_class] },
          { label: 'مرحلة الصندوق', value: fundStageLabels[fund.stage] },
        ]} />
      </ReportSection>

      <ReportSection title={`قائمة المستثمرين الموصى بهم (${recommended.length})`}>
        {recommended.map(({ client, match }, i) => (
          <div key={client.client_id} className="mb-5 pb-5 border-b border-[#F0EDE6] last:border-0 last:mb-0 last:pb-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${i === 0 ? 'bg-watheeq-gold text-white' : i === 1 ? 'bg-watheeq-navy/15 text-watheeq-navy' : 'bg-watheeq-bg-cream text-ink-muted'}`}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold text-[14px] text-watheeq-navy-deep">{client.name_ar}</p>
                  <p className="text-[12px] text-ink-muted">{clientClassificationLabels[client.classification]} · {client.city ?? '—'}</p>
                </div>
              </div>
              <div className="text-end">
                <p className="num font-bold text-[15px] text-watheeq-navy-deep">{formatCurrencyShort(match.expectedTicket)}</p>
                <p className="text-[11px] text-ink-muted">تذكرة متوقعة</p>
              </div>
            </div>
            <ScoreBar score={match.score} label="درجة التوافق" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {match.reasons.slice(0, 3).map((r, j) => (
                <span key={j} className="text-[11px] px-2 py-0.5 bg-state-success-bg text-state-success rounded border border-state-success/20 font-medium">✓ {r}</span>
              ))}
              {match.flags.map((f, j) => (
                <span key={j} className="text-[11px] px-2 py-0.5 bg-state-warning-bg text-state-warning rounded border border-state-warning/25 font-medium">⚠ {f}</span>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-ink-muted">
              <span>{empName(client.relationship_owner_id)}</span>
              <span className="num">آخر تواصل: {days(client.last_contact_date) ?? '—'} يوم</span>
            </div>
          </div>
        ))}
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// F. تقرير الزيارات الأسبوعي
// ─────────────────────────────────────────────
export function WeeklyVisitsReport({ notes }: { notes?: string } = {}) {
  return (
    <ReportShell>
      <ReportCover
        title="تقرير الزيارات الأسبوعي"
        subtitle={`خطة الزيارات والأهداف — ${WEEK_LABEL}`}
        reportType="weekly_visits" audience="management"
        generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `مُخطّط ${mockVisits.length} زيارات هذا الأسبوع. إجمالي القيمة المستهدفة ${formatCurrencyShort(mockVisits.reduce((s, v) => s + (v.expected_amount ?? 0), 0))}. ` +
          `${mockVisits.filter((v) => v.is_new_client).length} زيارة لعملاء جدد.`
        } />
      </ReportSection>

      <ReportSection title="مؤشرات أسبوع الزيارات">
        <ReportHeroNumbers items={[
          { label: 'إجمالي الزيارات',     value: String(mockVisits.length) },
          { label: 'عملاء جدد',           value: String(mockVisits.filter((v) => v.is_new_client).length), color: 'gold' },
          { label: 'قيمة الفرص المستهدفة', value: formatCurrencyShort(mockVisits.reduce((s, v) => s + (v.expected_amount ?? 0), 0)), color: 'default' },
          { label: 'تحتاج تحضيراً',        value: String(mockVisits.filter((v) => v.prep_required).length) },
        ]} />
      </ReportSection>

      <ReportSection title="جدول الزيارات">
        <ReportTable
          headers={['التاريخ', 'العميل', 'الصندوق', 'الهدف', 'القيمة المتوقعة', 'المسؤول']}
          rows={mockVisits.map((v) => [
            <span className="num">{formatDateShort(v.visit_date)}</span>,
            <span className="font-bold">{clientObj(v.client_id)?.name_ar ?? v.client_id}</span>,
            fundName(v.fund_id),
            v.purpose,
            v.expected_amount ? <span className="num font-bold">{formatCurrencyShort(v.expected_amount)}</span> : '—',
            empName(v.employee_id),
          ])}
        />
      </ReportSection>

      <ReportSection title="زيارات تتطلب دعم الإدارة">
        {mockVisits.filter((v) => v.management_note).map((v) => (
          <ReportInsight key={v.visit_id} icon="📌" tone="warning"
            label={clientObj(v.client_id)?.name_ar ?? ''}
            text={v.management_note ?? ''}
          />
        ))}
        {!mockVisits.some((v) => v.management_note) && (
          <p className="text-[13px] text-ink-muted">لا توجد زيارات تتطلب دعم إدارة هذا الأسبوع.</p>
        )}
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// G. فرص تحتاج تدخل الإدارة
// ─────────────────────────────────────────────
export function ManagementAttentionReport({ notes }: { notes?: string } = {}) {
  const now = Date.now();
  const items = mockPipeline
    .filter((p) => p.stage !== 'Closed' && p.stage !== 'Lost')
    .map((p) => {
      const client = clientObj(p.client_id);
      const reasons: string[] = [];
      if (p.ceo_attention_flag) reasons.push('مرفوع لرادار الإدارة');
      if (p.expected_amount > 15_000_000) reasons.push('قيمة عالية');
      if (client?.status === 'sensitive') reasons.push('عميل حساس');
      if (p.probability >= 0.7 && !p.next_step) reasons.push('احتمالية عالية بدون خطوة تالية');
      if (p.expected_close_date) {
        const dl = Math.floor((new Date(p.expected_close_date).getTime() - now) / 86_400_000);
        if (dl >= 0 && dl < 14) reasons.push(`تاريخ الإغلاق بعد ${dl} يوم`);
        if (dl < 0) reasons.push('تجاوز تاريخ الإغلاق');
      }
      return { opp: p, client, reasons };
    })
    .filter((x) => x.reasons.length > 0)
    .sort((a, b) => b.opp.expected_amount - a.opp.expected_amount);

  return (
    <ReportShell>
      <ReportCover
        title="فرص تحتاج تدخل الإدارة"
        subtitle="تقرير المخاطر والفرص الحرجة — يُرفع للرئيس التنفيذي"
        reportType="management_attention" audience="ceo"
        generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `تم رصد ${items.length} فرصة تحتاج قرارات أو تدخل من الإدارة العليا. ` +
          `القيمة الإجمالية للفرص المعنية: ${formatCurrencyShort(items.reduce((s, x) => s + x.opp.expected_amount, 0))}.`
        } />
      </ReportSection>

      <ReportSection title="الفرص الحرجة">
        <ReportHeroNumbers items={[
          { label: 'فرص تحتاج تدخل', value: String(items.length), color: 'danger' },
          { label: 'القيمة الإجمالية', value: formatCurrencyShort(items.reduce((s, x) => s + x.opp.expected_amount, 0)) },
          { label: 'قيمة عالية',      value: String(items.filter((x) => x.opp.expected_amount > 15_000_000).length), color: 'gold' },
          { label: 'عملاء حساسون',   value: String(items.filter((x) => x.client?.status === 'sensitive').length) },
        ]} />
      </ReportSection>

      <ReportSection title="تفاصيل الفرص">
        {items.map(({ opp, client, reasons }) => (
          <div key={opp.opportunity_id} className="mb-4 pb-4 border-b border-[#F0EDE6] last:border-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-[14px] text-watheeq-navy-deep">{client?.name_ar ?? opp.client_id}</p>
                <p className="text-[12px] text-ink-muted">{fundName(opp.fund_id)} · {empName(opp.owner_id)}</p>
              </div>
              <div className="text-end">
                <p className="num font-bold text-[14px]">{formatCurrencyShort(opp.expected_amount)}</p>
                <p className="num text-[12px] text-ink-muted">{formatPercent(opp.probability)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {reasons.map((r, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 bg-state-danger-bg text-state-danger rounded border border-state-danger/20 font-bold">{r}</span>
              ))}
            </div>
            <p className="text-[13px] text-ink-muted">{opp.next_step ?? 'لا توجد خطوة محددة'}</p>
          </div>
        ))}
      </ReportSection>

      <ReportSection title="الإجراءات المقترحة للإدارة" gold>
        {['تدخل مباشر من الإدارة في الفرص عالية القيمة والاحتمالية', 'مراجعة العملاء الحساسين مع مدير العلاقات', 'تحديد قرار نهائي للفرص التي تجاوزت موعد الإغلاق'].map((a, i) => (
          <div key={i} className="flex items-start gap-2 py-2">
            <span className="num text-[12px] text-watheeq-gold font-bold shrink-0">{i + 1}.</span>
            <span className="text-[14px] text-ink">{a}</span>
          </div>
        ))}
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// H. تقرير الإدارة الأسبوعي
// ─────────────────────────────────────────────
export function CEOWeeklyReport({ notes }: { notes?: string } = {}) {
  const dash = mockDashboard;
  const committed = mockPipeline.filter((p) => p.stage === 'Committed' || p.stage === 'Closed')
    .reduce((s, p) => s + p.expected_amount, 0);
  const atRisk = mockPipeline.filter((p) => p.ceo_attention_flag && p.stage !== 'Closed' && p.stage !== 'Lost');
  const latestFY = mockFinancials.at(-1);
  const bp2026 = mockBillionPlan.find((r) => r.year === 2026);

  return (
    <ReportShell>
      <ReportCover
        title="تقرير الإدارة الأسبوعي"
        subtitle={`ملخص تنفيذي — ${WEEK_LABEL}`}
        reportType="ceo_weekly" audience="ceo"
        generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `الأصول تحت الإدارة ${formatCurrencyShort(dash.total_aum)} بنمو مستمر. ` +
          `إنجاز المستهدف الشهري ${formatPercent(dash.achievement_pct)}. ` +
          `${atRisk.length} فرصة تحتاج قرار إداري هذا الأسبوع. ` +
          `${mockVisits.length} زيارة مجدولة.`
        } />
      </ReportSection>

      <ReportSection title="المؤشرات الرئيسية للأسبوع">
        <ReportHeroNumbers items={[
          { label: 'الأصول تحت الإدارة',    value: formatCurrencyShort(dash.total_aum), color: 'default' },
          { label: 'إيرادات السنة الحالية', value: formatCurrencyShort(dash.revenue_ytd), color: 'gold' },
          { label: 'إنجاز المستهدف الشهري', value: formatPercent(dash.achievement_pct),   color: dash.achievement_pct >= 0.85 ? 'success' : 'gold' },
          { label: 'تقدم خطة المليار',       value: formatPercent(dash.billion_progress_pct), color: 'default' },
        ]} />
      </ReportSection>

      <ReportSection title="تقدم تعبئة الصناديق">
        <ReportTable
          headers={['الصندوق', 'المرحلة', 'التغطية', 'المتبقي', 'عدد المستثمرين']}
          rows={mockFunds.filter((f) => f.stage === 'Fundraising' || f.stage === 'Managed').map((f) => [
            f.name_ar,
            fundStageLabels[f.stage],
            <div className="flex items-center gap-2">
              <ProgressBar value={clampPct(f.fundraising_progress_pct ?? 0)} tone="gold" size="sm" className="w-20" />
              <span className="num text-[12px] font-bold">{formatPercent(f.fundraising_progress_pct)}</span>
            </div>,
            <span className="num">{formatCurrencyShort(f.remaining_amount)}</span>,
            <span className="num">{f.investors_count}</span>,
          ])}
        />
      </ReportSection>

      {atRisk.length > 0 && (
        <ReportSection title="فرص تحتاج قرار هذا الأسبوع">
          {atRisk.map((o) => (
            <ReportInsight key={o.opportunity_id} icon="⚡" tone="warning"
              label={clientObj(o.client_id)?.name_ar ?? ''}
              text={`${fundName(o.fund_id)} · ${formatCurrencyShort(o.expected_amount)} · ${o.next_step ?? 'لا خطوة محددة'}`}
            />
          ))}
        </ReportSection>
      )}

      <ReportSection title="نشاط الفريق هذا الأسبوع">
        <ReportMetricCard label="زيارات مجدولة"     value={<span className="num">{mockVisits.length}</span>} />
        <ReportMetricCard label="فرص مفتوحة"        value={<span className="num">{mockPipeline.filter((p) => p.stage !== 'Closed' && p.stage !== 'Lost').length}</span>} />
        <ReportMetricCard label="التزامات جديدة"    value={<span className="num">{formatCurrencyShort(committed)}</span>} />
      </ReportSection>

      <ReportSection title="قرارات مطلوبة هذا الأسبوع" gold>
        {['مراجعة الفرص الحرجة والبت في الخطوات التالية', 'الاطلاع على تقرير تعبئة الصناديق تحت الاستقطاب', 'متابعة نتائج زيارات الأسبوع وتقديم الدعم اللازم'].map((d, i) => (
          <div key={i} className="flex items-start gap-2 py-2">
            <span className="num text-[12px] text-watheeq-gold font-bold shrink-0">{i + 1}.</span>
            <span className="text-[14px] text-ink">{d}</span>
          </div>
        ))}
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// I. تقرير أداء مدير العلاقة
// ─────────────────────────────────────────────
export function RMPerformanceReport({ ownerId = 'EMP-002', notes }: { ownerId?: string; notes?: string }) {
  const emp    = mockEmployees.find((e) => e.employee_id === ownerId) ?? mockEmployees[1];
  const myClients  = mockClients.filter((c) => c.relationship_owner_id === ownerId);
  const myOpps     = mockPipeline.filter((p) => p.owner_id === ownerId);
  const myVisits   = mockVisits.filter((v) => v.employee_id === ownerId);
  const closed     = myOpps.filter((p) => p.stage === 'Closed');
  const open       = myOpps.filter((p) => p.stage !== 'Closed' && p.stage !== 'Lost');
  const stale      = myClients.filter((c) => c.last_contact_date && (Date.now() - new Date(c.last_contact_date).getTime()) / 86_400_000 > 30);
  const convRate   = myOpps.length > 0 ? closed.length / myOpps.length : 0;

  return (
    <ReportShell>
      <ReportCover
        title="تقرير أداء مدير العلاقة"
        subtitle={`تقييم أداء ${emp.name_ar} — ${formatDate(new Date().toISOString())}`}
        reportType="rm_performance" audience="management"
        generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `يُغطي هذا التقرير أداء ${emp.name_ar} (${emp.role}). ` +
          `يُدير ${myClients.length} عملاء بقيمة استثمار ${formatCurrencyShort(myClients.reduce((s, c) => s + (c.total_invested ?? 0), 0))}. ` +
          `معدل التحويل ${formatPercent(convRate)}.`
        } />
      </ReportSection>

      <ReportSection title="المؤشرات الرئيسية">
        <ReportHeroNumbers items={[
          { label: 'العملاء المُداروّن',  value: String(myClients.length) },
          { label: 'الفرص المفتوحة',     value: String(open.length), color: 'gold' },
          { label: 'معدل التحويل',       value: formatPercent(convRate), color: 'success' },
          { label: 'زيارات الأسبوع',    value: String(myVisits.length) },
        ]} />
      </ReportSection>

      <ReportSection title="تفاصيل الأداء">
        <ReportMetricCard label="قيمة محفظة العملاء"  value={<span className="num">{formatCurrencyShort(myClients.reduce((s, c) => s + (c.total_invested ?? 0), 0))}</span>} />
        <ReportMetricCard label="قيمة البايبلاين"     value={<span className="num">{formatCurrencyShort(open.reduce((s, p) => s + p.expected_amount, 0))}</span>} />
        <ReportMetricCard label="صفقات مغلقة"         value={<span className="num">{closed.length}</span>} />
        <ReportMetricCard label="عملاء غير متابَعين"  value={<span className={`num ${stale.length > 0 ? 'text-state-warning font-bold' : ''}`}>{stale.length}</span>} />
      </ReportSection>

      {stale.length > 0 && (
        <ReportSection title="عملاء يحتاجون متابعة">
          <ReportTable
            headers={['العميل', 'آخر تواصل (يوم)', 'الفرص المفتوحة']}
            rows={stale.map((c) => [c.name_ar, <span className="num text-state-warning font-bold">{days(c.last_contact_date)}</span>, <span className="num">{myOpps.filter((o) => o.client_id === c.client_id && o.stage !== 'Closed').length}</span>])}
          />
        </ReportSection>
      )}

      <ReportSection title="نقاط التحسين المقترحة" gold>
        <ReportInsight icon="📈" tone="success" label="نقاط القوة"
          text={`معدل تحويل ${formatPercent(convRate)} ونشاط زيارات منتظم.`} />
        {stale.length > 0 && (
          <ReportInsight icon="⚠" tone="warning" label="مجال للتحسين"
            text={`${stale.length} عميل لم يتم التواصل معهم منذ أكثر من شهر.`} />
        )}
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

// ─────────────────────────────────────────────
// K. تقرير تحديث الصندوق (يقرأ بيانات حية مُمرّرة من الصفحة)
// ─────────────────────────────────────────────
import type { Client, Fund, Holding } from '@/types';

export function FundUpdateReport({
  fund,
  client,
  holding,
  notes,
}: {
  fund: Fund;
  client?: Client;
  holding?: Holding | null;
  notes?: string;
}) {
  const progress = clampPct(fund.fundraising_progress_pct ?? 0);
  const isPersonal = !!client;
  const hasHolding = !!holding;
  const investedAmount = holding?.invested_amount ?? 0;
  const currentValue   = holding?.current_value   ?? 0;
  const realizedProfit = holding?.realized_profit ?? 0;
  const clientReturnPct = investedAmount > 0 ? realizedProfit / investedAmount : 0;

  // Title / subtitle / period prefer report fields, fallback to generic
  const reportTitle    = fund.report_title    || `تحديث ${fund.name_ar}`;
  const reportPeriod   = fund.report_period;
  const titleSubtitle  = isPersonal
    ? `${reportTitle} — معدّ خصيصاً لـ ${client!.name_ar}`
    : `${reportTitle} — للمستثمرين والإدارة`;

  return (
    <ReportShell>
      <ReportCover
        title={reportTitle}
        subtitle={titleSubtitle}
        reportType="fund_update"
        audience={isPersonal ? 'client' : 'management'}
        clientName={client?.name_ar}
        fundName={fund.name_ar}
        generatedAt={fund.last_updated ?? new Date().toISOString()}
      />

      {/* Period + status banner */}
      {(reportPeriod || fund.report_status) && (
        <ReportSection>
          <div className="flex flex-wrap gap-2 text-[12px]">
            {reportPeriod && (
              <span className="px-3 py-1 rounded-full border border-watheeq-gold/30 bg-watheeq-gold/8 text-watheeq-gold-deep font-bold num">
                {reportPeriod}
              </span>
            )}
            {fund.report_status && (
              <span className="px-3 py-1 rounded-full border border-line text-ink-muted font-medium">
                {fund.report_status}
              </span>
            )}
            {fund.last_updated && (
              <span className="px-3 py-1 rounded-full border border-line/60 text-ink-faint">
                آخر تحديث: <span className="num">{formatDate(fund.last_updated)}</span>
              </span>
            )}
          </div>
        </ReportSection>
      )}

      {/* Personal context: missing-data fallback notice */}
      {isPersonal && !hasHolding && (
        <ReportSection>
          <ReportInsight
            icon="ℹ"
            tone="warning"
            label="ملاحظة بشأن البيانات"
            text="بيانات الاستثمار الخاصة بهذا العميل غير مكتملة حاليًا في المصدر، ويعرض هذا التقرير التحديث العام للصندوق."
          />
        </ReportSection>
      )}

      {/* Executive summary — prefer field, fallback to generated */}
      <ReportSection>
        <ReportExecutiveSummary text={
          fund.executive_summary
          ?? (isPersonal && hasHolding
              ? `يستعرض هذا التقرير أداء ${fund.name_ar} وحصة ${client!.name_ar} فيه. ` +
                `حصة العميل المستثمرة ${formatCurrencyShort(investedAmount)} بقيمة سوقية حالية ${formatCurrencyShort(currentValue)}. ` +
                `الصندوق في مرحلة ${fundStageLabels[fund.stage]} بنسبة استقطاب ${formatPercent(progress)} من المستهدف.`
              : `يستعرض هذا التقرير الوضع العام لـ ${fund.name_ar}. ` +
                `الصندوق في مرحلة ${fundStageLabels[fund.stage]} بنسبة استقطاب ${formatPercent(progress)} من حجم مستهدف ${formatCurrencyShort(fund.target_size)}. ` +
                `العائد المتوقع ${formatPercent(fund.expected_return_pct)} على مدى ${fund.duration_years ?? '—'} سنوات.`)
        } />
      </ReportSection>

      {/* Per-client metrics (only when holding exists) */}
      {isPersonal && hasHolding && (
        <ReportSection title="حصة العميل في الصندوق" gold>
          <ReportHeroNumbers items={[
            { label: 'حصة العميل المستثمرة', value: formatCurrencyShort(investedAmount), color: 'default' },
            { label: 'القيمة الحالية',       value: formatCurrencyShort(currentValue),   color: 'success' },
            { label: 'الأرباح المحققة',      value: formatCurrencyShort(realizedProfit), color: 'success' },
            { label: 'العائد على الحصة',     value: formatPercent(clientReturnPct),       color: 'gold' },
          ]} />
        </ReportSection>
      )}

      {/* Project profile — only if any project field is present */}
      {(fund.project_name || fund.project_location || fund.asset_type || fund.near_haram) && (
        <ReportSection title="نبذة عن المشروع">
          {fund.project_name      && <ReportMetricCard label="اسم المشروع"   value={fund.project_name} />}
          {fund.project_location  && <ReportMetricCard label="الموقع"        value={fund.project_location} />}
          {fund.near_haram        && <ReportMetricCard label="القرب من الحرم" value={fund.near_haram} />}
          {fund.asset_type        && <ReportMetricCard label="نوع الأصل"      value={fund.asset_type} />}
        </ReportSection>
      )}

      {/* Project specs — areas, units, value, FAR */}
      {(fund.units_count !== undefined || fund.land_area !== undefined || fund.built_up_area !== undefined ||
        fund.sellable_area !== undefined || fund.far !== undefined || fund.project_value !== undefined ||
        fund.duration || fund.sales_model) && (
        <ReportSection title="مواصفات المشروع">
          {fund.units_count !== undefined && (
            <ReportMetricCard label="عدد الوحدات" value={<span className="num">{fund.units_count}</span>} />
          )}
          {fund.land_area !== undefined && (
            <ReportMetricCard label="مساحة الأرض" value={<span className="num">{fund.land_area.toLocaleString('en')} م²</span>} />
          )}
          {fund.built_up_area !== undefined && (
            <ReportMetricCard label="المساحة الإجمالية المبنية" value={<span className="num">{fund.built_up_area.toLocaleString('en')} م²</span>} />
          )}
          {fund.sellable_area !== undefined && (
            <ReportMetricCard label="المساحة القابلة للبيع" value={<span className="num">{fund.sellable_area.toLocaleString('en')} م²</span>} />
          )}
          {fund.far !== undefined && (
            <ReportMetricCard label="معامل البناء (FAR)" value={<span className="num">{fund.far}</span>} />
          )}
          {fund.project_value !== undefined && (
            <ReportMetricCard label="قيمة المشروع" value={<span className="num">{formatCurrency(fund.project_value)}</span>} />
          )}
          {fund.duration     && <ReportMetricCard label="مدة المشروع" value={fund.duration} />}
          {fund.sales_model  && <ReportMetricCard label="نموذج البيع" value={fund.sales_model} />}
        </ReportSection>
      )}

      {/* Construction progress */}
      {(fund.pre_construction_progress !== undefined || fund.overall_progress !== undefined) && (
        <ReportSection title="نسب الإنجاز">
          {fund.pre_construction_progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between mb-1.5 text-[13px]">
                <span className="text-ink-soft font-medium">ما قبل الإنشاء</span>
                <span className="num font-bold text-watheeq-navy-deep">{formatPercent(fund.pre_construction_progress)}</span>
              </div>
              <ProgressBar value={clampPct(fund.pre_construction_progress)} tone="gold" size="md" />
            </div>
          )}
          {fund.overall_progress !== undefined && (
            <div>
              <div className="flex justify-between mb-1.5 text-[13px]">
                <span className="text-ink-soft font-medium">الإنجاز الكلي</span>
                <span className="num font-bold text-watheeq-navy-deep">{formatPercent(fund.overall_progress)}</span>
              </div>
              <ProgressBar value={clampPct(fund.overall_progress)} tone="gold" size="md" />
            </div>
          )}
        </ReportSection>
      )}

      {/* Fund metrics + commitment progress (always shown) */}
      <ReportSection title="مؤشرات الصندوق الرئيسية">
        <ReportHeroNumbers items={[
          { label: 'حجم الصندوق',         value: formatCurrencyShort(fund.target_size),      color: 'default' },
          { label: 'الالتزامات الحالية',  value: formatCurrencyShort(fund.committed_amount), color: 'success' },
          { label: 'العائد المتوقع',       value: formatPercent(fund.expected_return_pct),    color: 'gold' },
          { label: 'عدد المستثمرين',      value: String(fund.investors_count ?? 0),           color: 'default' },
        ]} />
      </ReportSection>

      <ReportSection title="نسبة الاستقطاب">
        <div className="space-y-2">
          <ProgressBar value={progress} tone="gold" size="lg" />
          <div className="flex justify-between text-[13px]">
            <span className="num text-ink-muted">{formatCurrencyShort(fund.committed_amount)} محقق</span>
            <span className="num font-bold text-watheeq-gold-deep">{formatPercent(progress)}</span>
            <span className="num text-ink-muted">{formatCurrencyShort(fund.target_size)} مستهدف</span>
          </div>
        </div>
      </ReportSection>

      {/* Achievements */}
      {fund.achievements && (
        <ReportSection title="الإنجازات">
          <RichText text={fund.achievements} />
        </ReportSection>
      )}

      {/* Monthly summaries */}
      {(fund.jan_summary || fund.feb_summary || fund.mar_summary) && (
        <ReportSection title="ملخصات شهرية">
          {fund.jan_summary && (
            <div className="mb-4">
              <p className="text-[12px] font-bold text-watheeq-gold-deep uppercase tracking-wider mb-1.5">يناير</p>
              <RichText text={fund.jan_summary} />
            </div>
          )}
          {fund.feb_summary && (
            <div className="mb-4">
              <p className="text-[12px] font-bold text-watheeq-gold-deep uppercase tracking-wider mb-1.5">فبراير</p>
              <RichText text={fund.feb_summary} />
            </div>
          )}
          {fund.mar_summary && (
            <div>
              <p className="text-[12px] font-bold text-watheeq-gold-deep uppercase tracking-wider mb-1.5">مارس</p>
              <RichText text={fund.mar_summary} />
            </div>
          )}
        </ReportSection>
      )}

      {/* Approvals */}
      {(fund.approvals_completed || fund.approvals_pending) && (
        <ReportSection title="الموافقات والاعتمادات">
          {fund.approvals_completed && (
            <ReportInsight
              icon="✓"
              tone="success"
              label="تمت الموافقات"
              text={fund.approvals_completed}
            />
          )}
          {fund.approvals_pending && (
            <div className="mt-3">
              <ReportInsight
                icon="⏳"
                tone="warning"
                label="قيد الإنجاز"
                text={fund.approvals_pending}
              />
            </div>
          )}
        </ReportSection>
      )}

      {/* What this means for the investor */}
      {fund.investor_meaning && (
        <ReportSection title="ماذا يعني هذا للمستثمر؟" gold>
          <RichText text={fund.investor_meaning} />
        </ReportSection>
      )}

      {/* Generic fund details (always shown — useful at-a-glance) */}
      <ReportSection title="تفاصيل الصندوق">
        <ReportMetricCard label="فئة الأصول"        value={assetClassLabels[fund.asset_class]} />
        <ReportMetricCard label="مرحلة الصندوق"     value={fundStageLabels[fund.stage]} />
        <ReportMetricCard label="حجم الصندوق"       value={<span className="num">{formatCurrency(fund.target_size)}</span>} />
        <ReportMetricCard label="الالتزامات الحالية" value={<span className="num">{formatCurrency(fund.committed_amount)}</span>} />
        <ReportMetricCard label="المبلغ المتبقي"     value={<span className="num text-state-warning">{formatCurrency(fund.remaining_amount)}</span>} />
        <ReportMetricCard label="مدة الصندوق"
          value={fund.duration_years ? <span className="num">{fund.duration_years} سنوات</span> : '—'} />
        {fund.fund_close_date && (
          <ReportMetricCard label="تاريخ الإغلاق المستهدف"
            value={<span className="num">{formatDate(fund.fund_close_date)}</span>} />
        )}
        <ReportMetricCard label="مدير الصندوق" value={empName(fund.fund_manager_id)} />
      </ReportSection>

      {/* Next steps */}
      <ReportSection title={isPersonal ? 'الإجراء التالي' : 'الخطوات القادمة'} gold>
        {fund.next_steps ? (
          <RichText text={fund.next_steps} />
        ) : (
          <ReportInsight
            icon="➜"
            tone="success"
            label={isPersonal ? 'إجراء مقترح' : 'الخطوات القادمة'}
            text={isPersonal && hasHolding
              ? `جدولة اجتماع لمراجعة أداء حصة العميل في ${fund.name_ar} ومناقشة فرص زيادة الالتزام في الإغلاقات القادمة.`
              : isPersonal
                ? `التواصل مع العميل لتقديم نظرة عامة عن ${fund.name_ar} ومناقشة جدوى الانضمام في الإغلاقات القادمة.`
                : `استمرار جهود الاستقطاب لاستكمال ${formatCurrencyShort(fund.remaining_amount)} المتبقية من المستهدف، مع التركيز على المستثمرين المؤسسيين والمكاتب العائلية.`}
          />
        )}
      </ReportSection>

      {/* Custom disclaimer (overrides default footer disclaimer) */}
      {fund.disclaimer && (
        <ReportSection title="تنويه">
          <p className="text-[13px] text-ink-muted leading-relaxed">{fund.disclaimer}</p>
        </ReportSection>
      )}

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}

      <ReportFooter disclaimer={!fund.disclaimer} />
    </ReportShell>
  );
}

// Small helper: render multi-line text from a sheet cell (preserves line breaks
// and renders bullet markers like "- " or "• " as a list-feel paragraph).
function RichText({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="text-[14px] text-ink leading-relaxed">{text}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {lines.map((line, i) => {
        const cleaned = line.replace(/^[-•*]\s*/, '');
        return (
          <li key={i} className="text-[14px] text-ink leading-relaxed flex items-start gap-2">
            <span className="text-watheeq-gold shrink-0 mt-1.5 w-1 h-1 rounded-full bg-watheeq-gold" aria-hidden="true" />
            <span>{cleaned}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ─────────────────────────────────────────────
// J. تقرير SLA والمتابعة
// ─────────────────────────────────────────────
export function SLAReport({ notes }: { notes?: string } = {}) {
  const now = Date.now();
  const overdueCl = mockClients.filter((c) => c.last_contact_date && (now - new Date(c.last_contact_date).getTime()) / 86_400_000 > 30);
  const noStep    = mockPipeline.filter((p) => !p.next_step && p.stage !== 'Closed' && p.stage !== 'Lost');
  const overdue   = mockPipeline.filter((p) => p.next_step_date && (now - new Date(p.next_step_date).getTime()) / 86_400_000 > 5 && p.stage !== 'Closed');

  return (
    <ReportShell>
      <ReportCover
        title="تقرير SLA والمتابعة"
        subtitle="رصد انضباط المتابعة وتنبيهات التأخر — للإدارة"
        reportType="sla_followup" audience="management"
        generatedAt={new Date().toISOString()}
      />

      <ReportSection>
        <ReportExecutiveSummary text={
          `رصد النظام ${overdueCl.length} عميل لم يُتواصل معهم منذ أكثر من 30 يوم، ` +
          `${noStep.length} فرصة بدون خطوة تالية، و${overdue.length} فرصة متأخر في متابعتها.`
        } />
      </ReportSection>

      <ReportSection title="ملخص مؤشرات SLA">
        <ReportHeroNumbers items={[
          { label: 'عملاء بدون تواصل +30 يوم', value: String(overdueCl.length), color: 'danger' },
          { label: 'فرص بدون خطوة تالية',      value: String(noStep.length),    color: 'gold' },
          { label: 'فرص متأخرة في المتابعة',   value: String(overdue.length),   color: 'danger' },
          { label: 'إجمالي في خطر SLA',        value: String(overdueCl.length + noStep.length), color: 'default' },
        ]} />
      </ReportSection>

      {overdueCl.length > 0 && (
        <ReportSection title="عملاء لم يُتواصل معهم (أكثر من 30 يوم)">
          <ReportTable
            headers={['العميل', 'آخر تواصل (يوم)', 'المسؤول', 'مستوى الخطر']}
            rows={overdueCl.map((c) => {
              const d = days(c.last_contact_date)!;
              return [
                c.name_ar,
                <span className="num font-bold text-state-warning">{d}</span>,
                empName(c.relationship_owner_id),
                d > 60 ? <Badge tone="danger" size="sm">عالي</Badge> : <Badge tone="warning" size="sm">متوسط</Badge>,
              ];
            })}
          />
        </ReportSection>
      )}

      {noStep.length > 0 && (
        <ReportSection title="فرص بدون خطوة تالية">
          <ReportTable
            headers={['العميل', 'الصندوق', 'المرحلة', 'القيمة', 'المسؤول']}
            rows={noStep.map((p) => [
              clientObj(p.client_id)?.name_ar ?? p.client_id,
              fundName(p.fund_id),
              pipelineStageLabels[p.stage],
              <span className="num font-bold">{formatCurrencyShort(p.expected_amount)}</span>,
              empName(p.owner_id),
            ])}
          />
        </ReportSection>
      )}

      <ReportSection title="الإجراء الموصى به" gold>
        <ReportInsight icon="📋" tone="warning" label="قرار مطلوب"
          text="مراجعة قائمة التأخر مع كل مدير علاقة وإنشاء خطة متابعة أسبوعية. الهدف: صفر فرص بدون خطوة تالية." />
      </ReportSection>

      {notes && (
        <ReportSection title="ملاحظات إضافية" gold>
          <div style={{ fontSize: 14, color: '#3A3A3A', lineHeight: 1.7, padding: '12px 16px', background: 'rgba(200,164,93,0.06)', borderRadius: 8, borderRight: '3px solid #C8A45D' }}>{notes}</div>
        </ReportSection>
      )}
      <ReportFooter />
    </ReportShell>
  );
}

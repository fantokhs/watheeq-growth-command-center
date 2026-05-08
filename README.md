# 🏛️ غرفة قيادة النمو في وثيق

**Watheeq Growth Command Center — Phase 1 Vertical Slice**

لوحة قيادة تنفيذية بالعربية لشركة وثيق المالية، مبنية بـ React + TypeScript + Tailwind،
مع دعم RTL كامل ونظام هوية بصرية مطابق لهوية وثيق.

---

## 🎯 ما المُنفّذ في Phase 1

هذه نسخة عمودية (Vertical Slice) — تعني أن الطبقات كلها مكتملة (طبقة البيانات + المكونات + التصميم + الـ Routing)
لكن الصفحات المرئية محدودة بصفحة **لوحة القيادة التنفيذية** فقط، لإثبات الجودة قبل التوسع.

### ✅ ما يعمل الآن
- **بنية المشروع:** React 18 + TypeScript + Vite + Tailwind 3
- **RTL Arabic UI** كامل (HTML lang/dir + Tailwind logical properties)
- **هوية وثيق:** ألوان Navy/Gold، خطوط HSN Shahd Regular & Bold، شعار، نمط Hex خفيف كخلفية
- **Sidebar** — قائمة جانبية يمنى داكنة بكل الصفحات (الـ ٩ القادمة بشارة "قريباً")
- **TopBar** — يحتوي عنوان الصفحة + شارة "بيانات تجريبية" + زر تحديث + آخر وقت تحديث
- **AppLayout** + **Footer**
- **صفحة لوحة القيادة التنفيذية** كاملة:
  - ٤ بطاقات KPI رئيسية (AUM، الإيرادات، صافي الربح، البايبلاين)
  - ٤ بطاقات KPI ثانوية (الصناديق، العملاء، الزيارات، تنبيه الإدارة)
  - لوحة "فرص تحتاج تدخل الإدارة" بجدول قابل للترتيب
  - لوحة مستهدف الشهر + تقدم خطة المليار
  - مخطط البايبلاين حسب المرحلة (Recharts BarChart)
  - مخطط الإيرادات وصافي الربح (Recharts LineChart)
  - لوحة خطة المليار حتى ٢٠٢٩
  - زيارات الأسبوع
- **طبقة CSV Integration** — جاهزة بالكامل، تنتظر روابط CSV الحقيقية فقط
- **Mock Data** — بيانات تجريبية متسقة منطقياً تعمل كـ fallback
- **مكونات قابلة لإعادة الاستخدام:**
  `KPICard` · `ChartCard` · `DataTable` · `Badge` · `FilterBar` · `LoadingState` · `ErrorState` · `EmptyState` · `RefreshButton` · `ProgressBar` · `WatheeqLogo`

### 🔜 Phase 2 (لم يُبنَ بعد)
صفحات: العملاء، الصناديق، البايبلاين، زيارات الأسبوع، أداء الفريق، خطة المليار التفصيلية،
سجل التقارير، المؤشرات المالية، جودة البيانات.

---

## ⚙️ المتطلبات

| الأداة      | الإصدار الأدنى |
| ----------- | -------------- |
| Node.js     | 18.x           |
| npm         | 9.x (مرفق مع Node) |

تأكد من Node بكتابة:
```bash
node --version
```

---

## 🚀 تشغيل المشروع محلياً — خطوة بخطوة

### الخطوة ١: فك ضغط المشروع
```bash
unzip watheeq-dashboard.zip
cd watheeq-dashboard
```

### الخطوة ٢: تثبيت المكتبات
```bash
npm install
```
المتوقع يستغرق ١-٣ دقائق حسب سرعة الإنترنت.

### الخطوة ٣: تشغيل وضع التطوير
```bash
npm run dev
```
سيفتح المتصفح تلقائياً على: **http://localhost:5173**

ستلاحظ شارة برتقالية "بيانات تجريبية" في أعلى الصفحة — هذا طبيعي،
لأن روابط CSV لم تُربط بعد. الواجهة تعمل بشكل كامل على البيانات الوهمية.

### الخطوة ٤ (اختياري): بناء نسخة الإنتاج
```bash
npm run build
npm run preview
```

### أوامر إضافية
```bash
npm run lint    # فحص أخطاء TypeScript فقط (بدون build)
```

---

## 🔌 ربط Google Sheet (تحويل البيانات من Mock إلى Live)

### الخطوة ١: نشر كل تاب كـ CSV
في Google Sheet:
1. افتح الملف `Watheeq_Growth_Command_Center_Database_v0_2_AR`
2. **File → Share → Publish to web**
3. في القائمة المنسدلة على اليسار، اختر التاب المحدد (وليس "Entire Document")
4. اختر صيغة **Comma-separated values (.csv)**
5. اضغط **Publish**
6. انسخ الرابط الذي يظهر (يبدأ بـ `https://docs.google.com/spreadsheets/d/e/.../pub?...&output=csv`)
7. كرر العملية لكل تاب من التابات الـ ١٣

### الخطوة ٢: لصق الروابط في الكود
افتح الملف:
```
src/config/sheetsConfig.ts
```

ستجد ١٣ سطراً بهذا الشكل:
```ts
clients: 'PASTE_CLIENTS_CSV_URL_HERE',
funds:   'PASTE_FUNDS_CSV_URL_HERE',
// …
```

استبدل كل placeholder برابط CSV المقابل من الخطوة ١.

### الخطوة ٣: حفظ + Vite يعيد التحميل تلقائياً
- شارة "بيانات تجريبية" ستختفي من على رؤوس الصفحات
- البيانات ستأتي مباشرة من Google Sheet
- ⚡ كل تعديل في Sheet يظهر بعد ضغط زر "تحديث البيانات" أو خلال ٥ دقائق تلقائياً

> 💡 **ميزة مهمة:** لو فشل جلب أي تاب (مشكلة شبكة، نشر معطّل…)
> النظام يقع تلقائياً على الـ mock data ويستمر في العمل. لن تنكسر اللوحة أبداً.

---

## 🗂️ بنية المشروع

```
watheeq-dashboard/
├── public/
│   ├── fonts/              ← خطوط HSN Shahd
│   └── logo/               ← شعارات وثيق
├── src/
│   ├── assets/             ← (ملفات SVG/صور لاحقاً)
│   ├── components/
│   │   ├── brand/          ← WatheeqLogo
│   │   ├── layout/         ← Sidebar, TopBar, AppLayout
│   │   └── ui/             ← المكونات القابلة لإعادة الاستخدام
│   ├── config/
│   │   └── sheetsConfig.ts ← ⭐ روابط CSV لكل تاب
│   ├── data/
│   │   └── mockData.ts     ← بيانات تجريبية (fallback)
│   ├── hooks/
│   │   └── index.ts        ← React Query hooks
│   ├── lib/
│   │   ├── format.ts       ← formatCurrency, formatDate, etc.
│   │   ├── arabicLabels.ts ← تسميات عربية للـ enums
│   │   └── utils.ts        ← cn helper
│   ├── pages/
│   │   └── ExecutiveOverview.tsx  ← ⭐ الصفحة الوحيدة في Phase 1
│   ├── services/
│   │   ├── csvFetcher.ts   ← طبقة الجلب
│   │   └── repositories/   ← دوال جلب لكل entity
│   ├── styles/
│   │   ├── fonts.css       ← @font-face
│   │   ├── globals.css     ← base + utilities
│   │   └── brandTokens.ts  ← المصدر الموحّد لقيم الهوية
│   ├── types/
│   │   └── index.ts        ← TypeScript types لكل الـ schema
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🧠 قرارات معمارية مهمة

| القرار | السبب |
| --- | --- |
| **CSV Published بدلاً من Sheets API** | لا يحتاج OAuth ولا API keys ولا backend. يمكن تشغيل اللوحة فوراً. |
| **Mock data كـ fallback تلقائي** | تطوير الواجهة لا يتوقف انتظاراً لربط البيانات. أي خلل في الجلب لا يكسر اللوحة. |
| **React Query** | كاش ذكي + إعادة جلب تلقائية + حالات Loading/Error بدون كود متكرر. |
| **HSN Shahd داخل /public/fonts** | تحميل محلي = لا يعتمد على شبكات خارجية، استقرار في العرض. |
| **TypeScript strict** | اكتشاف أخطاء في وقت الكتابة لا في وقت التشغيل. |
| **brandTokens.ts** | أي تغيير في الهوية يحدث في ملف واحد فقط، ينعكس على كل اللوحة. |
| **ميلادي افتراضياً** | متطلب صريح. يمكن إضافة الهجري لاحقاً عبر `Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura')`. |
| **عملة بصيغتين** | الكامل `1,250,000 ر.س` للجداول، المختصر `5.2B ر.س` لـ KPI. |

---

## 🎨 نظام التصميم

- **اللون الأساسي:** Navy Deep `#071A2C`
- **اللون المميّز:** Gold `#C8A45D` — يستخدم كـ "مجوهرات" نادرة فقط (الشريط النشط، التركيز، أرقام مهمة)
- **خلفية المحتوى:** `#F7F5F0` (بيج دافئ + نمط Hex خفيف جداً)
- **بطاقات:** `#FDFCF8` بحدود `#E5E1D8`
- **النصوص الأساسية:** `#1C1C1C`، الثانوية `#6B7280`
- **الخط:** HSN Shahd (تحميل محلي) → fallback IBM Plex Sans Arabic

---

## ⚠️ ملاحظات مهمة

- **هذه ليست بيانات وثيق الفعلية** — وفقاً لملاحظة README في الـ Sheet:
  "أسماء العملاء والآفاق الاستثمارية المستخدمة في الملف عينات للتجربة فقط".
- مكتوب بشكل modular لـ Phase 2 — إضافة صفحة جديدة = ملف واحد في `src/pages/` + سطر في `App.tsx`.
- لا يوجد backend ولا قاعدة بيانات. كل شيء client-side — مناسب جداً للتشغيل الداخلي.

---

## 📞 للدعم

عبدالرحنن الفنتوخ — مدير التواصل المؤسسي وتطوير الأعمال
وثيق المالية | Watheeq Capital
ترخيص هيئة السوق المالية رقم 32-18189

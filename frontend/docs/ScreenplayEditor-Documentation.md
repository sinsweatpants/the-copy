# توثيق محرر السيناريو العربي 🎬📝

## جدول المحتويات
1. [نظرة عامة](#نظرة-عامة)
2. [البدء السريع](#البدء-السريع)
3. [أنواع التنسيق](#أنواع-التنسيق-المدعومة)
4. [الاختصارات والتحكم](#الاختصارات-الأساسية)
5. [التصنيف الذكي للنصوص](#التصنيف-الذكي-المتقدم)
6. [إدارة المشاريع والحفظ](#إدارة-المشاريع)
7. [التخصيص والإعدادات](#الإعدادات-المتقدمة)
8. [التصدير والطباعة](#التصدير-والطباعة)
9. [أدوات التطوير](#أدوات-التطوير-والapi)
10. [استكشاف الأخطاء](#استكشاف-الأخطاء)
11. [الأسئلة الشائعة](#الأسئلة-الشائعة)
12. [دليل المطورين](#دليل-المطورين)

## نظرة عامة
محرر السيناريو العربي هو أداة متقدمة لكتابة وتحرير السيناريوهات باللغة العربية مع دعم كامل للتنسيق الاحترافي والمعايير الدولية لكتابة السيناريو.

## المميزات الرئيسية

### 1. التصنيف الذكي للنصوص
- تصنيف تلقائي للأسطر حسب نوع المحتوى (بسملة، عنوان مشهد، فعل، شخصية، حوار، انتقال)
- دعم اللغة العربية مع قاموس الأفعال الشائعة
- تعرف ذكي على أسماء الأماكن والشخصيات

### 2. الواجهة المتقدمة
- شريط قوائم كامل (ملف، تحرير، عرض، أدوات)
- أشرطة أدوات للتنسيق السريع
- دعم الوضع المظلم والفاتح
- واجهة RTL مع دعم كامل للعربية

### 3. أدوات التحرير
- اختصارات لوحة المفاتيح الشاملة
- أدوات البحث والاستبدال
- إعادة تسمية الشخصيات
- حفظ تلقائي

### 4. التخطيط والطباعة
- محاكاة صفحات A4 مع ترقيم
- مساطر أفقية وعمودية
- إحصائيات مفصلة (كلمات، أحرف، صفحات، مشاهد)

## البدء السريع

### التثبيت والإعداد الأولي

#### 1. متطلبات النظام
- **نظام التشغيل:** Windows 10+، macOS 10.14+، Linux Ubuntu 18.04+
- **المتصفح:** Chrome 90+، Firefox 88+، Safari 14+، Edge 90+
- **ذاكرة الوصول العشوائي:** 4 جيجابايت كحد أدنى، 8 جيجابايت مُوصى به
- **مساحة التخزين:** 100 ميجابايت للتطبيق + مساحة للمشاريع

#### 2. بدء الاستخدام الفوري

1. **إنشاء مشروع جديد:**
   - انقر على "ملف" → "جديد"
   - أو استخدم الاختصار `Ctrl+N`

2. **كتابة البسملة:**
   - ابدأ بكتابة "بسم الله الرحمن الرحيم"
   - ستظهر تلقائياً على الجانب الأيسر

3. **إنشاء مشهد:**
   - اكتب "مشهد 1 ليل - داخلي"
   - سيتم تصنيفه تلقائياً كعنوان مشهد

### إنشاء أول سيناريو

#### خطوات سريعة:
```
1. افتح المحرر
2. ابدأ بكتابة "بسم الله الرحمن الرحيم"
3. اضغط Enter واكتب "مشهد 1 ليل - داخلي"
4. اضغط Enter واكتب اسم المكان
5. ابدأ في كتابة الأحداث والحوارات
```

#### مثال سيناريو مكتمل:
```
بسم الله الرحمن الرحيم

مشهد 1                    ليل - داخلي

مسجد السيد البدوي

المسجد مضاء بنور خافت من الثريات المعلقة. السجاد الأحمر يغطي الأرضية، والجدران مزينة بآيات قرآنية.

أحمد :
     (ينظر حوله بخشوع)
     اللهم اهدني فيمن هديت.

يدخل أحمد إلى المسجد بخطوات بطيئة ومتأنية.

أحمد :
     ربي إني أسألك من فضلك ورحمتك.

ينحني أحمد في سجوده أمام المحراب.

قطع إلى:

مشهد 2                    نهار - خارجي

باحة المسجد
```

## أنواع التنسيق المدعومة

#### البسملة (`basmala`)
```
بسم الله الرحمن الرحيم
```
- **الموضع:** يسار الصفحة
- **الخط:** عريض، 16pt
- **الاختصار:** لا يوجد (تصنيف تلقائي)

#### عنوان المشهد المستوى 1 (`scene-header-1`)
```
مشهد 1                    ليل - داخلي
```
- **الموضع:** مقسم بين اليمين واليسار
- **الخط:** عريض، أحرف كبيرة
- **الاختصار:** `Ctrl+1`

#### عنوان المشهد المستوى 3 (`scene-header-3`)
```
مسجد السيد البدوي
```
- **الموضع:** وسط الصفحة
- **الخط:** عريض
- **الاختصار:** `Tab` بعد عنوان المشهد

#### الفعل/الحدث (`action`)
```
يدخل أحمد إلى الغرفة بسرعة ويلقي نظرة حوله
```
- **الموضع:** يمين الصفحة
- **الخط:** عادي
- **الاختصار:** `Ctrl+4`

#### الشخصية (`character`)
```
أحمد :
```
- **الموضع:** وسط الصفحة
- **الخط:** عريض، أحرف كبيرة
- **الاختصار:** `Ctrl+2`

#### الحوار (`dialogue`)
```
مرحباً، كيف حالك اليوم؟
```
- **الموضع:** وسط الصفحة مع هوامش
- **الخط:** عادي
- **الاختصار:** `Ctrl+3`

#### بين قوسين (`parenthetical`)
```
(بصوت منخفض)
```
- **الموضع:** وسط الصفحة مع هوامش إضافية
- **الخط:** مائل
- **الاختصار:** `Tab` أثناء الحوار

#### الانتقال (`transition`)
```
قطع إلى:
```
- **الموضع:** وسط الصفحة
- **الخط:** عريض، أحرف كبيرة
- **الاختصار:** `Ctrl+6`

## الاختصارات الأساسية

### اختصارات التنسيق
- `Ctrl+1` - عنوان مشهد
- `Ctrl+2` - شخصية
- `Ctrl+3` - حوار
- `Ctrl+4` - فعل/حدث
- `Ctrl+6` - انتقال

### اختصارات التحرير
- `Ctrl+B` - عريض
- `Ctrl+I` - مائل
- `Ctrl+U` - تسطير
- `Ctrl+Z` - تراجع
- `Ctrl+Y` - إعادة
- `Ctrl+A` - تحديد الكل

### اختصارات الملف
- `Ctrl+S` - حفظ
- `Ctrl+P` - طباعة
- `Ctrl+F` - بحث
- `Ctrl+H` - بحث واستبدال

### اختصارات التنقل
- `Enter` - سطر جديد مع تنسيق تلقائي
- `Tab` - الانتقال للتنسيق التالي
- `Shift+Tab` - الانتقال للتنسيق السابق

## المعايير المدعومة

## التصنيف الذكي المتقدم

### خوارزمية التصنيف الذكي

يستخدم المحرر نظام ذكي متطور يحلل النص العربي لتصنيفه تلقائياً:

#### 1. تحليل السياق والنمط
```javascript
// مثال على خوارزمية التصنيف
function classifyArabicText(line, previousContext) {
  // تحليل البداية والنهاية
  if (line.startsWith('بسم الله')) return 'basmala';
  if (line.includes('مشهد') && /\d+/.test(line)) return 'scene-header-1';
  
  // تحليل الكلمات المفتاحية
  if (containsTimeWords(line)) return 'scene-header-1';
  if (containsLocationWords(line)) return 'scene-header-3';
  
  // تحليل الهيكل
  if (line.endsWith(':')) return 'character';
  if (line.startsWith('(') && line.endsWith(')')) return 'parenthetical';
}
```

### المعاجم والكلمات المفتاحية

#### أوقات اليوم:
- **أوقات عامة:** ليل، نهار، صباح، مساء، فجر، ظهر، عصر، مغرب، عشاء
- **أوقات محددة:** منتصف الليل، شروق الشمس، غروب الشمس، وقت الضحى
- **فترات زمنية:** صبح، ليلة، نهارية، صباحية، مسائية، ليلية

#### أنواع الأماكن:
- **داخلي/خارجي:** داخلي، خارجي، فوتو، مونتاج، int، ext، interior، exterior
- **أماكن دينية:** مسجد، جامع، كنيسة، معبد، زاوية، خلوة
- **أماكن سكنية:** منزل، بيت، فيلا، شقة، عمارة، حجرة، غرفة
- **أماكن عامة:** شارع، ميدان، حديقة، سوق، محطة، مطار، ميناء
- **أماكن تعليمية:** مدرسة، جامعة، كلية، معهد، مكتبة
- **أماكن طبية:** مستشفى، عيادة، صيدلية، مختبر
- **أماكن تجارية:** مطعم، مقهى، فندق، محل، مولاد، سوبر ماركت

#### الأفعال الشائعة:
```
// أفعال الحركة
يقف، تقف، يجلس، تجلس، يمشي، تمشي، يركض، تركض، يقفز، تقفز
يدخل، تدخل، يخرج، تخرج، يقترب، تقترب، يبتعد، تبتعد

// أفعال النظر والانتباه
ينظر، تنظر، يراقب، تراقب، يلاحظ، تلاحظ، يركز، تركز
يبحث، تبحث، يفتش، تفتش، يستمع، تستمع

// أفعال الكلام
يقول، تقول، يصرخ، تصرخ، يهمس، تهمس، يسأل، تسأل
يجيب، تجيب، يحكي، تحكي، يناقش، تناقش

// أفعال المشاعر
يبتسم، تبتسم، يضحك، تضحك، يبكي، تبكي، يحزن، تحزن
يغضب، تغضب، يفرح، تفرح، يقلق، تقلق

// أفعال العمل
يكتب، تكتب، يقرأ، تقرأ، يعمل، تعمل، يطبخ، تطبخ
يأكل، تأكل، يشرب، تشرب، ينام، تنام، يستيقظ، تستيقظ
```

المحرر يتعرف تلقائياً على:

1. **عناوين المشاهد:**
   - `مشهد + رقم`
   - كلمات الوقت: ليل، نهار، صباح، مساء، فجر، ظهر، عصر، مغرب، عشاء
   - كلمات المكان: داخلي، خارجي، فوتو، مونتاج

2. **الشخصيات:**
   - نص ينتهي بنقطتين `:`
   - أسماء عامة: الرجل، الشاب، المرأة، الفتاة، الطفل + رقم
   - نص قصير (4 كلمات أو أقل) غير متضمن أفعال شائعة

3. **الأفعال الشائعة:**
   يقف، تقف، يجلس، تجلس، يدخل، تدخل، يخرج، تخرج، ينظر، تنظر، يقول، تقول، يمشي، تمشي، تركض، يركض، يكتب، تكتب، يقرأ، تقرأ

4. **أسماء الأماكن:**
   مسجد، جامع، كنيسة، مدرسة، مستشفى، شارع، ميدان، حديقة، مقهى، مطعم، محل، بيت، منزل، فيلا، عمارة، برج

5. **كلمات الانتقال:**
   قطع، اختفاء، تحول، انتقال، cut to، fade to، dissolve to

## إدارة المشاريع

### نظام الحفظ والاسترداد

#### 1. الحفظ التلقائي الذكي
```javascript
// إعدادات الحفظ التلقائي
const autoSaveSettings = {
  interval: 30, // كل 30 ثانية
  onFocusLoss: true, // عند فقدان التركيز
  onPageUnload: true, // قبل إغلاق الصفحة
  maxVersions: 10 // عدد الإصدارات المحفوظة
};
```

#### 2. إدارة المشاريع المتعددة
```
مشاريعي/
├── المسلسل الرمضاني/
│   ├── الحلقة الأولى.screenplay
│   ├── الحلقة الثانية.screenplay
│   └── ملاحظات الإنتاج.md
├── الفيلم الوثائقي/
│   ├── المسودة الأولى.screenplay
│   └── التعليق الصوتي.screenplay
└── المسرحية/
    ├── الفصل الأول.screenplay
    └── الفصل الثاني.screenplay
```

#### 3. النسخ الاحتياطية الآمنة
- نسخ محلية في localStorage
- نسخ في sessionStorage للأمان
- إمكانية التصدير كملف JSON
- نظام استرداد ذكي للمسودات المفقودة

### تنظيم المحتوى والعلامات

#### العلامات والتصنيفات (Tags)
```
#النوع:
- #دراما #كوميديا #إثارة #رومانسي #تاريخي
- #فانتازيا #خيال_علمي #رعب #غموض #مغامرة

@الشخصيات:
- @شخصية_رئيسية @شخصية_ثانوية @شخصية_مساعدة
- @البطل @البطلة @الخصم @الصديق @الحكيم

!الحالة:
- !مسودة !قيد_المراجعة !جاهز_للإنتاج !مكتمل
- !يحتاج_تطوير !مراجعة_مطلوبة !موافق_عليه

%التقدم:
- %البداية %الوسط %النهاية %المقدمة %الخاتمة
```

### إحصائيات المشروع المتقدمة

#### تحليل شامل للمحتوى:
```javascript
const projectStats = {
  general: {
    totalCharacters: 15420,
    totalWords: 3240,
    totalPages: 87,
    totalScenes: 23,
    estimatedDuration: '90 دقيقة'
  },
  characters: {
    speakingCharacters: 8,
    mainCharacters: 3,
    dialogueDistribution: {
      'أحمد': '35%',
      'فاطمة': '28%',
      'الوالد': '20%',
      'آخرون': '17%'
    }
  },
  scenes: {
    interiorScenes: 15,
    exteriorScenes: 8,
    dayScenes: 12,
    nightScenes: 11,
    averageSceneLength: '3.8 صفحة'
  }
};
```

## الإعدادات المتقدمة

### الخطوط المدعومة
- أميري (Amiri) - الافتراضي
- نوتو سانس عربي (Noto Sans Arabic)
- القاهرة (Cairo)
- تجوّل (Tajawal)
- المراي (Almarai)
- مركزي (Markazi Text)
- ريم كوفي (Reem Kufi)
- شهرزاد الجديد (Scheherazade New)
- لطيف (Lateef)
- عارف رقعة (Aref Ruqaa)
- Arial
- Tahoma

### أحجام النص المدعومة
8pt، 9pt، 10pt، 11pt، 12pt، 14pt (افتراضي)، 16pt، 18pt، 24pt، 36pt

### ألوان النص
لوحة ألوان شاملة مع 15 لون أساسي

### تخصيص البيئة والواجهة

#### ثيمات متقدمة:
```css
/* الثيم الكلاسيكي */
.classic-theme {
  --bg-primary: #f8f9fa;
  --text-primary: #212529;
  --accent: #0d6efd;
  --paper: #ffffff;
}

/* ثيم الكاتب الليلي */
.night-writer {
  --bg-primary: #1a1a1a;
  --text-primary: #e0e0e0;
  --accent: #bb86fc;
  --paper: #2d2d2d;
}

/* ثيم الورق القديم */
.vintage-paper {
  --bg-primary: #f4f1de;
  --text-primary: #3d405b;
  --accent: #e07a5f;
  --paper: #f2cc8f;
}
```

#### تخصيص متقدم للخطوط:
```javascript
const advancedFontSettings = {
  primaryFont: {
    family: 'Amiri',
    weight: 400,
    lineHeight: 1.6,
    letterSpacing: '0.02em'
  },
  headingFont: {
    family: 'Cairo',
    weight: 700,
    transform: 'uppercase'
  },
  dialogueFont: {
    family: 'Noto Sans Arabic',
    weight: 400,
    style: 'italic'
  }
};
```

### تخطيط الصفحة المتقدم

#### أحجام الورق المدعومة:
- **A4:** 210×297 مم (الافتراضي)
- **Letter:** 8.5×11 بوصة
- **Legal:** 8.5×14 بوصة
- **A5:** 148×210 مم
- **B5:** 176×250 مم

#### إعدادات الهوامش:
```css
/* هوامش ضيقة */
.tight-margins {
  margin: 1.5cm 1.5cm 1.5cm 2cm;
}

/* هوامش عادية */
.normal-margins {
  margin: 2.5cm 2cm 2cm 2.5cm;
}

/* هوامش واسعة */
.wide-margins {
  margin: 3.5cm 3cm 3cm 3.5cm;
}
```

## التصدير والطباعة

### تنسيقات التصدير المتقدمة

#### 1. PDF عالي الجودة
```javascript
const pdfExportOptions = {
  format: 'A4',
  orientation: 'portrait',
  margin: {
    top: '2.5cm',
    right: '2cm',
    bottom: '2cm',
    left: '2.5cm'
  },
  headers: {
    enabled: true,
    content: 'عنوان المشروع - ${pageNumber}'
  },
  footers: {
    enabled: true,
    content: 'تاريخ الطباعة: ${printDate}'
  },
  fonts: {
    embed: true,
    subset: true
  },
  rtl: true,
  language: 'ar'
};
```

#### 2. Word (DOCX) متقدم
```javascript
const docxExportOptions = {
  format: 'docx',
  template: 'screenplay-template.docx',
  styles: {
    preserveFormatting: true,
    includeComments: true,
    trackChanges: false
  },
  metadata: {
    title: 'اسم السيناريو',
    author: 'اسم الكاتب',
    subject: 'سيناريو',
    language: 'ar-SA'
  }
};
```

#### 3. HTML/Web محسن
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سيناريو مُصدَّر</title>
  <style>
    /* CSS مُحسن للطباعة */
    @media print {
      .page-break { page-break-before: always; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <!-- محتوى السيناريو -->
</body>
</html>
```

### إعدادات الطباعة الاحترافية

#### تخطيط الصفحة للطباعة:
```css
@page {
  size: A4;
  margin: 2.5cm 2cm 2cm 2.5cm;
  
  @top-center {
    content: "عنوان السيناريو";
    font-family: 'Cairo', sans-serif;
    font-size: 10pt;
  }
  
  @bottom-right {
    content: "صفحة " counter(page) " من " counter(pages);
    font-family: 'Amiri', serif;
    font-size: 9pt;
  }
}

/* فواصل الصفحات الذكية */
.scene-header {
  page-break-before: avoid;
  page-break-after: avoid;
}

.character {
  page-break-before: avoid;
  page-break-after: avoid;
}
```

## التكامل مع النظام

### نظام الحفظ والاستيراد المتقدم
- حفظ تلقائي في التخزين المحلي
- تصدير إلى PDF
- استيراد من ملفات نصية
- دعم تنسيقات متعددة

### الطباعة الاحترافية

#### معاينة الطباعة التفاعلية:
- عرض مباشر للصفحات
- تحديد نطاق الطباعة
- معاينة الرؤوس والتذييلات
- حساب تكلفة الطباعة

#### إعدادات طباعة متقدمة:
```javascript
const printSettings = {
  paperSize: 'A4',
  orientation: 'portrait',
  quality: 'high', // low, medium, high
  colorMode: 'grayscale', // color, grayscale, blackwhite
  duplex: 'longEdge', // simplex, longEdge, shortEdge
  copies: 1,
  collate: true,
  pageRange: 'all', // all, current, range
  customRange: '1-10,15,20-25'
};
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### البسملة لا تظهر على اليسار
**الحل:** تأكد من وجود CSS rule للفئة `.basmala` مع `direction: ltr !important`

#### التصنيف التلقائي لا يعمل
**الحل:** تحقق من:
1. وجود `classifierRef` مهيأ بشكل صحيح
2. دالة `classifyLine` تعمل بالمعاملات الصحيحة
3. المعاجم (`commonVerbs`, `locationNames`) محدثة

#### المساطر لا تظهر
**الحل:** تأكد من تفعيل `showRulers` في الإعدادات

#### اختصارات لوحة المفاتيح لا تعمل
**الحل:** تحقق من:
1. عدم تعارض الاختصارات مع المتصفح
2. وجود دالة `handleKeyDown` مربوطة بشكل صحيح
3. التركيز على المحرر (`editorRef.current.focus()`)

## أدوات التطوير والAPI

### واجهة برمجة التطبيقات الرئيسية

#### المكونات الأساسية

#### ScreenplayEditor
المكون الأساسي للمحرر

```typescript
interface ScreenplayEditorProps {
  // لا توجد خصائص مطلوبة
}
```

#### ScreenplayClassifier
فئة التصنيف الذكي

```typescript
class ScreenplayClassifier {
  classifyLine(line: string, previousFormat: ScreenplayFormatId): ScreenplayFormatId | 'scene-header-1-split'
  splitSceneHeader(line: string): { sceneNumber: string; sceneInfo: string } | null
}
```

### أنواع البيانات

```typescript
type ScreenplayFormatId = 
  | 'basmala' 
  | 'scene-header-1' 
  | 'scene-header-2' 
  | 'scene-header-3' 
  | 'action' 
  | 'character' 
  | 'parenthetical' 
  | 'dialogue' 
  | 'transition'

interface DocumentStats {
  characters: number
  words: number
  pages: number
  scenes: number
}
```

### خطوات التخصيص المتقدم

#### إضافة تنسيق جديد
1. أضف النوع الجديد إلى `ScreenplayFormatId`
2. أضف القواعد في `classifyLine`
3. أضف الأنماط في `getFormatStyles`
4. أضف الأيقونة في `screenplayFormats`

### تحديث المعاجم
عدّل المصفوفات في `ScreenplayClassifier`:
- `commonVerbs` - للأفعال الشائعة
- `locationNames` - لأسماء الأماكن
- `transitionKeywords` - لكلمات الانتقال

### إضافة خط جديد
أضف إدخال جديد إلى مصفوفة `fonts`:
```typescript
{ value: 'FontName', label: 'اسم الخط بالعربية' }
```

### توسيع المعاجم والقواميس

#### إضافة كلمات جديدة للتصنيف:
```javascript
// إضافة أفعال جديدة
ScreenplayClassifier.prototype.addCustomVerbs = function(verbs) {
  this.commonVerbs = [...this.commonVerbs, ...verbs];
};

// إضافة أماكن جديدة
ScreenplayClassifier.prototype.addCustomLocations = function(locations) {
  this.locationNames = [...this.locationNames, ...locations];
};

// مثال على الاستخدام
classifier.addCustomVerbs(['يطير', 'تطير', 'يحلق', 'تحلق']);
classifier.addCustomLocations(['مطار', 'محطة فضاء', 'مختبر']);
```

#### إنشاء قواعد تصنيف مخصصة:
```javascript
class CustomClassifier extends ScreenplayClassifier {
  classifyLine(line, previousFormat) {
    // قواعد مخصصة
    if (this.isCustomFormat(line)) {
      return 'custom-format';
    }
    
    // استخدام القواعد الأساسية
    return super.classifyLine(line, previousFormat);
  }
  
  isCustomFormat(line) {
    // منطق التصنيف المخصص
    return line.includes('ملاحظة:') || line.startsWith('[');
  }
}
```

## الأمان والخصوصية

### حماية البيانات المحلية

#### تشفير المحتوى:
```javascript
class SecureStorage {
  static encrypt(content, password) {
    const encrypted = CryptoJS.AES.encrypt(content, password).toString();
    return encrypted;
  }
  
  static decrypt(encryptedContent, password) {
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, password);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

// الاستخدام
const encryptedScript = SecureStorage.encrypt(scriptContent, userPassword);
localStorage.setItem('secureScript', encryptedScript);
```

#### إعدادات الخصوصية:
```javascript
const privacySettings = {
  autoSave: true, // يمكن تعطيله للمحتوى الحساس
  analyticsOptOut: false, // عدم جمع بيانات الاستخدام
  clearOnExit: false, // مسح البيانات عند الإغلاق
  incognitoMode: false, // وضع التصفح الخاص
  dataRetention: 30 // عدد أيام الاحتفاظ بالبيانات
};
```

### الامتثال للمعايير الدولية
- **GDPR:** حماية البيانات الأوروبية
- **CCPA:** قانون خصوصية كاليفورنيا
- **PIPEDA:** قانون الخصوصية الكندي
- **ISO 27001:** معايير أمن المعلومات

## دليل المطورين

### بنية الكود المتقدمة

#### معمارية التطبيق:
```
src/
├── components/
│   ├── core/                    # المكونات الأساسية
│   │   ├── Editor/              # محرر النصوص
│   │   ├── Classifier/          # مصنف النصوص
│   │   └── Formatter/           # منسق النصوص
│   ├── ui/                      # مكونات الواجهة
│   │   ├── MenuBar/             # شريط القوائم
│   │   ├── Toolbar/             # شريط الأدوات
│   │   ├── StatusBar/           # شريط الحالة
│   │   └── Dialogs/             # مربعات الحوار
│   └── utils/                   # أدوات مساعدة
│       ├── exporters/           # أدوات التصدير
│       ├── importers/           # أدوات الاستيراد
│       └── validators/          # أدوات التحقق
├── hooks/                       # React Hooks مخصصة
├── contexts/                    # React Contexts
├── types/                       # تعريفات TypeScript
├── styles/                      # ملفات الأنماط
└── tests/                       # اختبارات الوحدة
```

#### أنماط التصميم المستخدمة:
- **Observer Pattern:** لتتبع تغييرات المحتوى
- **Command Pattern:** لتنفيذ الأوامر والتراجع
- **Factory Pattern:** لإنشاء أنواع التنسيق
- **Singleton Pattern:** لإدارة الإعدادات العامة

### اختبارات الوحدة والتكامل

#### إطار الاختبار:
```javascript
// مثال على اختبار مصنف النصوص
describe('ScreenplayClassifier', () => {
  let classifier;
  
  beforeEach(() => {
    classifier = new ScreenplayClassifier();
  });
  
  test('should classify basmala correctly', () => {
    const line = 'بسم الله الرحمن الرحيم';
    const result = classifier.classifyLine(line, 'action');
    expect(result).toBe('basmala');
  });
  
  test('should classify scene header with Arabic numerals', () => {
    const line = '
- React 18+
- TypeScript 4.5+
- Tailwind CSS 3.0+
- Lucide React Icons

### الأداء
- محسن للنصوص الطويلة
- تحديث تفاعلي للإحصائيات
- حفظ تلقائي غير متزامن

### الأمان
- تنظيف تلقائي للـ HTML المدخل
- حماية من XSS في اللصق
- تشفير البيانات المحفوظة محلياً

---

**إصدار التوثيق:** 2.0  
**تاريخ آخر تحديث:** ديسمبر 2024  
**المطور:** فريق تطوير محرر السيناريو العربي

---

*لمزيد من المساعدة، راجع [دليل التطوير](API-Development-Guide.md) أو [README](../README.md)*

## الدعم والتواصل
- 📧 **البريد الإلكتروني:** support@arabic-screenplay.com
- 💬 **Discord:** [انضم للمجتمع](https://discord.gg/arabic-screenplay)
- 🐛 **تقرير الأخطاء:** [GitHub Issues](https://github.com/arabic-screenplay/editor/issues)
- 📖 **الوثائق الكاملة:** [موقع التوثيق](https://docs.arabic-screenplay.com)

### مجتمع المطورين العرب
نحن نؤمن بأهمية تطوير أدوات محتوى عربية متقدمة. انضم إلينا في بناء مستقبل أفضل للمحتوى العربي الرقمي.

**"من أجل محتوى عربي أصيل ومتطور"** 🌟
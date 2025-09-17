# دليل API وتطوير محرر السيناريو العربي

## نظرة عامة على البنية

### الملفات الأساسية

```
src/components/screenplay-editor.tsx  # المكون الرئيسي
├── ScreenplayClassifier             # فئة التصنيف الذكي
├── ScreenplayEditor                 # المكون الأساسي
├── Dialog                          # مكون الحوارات
├── Tooltip                         # مكون التلميحات
├── Ruler                           # مكون المساطر
└── MenuItem                        # عنصر القائمة
```

## أنواع البيانات الأساسية

### ScreenplayFormatId
```typescript
type ScreenplayFormatId = 
  | 'basmala'           // البسملة
  | 'scene-header-1'    // عنوان المشهد الأساسي
  | 'scene-header-2'    // عنوان المشهد الفرعي
  | 'scene-header-3'    // اسم المكان
  | 'action'            // الفعل/الحدث
  | 'character'         // اسم الشخصية
  | 'parenthetical'     // النص بين قوسين
  | 'dialogue'          // الحوار
  | 'transition'        // الانتقال
```

### ScreenplayFormat
```typescript
interface ScreenplayFormat {
  id: ScreenplayFormatId    // معرف نوع التنسيق
  label: string            // التسمية بالعربية
  shortcut: string         // اختصار لوحة المفاتيح
  color: string           // لون الخلفية في شريط الأدوات
  icon: JSX.Element       // أيقونة التنسيق
}
```

### DocumentStats
```typescript
interface DocumentStats {
  characters: number      // عدد الأحرف الإجمالي
  words: number          // عدد الكلمات
  pages: number          // عدد الصفحات
  scenes: number         // عدد المشاهد
}
```

### Font & TextSize
```typescript
interface Font {
  value: string          // اسم الخط التقني
  label: string          // اسم الخط بالعربية
}

interface TextSize {
  value: string          // حجم الخط (مثل: '14pt')
  label: string          // تسمية الحجم (مثل: '14')
}
```

## فئة ScreenplayClassifier

### الغرض
فئة مسؤولة عن التصنيف التلقائي للنصوص حسب السياق والمحتوى.

### الخصائص

```typescript
class ScreenplayClassifier {
  // كلمات الوقت
  sceneTimeKeywords: string[]
  
  // كلمات المكان
  sceneLocationKeywords: string[]
  
  // كلمات الانتقال
  transitionKeywords: string[]
  
  // الأفعال الشائعة
  commonVerbs: string[]
  
  // أسماء الأماكن
  locationNames: string[]
}
```

### الطرق الأساسية

#### classifyLine()
```typescript
classifyLine(
  line: string,                    // السطر المراد تصنيفه
  previousFormat: ScreenplayFormatId // تنسيق السطر السابق
): ScreenplayFormatId | 'scene-header-1-split'
```

**الغرض:** تصنيف سطر نص واحد حسب محتواه والسياق

**منطق التصنيف:**
1. **البسملة:** يبدأ بـ "بسم الله الرحمن الرحيم"
2. **الانتقال:** يبدأ بكلمة انتقال مثل "قطع"
3. **عنوان المشهد:** يبدأ بـ "مشهد" + رقم
4. **المكان:** سطر قصير بعد عنوان المشهد
5. **الشخصية:** ينتهي بنقطتين أو أحرف كبيرة
6. **الحوار:** بعد اسم الشخصية أو بين قوسين
7. **الفعل:** كل ما عدا ذلك

**مثال:**
```typescript
const classifier = new ScreenplayClassifier()

classifier.classifyLine("بسم الله الرحمن الرحيم", "action")
// النتيجة: "basmala"

classifier.classifyLine("مشهد 1 ليل - داخلي", "action")  
// النتيجة: "scene-header-1"

classifier.classifyLine("أحمد :", "action")
// النتيجة: "character"
```

#### splitSceneHeader()
```typescript
splitSceneHeader(line: string): {
  sceneNumber: string    // رقم المشهد
  sceneInfo: string      // معلومات المشهد
} | null
```

**الغرض:** تقسيم عنوان المشهد إلى رقم ومعلومات

**مثال:**
```typescript
classifier.splitSceneHeader("مشهد 1 ليل - داخلي")
// النتيجة: { sceneNumber: "مشهد 1", sceneInfo: "ليل - داخلي" }
```

## مكون ScreenplayEditor

### الخصائص الحالة (State)

#### إدارة المحتوى
```typescript
const [text, setText] = useState<string>('')              // النص الخام
const [htmlContent, setHtmlContent] = useState<string>('') // المحتوى HTML
const [currentFormat, setCurrentFormat] = useState<ScreenplayFormatId>('action')
```

#### إعدادات المظهر
```typescript
const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
const [selectedFont, setSelectedFont] = useState<string>('Amiri')
const [selectedSize, setSelectedSize] = useState<string>('14pt')
```

#### حالة الواجهة
```typescript
const [showFontMenu, setShowFontMenu] = useState<boolean>(false)
const [showSearchDialog, setShowSearchDialog] = useState<boolean>(false)
const [showRulers, setShowRulers] = useState<boolean>(true)
```

### المراجع (Refs)

```typescript
const classifierRef = useRef<ScreenplayClassifier>(new ScreenplayClassifier())
const editorRef = useRef<HTMLDivElement>(null)           // المحرر الرئيسي
const scrollContainerRef = useRef<HTMLDivElement>(null)  // حاوي التمرير
const stickyHeaderRef = useRef<HTMLDivElement>(null)     // الرأس الثابت
```

### الدوال الأساسية

#### getFormatStyles()
```typescript
getFormatStyles(formatType: ScreenplayFormatId): React.CSSProperties
```

**الغرض:** إرجاع الأنماط CSS لنوع تنسيق معين

**الأنماط المعرّفة:**
- `basmala`: يسار الصفحة، عريض، 16pt
- `scene-header-1`: عريض، مقسم بين اليمين واليسار
- `character`: وسط، عريض، أحرف كبيرة
- `dialogue`: وسط مع هوامش
- `action`: يمين الصفحة

#### applyFormatToCurrentLine()
```typescript
applyFormatToCurrentLine(formatType: ScreenplayFormatId): void
```

**الغرض:** تطبيق تنسيق معين على السطر الحالي

**الخطوات:**
1. العثور على العنصر الحالي في المحرر
2. تطبيق الفئة CSS الجديدة
3. تطبيق الأنماط المحددة
4. تحديث حالة التنسيق الحالي

#### handlePaste()
```typescript
handlePaste(e: React.ClipboardEvent<HTMLDivElement>): void
```

**الغرض:** معالجة عملية اللصق مع التنسيق التلقائي

**الخطوات:**
1. استخراج النص من الحافظة
2. تقسيم النص إلى أسطر
3. تصنيف كل سطر باستخدام `ScreenplayClassifier`
4. إنشاء HTML منسق
5. إدراج المحتوى في المحرر

#### handleKeyDown()
```typescript
handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void
```

**الغرض:** معالجة اختصارات لوحة المفاتيح

**الاختصارات المدعومة:**
- `Tab`: الانتقال للتنسيق التالي
- `Enter`: سطر جديد مع تنسيق تلقائي
- `Ctrl+[1-6]`: تطبيق تنسيقات محددة
- `Ctrl+[B,I,U]`: تنسيق النص (عريض، مائل، تسطير)
- `Ctrl+[F,H]`: فتح حوارات البحث والاستبدال

#### calculateStats()
```typescript
calculateStats(): void
```

**الغرض:** حساب الإحصائيات (كلمات، أحرف، صفحات، مشاهد)

**التطبيق:**
- عدد الأحرف: `textContent.length`
- عدد الكلمات: تقسيم النص وتصفية الفراغات
- عدد المشاهد: عدد عناصر `.scene-header-1`
- عدد الصفحات: حساب الارتفاع / ارتفاع صفحة A4

## المكونات المساعدة

### Dialog
```typescript
interface DialogProps {
  title: string          // عنوان الحوار
  children: React.ReactNode  // المحتوى
  isOpen: boolean        // حالة الظهور
  onClose: () => void    // دالة الإغلاق
}
```

### Tooltip
```typescript
interface TooltipProps {
  text: string           // نص التلميح
  children: React.ReactNode  // العنصر المراد توضيحه
}
```

### Ruler
```typescript
interface RulerProps {
  orientation: 'horizontal' | 'vertical'  // اتجاه المسطرة
  size: number           // الحجم بالبكسل
}
```

## إعدادات CSS المتقدمة

### متغيرات CSS
```css
:root {
  --ruler-bg: #ffffff;           /* خلفية المسطرة */
  --ruler-border: #e5e7eb;       /* حدود المسطرة */
  --ruler-mark: #9ca3af;         /* علامات المسطرة */
  --ruler-num: #6b7280;          /* أرقام المسطرة */
}
```

### فئات مخصصة
```css
.page-content {                  /* محتوى الصفحة */
  direction: rtl;
  unicode-bidi: bidi-override;
  padding: 0 96px 96px 96px;
}

.page-content .basmala {         /* البسملة خاصة */
  direction: ltr !important;
  text-align: left !important;
}

.tooltip {                       /* تلميحات الأدوات */
  opacity: 0;
  transition: opacity 0.2s ease;
}

.group:hover .tooltip {
  opacity: 1;
}
```

## إرشادات التطوير

### إضافة نوع تنسيق جديد

1. **أضف النوع إلى التعريف:**
```typescript
type ScreenplayFormatId = 
  | 'existing-types'
  | 'new-format'  // النوع الجديد
```

2. **أضف القواعد في المصنف:**
```typescript
classifyLine(line: string, previousFormat: ScreenplayFormatId) {
  // ... القواعد الموجودة
  
  if (line.match(/pattern-for-new-format/)) {
    return 'new-format'
  }
  
  // ... بقية القواعد
}
```

3. **أضف الأنماط:**
```typescript
const formatStyles = {
  // ... الأنماط الموجودة
  'new-format': { 
    textAlign: 'center', 
    fontWeight: 'bold' 
  }
}
```

4. **أضف إلى شريط الأدوات:**
```typescript
const screenplayFormats = [
  // ... التنسيقات الموجودة
  { 
    id: 'new-format', 
    label: 'تنسيق جديد', 
    shortcut: 'Ctrl+7', 
    color: 'bg-pink-100', 
    icon: <NewIcon size={18} /> 
  }
]
```

### إضافة اختصار جديد

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  // ... الاختصارات الموجودة
  
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      // ... الحالات الموجودة
      case '7': 
        e.preventDefault()
        applyFormatToCurrentLine('new-format')
        break
    }
  }
}
```

### إضافة دالة بحث مخصصة

```typescript
const searchInEditor = (term: string, options: SearchOptions) => {
  if (!editorRef.current) return []
  
  const content = editorRef.current.textContent || ''
  const results: SearchResult[] = []
  
  // منطق البحث المخصص
  let index = content.indexOf(term)
  while (index !== -1) {
    results.push({
      index,
      length: term.length,
      context: content.substring(index - 20, index + 20)
    })
    index = content.indexOf(term, index + 1)
  }
  
  return results
}
```

## أمثلة التطبيق

### استخدام التصنيف الذكي
```typescript
const classifier = new ScreenplayClassifier()

// تصنيف سطر واحد
const format = classifier.classifyLine("أحمد :", "action")
console.log(format) // "character"

// تصنيف نص متعدد الأسطر
const lines = text.split('\n')
let previousFormat: ScreenplayFormatId = 'action'

const classified = lines.map(line => {
  const format = classifier.classifyLine(line.trim(), previousFormat)
  previousFormat = format === 'scene-header-1-split' ? 'scene-header-1' : format
  return { line, format }
})
```

### إنشاء تنسيق مخصص
```typescript
const applyCustomFormat = (element: HTMLElement, formatType: string) => {
  const customStyles = {
    'narrator': {
      textAlign: 'center',
      fontStyle: 'italic',
      color: '#666666',
      margin: '12px 0'
    }
  }
  
  if (customStyles[formatType]) {
    Object.assign(element.style, customStyles[formatType])
    element.className = formatType
  }
}
```

### معالجة ملفات الاستيراد
```typescript
const importScreenplay = async (file: File) => {
  const text = await file.text()
  const lines = text.split(/\r?\n/)
  
  let formattedHTML = ''
  let previousFormat: ScreenplayFormatId = 'action'
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    const format = classifier.classifyLine(trimmed, previousFormat)
    const div = createFormattedDiv(trimmed, format)
    formattedHTML += div.outerHTML
    previousFormat = format
  }
  
  if (editorRef.current) {
    editorRef.current.innerHTML = formattedHTML
    updateContent()
  }
}
```

## اختبار وتطوير

### اختبار التصنيف
```typescript
describe('ScreenplayClassifier', () => {
  const classifier = new ScreenplayClassifier()
  
  test('should classify basmala correctly', () => {
    const result = classifier.classifyLine('بسم الله الرحمن الرحيم', 'action')
    expect(result).toBe('basmala')
  })
  
  test('should classify scene header', () => {
    const result = classifier.classifyLine('مشهد 1 ليل - داخلي', 'action')
    expect(result).toBe('scene-header-1')
  })
})
```

### اختبار المكونات
```typescript
import { render, fireEvent } from '@testing-library/react'
import ScreenplayEditor from './screenplay-editor'

test('applies format on keyboard shortcut', () => {
  const { container } = render(<ScreenplayEditor />)
  const editor = container.querySelector('[data-testid="rich-text-editor"]')
  
  fireEvent.keyDown(editor, { key: '1', ctrlKey: true })
  
  // التحقق من تطبيق التنسيق
  expect(editor.querySelector('.scene-header-1')).toBeInTheDocument()
})
```

## الأمان والأداء

### حماية من XSS
```typescript
const sanitizeHTML = (html: string) => {
  // إزالة الوسوم الخطيرة
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
             .replace(/javascript:/gi, '')
             .replace(/on\w+\s*=/gi, '')
}
```

### تحسين الأداء
```typescript
// استخدام debounce للإحصائيات
const debouncedCalculateStats = useCallback(
  debounce(calculateStats, 300),
  [editorRef.current]
)

// تحديث تفاعلي للمحتوى
useEffect(() => {
  debouncedCalculateStats()
}, [htmlContent])
```

---

هذا الدليل يغطي جميع جوانب تطوير وتخصيص محرر السيناريو العربي. للمزيد من التفاصيل، راجع التوثيق الأساسي والأمثلة العملية.
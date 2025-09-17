# دليل المطور - محرر السيناريو العربي 💻

## نظرة عامة للمطورين

هذا الدليل مخصص للمطورين الذين يريدون:
- المساهمة في تطوير المحرر
- فهم البنية التقنية للمشروع
- تطوير إضافات أو امتدادات
- تكامل المحرر مع تطبيقات أخرى

## البدء السريع للمطوير

### 1. إعداد بيئة التطوير

```bash
# استنساخ المشروع
git clone https://github.com/arabic-screenplay/editor.git
cd editor

# تثبيت المتطلبات
npm install

# تشغيل الخادم التطويري
npm run dev

# تشغيل الاختبارات
npm test

# بناء الإنتاج
npm run build
```

### 2. البنية التقنية

#### تقنيات الأساس:
- **React 18** مع TypeScript
- **Vite** كأداة بناء
- **Tailwind CSS** للتصميم
- **Lucide React** للأيقونات
- **Jest** و **React Testing Library** للاختبارات

#### معمارية المشروع:
```
src/
├── components/
│   ├── core/                 # المكونات الأساسية
│   │   ├── Editor/          # محرر النصوص
│   │   ├── Classifier/      # مصنف النصوص
│   │   └── Formatter/       # منسق النصوص
│   ├── ui/                  # مكونات الواجهة
│   └── utils/               # أدوات مساعدة
├── hooks/                   # React Hooks مخصصة
├── contexts/                # React Contexts
├── types/                   # تعريفات TypeScript
└── styles/                  # ملفات الأنماط
```

## مكونات النظام الأساسية

### 1. ScreenplayEditor (المكون الرئيسي)

```typescript
interface ScreenplayEditorProps {
  initialContent?: string;
  readOnly?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  onContentChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

const ScreenplayEditor: React.FC<ScreenplayEditorProps> = ({
  initialContent = '',
  readOnly = false,
  theme = 'auto',
  onContentChange,
  onSave
}) => {
  // منطق المحرر
};
```

### 2. ScreenplayClassifier (مصنف النصوص)

```typescript
class ScreenplayClassifier {
  private commonVerbs: string[];
  private locationNames: string[];
  private transitionKeywords: string[];

  constructor() {
    this.initializeVocabularies();
  }

  /**
   * يصنف السطر الواحد حسب محتواه وسياقه
   */
  classifyLine(line: string, previousFormat: ScreenplayFormatId): ScreenplayFormatId {
    // منطق التصنيف المتقدم
  }

  /**
   * يقسم عنوان المشهد إلى رقم ومعلومات
   */
  splitSceneHeader(line: string): { sceneNumber: string; sceneInfo: string } | null {
    // منطق تقسيم العنوان
  }
}
```

### 3. نظام الأنماط والتنسيقات

```typescript
interface FormatStyle {
  fontSize: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize';
  fontStyle?: 'italic' | 'normal';
  marginTop: string;
  marginBottom: string;
  paddingLeft?: string;
  paddingRight?: string;
  direction?: 'ltr' | 'rtl';
}

const getFormatStyles = (format: ScreenplayFormatId): FormatStyle => {
  const styles: Record<ScreenplayFormatId, FormatStyle> = {
    basmala: {
      fontSize: '16pt',
      fontWeight: 'bold',
      textAlign: 'left',
      direction: 'ltr',
      marginTop: '0',
      marginBottom: '24pt'
    },
    // ... باقي الأنماط
  };
  
  return styles[format];
};
```

## إضافة ميزات جديدة

### 1. إضافة نوع تنسيق جديد

```typescript
// 1. أضف النوع الجديد
type ScreenplayFormatId = 
  | 'basmala' 
  | 'scene-header-1' 
  | 'your-new-format'  // ← النوع الجديد
  | /* ... باقي الأنواع */;

// 2. أضف القواعد في المصنف
class ScreenplayClassifier {
  classifyLine(line: string, previousFormat: ScreenplayFormatId): ScreenplayFormatId {
    // قواعد التصنيف الجديدة
    if (this.isYourNewFormat(line)) {
      return 'your-new-format';
    }
    // ... باقي القواعد
  }

  private isYourNewFormat(line: string): boolean {
    // منطق التصنيف للنوع الجديد
    return line.startsWith('كلمة_مفتاحية:');
  }
}

// 3. أضف الأنماط
const formatStyles: Record<ScreenplayFormatId, FormatStyle> = {
  'your-new-format': {
    fontSize: '12pt',
    fontWeight: 'normal',
    textAlign: 'right',
    marginTop: '12pt',
    marginBottom: '6pt'
  },
  // ... باقي الأنماط
};

// 4. أضف الأيقونة والوصف
const screenplayFormats = [
  {
    id: 'your-new-format' as ScreenplayFormatId,
    label: 'النوع الجديد',
    icon: YourNewIcon,
    shortcut: 'Ctrl+7'
  },
  // ... باقي الأنواع
];
```

### 2. إضافة اختصار لوحة مفاتيح جديد

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  // اختصار جديد
  if (e.ctrlKey && e.key === '7') {
    e.preventDefault();
    applyFormat('your-new-format');
    return;
  }
  
  // ... باقي الاختصارات
};
```

### 3. إضافة منطق تصدير جديد

```typescript
interface ExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'txt' | 'your-new-format';
  filename?: string;
  includeMetadata?: boolean;
  customOptions?: Record<string, any>;
}

class ExportManager {
  async export(content: string, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'your-new-format':
        return this.exportToYourFormat(content, options);
      // ... باقي التنسيقات
    }
  }

  private async exportToYourFormat(content: string, options: ExportOptions): Promise<Blob> {
    // منطق التصدير للتنسيق الجديد
    const processed = this.processContent(content);
    return new Blob([processed], { type: 'application/your-format' });
  }
}
```

## API التطوير المتقدم

### 1. إنشاء إضافات (Plugins)

```typescript
interface ScreenplayPlugin {
  name: string;
  version: string;
  description: string;
  
  // دورة حياة الإضافة
  onLoad?(editor: ScreenplayEditor): void;
  onUnload?(editor: ScreenplayEditor): void;
  
  // تعديل السلوك
  beforeClassify?(line: string, context: ClassificationContext): string;
  afterClassify?(result: ScreenplayFormatId, context: ClassificationContext): ScreenplayFormatId;
  
  // واجهة المستخدم
  menuItems?: MenuItem[];
  toolbarItems?: ToolbarItem[];
  shortcuts?: ShortcutConfig[];
}

// مثال على إضافة
const spellCheckPlugin: ScreenplayPlugin = {
  name: 'spell-check',
  version: '1.0.0',
  description: 'فحص الإملاء للنصوص العربية',
  
  onLoad(editor) {
    // تهيئة فحص الإملاء
    this.spellChecker = new ArabicSpellChecker();
  },
  
  afterClassify(result, context) {
    // فحص الإملاء بعد التصنيف
    this.spellChecker.checkLine(context.line);
    return result;
  }
};
```

### 2. نظام الأحداث (Events)

```typescript
type ScreenplayEvent = 
  | 'content-changed'
  | 'format-applied'
  | 'file-saved'
  | 'file-loaded'
  | 'export-started'
  | 'export-completed';

interface EventData {
  timestamp: Date;
  source: string;
  data: any;
}

class EventManager {
  private listeners: Map<ScreenplayEvent, Function[]> = new Map();

  on(event: ScreenplayEvent, callback: (data: EventData) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: ScreenplayEvent, data: EventData): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// الاستخدام
const eventManager = new EventManager();

eventManager.on('content-changed', (data) => {
  console.log('المحتوى تغير:', data);
});

eventManager.emit('content-changed', {
  timestamp: new Date(),
  source: 'user-input',
  data: { newContent: 'النص الجديد' }
});
```

## الاختبارات والتحقق

### 1. اختبارات الوحدة

```typescript
describe('ScreenplayClassifier', () => {
  let classifier: ScreenplayClassifier;

  beforeEach(() => {
    classifier = new ScreenplayClassifier();
  });

  describe('تصنيف البسملة', () => {
    test('يجب أن يصنف البسملة بشكل صحيح', () => {
      const line = 'بسم الله الرحمن الرحيم';
      const result = classifier.classifyLine(line, 'action');
      expect(result).toBe('basmala');
    });

    test('يجب أن يتعامل مع البسملة مع مسافات إضافية', () => {
      const line = '  بسم الله الرحمن الرحيم  ';
      const result = classifier.classifyLine(line.trim(), 'action');
      expect(result).toBe('basmala');
    });
  });

  describe('تصنيف عناوين المشاهد', () => {
    const testCases = [
      { input: 'مشهد 1 ليل - داخلي', expected: 'scene-header-1' },
      { input: 'مشهد ٢ نهار - خارجي', expected: 'scene-header-1' },
      { input: 'المشهد الأول صباح - فوتو', expected: 'scene-header-1' }
    ];

    testCases.forEach(({ input, expected }) => {
      test(`يجب أن يصنف "${input}" كـ ${expected}`, () => {
        const result = classifier.classifyLine(input, 'action');
        expect(result).toBe(expected);
      });
    });
  });
});
```

### 2. اختبارات التكامل

```typescript
describe('ScreenplayEditor Integration', () => {
  let editor: ScreenplayEditor;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    editor = new ScreenplayEditor({
      container,
      initialContent: 'بسم الله الرحمن الرحيم\n\nمشهد 1 ليل - داخلي'
    });
  });

  afterEach(() => {
    editor.destroy();
    document.body.removeChild(container);
  });

  test('يجب أن يطبق التنسيقات تلقائياً', async () => {
    // إدخال نص جديد
    await editor.insertText('\n\nأحمد :');
    
    // التحقق من التصنيف
    const lastLine = editor.getLastLine();
    expect(lastLine.format).toBe('character');
  });

  test('يجب أن يحفظ ويستعيد المحتوى', async () => {
    const originalContent = editor.getContent();
    
    // حفظ
    await editor.save();
    
    // مسح وإعادة تحميل
    editor.clear();
    await editor.load();
    
    expect(editor.getContent()).toBe(originalContent);
  });
});
```

## الأمان والأداء

### 1. تنظيف المدخلات

```typescript
class SecurityManager {
  /**
   * ينظف HTML المدخل من العناصر الخطيرة
   */
  static sanitizeHTML(html: string): string {
    const allowedTags = ['p', 'div', 'span', 'br', 'strong', 'em'];
    const allowedAttributes = ['class', 'style', 'dir'];
    
    // استخدام DOMParser للتنظيف الآمن
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // إزالة العناصر غير المسموحة
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(element => {
      if (!allowedTags.includes(element.tagName.toLowerCase())) {
        element.remove();
      }
    });
    
    return doc.body.innerHTML;
  }

  /**
   * ينظف النص من الأحرف الخطيرة
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // إزالة أحرف HTML
      .replace(/javascript:/gi, '') // إزالة JavaScript
      .trim();
  }
}
```

### 2. تحسين الأداء

```typescript
class PerformanceOptimizer {
  private static classificationCache = new Map<string, ScreenplayFormatId>();
  
  /**
   * تصنيف مع تخزين مؤقت
   */
  static classifyWithCache(line: string, classifier: ScreenplayClassifier): ScreenplayFormatId {
    const cacheKey = line.trim().toLowerCase();
    
    if (this.classificationCache.has(cacheKey)) {
      return this.classificationCache.get(cacheKey)!;
    }
    
    const result = classifier.classifyLine(line, 'action');
    this.classificationCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * تنظيف الذاكرة المؤقتة
   */
  static clearCache(): void {
    this.classificationCache.clear();
  }

  /**
   * تحديث مؤقت (debounced)
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
}
```

## إرشادات المساهمة

### 1. معايير الكود

- استخدم TypeScript لجميع الملفات الجديدة
- اتبع ESLint والتكوين المحدد
- اكتب اختبارات لكل ميزة جديدة
- وثّق الدوال والمكونات بالعربية

### 2. عملية المراجعة

```bash
# قبل إرسال Pull Request
npm run lint          # فحص الكود
npm run test          # تشغيل جميع الاختبارات
npm run build         # التأكد من البناء
npm run type-check    # فحص TypeScript
```

### 3. الالتزام بالمعايير

- استخدم Conventional Commits للرسائل
- اكتب وصف شامل للتغييرات
- أضف لقطات شاشة للتغييرات البصرية
- اختبر على المتصفحات المختلفة

## المراجع التقنية

### 1. APIs مفيدة

```typescript
// واجهة التحرير
interface EditorAPI {
  getContent(): string;
  setContent(content: string): void;
  insertText(text: string, position?: number): void;
  deleteText(start: number, end: number): void;
  formatSelection(format: ScreenplayFormatId): void;
  undo(): void;
  redo(): void;
}

// واجهة التصدير
interface ExportAPI {
  toPDF(options?: PDFOptions): Promise<Blob>;
  toWord(options?: WordOptions): Promise<Blob>;
  toHTML(options?: HTMLOptions): string;
  toText(): string;
}

// واجهة الإحصائيات
interface StatsAPI {
  getWordCount(): number;
  getCharacterCount(): number;
  getPageCount(): number;
  getSceneCount(): number;
  getDialogueDistribution(): Record<string, number>;
}
```

### 2. أدوات التطوير

```typescript
// وضع التطوير
const DevTools = {
  enableClassificationDebug: () => {
    window.__SCREENPLAY_DEBUG__ = true;
  },
  
  logClassification: (line: string, result: ScreenplayFormatId) => {
    if (window.__SCREENPLAY_DEBUG__) {
      console.log(`[تصنيف] "${line}" → ${result}`);
    }
  },
  
  benchmarkClassifier: (lines: string[]) => {
    console.time('تصنيف');
    lines.forEach(line => classifier.classifyLine(line, 'action'));
    console.timeEnd('تصنيف');
  }
};
```

---

**نصائح للمطورين الجدد:**
1. ابدأ بقراءة الكود الموجود لفهم النمط
2. جرب الأمثلة في بيئة التطوير
3. لا تتردد في طرح الأسئلة في Discord
4. ساهم بتحسينات صغيرة أولاً قبل الميزات الكبيرة

**للدعم التقني:** developer-support@arabic-screenplay.com
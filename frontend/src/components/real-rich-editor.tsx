import React, { useCallback, useEffect, useState } from 'react';
import { ScreenplayClassifier, type ScreenplayFormatId } from '../services/ScreenplayClassifier';

interface RealRichEditorProps {
    screenplay: any;
    onUpdate: (updates: any) => Promise<void>;
}

export default function RealRichEditor({ screenplay, onUpdate }: RealRichEditorProps) {
    const [documentStats, setDocumentStats] = useState({ characters: 0, words: 0, pages: 1, scenes: 0 });
    const [currentFormat, setCurrentFormat] = useState<ScreenplayFormatId>('action');
    const [htmlContent, setHtmlContent] = useState<string>('');
    
    // إعداد المصنف والمعالج
    const classifier = new ScreenplayClassifier();
    
    // Ref للمحرر
    const editorRef = React.useRef<HTMLDivElement>(null);

    // تحديث الإحصاءات
    const calculateStats = useCallback(() => {
        if (!editorRef.current) return;
        
        const content = editorRef.current.textContent || '';
        const characters = content.length;
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        
        // عد المشاهد بناءً على التصنيف
        const lines = content.split('\n');
        let scenes = 0;
        lines.forEach(line => {
            const result = classifier.classifyLine(line.trim(), 'action');
            if (result === 'scene-header-1') {
                scenes++;
            }
        });
        
        const pages = Math.max(1, Math.ceil(words / 250)); // تقدير تقريبي للصفحات
        
        setDocumentStats({ characters, words, pages, scenes });
    }, [classifier]);

    // دالة التحديث
    const updateContent = useCallback(() => {
        if (!editorRef.current) return;
        
        calculateStats();
        
        // حفظ تلقائي
        if (screenplay) {
            const html = editorRef.current.innerHTML;
            const wordCount = documentStats.words;
            const pageCount = documentStats.pages;
            
            onUpdate({
                content: html,
                wordCount,
                pageCount,
                updatedAt: new Date()
            });
        }
    }, [calculateStats, screenplay, documentStats, onUpdate]);

    // دالة الحصول على أنماط التنسيق - حسب المواصفات الجديدة المحدثة
    const getFormatStylesForPaste = useCallback((format: ScreenplayFormatId): Partial<CSSStyleDeclaration> => {
        const baseStyles: Partial<CSSStyleDeclaration> = {
            fontFamily: "'Courier Prime', 'Courier New', 'Cairo', monospace",
            fontSize: '12pt',
            lineHeight: '1.5',
            margin: '0',
            padding: '0'
        };

        switch (format) {
            case 'scene-header-1':
                // المكون الأول: رقم المشهد - محاذاة يمين
                return { 
                    ...baseStyles, 
                    fontWeight: 'bold', 
                    textAlign: 'right', 
                    direction: 'rtl', 
                    textTransform: 'uppercase', 
                    margin: '2rem 0 0 0'
                };
            
            case 'scene-header-2':
                // المكون الثاني: الزمان والمكان - محاذاة يسار
                return { 
                    ...baseStyles, 
                    fontWeight: 'bold', 
                    textAlign: 'left', 
                    direction: 'ltr', 
                    textTransform: 'uppercase', 
                    margin: '0'
                };
            
            case 'scene-header-3':
                // المكون الثالث: الموقع التفصيلي - محاذاة مركزية
                return { 
                    ...baseStyles, 
                    fontStyle: 'italic', 
                    textAlign: 'center', 
                    direction: 'rtl',
                    margin: '0.2rem 0 1rem 0'
                };
            
            case 'action':
                // السرد الحركي: محاذاة يمين مع الهوامش الأساسية
                return { 
                    ...baseStyles, 
                    textAlign: 'right', 
                    direction: 'rtl', 
                    margin: '0.5rem 0'
                };
            
            case 'character':
                // مُعرف الشخصية: محاذاة مركزية مع هوامش إضافية
                return { 
                    ...baseStyles, 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    direction: 'rtl',
                    textTransform: 'uppercase',
                    margin: '1rem 0 0.5rem 0',
                    padding: '0 2.5in 0 2.5in' // 1.5 أساسي + 1.5 إضافي = 2.5 كل جانب
                };
            
            case 'parenthetical':
                // الإرشادات الأدائية: محاذاة مركزية مع نفس هوامش الكتلة الحوارية
                return { 
                    ...baseStyles, 
                    fontStyle: 'italic', 
                    textAlign: 'center', 
                    margin: '0.2rem 0',
                    padding: '0 2.5in 0 2.5in'
                };
            
            case 'dialogue':
                // الحوار: محاذاة مركزية مع هوامش إضافية 1.5" كل جانب
                return { 
                    ...baseStyles, 
                    textAlign: 'center', 
                    direction: 'rtl',
                    margin: '0.2rem 0',
                    padding: '0 2.5in 0 2.5in',
                    maxWidth: 'calc(100% - 5in)' // للحفاظ على العرض المحدد
                };
            
            case 'transition':
                // مؤشرات الانتقال: محاذاة مركزية
                return { 
                    ...baseStyles, 
                    fontWeight: 'bold', 
                    textAlign: 'center', 
                    textTransform: 'uppercase',
                    margin: '2rem 0 1rem 0'
                };
            
            default:
                return baseStyles;
        }
    }, []);

    // معالج اللصق المحدث مع المنطق المصحح
    const handlePasteInEditor = useCallback((e: ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain');
        if (!text || !editorRef.current) return;

        // تنظيف النص وتقسيمه إلى أسطر
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        
        // معالجة كل سطر وتطبيق التنسيق المناسب
        let htmlContent = '';
        let previousFormat: ScreenplayFormatId = 'action';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let format = classifier.classifyLine(line, previousFormat);
            
            // Remove the check for scene-header-1-split since it's no longer part of the new classifier

            // تطبيق التنسيق الصحيح
            const div = document.createElement('div');
            div.className = format;
            div.setAttribute('data-format', format);
            Object.assign(div.style, getFormatStylesForPaste(format));
            div.textContent = line;
            
            htmlContent += div.outerHTML;
            previousFormat = format;
        }
        
        // إدراج المحتوى في المحرر
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const fragment = range.createContextualFragment(htmlContent);
            range.insertNode(fragment);
            
            // وضع المؤشر في النهاية
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        updateContent();
    }, [classifier, getFormatStylesForPaste, updateContent]);

    // ربط معالج اللصق
    useEffect(() => {
        if (!editorRef.current) return;
        
        const editorElement = editorRef.current;
        editorElement.addEventListener('paste', handlePasteInEditor);
        
        return () => {
            editorElement.removeEventListener('paste', handlePasteInEditor);
        };
    }, [handlePasteInEditor]);

    // تطبيق التنسيق على السطر الحالي
    const applyFormat = (format: ScreenplayFormatId) => {
        if (!editorRef.current) return;
        
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        // العثور على العنصر الحاوي
        while (element && element.nodeType !== Node.ELEMENT_NODE) {
            element = element.parentNode!;
        }
        
        if (element && (element as HTMLElement).tagName === 'DIV') {
            // تطبيق التنسيق الجديد
            const divElement = element as HTMLDivElement;
            divElement.className = format;
            divElement.setAttribute('data-format', format);
            Object.assign(divElement.style, getFormatStylesForPaste(format));
            
            setCurrentFormat(format);
            updateContent();
        }
    };

    // أزرار التنسيق السريع
    const formatButtons = [
        { id: 'basmala', label: 'بسملة', className: 'bg-indigo-600 text-white text-xs' },
        { id: 'scene-header-1', label: 'عنوان مشهد', className: 'bg-blue-600 text-white text-xs' },
        { id: 'action', label: 'سرد حركي', className: 'bg-gray-600 text-white text-xs' },
        { id: 'character', label: 'شخصية', className: 'bg-green-600 text-white text-xs' },
        { id: 'parenthetical', label: 'إرشاد أدائي', className: 'bg-yellow-600 text-white text-xs' },
        { id: 'dialogue', label: 'حوار', className: 'bg-purple-600 text-white text-xs' },
        { id: 'transition', label: 'انتقال', className: 'bg-red-600 text-white text-xs' }
    ];

    // تحديث المحتوى عند التغيير
    const handleInput = useCallback(() => {
        updateContent();
    }, [updateContent]);

    return (
        <div className="flex flex-col h-full" dir="rtl">
            {/* شريط أدوات التنسيق */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <div className="flex flex-wrap gap-2 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 w-full">تنسيق السيناريو</h3>
                    {formatButtons.map((button) => (
                        <button
                            key={button.id}
                            onClick={() => applyFormat(button.id as ScreenplayFormatId)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${button.className} hover:opacity-80 ${
                                currentFormat === button.id ? 'ring-2 ring-blue-300' : ''
                            }`}
                            title={`تطبيق تنسيق ${button.label}`}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
                
                {/* إحصائيات المستند */}
                <div className="flex gap-6 text-sm text-gray-600">
                    <span>الأحرف: {documentStats.characters}</span>
                    <span>الكلمات: {documentStats.words}</span>
                    <span>الصفحات: {documentStats.pages}</span>
                    <span>المشاهد: {documentStats.scenes}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        التنسيق الحالي: {currentFormat}
                    </span>
                </div>
            </div>

            {/* منطقة المحرر */}
            <div className="flex-1 overflow-auto bg-gray-100 p-8">
                <div className="bg-white shadow-lg max-w-4xl mx-auto min-h-full">
                    <div 
                        ref={editorRef}
                        contentEditable
                        className="screenplay-real-editor focus:outline-none p-8 min-h-full"
                        style={{
                            fontFamily: "'Courier Prime', 'Courier New', 'Cairo', monospace",
                            fontSize: '12pt',
                            lineHeight: '1.5',
                            direction: 'rtl',
                            textAlign: 'right'
                        }}
                        onInput={handleInput}
                        dangerouslySetInnerHTML={{ 
                            __html: screenplay?.content || '<div class="action" data-format="action">ابدأ الكتابة هنا...</div>' 
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { ScreenplayClassifier, type ScreenplayFormatId } from '@/lib/screenplay-classifier';
import { usePasteHandler } from '@/components/screenplay/paste-handler';

interface RealRichEditorProps {
    screenplay: any;
    onUpdate: (updates: any) => Promise<void>;
}

export default function RealRichEditor({ screenplay, onUpdate }: RealRichEditorProps) {
    const [documentStats, setDocumentStats] = useState({ characters: 0, words: 0, pages: 1, scenes: 0 });
    const [currentFormat, setCurrentFormat] = useState<ScreenplayFormatId>('action');
    
    // إعداد المصنف والمعالج
    const classifier = new ScreenplayClassifier();
    
    // إعداد محرر TipTap
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            CharacterCount,
        ],
        content: screenplay?.content || '<p>ابدأ الكتابة هنا...</p>',
        editorProps: {
            attributes: {
                class: 'screenplay-real-editor prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                dir: 'rtl',
            },
        },
        onUpdate: ({ editor }) => {
            updateContent();
        },
    });

    // تحديث الإحصاءات
    const calculateStats = useCallback(() => {
        if (!editor) return;
        
        const content = editor.getText();
        const html = editor.getHTML();
        const characters = content.length;
        const words = content.trim().split(/\s+/).filter(Boolean).length;
        
        // عد المشاهد بناءً على التصنيف
        const lines = content.split('\n');
        let scenes = 0;
        lines.forEach(line => {
            const result = classifier.classifyLine(line.trim(), 'action');
            if (result.format === 'scene-header-1' || result.format === 'scene-header-line1') {
                scenes++;
            }
        });
        
        const pages = Math.max(1, Math.ceil(words / 250)); // تقدير تقريبي للصفحات
        
        setDocumentStats({ characters, words, pages, scenes });
    }, [editor, classifier]);

    // دالة التحديث
    const updateContent = useCallback(() => {
        if (!editor) return;
        
        calculateStats();
        
        // حفظ تلقائي
        if (screenplay) {
            const html = editor.getHTML();
            const wordCount = documentStats.words;
            const pageCount = documentStats.pages;
            
            onUpdate({
                content: html,
                wordCount,
                pageCount,
                updatedAt: new Date()
            });
        }
    }, [editor, calculateStats, screenplay, documentStats, onUpdate]);

    // دالة الحصول على أنماط التنسيق - حسب المواصفات الجديدة
    const getFormatStylesForPaste = useCallback((format: ScreenplayFormatId): Partial<CSSStyleDeclaration> => {
        const baseStyles: Partial<CSSStyleDeclaration> = {
            fontFamily: "'Courier Prime', 'Courier New', 'Cairo', monospace",
            fontSize: '12pt',
            lineHeight: '1.5',
            margin: '0',
            padding: '0'
        };

        switch (format) {
            case 'basmala':
                // البسملة: محاذاة إلى أقصى يسار الصفحة
                return { 
                    ...baseStyles, 
                    textAlign: 'left', 
                    direction: 'ltr', 
                    fontWeight: 'bold', 
                    fontSize: '16pt',
                    margin: '1rem 0 2rem 0',
                    fontFamily: "'Cairo', 'Tajawal', Arial, sans-serif"
                };
            
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
            
            case 'scene-header-location':
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

    // معالج اللصق المحدث مع ترويسة المشهد الثلاثية
    const handlePasteInEditor = useCallback((e: ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData?.getData('text/plain');
        if (!text || !editor) return;

        // تنظيف النص وتقسيمه إلى أسطر
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        
        // معالجة كل سطر وتطبيق التنسيق المناسب
        let htmlContent = '';
        let previousFormat: ScreenplayFormatId = 'action';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const result = classifier.classifyLine(line, previousFormat);
            let format = result.format;
            
            // معالجة خاصة لترويسة المشهد الثلاثية (Version 2.0)
            if (format === 'scene-header-line1') {
                // تحليل السطر لفصل المكونات
                const parsed = classifier.parseSceneHeaderLine(line);
                if (parsed && parsed.sceneNumber && parsed.sceneInfo) {
                    // إنشاء حاوية عنوان المشهد مع المكونين الأول والثاني
                    const headerContainer = `
                        <div class="scene-header" data-format="scene-header">
                            <span class="scene-header-1">${parsed.sceneNumber}</span>
                            <span class="scene-header-2">${parsed.sceneInfo}</span>
                        </div>
                    `;
                    htmlContent += headerContainer;
                    
                    // إذا كان هناك سطر تالٍ، فحص إذا كان موقع تفصيلي (المكون الثالث)
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1];
                        const nextResult = classifier.classifyLine(nextLine, 'scene-header-line1');
                        if (nextResult.format === 'scene-header-location') {
                            i++; // تخطي السطر التالي
                            htmlContent += `<div class="scene-header-location" data-format="scene-header-location">${nextLine}</div>`;
                        }
                    }
                    
                    previousFormat = 'scene-header-location';
                    continue;
                }
            }
            
            // باقي العناصر - استخدام CSS classes بدلاً من inline styles
            htmlContent += `<div class="${format}" data-format="${format}">${line}</div>`;
            previousFormat = format;
        }
        
        // إدراج المحتوى في المحرر
        editor.commands.insertContent(htmlContent);
        updateContent();
    }, [editor, classifier, getFormatStylesForPaste, updateContent]);

    // ربط معالج اللصق
    useEffect(() => {
        if (!editor) return;
        
        const editorElement = editor.view.dom;
        editorElement.addEventListener('paste', handlePasteInEditor);
        
        return () => {
            editorElement.removeEventListener('paste', handlePasteInEditor);
        };
    }, [editor, handlePasteInEditor]);

    // تطبيق التنسيق على السطر الحالي (Version 2.0)
    const applyFormat = (format: ScreenplayFormatId) => {
        if (!editor) return;
        
        // الحصول على النص الحالي أو إنشاء نص جديد
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to) || '';
        
        // تطبيق التنسيق حسب النوع
        switch (format) {
            case 'scene-header-1':
            case 'scene-header-line1':
                // إنشاء عنوان مشهد ثلاثي المكونات
                const sceneContent = `
                    <div class="scene-header" data-format="scene-header">
                        <span class="scene-header-1">مشهد 1</span>
                        <span class="scene-header-2">ليل - داخلي</span>
                    </div>
                    <div class="scene-header-location" data-format="scene-header-location">غرفة المعيشة</div>
                `;
                editor.commands.insertContent(sceneContent);
                break;
                
            case 'basmala':
                editor.commands.insertContent(`<div class="basmala" data-format="basmala">بسم الله الرحمن الرحيم</div>`);
                break;
                
            case 'character':
                const characterText = selectedText || 'الشخصية';
                editor.commands.insertContent(`<div class="character" data-format="character">${characterText}:</div>`);
                break;
                
            case 'dialogue':
                const dialogueText = selectedText || 'الحوار هنا...';
                editor.commands.insertContent(`<div class="dialogue" data-format="dialogue">${dialogueText}</div>`);
                break;
                
            case 'parenthetical':
                const parentheticalText = selectedText || 'إرشاد أدائي';
                editor.commands.insertContent(`<div class="parenthetical" data-format="parenthetical">(${parentheticalText})</div>`);
                break;
                
            case 'action':
                const actionText = selectedText || 'وصف الحدث...';
                editor.commands.insertContent(`<div class="action" data-format="action">${actionText}</div>`);
                break;
                
            case 'transition':
                const transitionText = selectedText || 'قطع إلى';
                editor.commands.insertContent(`<div class="transition" data-format="transition">${transitionText}</div>`);
                break;
                
            default:
                const defaultText = selectedText || 'اكتب هنا...';
                editor.commands.insertContent(`<div class="${format}" data-format="${format}">${defaultText}</div>`);
        }
        
        setCurrentFormat(format);
        
        // التركيز على المحرر
        editor.commands.focus();
    };

    // أزرار التنسيق السريع - Version 2.0 (حسب المواصفات الجديدة)
    const formatButtons = [
        { id: 'basmala', label: 'بسملة', className: 'bg-indigo-600 text-white text-xs' },
        { id: 'scene-header-1', label: 'عنوان مشهد', className: 'bg-blue-600 text-white text-xs', title: 'إدراج عنوان مشهد ثلاثي المكونات' },
        { id: 'action', label: 'سرد حركي', className: 'bg-gray-600 text-white text-xs' },
        { id: 'character', label: 'شخصية', className: 'bg-green-600 text-white text-xs' },
        { id: 'parenthetical', label: 'إرشاد أدائي', className: 'bg-yellow-600 text-white text-xs' },
        { id: 'dialogue', label: 'حوار', className: 'bg-purple-600 text-white text-xs' },
        { id: 'transition', label: 'انتقال', className: 'bg-red-600 text-white text-xs' }
    ];

    // حالة التحميل
    if (!editor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">جاري تحميل المحرر...</p>
                </div>
            </div>
        );
    }

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
                            title={button.title || `تطبيق تنسيق ${button.label}`}
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
                    <EditorContent 
                        editor={editor} 
                        className="screenplay-real-editor focus:outline-none"
                        style={{
                            fontFamily: "'Courier Prime', 'Courier New', 'Cairo', monospace",
                            fontSize: '12pt',
                            lineHeight: '1.5',
                            direction: 'rtl',
                            textAlign: 'right'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
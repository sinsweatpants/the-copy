
import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import {
  Sparkles, Check, X, Loader2, Sun, Moon, Copy, FileText,
  Bold, Italic, Underline, Link, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered,
  Palette, MoveVertical, Type, Highlighter, MoreHorizontal,
  Search, Replace, Save, FolderOpen, Printer, Eye, Settings,
  Play, Pause, RotateCcw, RotateCw, Download, Upload, Share2,
  FilePlus, Undo, Redo, Scissors, Pilcrow, Image as ImageIcon,
  Table, Minus, ChevronsRight, Pencil, ChevronDown,
  BookHeart, Film, MapPin, Camera, Feather, UserSquare,
  Parentheses, MessageCircle, FastForward
} from 'lucide-react';
import { ScreenplayClassifier, ScreenplayFormatId } from '../../services/ScreenplayClassifier';
import { auditWithGemini } from '../../services/GeminiCoordinator';

// ======================== CONSTANTS ==================================
const A4_PAGE_HEIGHT_PX = 1123;
const BASMALA_FONT_SIZE = '18pt';
const CHARACTER_MARGIN = '260px';
const PARENTHETICAL_MARGIN = '280px';
const DIALOGUE_MARGIN = '240px';


interface ScreenplayFormat {
  id: ScreenplayFormatId;
  label: string;
  shortcut: string;
  color: string;
  icon: JSX.Element;
}

interface Font {
  value: string;
  label: string;
}

interface TextSize {
  value: string;
  label: string;
}

interface DocumentStats {
  characters: number;
  words: number;
  pages: number;
  scenes: number;
}

// ======================== المكوّن الرئيسي ==================================
const ScreenplayEditor = () => {
  // -------------------- الحالة العامة --------------------
  const [htmlContent, setHtmlContent] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentFormat, setCurrentFormat] = useState<ScreenplayFormatId>('action');
  const [selectedFont, setSelectedFont] = useState('Amiri');
  const [selectedSize, setSelectedSize] = useState('14pt');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ characters: 0, words: 0, pages: 1, scenes: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [_lastSavedContent, setLastSavedContent] = useState('');

  // -------------------- القوائم و الحوارات -----------------
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showCharacterRename, setShowCharacterRename] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [showLeftSidebar] = useState(true); 
  const [showRightSidebar] = useState(true);
    
  // ✨ Gemini Generator State
  const [generatorState, setGeneratorState] = useState({ 
    isOpen: false, 
    type: null, 
    input: '', 
    result: '', 
    isLoading: false 
  });

  // -------------------- الذكاء المحلي / الوكلاء --------------
  const [localClassifier, setLocalClassifier] = useState<ScreenplayClassifier | null>(null);
  const [isLoadingLocalAI, setIsLoadingLocalAI] = useState(false);
  const [useAgentSystem, setUseAgentSystem] = useState(true);
  const [useWorkflowSystem, setUseWorkflowSystem] = useState(true);
  const [agentSystemStats, setAgentSystemStats] = useState({
    totalClassifications: 0,
    agentDecisions: 0,
    coordinatorDecisions: 0,
    workflowDecisions: 0,
    averageConfidence: 0,
    totalApiCalls: 0,
    currentStrategy: 'fast-sequential'
  });

  // -------------------- مراجعة ذكية / طوابير -----------------
  const reviewQueueRef = useRef<any[]>([]);
  const reviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundAuditorRef = useRef<NodeJS.Timeout | null>(null);
  const lastAuditTimeRef = useRef(Date.now());
  const [lastModifiedLines, setLastModifiedLines] = useState(new Set());

  // -------------------- مراجع DOM ---------------------------
  const classifierRef = useRef(new ScreenplayClassifier());
  const geminiCoordinator = useRef({ audit: auditWithGemini });
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const globalLineCounterRef = useRef(0);

  // -------------------- بيانات التنسيق ----------------------
  const screenplayFormats: ScreenplayFormat[] = [
    { id: 'basmala',          label: 'بسملة',             shortcut: '',        color: 'bg-purple-100', icon: <BookHeart size={18} /> },
    { id: 'scene-header-1',   label: 'عنوان المشهد (1)',   shortcut: 'Ctrl+1',  color: 'bg-blue-100',   icon: <Film size={18} /> },
    { id: 'scene-header-2',   label: 'عنوان المشهد (2)',   shortcut: 'Tab',     color: 'bg-blue-50',    icon: <MapPin size={18} /> },
    { id: 'scene-header-3',   label: 'عنوان المشهد (3)',   shortcut: 'Tab',     color: 'bg-blue-25',    icon: <Camera size={18} /> },
    { id: 'action',           label: 'الفعل/الحدث',        shortcut: 'Ctrl+4',  color: 'bg-gray-100',   icon: <Feather size={18} /> },
    { id: 'character',        label: 'شخصية',              shortcut: 'Ctrl+2',  color: 'bg-green-100',  icon: <UserSquare size={18} /> },
    { id: 'parenthetical',    label: 'بين قوسين',          shortcut: 'Tab',     color: 'bg-yellow-100', icon: <Parentheses size={18} /> },
    { id: 'dialogue',         label: 'حوار',               shortcut: 'Ctrl+3',  color: 'bg-orange-100', icon: <MessageCircle size={18} /> },
    { id: 'transition',       label: 'انتقال',             shortcut: 'Ctrl+6',  color: 'bg-red-100',    icon: <FastForward size={18} /> }
  ];

  const dramaAnalyzerTools = [
    { id: 'day-night',   label: 'وضع الرؤية',   icon: <Sun size={20} />,            action: () => setIsDarkMode(p => !p) },
    { id: 'scene-header',label: 'رأس المشهد',   icon: <Film size={20} />,           action: () => applyFormatToCurrentLine('scene-header-1') },
    { id: 'number-1',    label: 'رقم 1',        icon: <span className="text-lg font-bold">1</span>, action: () => applyFormatToCurrentLine('scene-header-1') },
    { id: 'number-2',    label: 'رقم 2',        icon: <span className="text-lg font-bold">2</span>, action: () => applyFormatToCurrentLine('scene-header-2') },
    { id: 'number-3',    label: 'رقم 3',        icon: <span className="text-lg font-bold">3</span>, action: () => applyFormatToCurrentLine('scene-header-3') },
    { id: 'action',      label: 'الحركة/الوصف', icon: <Feather size={20} />,        action: () => applyFormatToCurrentLine('action') },
    { id: 'character',   label: 'الشخصية',      icon: <UserSquare size={20} />,      action: () => applyFormatToCurrentLine('character') },
    { id: 'dialogue',    label: 'الحوار',       icon: <MessageCircle size={20} />,   action: () => applyFormatToCurrentLine('dialogue') },
    { id: 'transition',  label: 'الانتقال',     icon: <FastForward size={20} />,     action: () => applyFormatToCurrentLine('transition') }
  ];

  const screenplayEditorTools = [
    { id: 'new-text',     label: 'نص جديد',       icon: <FilePlus size={20} />,    action: () => createNewDocument() },
    { id: 'load-file',    label: 'تحميل ملف',     icon: <Upload size={20} />,      action: () => (document.getElementById('file-import-input') as HTMLInputElement)?.click() },
    { id: 'save-file',    label: 'حفظ ملف',       icon: <Save size={20} />,        action: () => saveDocument() },
    { id: 'print',        label: 'طباعة',         icon: <Printer size={20} />,     action: () => printDocument() },
    { id: 'gemini-audit', label: 'تدقيق ذكي',     icon: <Sparkles size={20} />,    action: () => smartNormalizeDocument() },
    { id: 'font-type',    label: 'نوع الخط',      icon: <Type size={20} />,        action: () => setShowFontMenu(p => !p) },
    { id: 'font-size',    label: 'حجم الخط',      icon: <Settings size={20} />,     action: () => setShowSizeMenu(p => !p) },
    { id: 'italic',       label: 'الخط المائل',   icon: <Italic size={20} />,      action: () => formatText('italic') },
    { id: 'underline',    label: 'وضع خط سفلي',   icon: <Underline size={20} />,    action: () => formatText('underline') },
    { id: 'bold',         label: 'الخط العريض',   icon: <Bold size={20} />,         action: () => formatText('bold') },
    { id: 'text-color',   label: 'لون الخط',      icon: <Palette size={20} />,      action: () => setShowColorPicker(p => !p) }
  ];

  const colors = ['#000000', '#e03131', '#c2255c', '#9c36b5', '#6741d9', '#3b5bdb', '#1b6ec2', '#0c8599', '#099268', '#2f9e44', '#66a80f', '#f08c00', '#e8590c', '#5f676e', '#343a40'];
  const fonts: Font[] = [
    { value: 'Amiri', label: 'أميري' },
    { value: 'Noto Sans Arabic', label: 'نوتو سانس عربي' },
    { value: 'Cairo', label: 'القاهرة' },
    { value: 'Tajawal', label: 'تجوّل' },
    { value: 'Almarai', label: 'المراي' },
    { value: 'Markazi Text', label: 'مركزي' },
    { value: 'Reem Kufi', label: 'ريم كوفي' },
    { value: 'Scheherazade New', label: 'شهرزاد الجديد' },
    { value: 'Lateef', label: 'لطيف' },
    { value: 'Aref Ruqaa', label: 'عارف رقعة' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Tahoma', label: 'Tahoma' }
  ];
  const textSizes: TextSize[] = [
    { value: '8pt', label: '8' }, { value: '9pt', label: '9' }, { value: '10pt', label: '10' },
    { value: '11pt', label: '11' }, { value: '12pt', label: '12' }, { value: '14pt', label: '14' },
    { value: '16pt', label: '16' }, { value: '18pt', label: '18' }, { value: '24pt', label: '24' }, { value: '36pt', label: '36' }
  ];

  // ==================== تنسيقات CSS للسطر =====================
  const getFormatStyles = useCallback((formatType: ScreenplayFormatId): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`,
      fontSize: selectedSize,
      direction: 'rtl',
      margin: '0',
      lineHeight: '1.6',
      minHeight: '1.6em'
    };
    const fm: {[key in ScreenplayFormatId]?: React.CSSProperties} = {
      'basmala':        { textAlign: 'left', fontWeight: 'bold', fontSize: BASMALA_FONT_SIZE },
      'scene-header-1': { textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' },
      'scene-header-2': { textAlign: 'left', fontStyle: 'italic' },
      'scene-header-3': { textAlign: 'center', fontWeight: 'bold' },
      'action':         { textAlign: 'right' },
      'character':      { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', margin: `0 ${CHARACTER_MARGIN}` },
      'parenthetical':  { textAlign: 'center', fontStyle: 'italic', margin: `0 ${PARENTHETICAL_MARGIN}` },
      'dialogue':       { textAlign: 'center', margin: `0 ${DIALOGUE_MARGIN}` },
      'transition':     { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }
    };
    return { ...base, ...(fm[formatType] || {}) };
  }, [selectedFont, selectedSize]);

  // ==================== حساب الإحصاءات =======================
  const calculateStats = useCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.textContent || '';
    const characters = content.length;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const scenes = editorRef.current.querySelectorAll('.scene-header-1').length;
    const pages = Math.max(1, Math.ceil(editorRef.current.scrollHeight / (A4_PAGE_HEIGHT_PX + 20)));
    setDocumentStats({ characters, words, pages, scenes });
    setPageCount(pages);
  }, []);

  // إعادة تطبيق الأنماط بعد كل تغيير خط/حجم أو htmlContent
  useEffect(() => {
    if (editorRef.current) {
      const divs = editorRef.current.querySelectorAll('div[class]');
      divs.forEach((div) => {
        const htmlDiv = div as HTMLDivElement;
        Object.assign(htmlDiv.style, getFormatStyles(htmlDiv.className as ScreenplayFormatId));
      });
      calculateStats();
    }
  }, [selectedFont, selectedSize, htmlContent, getFormatStyles, calculateStats]);

  // ==================== خرائط المسافات و الانتقال ===================
  const getMarginTop = (from: ScreenplayFormatId, to: ScreenplayFormatId) => {
    const spacingMap: {[key: string]: {[key: string]: string}} = {
      'scene-header-1': { 'scene-header-3': '0px', 'action': '1em' },
      'scene-header-3': { 'action': '0.5em' },
      'action':         { 'action': '0px', 'character': '1em', 'scene-header-1': '2em' },
      'character':      { 'dialogue': '0px', 'parenthetical': '0px' },
      'parenthetical':  { 'dialogue': '0px' },
      'dialogue':       { 'action': '1em', 'character': '1em' },
      'transition':     { 'scene-header-1': '2em' },
      'basmala':        { 'scene-header-1': '1em' }
    };
    return spacingMap[from]?.[to] || '0px';
  };

  const getNextFormatOnEnter = (fmt: ScreenplayFormatId): ScreenplayFormatId => {
    const transitions: { [key in ScreenplayFormatId]?: ScreenplayFormatId } = {
      'scene-header-1': 'scene-header-3',
      'scene-header-3': 'action',
      'action': 'action',
      'character': 'dialogue',
      'parenthetical': 'dialogue',
      'dialogue': 'action',
      'transition': 'scene-header-1',
      'basmala': 'scene-header-1'
    };
    return transitions[fmt] || 'action';
  };

  const needsEmptyLine = (prev: ScreenplayFormatId, cur: ScreenplayFormatId) => {
    const rules: {[key: string]: string[]} = {
      'scene-header-3': ['action'],
      'action': ['character', 'transition'],
      'dialogue': ['character', 'action', 'transition'],
      'transition': ['scene-header-1']
    };
    return rules[prev]?.includes(cur) || false;
  };

  const normalizeSpacing = (contentLines: any[], preservePDFSpacing = false) => {
    const normalizedLines: any[] = [];
    let previousFormat: ScreenplayFormatId | null = null;
    
    for (let i = 0; i < contentLines.length; i++) {
      const currentLine = contentLines[i];
      const isEmptyLine = !currentLine.content.trim();
      
      if (isEmptyLine) {
        if (preservePDFSpacing) {
          normalizedLines.push({ content: '', format: 'action', isEmpty: true });
        }
        continue;
      }
      
      if (!preservePDFSpacing && previousFormat && needsEmptyLine(previousFormat, currentLine.format)) {
        normalizedLines.push({ content: '', format: 'action', isEmpty: true });
      }
      
      normalizedLines.push(currentLine);
      previousFormat = currentLine.format;
    }
    
    return normalizedLines;
  };

  // Dummy functions to avoid errors, will be implemented later
  const applyFormatToCurrentLine = (format: ScreenplayFormatId) => console.log('Applying format', format);
  const createNewDocument = () => console.log('Creating new document');
  const saveDocument = () => console.log('Saving document');
  const printDocument = () => console.log('Printing document');
  const smartNormalizeDocument = () => console.log('Normalizing document');
  const formatText = (format: string, value: string | null = null) => console.log('Formatting text', format, value);

  const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (<div className="relative group">{children}<div className="tooltip">{text}</div></div>);

  const Ruler: React.FC<{ orientation: 'horizontal' | 'vertical'; size: number }> = ({ orientation, size }) => {
    const PIXELS_PER_CM = 37.8;
    const marks = [];
    const numMarks = Math.floor(size / (PIXELS_PER_CM / 10));
    for (let i = 0; i < numMarks; i++) {
      const pos = i * (PIXELS_PER_CM / 10);
      let type = 'minor';
      if (i % 10 === 0) type = 'major';
      else if (i % 5 === 0) type = 'medium';
      if (orientation === 'horizontal') {
        marks.push(<Fragment key={i}><div className={`h-ruler-mark ${type}`} style={{ right: `${pos}px` }}></div>{type === 'major' && <span className="h-ruler-number" style={{ right: `${pos + 2}px` }}>{i / 10}</span>}</Fragment>);
      } else {
        marks.push(<Fragment key={i}><div className={`v-ruler-mark ${type}`} style={{ top: `${pos}px` }}></div>{type === 'major' && <span className="v-ruler-number" style={{ top: `${pos}px` }}>{i / 10}</span>}</Fragment>);
      }
    }
    return orientation === 'horizontal' ? (<div className="horizontal-ruler">{marks}</div>) : (<div className="vertical-ruler">{marks}</div>);
  };

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-200 text-gray-800'}`} dir="rtl">
      <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans+Arabic:wght@100..900&family=Cairo:wght@200..1000&family=Tajawal:wght@200..900&family=Almarai:wght@300;400;700;800&family=Markazi+Text:wght@400..700&family=Reem+Kufi:wght@400..700&family=Scheherazade+New:wght@400..700&family=Lateef:wght@200..800&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
        :root { --ruler-bg: ${isDarkMode ? '#1f2937' : '#ffffff'}; --ruler-border: ${isDarkMode ? '#374151' : '#e5e7eb'}; --ruler-corner-bg: ${isDarkMode ? '#111827' : '#f9fafb'}; --ruler-mark: ${isDarkMode ? '#4b5563' : '#9ca3af'}; --ruler-mark-major: ${isDarkMode ? '#9ca3af' : '#4b5563'}; --ruler-num: ${isDarkMode ? '#6b7280' : '#6b7280'}; }
        .ltr-element, button, select, input { direction: ltr; }
        .toolbar-container { direction: ltr; display: flex; justify-content: flex-end; }
        .horizontal-ruler { position: relative; height: 30px; border-bottom: 1px solid var(--ruler-border); }
        .vertical-ruler { position: relative; width: 30px; }
        .ruler-corner { width: 30px; height: 30px; background: var(--ruler-corner-bg); border-left: 1px solid var(--ruler-border); border-bottom: 1px solid var(--ruler-border); }
        .h-ruler-mark { position: absolute; top: 0; width: 1px; background: var(--ruler-mark); } .h-ruler-mark.major { height: 15px; background: var(--ruler-mark-major); } .h-ruler-mark.minor { height: 6px; } .h-ruler-mark.medium { height: 10px; }
        .v-ruler-mark { position: absolute; left: 0; height: 1px; background: var(--ruler-mark); } .v-ruler-mark.major { width: 15px; background: var(--ruler-mark-major); } .v-ruler-mark.minor { width: 6px; } .v-ruler-mark.medium { width: 10px; }
        .h-ruler-number { position: absolute; font-size: 8px; color: var(--ruler-num); top: 18px; }
        .v-ruler-number { position: absolute; font-size: 8px; color: var(--ruler-num); left: 18px; transform: translateY(-50%) rotate(-90deg); }
        .page-content { outline: none; direction: rtl; unicode-bidi: bidi-override; padding: 0 96px 96px 96px; min-height: ${A4_PAGE_HEIGHT_PX}px; }
        .page-content::before { content: ''; display: block; height: 96px; }
        [contenteditable] div { min-height: 1.2em; }
        .page-background { position: relative; width: 100%; max-width: 1000px; height: ${A4_PAGE_HEIGHT_PX}px; margin: 0 auto 20px auto; background: ${isDarkMode ? '#1f2937' : '#ffffff'}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 3px; }
        .page-number { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); font-size: 12px; color: ${isDarkMode ? '#6b7280' : '#9ca3af'}; }
        .tooltip { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; padding: 8px 12px; background: ${isDarkMode ? '#1f2937' : '#374151'}; color: white; font-size: 12px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 1000; }
        .tooltip::after { content: ''; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-bottom-color: ${isDarkMode ? '#1f2937' : '#374151'}; }
        .group:hover .tooltip { opacity: 1; }
      ` }} />

      <div className="flex-shrink-0 px-4 pt-2 shadow-sm z-30 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className="text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>محرر السيناريو العربي</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm menu-container">
          {/* Menu items will be added here */}
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {showRulers && (
          <div className="flex-shrink-0 flex flex-col" style={{ paddingTop: `${stickyHeaderHeight}px` }}>
            <div className="vertical-ruler bg-white dark:bg-gray-800 border-l dark:border-gray-700">
              <Ruler orientation="vertical" size={A4_PAGE_HEIGHT_PX * pageCount} />
            </div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto" ref={scrollContainerRef}>
          <div ref={stickyHeaderRef} className={`sticky top-0 z-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
            <div className="p-2 w-full max-w-[1000px] mx-auto">
              <div className={`mb-2 p-2 rounded-lg border flex items-center gap-2 overflow-x-auto toolbar-container ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                {screenplayFormats.map(format => (<Tooltip key={format.id} text={`${format.label} (${format.shortcut || 'Tab/Enter'})`}><button onClick={() => applyFormatToCurrentLine(format.id)} className={`p-2 rounded-md transition-all duration-200 ${currentFormat === format.id ? `${format.color} text-gray-900 ring-2 ring-purple-500` : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{format.icon}</button></Tooltip>))}
              </div>
              <div className={`p-2 rounded-lg border flex items-center flex-wrap gap-x-3 gap-y-2 toolbar-container ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <div className="relative"><button onClick={() => setShowFontMenu(p => !p)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}><span style={{ fontFamily: selectedFont }}>{fonts.find(f => f.value === selectedFont)?.label}</span><ChevronDown size={14} /></button>{showFontMenu && (<div className={`absolute top-full right-0 mt-1 w-48 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>{fonts.map(font => <button key={font.value} onClick={() => { setSelectedFont(font.value); setShowFontMenu(false); }} className={`w-full text-right block px-3 py-1.5 text-sm rounded ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`} style={{ fontFamily: font.value }}>{font.label}</button>)}</div>)}</div>
                <div className="relative"><button onClick={() => setShowSizeMenu(p => !p)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}><span>{selectedSize.replace('pt', '')}</span><ChevronDown size={14} /></button>{showSizeMenu && (<div className={`absolute top-full right-0 mt-1 w-20 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>{textSizes.map(size => <button key={size.value} onClick={() => { setSelectedSize(size.value); setShowSizeMenu(false); }} className={`w-full text-right block px-3 py-1.5 text-sm rounded ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>{size.label}</button>)}</div>)}</div>
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <Tooltip text="عريض"><button onClick={() => formatText('bold')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Bold size={16} /></button></Tooltip>
                <Tooltip text="مائل"><button onClick={() => formatText('italic')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Italic size={16} /></button></Tooltip>
                <Tooltip text="تسطير"><button onClick={() => formatText('underline')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Underline size={16} /></button></Tooltip>
                <div className="relative"><Tooltip text="لون النص"><button onClick={() => setShowColorPicker(p => !p)} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Palette size={16} /></button></Tooltip>{showColorPicker && (<div className={`absolute top-full right-0 mt-1 p-2 grid grid-cols-5 gap-1 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>{colors.map(color => <button key={color} onClick={() => { formatText('foreColor', color); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-400" style={{ backgroundColor: color }}></button>)}</div>)}</div>
              </div>
            </div>
            {showRulers && <div className="w-full max-w-[1000px] mx-auto bg-white dark:bg-gray-800"><Ruler orientation="horizontal" size={1000} /></div>}
          </div>

          <div className="p-4">
            <div className="relative w-full max-w-[1000px] mx-auto">
              <div ref={editorRef} contentEditable={true} suppressContentEditableWarning={true}
                data-testid="rich-text-editor"
                className="page-content" style={{ fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`, fontSize: selectedSize, lineHeight: '1.8' }} />
              <div className="absolute top-0 right-0 bottom-0 left-0 -z-10">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div key={i} className="page-background"><span className="page-number">{i + 1}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex-shrink-0 px-4 py-1.5 text-xs border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} dir="ltr">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">

          // ======================= الذكاء المحلي و الجيمني ============================
// These are mocked as they are not available in the environment
// import { pipeline } from '@huggingface/transformers';
// import { GeminiCoordinator } from './agents/ProductionAgentSystem.js';
const GeminiCoordinator = class {
    setApiKey(key) { return true; }
    async classifyWithAgents(text, context) {
        // Mock implementation
        return { classification: 'action', confidence: 0.7, agent: 'mock' };
    }
};


// ======================= صنف السيناريو القاعدي ==============================
class ScreenplayClassifier {
  sceneTimeKeywords = ['ليل', 'نهار', 'صباح', 'مساء', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'day', 'night', 'morning', 'evening'];
  sceneLocationKeywords = ['داخلي', 'خارجي', 'فوتو', 'مونتاج', 'int.', 'ext.'];
  sceneKeywords = [...this.sceneTimeKeywords, ...this.sceneLocationKeywords];
  transitionKeywords = ['قطع', 'اختفاء', 'تحول', 'مزج', 'انتقال', 'cut to', 'fade to', 'dissolve to'];

  commonVerbs = [
    'يقف', 'تقف', 'يجلس', 'تجلس', 'يدخل', 'تدخل', 'يخرج', 'تخرج', 'ينظر', 'تنظر', 'يقول', 'تقول', 'يمشي', 'تمشي', 'تركض', 'يركض', 'يكتب', 'تكتب', 'يقرأ', 'تقرأ',
    'يصمت', 'تسكت', 'يصمتون', 'تشهق', 'يصرخ', 'تصرخ', 'يهمس', 'همس', 'يتنهد', 'تتنهد', 'يبتسم', 'تبتسم', 'يضحك', 'تضحك', 'ينهض', 'تنهض', 'يقترب', 'تقترب', 'يبتعد', 'تبتعد', 'يلتفت', 'تلتفت', 'يحدق', 'تحدق', 'يتلعثم', 'تتلعثم'
  ];

  locationNames = ['مسجد', 'جامع', 'كنيسة', 'مدرسة', 'مستشفى', 'شارع', 'ميدان', 'حديقة', 'مقهى', 'مطعم', 'محل', 'بيت', 'منزل', 'فيلا', 'عمارة', 'برج', 'القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة', 'أسوان', 'الأقصر', 'طنطا', 'المنيا', 'شقة', 'صالة'];

  stageDirectionSingles = ['متلعثم', 'مبتسماً', 'مبتسمة', 'صامتاً', 'صامتة', 'مذهول', 'مذهولة', 'مندهش', 'مندهشة', 'باكياً', 'باكية', 'صارخاً', 'صارخة', 'مهموماً', 'مهمومة'];

  classifyLine(line, previousFormat) {
    const trimmedLine = line.trim();
    if (!trimmedLine) return 'action';

    const wordCount = trimmedLine.split(/\s+/).filter(Boolean).length;
    const firstWord = trimmedLine.split(/[\s-]/)[0];

    if (wordCount === 1 && this.stageDirectionSingles.includes(trimmedLine)) return 'action';
    if (/^بسم الله الرحمن الرحيم/i.test(trimmedLine)) return 'basmala';
    if (this.transitionKeywords.some(k => trimmedLine.toLowerCase().startsWith(k))) return 'transition';

    if (/^(مشهد\s*\d+|scene\s*\d+)/i.test(trimmedLine)) {
      const match = trimmedLine.match(/^(مشهد\s*\d+)\s+(.+)$/i);
      if (match && this.sceneKeywords.some(kw => match[2].toLowerCase().includes(kw))) {
        return 'scene-header-1-split';
      }
      return 'scene-header-1';
    }

    if ((previousFormat && previousFormat.startsWith('scene-header-1')) || previousFormat === 'scene-header-2') {
      const locationParts = trimmedLine.split(/\s*[-–—]\s*/);
      if (locationParts.length > 1) {
        const locationLike = locationParts.filter(p => this.locationNames.some(loc => p.includes(loc)));
        if (locationLike.length >= 2 && (locationLike.length / locationParts.length) >= 0.5) return 'scene-header-3';
      }
      if (this.locationNames.filter(loc => trimmedLine.includes(loc)).length >= 1) return 'scene-header-3';
      if (wordCount <= 5 && (trimmedLine.endsWith(':') || trimmedLine.endsWith('：'))) return 'character';
      if (this.commonVerbs.includes(firstWord)) return 'action';
      const eff = trimmedLine.split(/\s+/).filter(t => !/^[-–—]$/.test(t)).length;
      if (eff <= 7 && !/[:：]/.test(trimmedLine)) return 'scene-header-3';
    }

    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
      return (previousFormat === 'character' || previousFormat === 'dialogue') ? 'parenthetical' : 'action';
    }

    const inlineMatch = trimmedLine.match(/^([^:]{1,60}?)\s*:\s*(.+)$/);
    if (inlineMatch) {
      const namePart = inlineMatch[1].trim();
      const nameWords = namePart.split(/\s+/).filter(Boolean);
      if (nameWords.length <= 4 && !this.commonVerbs.includes(nameWords[0] || '') && !this.locationNames.some(loc => namePart.includes(loc)) && inlineMatch[2].trim().length > 0) {
        return 'character-inline';
      }
    }

    if (trimmedLine.endsWith(':') || trimmedLine.endsWith('：')) {
      const looksVerb = /^(?:ي|ت)[\u0621-\u064A]{2,}$/.test(firstWord) || this.commonVerbs.includes(firstWord);
      return (looksVerb && wordCount > 1) ? 'action' : 'character';
    }

    if (/^[A-Z\s]+$/.test(trimmedLine) && wordCount <= 4) return 'character';
    if (/^(الرجل|الشاب|المرأة|الفتاة|الطفل)\s+\d+/i.test(trimmedLine)) return 'character';

    if (wordCount <= 4 && !this.commonVerbs.includes(firstWord) && !this.locationNames.some(loc => trimmedLine.includes(loc))) {
      const hasVerbPattern = /(?:\s|^)(?:ي|ت)[\u0621-\u064A]{2,}/.test(trimmedLine);
      if (!hasVerbPattern && !previousFormat.startsWith('scene-header-')) {
        if (['action', 'dialogue', 'transition'].includes(previousFormat)) return 'character';
      }
    }

    if (previousFormat === 'character' || previousFormat === 'parenthetical') return 'dialogue';
    return 'action';
  }

  splitSceneHeader(line) {
    const match = line.match(/^(مشهد\s*\d+)\s+(.+)$/i);
    return match ? { sceneNumber: match[1].trim(), sceneInfo: match[2].trim() } : null;
  }
}

// =========================== ثوابت و أدوات ================================
const STRIP_LEADING_BULLETS = true;
const PIXELS_PER_CM = 37.79;
const A4_PAGE_HEIGHT_PX = 1123;
const GEMINI_AUDIT_WINDOW = 50;
const BASMALA_FONT_SIZE = '16pt';
const CHARACTER_MARGIN = '260px';
const PARENTHETICAL_MARGIN = '280px';
const DIALOGUE_MARGIN = '240px';
const ENABLE_GEMINI_AUDIT = true;

function stripLeadingBullet(raw) {
  let s = raw.replace(/^[\u200F\u200E]+/, '');
  if (/^[-–—•▪►▸□■●◇◆]\s+/.test(s)) {
    s = s.replace(/^[-–—•▪►▸□■●◇◆]\s+/, '');
  }
  return s;
}

function buildAuditPrompt(lines) {
  const allowedClasses = JSON.stringify([
    'character', 'dialogue', 'parenthetical', 'action',
    'scene-header-1', 'scene-header-2', 'scene-header-3', 'transition'
  ]);
  return `### Persona
You are an expert AI system specializing in the structural analysis and classification of Arabic screenplay text. Your expertise lies in understanding the nuanced conventions of screenplay formatting, including scene headers, character names, dialogue, parentheticals, actions, and transitions. You operate with surgical precision and high confidence.

### Primary Objective
Your primary objective is to audit a list of pre-classified screenplay lines, identify definite misclassifications made by a less sophisticated local classifier, and provide corrections in a structured JSON format.

### Context
You will be given a JSON array named \`lines\`. Each object in this array represents a single line from a screenplay and contains:
- \`index\`: The original line number (integer).
- \`raw\`: The raw Arabic text of the line.
- \`cls\`: The initial classification assigned by the local classifier.

The set of valid classifications is: ${allowedClasses}.

### Core Task
Your task is to analyze the provided \`lines\` array and return a JSON array of correction objects. Each correction object must identify a line that was definitively misclassified.

### Step-by-Step Instructions
1. Iterate through the \`lines\` array, considering each line in the context of its preceding and succeeding lines.
2. Apply the provided \`High-Confidence Heuristics\` and your internal knowledge of screenplay structure to detect classification errors.
3. For each error you identify with high confidence, create a JSON object with the following keys:
   * \`index\`: The \`index\` of the misclassified line.
   * \`suggestedClass\`: The correct class from the allowed list.
   * \`reason\`: A brief, concise justification for the change (in English or Arabic).
4. Compile all correction objects into a single JSON array.
5. If you find no definite errors, you MUST return an empty array \`[]\`.

### High-Confidence Heuristics (Arabic Screenplays)
1. **Dialogue after Character:** If a line is classified as \`action\` but directly follows a \`character\` line, contains three or more words, and reads like spoken Arabic, it is almost certainly \`dialogue\`.
2. **Inline Character Names:** If a line contains the pattern \`NAME :\` and is not part of a scene header, the text before the colon should be \`character\` and after it \`dialogue\`.
3. **Multi-Part Scene Headers:** If a line classified as \`action\` appears directly after a \`scene-header-1\` and contains multiple location names separated by dashes, it should be \`scene-header-3\`.
4. **Emotional Cues vs. Characters:** A single emotional/state word misclassified as \`character\` should be \`action\` or \`parenthetical\`.
5. **Principle of Caution:** Only flag unambiguous errors.

### Critical Rules
1. Output MUST be a valid JSON array ONLY.
2. No prose outside JSON.
3. Empty array when no corrections.
4. suggestedClass must be in the allowed set.
5. Reasons must be concise.

### DATA FOR ANALYSIS
${JSON.stringify(lines, null, 2)}
`;
}

// ========================== المساطر (Ruler) ================================
const Ruler = ({ orientation = 'horizontal', isDarkMode }) => {
  const length = orientation === 'horizontal' ? 1000 : 1123;
  const lengthInCm = Math.floor(length / PIXELS_PER_CM);
  const numbers = [];
  for (let i = 1; i <= lengthInCm; i++) {
    const style = orientation === 'horizontal'
      ? { right: `${i * PIXELS_PER_CM}px`, transform: 'translateX(50%)' }
      : { top: `${i * PIXELS_PER_CM}px`, transform: 'translateY(-50%)' };
    numbers.push(<span key={i} className="ruler-number" style={style}>{i}</span>);
  }
  return (
    <div className={`ruler-container ${orientation} ${isDarkMode ? 'dark' : ''}`}>
      {numbers}
    </div>
  );
};

// ======================== المكوّن الرئيسي ==================================
const ScreenplayEditor = () => {
  // -------------------- الحالة العامة --------------------
  const [htmlContent, setHtmlContent] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentFormat, setCurrentFormat] = useState('action');
  const [selectedFont, setSelectedFont] = useState('Amiri');
  const [selectedSize, setSelectedSize] = useState('14pt');
  const [documentStats, setDocumentStats] = useState({ characters: 0, words: 0, pages: 1, scenes: 0 });
  const [pageCount, setPageCount] = useState(1);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [_lastSavedContent, setLastSavedContent] = useState('');

  // -------------------- القوائم و الحوارات -----------------
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showCharacterRename, setShowCharacterRename] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [showLeftSidebar] = useState(true); 
  const [showRightSidebar] = useState(true);
    
  // ✨ Gemini Generator State
  const [generatorState, setGeneratorState] = useState({ 
    isOpen: false, 
    type: null, 
    input: '', 
    result: '', 
    isLoading: false 
  });

  // -------------------- الذكاء المحلي / الوكلاء --------------
  const [localClassifier, setLocalClassifier] = useState(null);
  const [isLoadingLocalAI, setIsLoadingLocalAI] = useState(false);
  const [useAgentSystem, setUseAgentSystem] = useState(true);
  const [useWorkflowSystem, setUseWorkflowSystem] = useState(true);
  const [agentSystemStats, setAgentSystemStats] = useState({
    totalClassifications: 0,
    agentDecisions: 0,
    coordinatorDecisions: 0,
    workflowDecisions: 0,
    averageConfidence: 0,
    totalApiCalls: 0,
    currentStrategy: 'fast-sequential'
  });

  // -------------------- مراجعة ذكية / طوابير -----------------
  const reviewQueueRef = useRef([]);
  const reviewTimeoutRef = useRef(null);
  const backgroundAuditorRef = useRef(null);
  const lastAuditTimeRef = useRef(Date.now());
  const [lastModifiedLines, setLastModifiedLines] = useState(new Set());

  // -------------------- مراجع DOM ---------------------------
  const classifierRef = useRef(new ScreenplayClassifier());
  const geminiCoordinator = useRef(null);
  const editorRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const stickyHeaderRef = useRef(null);
  const globalLineCounterRef = useRef(0);

  // -------------------- بيانات التنسيق ----------------------
  const screenplayFormats = [
    { id: 'basmala',          label: 'بسملة',             shortcut: '',        color: 'bg-purple-100', icon: <BookHeart size={18} /> },
    { id: 'scene-header-1',   label: 'عنوان المشهد (1)',   shortcut: 'Ctrl+1',  color: 'bg-blue-100',   icon: <Film size={18} /> },
    { id: 'scene-header-2',   label: 'عنوان المشهد (2)',   shortcut: 'Tab',     color: 'bg-blue-50',    icon: <MapPin size={18} /> },
    { id: 'scene-header-3',   label: 'عنوان المشهد (3)',   shortcut: 'Tab',     color: 'bg-blue-25',    icon: <Camera size={18} /> },
    { id: 'action',           label: 'الفعل/الحدث',        shortcut: 'Ctrl+4',  color: 'bg-gray-100',   icon: <Feather size={18} /> },
    { id: 'character',        label: 'شخصية',              shortcut: 'Ctrl+2',  color: 'bg-green-100',  icon: <UserSquare size={18} /> },
    { id: 'parenthetical',    label: 'بين قوسين',          shortcut: 'Tab',     color: 'bg-yellow-100', icon: <Parentheses size={18} /> },
    { id: 'dialogue',         label: 'حوار',               shortcut: 'Ctrl+3',  color: 'bg-orange-100', icon: <MessageCircle size={18} /> },
    { id: 'transition',       label: 'انتقال',             shortcut: 'Ctrl+6',  color: 'bg-red-100',    icon: <FastForward size={18} /> }
  ];

  const dramaAnalyzerTools = [
    { id: 'day-night',   label: 'وضع الرؤية',   icon: <Sun size={20} />,            action: () => setIsDarkMode(p => !p) },
    { id: 'scene-header',label: 'رأس المشهد',   icon: <Film size={20} />,           action: () => applyFormatToCurrentLine('scene-header-1') },
    { id: 'number-1',    label: 'رقم 1',        icon: <span className="text-lg font-bold">1</span>, action: () => applyFormatToCurrentLine('scene-header-1') },
    { id: 'number-2',    label: 'رقم 2',        icon: <span className="text-lg font-bold">2</span>, action: () => applyFormatToCurrentLine('scene-header-2') },
    { id: 'number-3',    label: 'رقم 3',        icon: <span className="text-lg font-bold">3</span>, action: () => applyFormatToCurrentLine('scene-header-3') },
    { id: 'action',      label: 'الحركة/الوصف', icon: <Feather size={20} />,        action: () => applyFormatToCurrentLine('action') },
    { id: 'character',   label: 'الشخصية',      icon: <UserSquare size={20} />,      action: () => applyFormatToCurrentLine('character') },
    { id: 'dialogue',    label: 'الحوار',       icon: <MessageCircle size={20} />,   action: () => applyFormatToCurrentLine('dialogue') },
    { id: 'transition',  label: 'الانتقال',     icon: <FastForward size={20} />,     action: () => applyFormatToCurrentLine('transition') }
  ];

  const screenplayEditorTools = [
    { id: 'new-text',     label: 'نص جديد',       icon: <FilePlus size={20} />,    action: createNewDocument },
    { id: 'load-file',    label: 'تحميل ملف',     icon: <Upload size={20} />,      action: () => document.getElementById('file-import-input').click() },
    { id: 'save-file',    label: 'حفظ ملف',       icon: <Save size={20} />,        action: saveDocument },
    { id: 'print',        label: 'طباعة',         icon: <Printer size={20} />,     action: printDocument },
    { id: 'gemini-audit', label: 'تدقيق ذكي',     icon: <Sparkles size={20} />,    action: () => smartNormalizeDocument() },
    { id: 'font-type',    label: 'نوع الخط',      icon: <Type size={20} />,        action: () => setShowFontMenu(p => !p) },
    { id: 'font-size',    label: 'حجم الخط',      icon: <Settings size={20} />,     action: () => setShowSizeMenu(p => !p) },
    { id: 'italic',       label: 'الخط المائل',   icon: <Italic size={20} />,      action: () => formatText('italic') },
    { id: 'underline',    label: 'وضع خط سفلي',   icon: <Underline size={20} />,    action: () => formatText('underline') },
    { id: 'bold',         label: 'الخط العريض',   icon: <Bold size={20} />,         action: () => formatText('bold') },
    { id: 'text-color',   label: 'لون الخط',      icon: <Palette size={20} />,      action: () => setShowColorPicker(p => !p) }
  ];

  const colors = ['#000000', '#e03131', '#c2255c', '#9c36b5', '#6741d9', '#3b5bdb', '#1b6ec2', '#0c8599', '#099268', '#2f9e44', '#66a80f', '#f08c00', '#e8590c', '#5f676e', '#343a40'];
  const fonts = [
    { value: 'Amiri', label: 'أميري' },
    { value: 'Noto Sans Arabic', label: 'نوتو سانس عربي' },
    { value: 'Cairo', label: 'القاهرة' },
    { value: 'Tajawal', label: 'تجوّل' },
    { value: 'Almarai', label: 'المراي' },
    { value: 'Markazi Text', label: 'مركزي' },
    { value: 'Reem Kufi', label: 'ريم كوفي' },
    { value: 'Scheherazade New', label: 'شهرزاد الجديد' },
    { value: 'Lateef', label: 'لطيف' },
    { value: 'Aref Ruqaa', label: 'عارف رقعة' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Tahoma', label: 'Tahoma' }
  ];
  const textSizes = [
    { value: '8pt', label: '8' }, { value: '9pt', label: '9' }, { value: '10pt', label: '10' },
    { value: '11pt', label: '11' }, { value: '12pt', label: '12' }, { value: '14pt', label: '14' },
    { value: '16pt', label: '16' }, { value: '18pt', label: '18' }, { value: '24pt', label: '24' }, { value: '36pt', label: '36' }
  ];

  // ==================== تنسيقات CSS للسطر =====================
  const getFormatStyles = useCallback((formatType) => {
    const base = {
      fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`,
      fontSize: selectedSize,
      direction: 'rtl',
      margin: '0',
      lineHeight: '1.6',
      minHeight: '1.6em'
    };
    const fm = {
      'basmala':        { textAlign: 'left', fontWeight: 'bold', fontSize: BASMALA_FONT_SIZE },
      'scene-header-1': { textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' },
      'scene-header-2': { textAlign: 'left', fontStyle: 'italic' },
      'scene-header-3': { textAlign: 'center', fontWeight: 'bold' },
      'action':         { textAlign: 'right' },
      'character':      { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', margin: `0 ${CHARACTER_MARGIN}` },
      'parenthetical':  { textAlign: 'center', fontStyle: 'italic', margin: `0 ${PARENTHETICAL_MARGIN}` },
      'dialogue':       { textAlign: 'center', margin: `0 ${DIALOGUE_MARGIN}` },
      'transition':     { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }
    };
    return { ...base, ...(fm[formatType] || {}) };
  }, [selectedFont, selectedSize]);

  // ==================== حساب الإحصاءات =======================
  const calculateStats = useCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.textContent || '';
    const characters = content.length;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const scenes = editorRef.current.querySelectorAll('.scene-header-1').length;
    const pages = Math.max(1, Math.ceil(editorRef.current.scrollHeight / (A4_PAGE_HEIGHT_PX + 20)));
    setDocumentStats({ characters, words, pages, scenes });
    setPageCount(pages);
  }, []);

  // إعادة تطبيق الأنماط بعد كل تغيير خط/حجم أو htmlContent
  useEffect(() => {
    if (editorRef.current) {
      const divs = editorRef.current.querySelectorAll('div[class]');
      divs.forEach(div => {
        Object.assign(div.style, getFormatStyles(div.className));
      });
      calculateStats();
    }
  }, [selectedFont, selectedSize, htmlContent, getFormatStyles, calculateStats]);

  // ==================== خرائط المسافات و الانتقال ===================
  const getMarginTop = (from, to) => {
    const spacingMap = {
      'scene-header-1': { 'scene-header-3': '0px', 'action': '1em' },
      'scene-header-3': { 'action': '0.5em' },
      'action':         { 'action': '0px', 'character': '1em', 'scene-header-1': '2em' },
      'character':      { 'dialogue': '0px', 'parenthetical': '0px' },
      'parenthetical':  { 'dialogue': '0px' },
      'dialogue':       { 'action': '1em', 'character': '1em' },
      'transition':     { 'scene-header-1': '2em' },
      'basmala':        { 'scene-header-1': '1em' }
    };
    return spacingMap[from]?.[to] || '0px';
  };

  const getNextFormatOnEnter = (fmt) => ({
    'scene-header-1': 'scene-header-3',
    'scene-header-3': 'action',
    'action': 'action',
    'character': 'dialogue',
    'parenthetical': 'dialogue',
    'dialogue': 'action',
    'transition': 'scene-header-1',
    'basmala': 'scene-header-1'
  }[fmt] || 'action');

  const needsEmptyLine = (prev, cur) => {
    const rules = {
      'scene-header-3': ['action'],
      'action': ['character', 'transition'],
      'dialogue': ['character', 'action', 'transition'],
      'transition': ['scene-header-1']
    };
    return rules[prev]?.includes(cur) || false;
  };

  const normalizeSpacing = (contentLines, preservePDFSpacing = false) => {
    const normalizedLines = [];
    let previousFormat = null;
    
    for (let i = 0; i < contentLines.length; i++) {
      const currentLine = contentLines[i];
      const isEmptyLine = !currentLine.content.trim();
      
      if (isEmptyLine) {
        if (preservePDFSpacing) {
          normalizedLines.push({ content: '', format: 'action', isEmpty: true });
        }
        continue;
      }
      
      if (!preservePDFSpacing && previousFormat && needsEmptyLine(previousFormat, currentLine.format)) {
        normalizedLines.push({ content: '', format: 'action', isEmpty: true });
      }
      
      normalizedLines.push(currentLine);
      previousFormat = currentLine.format;
    }
    
    return normalizedLines;
  };

  // ==================== الدوال العامة للتنسيق ====================
  const updateContent = useCallback(async (shouldSaveToUndo = true) => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;

    if (shouldSaveToUndo && html !== htmlContent) {
      setUndoStack(prev => [...prev.slice(-19), htmlContent]);
      setRedoStack([]);

      const sel = window.getSelection();
      if (sel.rangeCount > 0) {
        let el = sel.getRangeAt(0).commonAncestorContainer;
        while (el && el.nodeName !== 'DIV') el = el.parentNode;
        if (el && el.getAttribute) {
          const idx = parseInt(el.getAttribute('data-line-index') || '0');
          markLineAsModified(idx);
          performInstantClassification(el);
        }
      }
    }

    setHtmlContent(html);

    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      let el = sel.getRangeAt(0).commonAncestorContainer;
      while (el && el.nodeName !== 'DIV') el = el.parentNode;
      if (el && el.className) {
        const fmt = screenplayFormats.map(f => f.id).find(cls => el.className.includes(cls));
        setCurrentFormat(fmt || 'action');
      } else {
        setCurrentFormat('action');
      }
    }

    calculateStats();
  }, [htmlContent, screenplayFormats, calculateStats]);

  const applyFormatToCurrentLine = (formatType, styleOverride = {}) => {
    document.execCommand('formatBlock', false, 'div');
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    let el = sel.getRangeAt(0).commonAncestorContainer;
    while (el && el.nodeName !== 'DIV') el = el.parentNode;

    if (!el || el.nodeName !== 'DIV') {
      const range = sel.getRangeAt(0);
      const div = document.createElement('div');
      try {
        range.surroundContents(div);
        el = div;
      } catch {
        const txt = range.toString();
        range.deleteContents();
        div.textContent = txt || ' ';
        range.insertNode(div);
        el = div;
      }
    }

    if (el) {
      el.className = formatType;
      Object.assign(el.style, getFormatStyles(formatType), styleOverride);
      setCurrentFormat(formatType);
      updateContent();
    }
  };

  function formatText(command, value = null) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateContent();
  }

  // ==================== الكتابة الفورية (Enter فقط) ====================
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'a') {
            e.preventDefault();
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            return;
        }
        const formatMap = { '1': 'scene-header-1', '2': 'character', '3': 'dialogue', '4': 'action', '6': 'transition' };
        if (formatMap[key]) { e.preventDefault(); applyFormatToCurrentLine(formatMap[key]); }
        if (key === 'b') { e.preventDefault(); formatText('bold'); }
        if (key === 'i') { e.preventDefault(); formatText('italic'); }
        if (key === 'u') { e.preventDefault(); formatText('underline'); }
    } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nextFormat = getNextFormatOnEnter(currentFormat);
        document.execCommand('insertParagraph');
        applyFormatToCurrentLine(nextFormat);
    }
    updateContent();
  };

  // ==================== التصنيف الفوري للسطر ===================
  const performInstantClassification = async (element) => {
    if (!element || !element.textContent) return;
    const content = element.textContent.trim();
    if (content.length < 2) return;

    try {
      const prev = element.previousElementSibling?.className || 'action';
      let newFmt = classifyLineInstantly(content, prev);

      if (localClassifier && content.length > 4) {
        try {
          const localRes = await classifyWithLocalAI(content, { previousFormat: prev, position: 'live-typing', isInstant: true });
          if (localRes && localRes.confidence > 0.7) newFmt = localRes.classification;
        } catch { /* ignore */ }
      }

      if (useAgentSystem && content.length > 8 && newFmt === 'action') {
        try {
          const gemRes = await classifyLineWithAgents(content, { previousFormat: prev, position: 'live-typing', isInstant: true });
          if (gemRes && gemRes.confidence > 0.8) newFmt = gemRes.classification;
        } catch { /* ignore */ }
      }

      if (newFmt && newFmt !== element.className) {
        element.className = newFmt;
        Object.assign(element.style, getFormatStyles(newFmt));
        setCurrentFormat(newFmt);
      }
    } catch (err) {
      console.error('[InstantClassification] Error:', err);
    }
  };

  // مصنف فوري بسيط
  const classifyLineInstantly = (text, previousFormat) => {
    if (!text || text.length < 2) return 'action';
    const trimmed = text.trim();
    if (/^[^\s:]{1,15}:/.test(trimmed)) return 'character';
    if (/^(مشهد|scene|الفصل|chapter)/i.test(trimmed)) return 'scene-header-1';
    if (/^(داخلي|خارجي|ليل|نهار|صباح|مساء|interior|exterior)/i.test(trimmed)) return 'scene-header-2';
    if (/^(البيت|المدرسة|المكتب|الشارع|المستشفى|الغرفة)/i.test(trimmed)) return 'scene-header-3';
    if (/^(قطع|اختفاء|انتقال|cut|fade)/i.test(trimmed) && trimmed.length < 20) return 'transition';
    if (/^(أنا|أنت|نعم|لا|ربما|آه|أوه)/.test(trimmed)) return 'dialogue';
    if (/[؟!]$/.test(trimmed)) return 'dialogue';
    if (/^(يدخل|يخرج|يجلس|يقوم|يمشي|نرى|نشاهد)/.test(trimmed)) return 'action';
    if (previousFormat === 'character') return 'dialogue';
    if (previousFormat === 'dialogue' && /^(هو|هي|الرجل|المرأة)/.test(trimmed)) return 'action';
    return 'action';
  };

  // تهيئة الذكاء المحلي
  const initializeLocalAI = useCallback(async () => {
    if (localClassifier || isLoadingLocalAI) return;
    try {
      setIsLoadingLocalAI(true);
    //   const classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased', {
    //     device: 'webgpu',
    //     dtype: 'fp16'
    //   });
    //   setLocalClassifier(classifier);
    } catch (err) {
      console.warn('[LocalAI] WebGPU failed, fallback to WASM:', err);
      try {
        // const classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased', { device: 'wasm' });
        // setLocalClassifier(classifier);
      } catch (wasmErr) {
        console.error('[LocalAI] Failed to init local AI:', wasmErr);
      }
    } finally {
      setIsLoadingLocalAI(false);
    }
  }, [localClassifier, isLoadingLocalAI]);

  const classifyWithLocalAI = async (text, context = {}) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { classification: 'action', confidence: 0.5, source: 'default-fallback' };
    }
    if (!localClassifier) return classifyLineInstantly(text, context.previousFormat);
    try {
      const enriched = `Previous: ${context.previousFormat || 'none'}. Text: ${text.trim()}`;
      const result = await localClassifier(enriched);
      const conf = result[0]?.score || 0.5;
      const mapped = mapModelOutputToFormat(result, text, context);
      return { classification: mapped, confidence: conf, source: 'local-ai' };
    } catch (err) {
      console.error('[LocalAI] Error:', err);
      return { classification: classifyLineInstantly(text, context.previousFormat), confidence: 0.6, source: 'fallback' };
    }
  };

  const mapModelOutputToFormat = (modelResult, text, context) => {
    const base = classifyLineInstantly(text, context.previousFormat);
    if (modelResult[0]?.score > 0.8) {
      const label = modelResult[0].label.toLowerCase();
      if (label.includes('dialogue') || label.includes('conversation')) return 'dialogue';
      if (label.includes('action') || label.includes('description')) return 'action';
    }
    if (['character', 'scene-header-1', 'scene-header-2', 'scene-header-3', 'transition'].includes(base)) return base;
    return base;
  };

  // تهيئة جيمني
  const initializeGeminiSystem = useCallback(() => {
    if (!geminiCoordinator.current) {
      geminiCoordinator.current = new GeminiCoordinator();
      const apiKey = ""; 
      if (apiKey) {
        const ok = geminiCoordinator.current.setApiKey(apiKey);
        if (!ok) console.error('[Gemini] Failed to set API key');
      }
    }
  }, []);

  const classifyLineWithAgents = async (text, context = {}) => {
    if (!geminiCoordinator.current) {
      console.warn('[Gemini] Coordinator not initialized');
      return { classification: classifyLineInstantly(text, context.previousFormat), confidence: 0.6, source: 'fallback' };
    }
    try {
      const result = await geminiCoordinator.current.classifyWithAgents(text, context);
      setAgentSystemStats(p => ({
        ...p,
        totalClassifications: p.totalClassifications + 1,
        coordinatorDecisions: p.coordinatorDecisions + 1,
        totalApiCalls: p.totalApiCalls + 1,
        averageConfidence: (p.averageConfidence * p.totalClassifications + result.confidence) / (p.totalClassifications + 1)
      }));
      return result;
    } catch (err) {
      console.error('[Gemini] classify error:', err);
      return { classification: classifyLineInstantly(text, context.previousFormat), confidence: 0.5, source: 'error-fallback' };
    }
  };

  // مراجعة جيمني
  async function auditWithGemini(batch) {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const prompt = buildAuditPrompt(batch);
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: 'application/json' }
        })
      });
      if (!resp.ok) {
        const errTxt = await resp.text();
        console.error('Gemini API Error:', resp.status, errTxt);
        return [];
      }
      const data = await resp.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      let corrections = JSON.parse(rawText);
      if (!Array.isArray(corrections)) return [];
      const allowed = new Set(screenplayFormats.map(f => f.id));
      return corrections.filter(c => typeof c?.index === 'number' && allowed.has(c?.suggestedClass));
    } catch (err) {
      console.error('Gemini audit exception:', err);
      return [];
    }
  }

  // ✨ Gemini Creative Text Generation
  async function generateCreativeText(prompt) {
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            return `حدث خطأ أثناء الاتصال بالخادم: ${errorText}`;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
             return "لم يتمكن النموذج من إنشاء رد. حاول مرة أخرى.";
        }
        return text;

    } catch (error) {
        console.error('Gemini creative text exception:', error);
        return `حدث استثناء: ${error.message}`;
    }
  }

  // طابور مراجعة جيمني
  const queueForGeminiReview = (element, content, format) => {
    const item = { element, content: content.trim(), format, timestamp: Date.now(), lineIndex: element.getAttribute('data-line-index') };
    reviewQueueRef.current.push(item);
    if (reviewTimeoutRef.current) clearTimeout(reviewTimeoutRef.current);
    reviewTimeoutRef.current = setTimeout(processReviewQueue, 2000);
  };

  const processReviewQueue = async () => {
    if (reviewQueueRef.current.length === 0) return;
    const items = [...reviewQueueRef.current];
    reviewQueueRef.current = [];
    const batch = items.map(it => ({ index: parseInt(it.lineIndex || '0'), raw: it.content, cls: it.format }));
    try {
      setIsAuditing(true);
      const corrections = await auditWithGemini(batch);
      if (corrections.length > 0) {
        const map = new Map(corrections.map(c => [c.index, c.suggestedClass]));
        items.forEach(it => {
          const idx = parseInt(it.lineIndex || '0');
          if (map.has(idx) && it.element.parentNode) {
            const newCls = map.get(idx);
            if (it.element.className !== newCls) {
              it.element.className = newCls;
              Object.assign(it.element.style, getFormatStyles(newCls));
              const sel = window.getSelection();
              if (sel.rangeCount > 0) {
                let cur = sel.getRangeAt(0).commonAncestorContainer;
                while (cur && cur.nodeName !== 'DIV') cur = cur.parentNode;
                if (cur === it.element) setCurrentFormat(newCls);
              }
            }
          }
        });
        updateContent(false);
      }
    } catch (err) {
      console.error('[SmartReview] error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // المدقق الخلفي
  const startBackgroundAuditor = () => {
    if (backgroundAuditorRef.current) clearInterval(backgroundAuditorRef.current);
    backgroundAuditorRef.current = setInterval(async () => {
      if (!ENABLE_GEMINI_AUDIT || isAuditing || !editorRef.current) return;
      const now = Date.now();
      if (now - lastAuditTimeRef.current < 10000) return;

      const allDivs = Array.from(editorRef.current.children);
      const recent = [];
      allDivs.forEach((div, idx) => {
        const lineIndex = parseInt(div.getAttribute('data-line-index') || '0');
        const content = div.textContent?.trim();
        if (content && (
          idx >= allDivs.length - 10 ||
          lastModifiedLines.has(lineIndex) ||
          now - (div.dataset.lastModified || 0) < 60000
        )) {
          recent.push({ index: lineIndex, raw: content, cls: div.className || 'action', element: div });
        }
      });

      if (recent.length === 0) return;

      try {
        setIsAuditing(true);
        const corrections = await auditWithGemini(recent);
        if (corrections.length > 0) {
          const map = new Map(corrections.map(c => [c.index, c.suggestedClass]));
          recent.forEach(item => {
            if (map.has(item.index) && item.element.parentNode) {
              const newCls = map.get(item.index);
              if (item.element.className !== newCls) {
                item.element.className = newCls;
                Object.assign(item.element.style, getFormatStyles(newCls));
                item.element.style.transition = 'background-color 0.3s ease';
                item.element.style.backgroundColor = isDarkMode ? '#065f46' : '#dcfce7';
                setTimeout(() => {
                  item.element.style.backgroundColor = '';
                  setTimeout(() => { item.element.style.transition = ''; }, 300);
                }, 1500);
              }
            }
          });
          setLastModifiedLines(new Set());
          updateContent(false);
        }
        lastAuditTimeRef.current = now;
      } catch (err) {
        console.error('[BackgroundAuditor] error:', err);
      } finally {
        setIsAuditing(false);
      }
    }, 15000);
  };

  const stopBackgroundAuditor = () => {
    if (backgroundAuditorRef.current) {
      clearInterval(backgroundAuditorRef.current);
      backgroundAuditorRef.current = null;
    }
  };

  // تعليم السطر على أنه معدّل
  const markLineAsModified = (lineIndex) => {
    setLastModifiedLines(prev => new Set([...prev, lineIndex]));
    if (editorRef.current) {
      const divs = editorRef.current.children;
      for (let div of divs) {
        if (parseInt(div.getAttribute('data-line-index') || '0') === lineIndex) {
          div.dataset.lastModified = Date.now().toString();
          break;
        }
      }
    }
  };

    // ==================== لصق النص (Paste) =====================
    const handlePaste = async (e) => {
        e.preventDefault();
        const textData = e.clipboardData.getData('text/plain');
        if (!textData) return;

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const lines = textData.split('\n');
        const classifier = classifierRef.current;
        const batchLinesForAudit = [];

        const contentLines = [];
        let previousFormatClass = currentFormat;

        for (const line of lines) {
            let trimmedLine = line.trim();
            if (STRIP_LEADING_BULLETS && trimmedLine) {
                trimmedLine = stripLeadingBullet(trimmedLine);
            }

            let formatClass = 'action';
            if (trimmedLine) {
                if (useAgentSystem) {
                    try {
                        const res = await classifyLineWithAgents(trimmedLine, { previousFormat: previousFormatClass, position: 'paste', isTyping: false });
                        formatClass = res.classification;
                    } catch (error) {
                        formatClass = classifier.classifyLine(trimmedLine, previousFormatClass);
                    }
                } else {
                    formatClass = classifier.classifyLine(trimmedLine, previousFormatClass);
                }
            }
            let cleanLine = trimmedLine;
            let isHtml = false;

            if (formatClass === 'scene-header-1-split') {
                const splitResult = classifier.splitSceneHeader(trimmedLine);
                if (splitResult) {
                    formatClass = 'scene-header-1';
                    cleanLine = `<span>${splitResult.sceneNumber}</span><span>${splitResult.sceneInfo}</span>`;
                    isHtml = true;
                }
            } else if (formatClass === 'character-inline') {
                const parts = trimmedLine.split(/:/);
                const namePart = parts.shift().trim();
                const dialoguePart = parts.join(':').trim();
                contentLines.push({ content: namePart + ' :', format: 'character', isHtml: false });
                contentLines.push({ content: dialoguePart, format: 'dialogue', isHtml: false });
                previousFormatClass = 'dialogue';
                continue;
            }

            if (formatClass === 'character' && trimmedLine && !trimmedLine.endsWith(':') && !trimmedLine.endsWith('：')) {
                cleanLine += ' :';
            }

            contentLines.push({ content: cleanLine, format: formatClass, isHtml: isHtml });
            if (trimmedLine) {
                previousFormatClass = formatClass;
            }
        }

        const normalizedLines = normalizeSpacing(contentLines, e.isPDFSource);
        let formattedHTML = '';
        for (const line of normalizedLines) {
            const lineIndex = globalLineCounterRef.current;
            if (line.isEmpty) {
                formattedHTML += `<div class="action" style="min-height: 1.6em;" data-line-index="${lineIndex}"><br></div>`;
            } else {
                batchLinesForAudit.push({ index: lineIndex, raw: line.content, cls: line.format });
                const div = document.createElement('div');
                div.className = line.format;
                div.setAttribute('data-line-index', String(lineIndex));
                if (line.isHtml) div.innerHTML = line.content;
                else div.textContent = line.content;
                formattedHTML += div.outerHTML;
            }
            globalLineCounterRef.current++;
        }

        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(formattedHTML);
        const lastNode = fragment.lastChild;
        range.insertNode(fragment);

        if (lastNode) {
            const newRange = document.createRange();
            newRange.setStartAfter(lastNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }

        updateContent();

        if (ENABLE_GEMINI_AUDIT && batchLinesForAudit.length > 0) {
            setIsAuditing(true);
            const subset = batchLinesForAudit.slice(-GEMINI_AUDIT_WINDOW);
            const corrections = await auditWithGemini(subset);
            if (corrections.length > 0 && editorRef.current) {
                const map = new Map(corrections.map(c => [c.index, c.suggestedClass]));
                const children = editorRef.current.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    const idxAttr = child.getAttribute('data-line-index');
                    if (!idxAttr) continue;
                    const lineIdx = parseInt(idxAttr, 10);
                    if (map.has(lineIdx)) {
                        const newCls = map.get(lineIdx);
                        if (child.className !== newCls) {
                            child.className = newCls;
                            Object.assign(child.style, getFormatStyles(newCls));
                        }
                    }
                }
                setHtmlContent(editorRef.current.innerHTML);
            }
            setIsAuditing(false);
        }
    };
    
    // ==================== استيراد الملفات =====================
    async function handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsImporting(true);
            createNewDocument();
            let text = '';
            if (file.name.toLowerCase().endsWith('.pdf')) {
                try {
                    await handleAdvancedPDFImport(file);
                    return;
                } catch (error) {
                    text = await fileReaderService.extractTextFromFile(file);
                }
            } else {
                text = await fileReaderService.extractTextFromFile(file);
            }

            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            setTimeout(() => {
                handlePaste({ preventDefault: () => {}, clipboardData: dt });
                setIsImporting(false);
            }, 0);
        } catch (error) {
            console.error('File import error:', error);
            setIsImporting(false);
            alert(`فشل استيراد الملف: ${error.message || error}`);
        } finally {
            e.target.value = '';
        }
    }

    // ==================== PDF OCR المسار المتقدم =====================
    async function handleAdvancedPDFImport(pdfFile) {
        setIsImporting(true);
        try {
            let extractedText = null;
            if (!extractedText) {
                // extractedText = await processPDFWithTesseract(pdfFile);
            }
            if (!extractedText) throw new Error('All OCR methods failed');

            const processedText = await smartProcessPDFText(extractedText);
            const dt = new DataTransfer();
            dt.setData('text/plain', processedText);
            await handlePaste({ preventDefault: () => {}, clipboardData: dt, isPDFSource: true });
        } catch (error) {
            console.error('[AdvancedPDFImport] Error:', error);
            alert('فشل استيراد ملف PDF (OCR): ' + (error?.message || error));
        } finally {
            setIsImporting(false);
        }
    };

    // ==================== استيراد ملفات TXT / DOCX =====================
    const handleStructuredTextImport = async (file) => {
        setIsImporting(true);
        try {
            const rawText = await fileReaderService.extractTextFromFile(file);
            if (!rawText || !rawText.trim()) {
                throw new Error('المحتوى المستخرج فارغ');
            }
            await importTextThroughPastePipeline(rawText, {
                source: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'file'
            });
        } catch (err) {
            console.error('[StructuredImport] Error:', err);
            alert('فشل استيراد الملف: ' + (err?.message || err));
        } finally {
            setIsImporting(false);
        }
    };
    
    // ==================== قناة موحّدة لتمرير أي نص عبر مسار اللصق =====================
    const importTextThroughPastePipeline = async (text, { source = 'clipboard' } = {}) => {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        await handlePaste({ preventDefault: () => {}, clipboardData: dt, isPDFSource: source === 'pdf' });
    };
    
    // ==================== زر "التنسيق الذكي" (Normalize) =====================
    async function smartNormalizeDocument() {
        if (!editorRef.current) return;
        const allDivs = Array.from(editorRef.current.children);
        const contentLines = [];
        let previousFormatClass = 'action';
        const batchLinesForAudit = [];
        const classifier = classifierRef.current;

        for (const div of allDivs) {
            const content = (div.textContent || '').trim();
            if (!content) {
                contentLines.push({ content: '', format: 'action', isHtml: false, isEmpty: true });
                continue;
            }
            let formatClass;
            try {
                if (useAgentSystem) {
                    const res = await classifyLineWithAgents(content, { previousFormat: previousFormatClass, position: 'normalize' });
                    formatClass = res.classification;
                } else {
                    formatClass = classifier.classifyLine(content, previousFormatClass);
                }
            } catch {
                formatClass = classifier.classifyLine(content, previousFormatClass);
            }
            if (formatClass === 'character-inline') {
                const parts = content.split(/:/);
                const namePart = parts.shift().trim();
                const dialoguePart = parts.join(':').trim();
                contentLines.push({ content: namePart + ' :', format: 'character', isHtml: false });
                if (dialoguePart) contentLines.push({ content: dialoguePart, format: 'dialogue', isHtml: false });
                previousFormatClass = 'dialogue';
                continue;
            }
            let cleanContent = content;
            if (formatClass === 'character' && !content.endsWith(':') && !content.endsWith('：')) {
                cleanContent += ' :';
            }
            contentLines.push({ content: cleanContent, format: formatClass, isHtml: false });
            previousFormatClass = formatClass;
        }

        const normalized = normalizeSpacing(contentLines, false);
        editorRef.current.innerHTML = '';
        globalLineCounterRef.current = 0;

        for (const line of normalized) {
            const idx = globalLineCounterRef.current;
            const div = document.createElement('div');
            div.setAttribute('data-line-index', String(idx));
            if (line.isEmpty) {
                div.className = 'action';
                div.innerHTML = '<br>';
                div.style.minHeight = '1.6em';
            } else {
                batchLinesForAudit.push({ index: idx, raw: line.content, cls: line.format });
                div.className = line.format;
                div.textContent = line.content;
                Object.assign(div.style, getFormatStyles(line.format));
            }
            editorRef.current.appendChild(div);
            globalLineCounterRef.current++;
        }
        updateContent();

        if (ENABLE_GEMINI_AUDIT && batchLinesForAudit.length) {
            try {
                setIsAuditing(true);
                const subset = batchLinesForAudit.slice(-GEMINI_AUDIT_WINDOW);
                const corrections = await auditWithGemini(subset);
                if (corrections.length && editorRef.current) {
                    const map = new Map(corrections.map(c => [c.index, c.suggestedClass]));
                    const children = editorRef.current.children;
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i];
                        const idxAttr = child.getAttribute('data-line-index');
                        if (!idxAttr) continue;
                        const idx = parseInt(idxAttr, 10);
                        if (map.has(idx)) {
                            const newCls = map.get(idx);
                            if (child.className !== newCls) {
                                child.className = newCls;
                                Object.assign(child.style, getFormatStyles(newCls));
                            }
                        }
                    }
                    setHtmlContent(editorRef.current.innerHTML);
                }
            } catch (err) {
                console.error('[SmartFormatting] Gemini audit error:', err);
            } finally {
                setIsAuditing(false);
            }
        }
    }

  // ✨ Gemini Generator Functions
  const openGenerator = (type) => {
    setGeneratorState({
        isOpen: true,
        type: type,
        input: '',
        result: '',
        isLoading: false,
    });
    setShowToolsMenu(false);
  };

  const handleGenerate = async () => {
    if (!generatorState.input.trim()) return;

    setGeneratorState(prev => ({ ...prev, isLoading: true, result: '' }));

    let prompt = '';
    if (generatorState.type === 'character') {
        prompt = `أنت مساعد كتابة سيناريو خبير. قم بإنشاء ملف شخصية مفصل بناءً على الوصف التالي: '${generatorState.input}'. يجب أن يتضمن الملف: الاسم، العمر، المظهر، السمات الشخصية الرئيسية، ونبذة عن خلفية الشخصية. قدم الإجابة بتنسيق واضح ومنظم باستخدام Markdown.`;
    } else if (generatorState.type === 'scene') {
        prompt = `أنت مساعد كتابة سيناريو إبداعي. قم بتوليد ثلاثة أفكار لمشهد سينمائي بناءً على هذا الملخص: '${generatorState.input}'. لكل فكرة، قدم: 1. عنوان المشهد (داخلي/خارجي - المكان - الوقت). 2. ملخص قصير للحدث الرئيسي في المشهد. 3. سطر حوار مميز يمكن أن يقال في المشهد.`;
    }

    const result = await generateCreativeText(prompt);
    setGeneratorState(prev => ({ ...prev, isLoading: false, result: result }));
  };


  const loadSampleText = () => {
    const sample = `
- مشهد 1 - ليل - داخلي
- شقة قديمة
- يجلس "سامي" (30 عامًا) على أريكة متهالكة.
سامي :
(متوترًا)
لا أعرف ماذا أفعل.
- يظهر شبح "ليلى" (25 عامًا) خلفه.
ليلى:
أنا أعرف.
قطع
    `.trim();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', sample);
    handlePaste({ preventDefault: () => { }, clipboardData: dataTransfer });
  };

  const closeAllMenus = () => {
    setShowFileMenu(false); setShowEditMenu(false); setShowViewMenu(false);
    setShowToolsMenu(false); setShowFontMenu(false); setShowSizeMenu(false); setShowColorPicker(false);
  };

  // File operations
  function createNewDocument() {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      const defaultDiv = document.createElement('div');
      defaultDiv.innerHTML = '<br>';
      defaultDiv.className = 'action';
      defaultDiv.setAttribute('data-line-index', '0');
      Object.assign(defaultDiv.style, getFormatStyles('action'));
      editorRef.current.appendChild(defaultDiv);
      globalLineCounterRef.current = 1;
      updateContent(false);
      setLastSavedContent('');
      setUndoStack([]);
      setRedoStack([]);
    }
    setShowFileMenu(false);
  }

  function saveDocument() {
    const content = editorRef.current?.innerHTML || '';
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'screenplay.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setLastSavedContent(content);
    setShowFileMenu(false);
  }

  async function exportToPDF() {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const content = editorRef.current?.textContent || '';
      
      const lines = doc.splitTextToSize(content, 180);
      let yPosition = 20;
      
      lines.forEach((line) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 15, yPosition);
        yPosition += 7;
      });
      
      doc.save('screenplay.pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('فشل في تصدير PDF. يرجى المحاولة مرة أخرى.');
    }
    setShowFileMenu(false);
  }

  function printDocument() {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const content = editorRef.current?.outerHTML || '';
      printWindow.document.write(`
        <html>
          <head><title>طباعة السيناريو</title>
          <style>body { direction: rtl; font-family: 'Amiri', Arial, sans-serif; } .page-content { padding: 2cm; }</style>
          </head><body><div class="page-content">${content}</div></body></html>`);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    setShowFileMenu(false);
  }

  // Edit operations
  function undoAction() {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [htmlContent, ...prev.slice(0, 19)]);
      setUndoStack(prev => prev.slice(0, -1));
      if (editorRef.current) {
        editorRef.current.innerHTML = previousState;
        updateContent(false);
      }
    }
    setShowEditMenu(false);
  }

  function redoAction() {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, htmlContent]);
      setRedoStack(prev => prev.slice(1));
      if (editorRef.current) {
        editorRef.current.innerHTML = nextState;
        updateContent(false);
      }
    }
    setShowEditMenu(false);
  }

  function cutText() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const selectedText = selection.toString();
      navigator.clipboard.writeText(selectedText);
      selection.deleteFromDocument();
      updateContent();
    }
    setShowEditMenu(false);
  }

  function copyText() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const selectedText = selection.toString();
      navigator.clipboard.writeText(selectedText);
    }
    setShowEditMenu(false);
  }

  async function pasteText() {
    try {
      const text = await navigator.clipboard.readText();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        updateContent();
      }
    } catch (error) {
      console.error('Paste error:', error);
    }
    setShowEditMenu(false);
  }

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      const defaultDiv = document.createElement('div');
      defaultDiv.innerHTML = '<br>';
      defaultDiv.className = 'action';
      defaultDiv.setAttribute('data-line-index', '0');
      Object.assign(defaultDiv.style, getFormatStyles('action'));
      editorRef.current.appendChild(defaultDiv);
      globalLineCounterRef.current = 1;
      updateContent();
    }
    
    const handleClickOutside = (e) => { if (!e.target.closest('.menu-container, .toolbar-container')) { closeAllMenus(); } };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('selectionchange', updateContent);
    if (stickyHeaderRef.current) setStickyHeaderHeight(stickyHeaderRef.current.offsetHeight);
    
    initializeGeminiSystem();
    initializeLocalAI();
    startBackgroundAuditor();
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('selectionchange', updateContent);
      stopBackgroundAuditor();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Recalculate sticky header height when rulers are shown/hidden
  useEffect(() => {
     if (stickyHeaderRef.current) {
       setTimeout(() => setStickyHeaderHeight(stickyHeaderRef.current.offsetHeight), 0);
     }
  }, [showRulers]);

  const Tooltip = ({ text, children }) => (<div className="relative group">{children}<div className="tooltip">{text}</div></div>);
  
  const SidebarButton = ({ tool, isActive = false, orientation = 'left' }) => (
    <button 
      onClick={tool.action}
      className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 mb-2 group relative ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg' 
          : isDarkMode 
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white' 
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
      }`}
      title={tool.label}
    >
      {tool.icon}
      <div className={`absolute ${orientation === 'left' ? 'left-14' : 'right-14'} top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50`}>
        {tool.label}
      </div>
    </button>
  );
  const Dialog = ({ title, children, isOpen, onClose }) => { if (!isOpen) return null; return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}><div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`} onClick={e => e.stopPropagation()}><div className="flex justify-between items-center border-b pb-3 mb-4" dir="rtl"><h3 className="text-lg font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>{title}</h3><button onClick={onClose} className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><X size={20} /></button></div><div>{children}</div></div></div>); };
  const MenuItem = ({ icon, label, shortcut, onClick, hasSeparator = false, isChecked = false }) => (<><button onClick={onClick} className={`w-full text-right flex justify-between items-center px-3 py-1.5 text-sm rounded ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}><div className="flex items-center gap-3">{isChecked ? <Check size={16} /> : icon}<span style={{ fontFamily: 'Cairo, sans-serif' }}>{label}</span></div>{shortcut && <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{shortcut}</span>}</button>{hasSeparator && <div className={`my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ height: '1px' }} />}</>);

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-200 text-gray-800'}`} dir="rtl">
      <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans+Arabic:wght@100..900&family=Cairo:wght@200..1000&family=Tajawal:wght@200..900&family=Almarai:wght@300;400;700;800&family=Markazi+Text:wght@400..700&family=Reem+Kufi:wght@400..700&family=Scheherazade+New:wght@400..700&family=Lateef:wght@200..800&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
        :root { 
          --page-bg: ${isDarkMode ? '#ffffff' : '#ffffff'};
          --page-shadow: ${isDarkMode ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)'};
          --ruler-bg: ${isDarkMode ? '#2d3748' : '#f0f0f0'};
          --ruler-line: ${isDarkMode ? '#4a5568' : '#cbd5e0'};
          --ruler-text: ${isDarkMode ? '#a0aec0' : '#4a5568'};
          --px-per-cm: ${PIXELS_PER_CM}px;
        }
        .page-content { outline: none; direction: rtl; padding: 96px 144px 96px 96px; min-height: 1123px; line-height: 1.6; }
        .page-content.dark-mode-text {
          color: #111827;
        }
        .page-background { position: relative; width: 100%; max-width: 794px; height: 1123px; margin: 0 auto 20px auto; background: var(--page-bg); box-shadow: 0 4px 12px var(--page-shadow); border-radius: 3px; }
        .page-number { position: absolute; bottom: 30px; left: 30px; font-size: 12px; color: ${isDarkMode ? '#6b7280' : '#9ca3af'}; font-family: Arial, sans-serif; }
        .tooltip { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; padding: 8px 12px; background: ${isDarkMode ? '#1f2937' : '#374151'}; color: white; font-size: 12px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 1000; }
        .tooltip::after { content: ''; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-bottom-color: ${isDarkMode ? '#1f2937' : '#374151'}; }
        .group:hover .tooltip { opacity: 1; }

        .ruler-container {
          position: absolute;
          background-color: var(--ruler-bg);
          z-index: 10;
          overflow: hidden;
          pointer-events: none;
        }
        .ruler-container.horizontal {
          height: 30px;
          width: 100%;
          top: 0;
          right: 0;
          border-bottom: 1px solid var(--ruler-line);
          background-image: 
            repeating-linear-gradient(to right, var(--ruler-line) 0, var(--ruler-line) 1px, transparent 1px, transparent calc(var(--px-per-cm) / 10)),
            repeating-linear-gradient(to right, var(--ruler-line) 0, var(--ruler-line) 1px, transparent 1px, transparent calc(var(--px-per-cm) / 2)),
            repeating-linear-gradient(to right, var(--ruler-line) 0, var(--ruler-line) 1px, transparent 1px, transparent var(--px-per-cm));
          background-size: calc(var(--px-per-cm) / 10) 8px, calc(var(--px-per-cm) / 2) 12px, var(--px-per-cm) 16px;
          background-repeat: repeat-x;
          background-position: 0 bottom, 0 bottom, 0 bottom;
        }
        .ruler-container.vertical {
          width: 30px;
          height: ${A4_PAGE_HEIGHT_PX}px;
          top: 0;
          right: 0;
          border-left: 1px solid var(--ruler-line);
          background-image: 
            repeating-linear-gradient(to bottom, var(--ruler-line) 0, var(--ruler-line) 1px, transparent 1px, transparent calc(var(--px-per-cm) / 10)),
            repeating-linear-gradient(to bottom, var(--ruler-line) 0, var(--ruler-line) 1px, transparent 1px, transparent calc(var(--px-per-cm) / 2)),
            repeating-linear-gradient(to bottom, var(--ruler-line) 0, var(--ruler-line) 1px, transparent 1px, transparent var(--px-per-cm));
          background-size: 8px calc(var(--px-per-cm) / 10), 12px calc(var(--px-per-cm) / 2), 16px var(--px-per-cm);
          background-repeat: repeat-y;
          background-position: right 0, right 0, right 0;
        }
        .ruler-number {
          position: absolute;
          font-size: 10px;
          color: var(--ruler-text);
          font-family: Arial, sans-serif;
        }
        .horizontal .ruler-number {
          top: 2px;
        }
        .vertical .ruler-number {
          right: 4px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}} />

      <div className="flex-shrink-0 px-4 pt-2 shadow-sm z-30 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className="text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>the copy</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuditing && <div className="flex items-center gap-2 text-sm text-purple-500"><Loader2 size={16} className="animate-spin" /><span>يجري التدقيق الذكي...</span></div>}
            {isImporting && <div className="flex items-center gap-2 text-sm text-purple-500"><Loader2 size={16} className="animate-spin" /><span>جاري استيراد الملف...</span></div>}
            {useAgentSystem && useWorkflowSystem && <div className="flex items-center gap-2 text-xs text-blue-500"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div><span>نظام العمل الذكي | {agentSystemStats.currentStrategy}</span></div>}
            {useAgentSystem && !useWorkflowSystem && <div className="flex items-center gap-2 text-xs text-orange-500"><div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div><span>5 وكلاء Gemma نشط</span></div>}
            {ENABLE_GEMINI_AUDIT && !isAuditing && <div className="flex items-center gap-2 text-xs text-green-500"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>المراجع الذكي نشط</span></div>}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm menu-container">
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowFileMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>ملف</button>{showFileMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<FilePlus size={16} />} label="جديد" onClick={createNewDocument} /><MenuItem icon={<FolderOpen size={16} />} label="فتح..." onClick={() => document.getElementById('file-import-input').click()} hasSeparator /><MenuItem icon={<Save size={16} />} label="حفظ" onClick={saveDocument} /><MenuItem icon={<ChevronsRight size={16} />} label="حفظ باسم..." onClick={saveDocument} hasSeparator /><MenuItem icon={<Download size={16} />} label="تصدير كـ PDF" onClick={exportToPDF} /><MenuItem icon={<Upload size={16} />} label="استيراد..." onClick={() => document.getElementById('file-import-input').click()} hasSeparator /><MenuItem icon={<Printer size={16} />} label="طباعة" onClick={printDocument} /></div>}</div>
          <input id="file-import-input" type="file" accept=".txt,.pdf,.docx" onChange={handleFileImport} className="hidden" />
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowEditMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>تحرير</button>{showEditMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<Undo size={16} />} label="تراجع" onClick={undoAction} /><MenuItem icon={<Redo size={16} />} label="إعادة" onClick={redoAction} hasSeparator /><MenuItem icon={<Scissors size={16} />} label="قص" onClick={cutText} /><MenuItem icon={<Copy size={16} />} label="نسخ" onClick={copyText} /><MenuItem icon={<FileText size={16} />} label="لصق" onClick={pasteText} hasSeparator /><MenuItem icon={<Search size={16} />} label="بحث..." onClick={() => setShowSearchDialog(true)} /><MenuItem icon={<Replace size={16} />} label="بحث واستبدال..." onClick={() => setShowReplaceDialog(true)} /></div>}</div>
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowViewMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>عرض</button>{showViewMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<Eye size={16} />} label={showRulers ? "إخفاء المساطر" : "إظهار المساطر"} onClick={() => setShowRulers(p => !p)} isChecked={showRulers} /></div>}</div>
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowToolsMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>أدوات</button>{showToolsMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<Pencil size={16} />} label="إعادة تسمية شخصية" onClick={() => setShowCharacterRename(true)} /><MenuItem icon={<FileText size={16} />} label="تطبيع المسافات" onClick={smartNormalizeDocument} hasSeparator /><MenuItem icon={<Sparkles size={16} />} label="✨ إنشاء شخصية" onClick={() => openGenerator('character')} /><MenuItem icon={<Sparkles size={16} />} label="✨ اقتراح مشهد" onClick={() => openGenerator('scene')} /></div>}</div>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {showLeftSidebar && (
          <div className={`w-16 flex-shrink-0 p-2 border-r overflow-y-auto ${ isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300' }`}>
            <div className="flex flex-col items-center">
              {dramaAnalyzerTools.map(tool => ( <SidebarButton key={tool.id} tool={tool} isActive={currentFormat === tool.id} orientation="left" /> ))}
            </div>
          </div>
        )}
        
        <div className="flex-grow overflow-y-auto" ref={scrollContainerRef}>
          <div ref={stickyHeaderRef} className={`sticky top-0 z-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
            <div className="p-2 w-full max-w-[1000px] mx-auto">
              <div className={`mb-2 p-2 rounded-lg border flex items-center justify-end gap-2 overflow-x-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                {screenplayFormats.map(format => (<Tooltip key={format.id} text={`${format.label} (${format.shortcut || 'Tab/Enter'})`}><button onClick={() => applyFormatToCurrentLine(format.id)} className={`p-2 rounded-md transition-all duration-200 ${currentFormat === format.id ? `${format.color} text-gray-900 ring-2 ring-purple-500` : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{format.icon}</button></Tooltip>))}
              </div>
              <div className={`p-2 rounded-lg border flex items-center justify-end flex-wrap gap-x-3 gap-y-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <div className="relative"><button onClick={() => setShowFontMenu(p => !p)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}><span style={{ fontFamily: selectedFont }}>{fonts.find(f => f.value === selectedFont)?.label}</span><ChevronDown size={14} /></button>{showFontMenu && (<div className={`absolute top-full right-0 mt-1 w-48 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>{fonts.map(font => <button key={font.value} onClick={() => { setSelectedFont(font.value); setShowFontMenu(false); }} className={`w-full text-right block px-3 py-1.5 text-sm rounded ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`} style={{ fontFamily: font.value }}>{font.label}</button>)}</div>)}</div>
                <div className="relative"><button onClick={() => setShowSizeMenu(p => !p)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}><span>{selectedSize.replace('pt', '')}</span><ChevronDown size={14} /></button>{showSizeMenu && (<div className={`absolute top-full right-0 mt-1 w-20 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>{textSizes.map(size => <button key={size.value} onClick={() => { setSelectedSize(size.value); setShowSizeMenu(false); }} className={`w-full text-right block px-3 py-1.5 text-sm rounded ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}>{size.label}</button>)}</div>)}</div>
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <Tooltip text="عريض"><button onClick={() => formatText('bold')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Bold size={16} /></button></Tooltip>
                <Tooltip text="مائل"><button onClick={() => formatText('italic')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Italic size={16} /></button></Tooltip>
                <Tooltip text="تسطير"><button onClick={() => formatText('underline')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Underline size={16} /></button></Tooltip>
                <div className="relative"><Tooltip text="لون النص"><button onClick={() => setShowColorPicker(p => !p)} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Palette size={16} /></button></Tooltip>{showColorPicker && (<div className={`absolute top-full right-0 mt-1 p-2 grid grid-cols-5 gap-1 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>{colors.map(color => <button key={color} onClick={() => { formatText('foreColor', color); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-gray-400" style={{ backgroundColor: color }}></button>)}</div>)}</div>
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <Tooltip text="استيراد ملف"><button onClick={() => document.getElementById('file-import-input').click()} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><Upload size={16} /></button></Tooltip>
              </div>
            </div>
            {showRulers && ( <div className="w-full max-w-[1000px] mx-auto relative h-[30px]"><Ruler orientation="horizontal" isDarkMode={isDarkMode} /></div> )}
          </div>

          <div className="px-4 pt-4 pb-4">
            <div className="relative w-full max-w-[1000px] mx-auto">
              {showRulers && (
                <div className="absolute top-0 right-[-30px] h-full w-[30px]">
                  <div className="sticky z-10" style={{ top: `${stickyHeaderHeight}px` }}><Ruler orientation="vertical" isDarkMode={isDarkMode} /></div>
                </div>
              )}
              <div ref={editorRef} contentEditable={true} suppressContentEditableWarning={true} onInput={updateContent} onPaste={handlePaste} onKeyUp={updateContent} onKeyDown={handleKeyDown} onMouseUp={updateContent} onClick={updateContent} className={`page-content ${isDarkMode ? 'dark-mode-text' : ''}`} style={{ fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`, fontSize: selectedSize, lineHeight: '1.6' }} />
              <div className="absolute top-0 right-0 bottom-0 left-0 -z-10">
                {Array.from({ length: pageCount }).map((_, i) => ( <div key={i} className="page-background"><span className="page-number">{i + 1}</span></div> ))}
              </div>
            </div>
          </div>
        </div>
        
        {showRightSidebar && (
          <div className={`w-16 flex-shrink-0 p-2 border-l overflow-y-auto ${ isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex flex-col items-center">
              {screenplayEditorTools.map(tool => ( <SidebarButton key={tool.id} tool={tool} orientation="right" /> ))}
              <div className={`mt-4 text-xs text-center font-bold transform rotate-90 whitespace-nowrap ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} style={{ fontFamily: 'Cairo, sans-serif', writingMode: 'vertical-rl' }}>محرر السيناريو</div>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-shrink-0 px-4 py-1.5 text-xs border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} dir="ltr">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span>{documentStats.pages} صفحة</span><span>{documentStats.words} كلمة</span><span>{documentStats.characters} حرف</span><span>{documentStats.scenes} مشهد</span>
            {useAgentSystem && agentSystemStats.totalClassifications > 0 && (
              <span className="text-blue-500" title={useWorkflowSystem ? `WF: ${agentSystemStats.workflowDecisions}, A: ${agentSystemStats.agentDecisions}, G: ${agentSystemStats.coordinatorDecisions}` : `A: ${agentSystemStats.agentDecisions}, G: ${agentSystemStats.coordinatorDecisions}`}>
                {useWorkflowSystem ? '🧠' : '🤖'} {(agentSystemStats.averageConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">{screenplayFormats.find(f => f.id === currentFormat)?.label || 'غير معروف'}</span>
            {useAgentSystem && (
              <div className="flex items-center gap-2">
                <button onClick={() => setUseWorkflowSystem(!useWorkflowSystem)} className="text-purple-600 dark:text-purple-400 hover:underline text-xs" title="تفعيل/تعطيل نظام العمل المتقدم">{useWorkflowSystem ? 'تعطيل WF' : 'تفعيل WF'}</button>
                <button onClick={() => setUseAgentSystem(!useAgentSystem)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">{useAgentSystem ? 'تعطيل الوكلاء' : 'تفعيل الوكلاء'}</button>
              </div>
            )}
            <button onClick={loadSampleText} className="text-purple-600 dark:text-purple-400 hover:underline">تحميل نص تجريبي</button>
          </div>
        </div>
      </div>

      <Dialog title={generatorState.type === 'character' ? "✨ إنشاء شخصية" : "✨ اقتراح مشهد"} isOpen={generatorState.isOpen} onClose={() => setGeneratorState(prev => ({ ...prev, isOpen: false }))}>
        <div className="flex flex-col gap-4" dir="rtl">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {generatorState.type === 'character' 
                    ? 'أدخل وصفًا موجزًا للشخصية (مثل "محقق عجوز ساخر") وسيقوم الذكاء الاصطناعي بتوسيع الفكرة.'
                    : 'أدخل ملخصًا لما يحدث في قصتك (مثل "البطل يكتشف خيانة صديقه") وسيقترح الذكاء الاصطناعي مشاهد تالية.'}
            </p>
            <textarea
                value={generatorState.input}
                onChange={(e) => setGeneratorState(prev => ({ ...prev, input: e.target.value }))}
                className="w-full h-24 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                placeholder="اكتب هنا..."
            />
            <button 
                onClick={handleGenerate} 
                disabled={generatorState.isLoading}
                className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300">
                {generatorState.isLoading ? <Loader2 className="animate-spin" /> : '✨ توليد'}
            </button>
            {generatorState.result && (
                <div className="mt-4 p-4 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{generatorState.result}</pre>
                    <button onClick={() => navigator.clipboard.writeText(generatorState.result)} className="mt-2 text-sm text-purple-500">نسخ النص</button>
                </div>
            )}
        </div>
      </Dialog>
      <Dialog title="بحث" isOpen={showSearchDialog} onClose={() => setShowSearchDialog(false)}>...</Dialog>
      <Dialog title="بحث واستبدال" isOpen={showReplaceDialog} onClose={() => setShowReplaceDialog(false)}>...</Dialog>
      <Dialog title="إعادة تسمية شخصية" isOpen={showCharacterRename} onClose={() => setShowCharacterRename(false)}>...</Dialog>
    </div>
  );
};

function App() {
  return <ScreenplayEditor />;
}

export default App;

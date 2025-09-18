import React, { useState, useEffect, useRef, Fragment } from 'react';
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

// Common Arabic verbs to differentiate from character names
const commonVerbs: string[] = ['يقف', 'تقف', 'يجلس', 'تجلس', 'يدخل', 'تدخل', 'يخرج', 'تخرج', 'ينظر', 'تنظر', 'يقول', 'تقول', 'يمشي', 'تمشي', 'تركض', 'يركض', 'يكتب', 'تكتب', 'يقرأ', 'تقرأ'];

const ScreenplayEditor: React.FC = () => {
  // State management
  const [text, setText] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentFormat, setCurrentFormat] = useState<ScreenplayFormatId>('action');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [verticalCursorPosition, setVerticalCursorPosition] = useState<number>(0);
  const [selectedFont, setSelectedFont] = useState<string>('Amiri');
  const [selectedSize, setSelectedSize] = useState<string>('14pt');
  const [documentStats, setDocumentStats] = useState<DocumentStats>({ characters: 0, words: 0, pages: 1, scenes: 0 });
  const [pageCount, setPageCount] = useState<number>(1);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState<number>(0);

  // UI State
  const [showFontMenu, setShowFontMenu] = useState<boolean>(false);
  const [showSizeMenu, setShowSizeMenu] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showLinkDialog, setShowLinkDialog] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');

  // Menu states
  const [showFileMenu, setShowFileMenu] = useState<boolean>(false);
  const [showEditMenu, setShowEditMenu] = useState<boolean>(false);
  const [showViewMenu, setShowViewMenu] = useState<boolean>(false);
  const [showFormatMenu, setShowFormatMenu] = useState<boolean>(false);
  const [showInsertMenu, setShowInsertMenu] = useState<boolean>(false);
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showProductionMenu, setShowProductionMenu] = useState<boolean>(false);

  // Dialog states
  const [showSearchDialog, setShowSearchDialog] = useState<boolean>(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState<boolean>(false);
  const [showCharacterRename, setShowCharacterRename] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replaceTerm, setReplaceTerm] = useState<string>('');
  const [oldCharacterName, setOldCharacterName] = useState<string>('');
  const [newCharacterName, setNewCharacterName] = useState<string>('');

  // View settings
  const [viewMode, setViewMode] = useState<string>('normal');
  const [showRulers, setShowRulers] = useState<boolean>(true);

  // Refs for DOM elements
  const classifierRef = useRef<ScreenplayClassifier>(new ScreenplayClassifier());
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  // Configuration
  const A4_PAGE_HEIGHT_PX = 1123;

  const screenplayFormats: ScreenplayFormat[] = [
    { id: 'scene-header-1', label: 'عنوان المشهد (1)', shortcut: 'Ctrl+1', color: 'bg-blue-100', icon: <Film size={18} /> },
    { id: 'scene-header-2', label: 'عنوان المشهد (2)', shortcut: 'Tab', color: 'bg-blue-50', icon: <MapPin size={18} /> },
    { id: 'scene-header-3', label: 'عنوان المشهد (3)', shortcut: 'Tab', color: 'bg-blue-25', icon: <Camera size={18} /> },
    { id: 'action', label: 'الفعل/الحدث', shortcut: 'Ctrl+4', color: 'bg-gray-100', icon: <Feather size={18} /> },
    { id: 'character', label: 'شخصية', shortcut: 'Ctrl+2', color: 'bg-green-100', icon: <UserSquare size={18} /> },
    { id: 'parenthetical', label: 'بين قوسين', shortcut: 'Tab', color: 'bg-yellow-100', icon: <Parentheses size={18} /> },
    { id: 'dialogue', label: 'حوار', shortcut: 'Ctrl+3', color: 'bg-orange-100', icon: <MessageCircle size={18} /> },
    { id: 'transition', label: 'انتقال', shortcut: 'Ctrl+6', color: 'bg-red-100', icon: <FastForward size={18} /> }
  ];

  const colors: string[] = [
    '#000000', '#e03131', '#c2255c', '#9c36b5', '#6741d9', '#3b5bdb', '#1b6ec2', '#0c8599', '#099268', '#2f9e44', '#66a80f', '#f08c00', '#e8590c', '#5f676e', '#343a40'
  ];

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
    { value: '16pt', label: '16' }, { value: '18pt', label: '18' }, { value: '24pt', label: '24' },
    { value: '36pt', label: '36' }
  ];

  const updateCursorPosition = () => {
    if (!editorRef.current || !scrollContainerRef.current) return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = scrollContainerRef.current.getBoundingClientRect();
      const horizontalPos = rect.left - editorRect.left;
      setCursorPosition(horizontalPos);
      const verticalPos = rect.top - editorRect.top + scrollContainerRef.current.scrollTop;
      setVerticalCursorPosition(verticalPos);
    }
  };

  const isCurrentElementEmpty = (): boolean => {
    if (!editorRef.current) return true;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return true;
    const range = selection.getRangeAt(0);
    let currentElement: Node | null = range.commonAncestorContainer;
    while (currentElement && currentElement.nodeType !== Node.ELEMENT_NODE) {
      currentElement = currentElement.parentNode;
    }
    while (currentElement && (currentElement as HTMLElement).tagName !== 'DIV' && currentElement !== editorRef.current) {
      currentElement = currentElement.parentNode;
    }
    if (!currentElement || currentElement === editorRef.current) return true;
    return (currentElement.textContent || '').trim().length === 0;
  };

  const getFormatStyles = (formatType: ScreenplayFormatId): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`,
      fontSize: selectedSize,
      direction: 'rtl',
      margin: '12px 0',
      lineHeight: '1.8',
      minHeight: '1.2em'
    };
    const formatStyles: { [key in ScreenplayFormatId]?: React.CSSProperties } = {
      'scene-header-1': { textTransform: 'uppercase', fontWeight: 'bold', margin: '12px 0 12px 0', display: 'flex', justifyContent: 'space-between' },
      'scene-header-2': { textAlign: 'left', fontStyle: 'italic', margin: '12px 0' },
      'scene-header-3': { textAlign: 'center', fontWeight: 'bold', margin: '12px 0 12px 0' },
      'action': { textAlign: 'right', margin: '12px 0' },
      'character': { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', margin: '12px 260px 2px 260px' },
      'parenthetical': { textAlign: 'center', fontStyle: 'italic', margin: '0 280px 2px 280px' },
      'dialogue': { textAlign: 'center', margin: '2px 240px 12px 240px', lineHeight: '1.6' },
      'transition': { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', margin: '24px 0 12px 0' }
    };
    return { ...baseStyles, ...formatStyles[formatType] };
  };

  const calculateStats = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.textContent || '';
    const characters = content.length;
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const scenes = editorRef.current.querySelectorAll('.scene-header-1').length;
    const pages = Math.max(1, Math.ceil(editorRef.current.scrollHeight / A4_PAGE_HEIGHT_PX));
    setDocumentStats({ characters, words, pages, scenes });
    setPageCount(pages);
  };

  useEffect(() => {
    if (editorRef.current) {
      const divs = editorRef.current.querySelectorAll('div');
      divs.forEach(div => {
        if (div.className) {
          const formatStyles = getFormatStyles(div.className as ScreenplayFormatId);
          Object.assign(div.style, formatStyles);
        }
      });
      calculateStats();
    }
  }, [selectedFont, selectedSize, htmlContent]);

  const getNextFormatOnTab = (current: ScreenplayFormatId, isEmpty = false, shiftPressed = false): ScreenplayFormatId => {
    const mainSequence: ScreenplayFormatId[] = ['scene-header-1', 'action', 'character', 'transition'];
    if (current === 'character' && isEmpty) return shiftPressed ? 'action' : 'transition';
    if (current === 'dialogue') return shiftPressed ? 'character' : 'parenthetical';
    if (current === 'parenthetical') return shiftPressed ? 'dialogue' : 'dialogue';
    const currentIndex = mainSequence.indexOf(current);
    if (currentIndex !== -1) {
      if (shiftPressed) return mainSequence[(currentIndex - 1 + mainSequence.length) % mainSequence.length];
      else return mainSequence[(currentIndex + 1) % mainSequence.length];
    }
    return current;
  };

  const getNextFormatOnEnter = (current: ScreenplayFormatId): ScreenplayFormatId => {
    const transitions: { [key in ScreenplayFormatId]?: ScreenplayFormatId } = {
      'scene-header-1': 'scene-header-3',
      'scene-header-3': 'action',
      'action': 'action',
      'character': 'dialogue',
      'parenthetical': 'dialogue',
      'dialogue': 'action',
      'transition': 'scene-header-1'
    };
    return transitions[current] || 'action';
  };

  const applyFormatToCurrentLine = (formatType: ScreenplayFormatId) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    let currentElement: Node | null = range.commonAncestorContainer;
    while (currentElement && currentElement.nodeType !== Node.ELEMENT_NODE) currentElement = currentElement.parentNode;
    while (currentElement && (currentElement as HTMLElement).tagName !== 'DIV' && currentElement !== editorRef.current) currentElement = currentElement.parentNode;
    if (!currentElement || currentElement === editorRef.current) {
      const newDiv = document.createElement('div');
      newDiv.innerHTML = '<br>';
      currentElement = newDiv;
      editorRef.current.appendChild(newDiv);
    }
    const formatStyles = getFormatStyles(formatType);
    (currentElement as HTMLElement).className = formatType;
    Object.assign((currentElement as HTMLElement).style, formatStyles);
    setCurrentFormat(formatType);
    const newRange = document.createRange();
    newRange.selectNodeContents(currentElement);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
    updateContent();
  };

  const formatText = (command: string, value: string | null = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value ?? undefined);
    editorRef.current.focus();
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      updateCursorPosition();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        if (element.nodeType === Node.TEXT_NODE) element = element.parentNode as HTMLElement;
        while (element && (element as HTMLElement).tagName !== 'DIV' && element !== editorRef.current) {
          element = element.parentNode as HTMLElement;
        }
        if (element && (element as HTMLElement).className && element !== editorRef.current) {
          const formatClasses: ScreenplayFormatId[] = ['scene-header-1', 'scene-header-2', 'scene-header-3', 'action', 'character', 'parenthetical', 'dialogue', 'transition'];
          const foundFormat = formatClasses.find(cls => (element as HTMLElement).className.includes(cls));
          if (foundFormat) setCurrentFormat(foundFormat);
        } else {
          setCurrentFormat('action');
        }
      }
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      tempDiv.innerHTML = tempDiv.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      const plainText = tempDiv.textContent || '';
      setText(plainText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const isEmpty = isCurrentElementEmpty();
      const nextFormat = getNextFormatOnTab(currentFormat, isEmpty, e.shiftKey);
      if (nextFormat !== currentFormat) applyFormatToCurrentLine(nextFormat);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const nextFormat = getNextFormatOnEnter(currentFormat);
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const newDiv = document.createElement('div');
        newDiv.className = nextFormat;
        Object.assign(newDiv.style, getFormatStyles(nextFormat));
        newDiv.innerHTML = '<br>';
        range.deleteContents();
        let currentLine: Node | null = range.startContainer;
        while (currentLine && (currentLine as HTMLElement).tagName !== 'DIV' && currentLine !== editorRef.current) {
          currentLine = currentLine.parentNode as Node | null;
        }
        if (currentLine && currentLine.parentNode && currentLine.parentNode === editorRef.current) {
          currentLine.parentNode.insertBefore(newDiv, currentLine.nextSibling);
        } else {
          range.insertNode(newDiv);
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(newDiv);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        setCurrentFormat(nextFormat);
        updateContent();
      }
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b': e.preventDefault(); formatText('bold'); break;
        case 'i': e.preventDefault(); formatText('italic'); break;
        case 'u': e.preventDefault(); formatText('underline'); break;
        case 'z': e.preventDefault(); document.execCommand('undo'); break;
        case 'y': e.preventDefault(); document.execCommand('redo'); break;
        case 's': e.preventDefault(); console.log('Save function called'); break;
        case 'f': e.preventDefault(); setShowSearchDialog(true); break;
        case 'h': e.preventDefault(); setShowReplaceDialog(true); break;
        case 'a': e.preventDefault(); document.execCommand('selectAll'); break;
        case 'p': e.preventDefault(); window.print(); break;
        case '1': e.preventDefault(); applyFormatToCurrentLine('scene-header-1'); break;
        case '2': e.preventDefault(); applyFormatToCurrentLine('character'); break;
        case '3': e.preventDefault(); applyFormatToCurrentLine('dialogue'); break;
        case '4': e.preventDefault(); applyFormatToCurrentLine('action'); break;
        case '6': e.preventDefault(); applyFormatToCurrentLine('transition'); break;
        default: break;
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const textData = e.clipboardData.getData('text/plain');
    if (!textData) return;

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const lines = textData.split('\n').filter(line => line.trim());
    let formattedHTML = '';
    let previousFormatClass: ScreenplayFormatId = 'action';
    const classifier = classifierRef.current;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      let result = classifierRef.current.classifyLine(line, currentFormat);
      let formatClass: ScreenplayFormatId = 'action';
      let cleanLine = trimmedLine;
      let isHtml = false;

      // Handle the result properly
      if (typeof result === 'string') {
        formatClass = result as ScreenplayFormatId;
      }

      if (formatClass === 'character' && !trimmedLine.endsWith(':') && !trimmedLine.endsWith('：')) {
        cleanLine = trimmedLine + ' :';
      }

      if (formatClass === 'parenthetical' && trimmedLine.match(/^[\(（].*?[\)）]$/)) {
        cleanLine = trimmedLine;
      } else if (trimmedLine.match(/^[\(（].*?[\)）]$/) && formatClass === 'action') {
        cleanLine = trimmedLine.substring(1, trimmedLine.length - 1).trim();
      }

      const div = document.createElement('div');
      div.className = formatClass;
      Object.assign(div.style, getFormatStyles(formatClass));

      if (isHtml) {
        div.innerHTML = cleanLine;
      } else {
        div.textContent = cleanLine;
      }

      formattedHTML += div.outerHTML;
      previousFormatClass = formatClass;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    const fragment = range.createContextualFragment(formattedHTML);
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);

    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    updateContent();
  };

  const loadSampleText = () => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = '';
    const elements = [
      { type: 'basmala', text: 'بسم الله الرحمن الرحيم' },
      { type: 'scene-header-1', text: '<span>مشهد1</span><span>ليل - داخلي</span>', isHtml: true },
      { type: 'scene-header-3', text: 'مسجد السيد البدوي' },
      { type: 'action', text: 'يكتب على الشاشة ( ظظا )' }, { type: 'action', text: 'تغنى أم أم في المسجد تجاه الشبح وتقف أمامه' },
      { type: 'character', text: 'أم أم' }, { type: 'dialogue', text: 'شاطع يا سيد يا بدوي .. اقف جيش .. انا عارفة أني خاطىة .. بس عازر إيك تشتعل عند ربنا' },
      { type: 'character', text: 'الرجل 1' }, { type: 'dialogue', text: 'هذا مثال لشخصية عامة.' },
      { type: 'transition', text: 'قطع' },
    ];
    let longText = '';
    for (let i = 0; i < 30; i++) {
      longText += 'هذا سطر طويل من النص لملء الصفحة واختبار التمرير وتقسيم الصفحات. يتم تكرار هذا النص عدة مرات للتأكد من أن المحتوى يتجاوز ارتفاع الصفحة الواحدة. ';
    }
    elements.push({ type: 'action', text: longText });
    elements.push({ type: 'character', text: 'شخصية في الصفحة الثانية' });
    elements.push({ type: 'dialogue', text: 'هذا حوار في الصفحة الثانية لاختبار كيفية ظهور العناصر عبر فواصل الصفحات.' });

    elements.forEach(element => {
      const div = document.createElement('div');
      div.className = element.type;
      if (element.isHtml) { div.innerHTML = element.text; } else { div.textContent = element.text; }
      Object.assign(div.style, getFormatStyles(element.type as ScreenplayFormatId));
      editorRef.current?.appendChild(div);
    });
    const lastElement = editorRef.current.lastElementChild;
    if (lastElement) {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(lastElement);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      setCurrentFormat('action');
    }
    updateContent();
  };

  const closeAllMenus = () => {
    setShowFileMenu(false); setShowEditMenu(false); setShowViewMenu(false);
    setShowFormatMenu(false); setShowInsertMenu(false); setShowToolsMenu(false);
    setShowProductionMenu(false); setShowFontMenu(false); setShowSizeMenu(false); setShowColorPicker(false);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      const defaultDiv = document.createElement('div');
      defaultDiv.innerHTML = '<br>';
      defaultDiv.className = 'action';
      Object.assign(defaultDiv.style, getFormatStyles('action'));
      editorRef.current.appendChild(defaultDiv);
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(defaultDiv);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
      setCurrentFormat('action');
      updateContent();
    }
    const handleSelectionChange = () => updateContent();
    const handleClickOutside = (e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest('.menu-container, .toolbar-container')) {
            closeAllMenus();
        }
    };
    if (stickyHeaderRef.current) {
      setStickyHeaderHeight(stickyHeaderRef.current.offsetHeight);
    }
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (<div className="relative group">{children}<div className="tooltip">{text}</div></div>);

  interface DialogProps {
      title: string;
      children: React.ReactNode;
      isOpen: boolean;
      onClose: () => void;
  }

  const Dialog: React.FC<DialogProps> = ({ title, children, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
        <div className={`rounded-lg shadow-xl p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`} onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center border-b pb-3 mb-4" dir="rtl">
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>{title}</h3>
            <button onClick={onClose} className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><X size={20} /></button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    );
  };

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

  interface MenuItemProps {
      icon: React.ReactNode;
      label: string;
      shortcut?: string;
      onClick?: () => void;
      hasSeparator?: boolean;
  }

  const MenuItem: React.FC<MenuItemProps> = ({ icon, label, shortcut, onClick, hasSeparator = false }) => (
    <><button onClick={onClick} className={`w-full text-right flex justify-between items-center px-3 py-1.5 text-sm rounded ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}`}><div className="flex items-center gap-3">{icon}<span style={{ fontFamily: 'Cairo, sans-serif' }}>{label}</span></div>{shortcut && <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{shortcut}</span>}</button>{hasSeparator && <div className={`my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ height: '1px' }} />}</>
  );

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
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowFileMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>ملف</button>{showFileMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<FilePlus size={16} />} label="جديد" /><MenuItem icon={<FolderOpen size={16} />} label="فتح..." hasSeparator /><MenuItem icon={<Save size={16} />} label="حفظ" /><MenuItem icon={<ChevronsRight size={16} />} label="حفظ باسم..." hasSeparator /><MenuItem icon={<Download size={16} />} label="تصدير كـ PDF" /><MenuItem icon={<Upload size={16} />} label="استيراد..." hasSeparator /><MenuItem icon={<Printer size={16} />} label="طباعة" /></div>}</div>
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowEditMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>تحرير</button>{showEditMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<Undo size={16} />} label="تراجع" /><MenuItem icon={<Redo size={16} />} label="إعادة" hasSeparator /><MenuItem icon={<Scissors size={16} />} label="قص" /><MenuItem icon={<Copy size={16} />} label="نسخ" /><MenuItem icon={<FileText size={16} />} label="لصق" hasSeparator /><MenuItem icon={<Search size={16} />} label="بحث..." onClick={() => setShowSearchDialog(true)} /><MenuItem icon={<Replace size={16} />} label="بحث واستبدال..." onClick={() => setShowReplaceDialog(true)} /></div>}</div>
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowViewMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>عرض</button>{showViewMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<Eye size={16} />} label="إظهار المساطر" onClick={() => setShowRulers(p => !p)} /></div>}</div>
          <div className="relative"><button onClick={() => { closeAllMenus(); setShowToolsMenu(p => !p); }} className={`px-3 py-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>أدوات</button>{showToolsMenu && <div className={`absolute top-full right-0 mt-1 w-60 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}><MenuItem icon={<Pencil size={16} />} label="إعادة تسمية شخصية" onClick={() => setShowCharacterRename(true)} /></div>}</div>
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
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                <Tooltip text="محاذاة لليمين"><button onClick={() => formatText('justifyRight')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><AlignRight size={16} /></button></Tooltip>
                <Tooltip text="توسيط"><button onClick={() => formatText('justifyCenter')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><AlignCenter size={16} /></button></Tooltip>
                <Tooltip text="محاذاة لليسار"><button onClick={() => formatText('justifyLeft')} className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}><AlignLeft size={16} /></button></Tooltip>
              </div>
            </div>
            {showRulers && <div className="w-full max-w-[1000px] mx-auto bg-white dark:bg-gray-800"><Ruler orientation="horizontal" size={1000} /></div>}
          </div>

          <div className="p-4">
            <div className="relative w-full max-w-[1000px] mx-auto">
              <div ref={editorRef} contentEditable={true} suppressContentEditableWarning={true} onInput={updateContent} onPaste={handlePaste} onKeyUp={updateCursorPosition} onKeyDown={handleKeyDown} onMouseUp={updateCursorPosition} onClick={updateCursorPosition}
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
            <span>{documentStats.pages} صفحة</span><span>{documentStats.words} كلمة</span><span>{documentStats.characters} حرف</span><span>{documentStats.scenes} مشهد</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">{screenplayFormats.find(f => f.id === currentFormat)?.label || 'غير معروف'}</span>
            <button onClick={loadSampleText} className="text-purple-600 dark:text-purple-400 hover:underline">تحميل نص تجريبي</button>
          </div>
        </div>
      </div>

      <Dialog title="بحث" isOpen={showSearchDialog} onClose={() => setShowSearchDialog(false)}>...</Dialog>
      <Dialog title="بحث واستبدال" isOpen={showReplaceDialog} onClose={() => setShowReplaceDialog(false)}>...</Dialog>
      <Dialog title="إعادة تسمية شخصية" isOpen={showCharacterRename} onClose={() => setShowCharacterRename(false)}>...</Dialog>
    </div>
  );
};

export default ScreenplayEditor;

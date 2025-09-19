import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  Bold,
  BookHeart,
  Camera,
  ChevronDown,
  FastForward,
  Feather,
  Film,
  Loader2,
  MessageCircle,
  Moon,
  Palette,
  Printer,
  RotateCcw,
  RotateCw,
  Save,
  Sparkles,
  Sun,
  Underline,
  Upload,
  UserSquare,
  X
} from 'lucide-react';
import { ScreenplayClassifier, ScreenplayFormatId } from '../../services/ScreenplayClassifier';
import {
  AuditLine,
  Correction,
  auditWithGemini,
  queueForGeminiReview,
  startBackgroundAuditor,
  stopBackgroundAuditor
} from '../../lib/editor/gemini';
import { extractTextFromFile } from '../../services/file-import';

const A4_PAGE_HEIGHT_PX = 1123;
const BASMALA_FONT_SIZE = '18pt';
const CHARACTER_MARGIN = '260px';
const PARENTHETICAL_MARGIN = '280px';
const DIALOGUE_MARGIN = '240px';
const STRIP_LEADING_BULLETS = true;
const PIXELS_PER_CM = 37.8;
const GEMINI_AUDIT_WINDOW = 50;
const ENABLE_GEMINI_AUDIT = true;

interface ScreenplayFormat {
  id: ScreenplayFormatId;
  label: string;
  shortcut: string;
  color: string;
  icon: JSX.Element;
}

interface FontOption {
  value: string;
  label: string;
}

interface TextSizeOption {
  value: string;
  label: string;
}

interface DocumentStats {
  characters: number;
  words: number;
  pages: number;
  scenes: number;
}

interface ParsedLine {
  content: string;
  format: ScreenplayFormatId;
  isHtml?: boolean;
  isEmpty?: boolean;
}

interface GeneratorState {
  isOpen: boolean;
  type: 'character' | 'scene' | null;
  input: string;
  result: string;
  isLoading: boolean;
}

interface AgentSystemStats {
  totalClassifications: number;
  agentDecisions: number;
  coordinatorDecisions: number;
  workflowDecisions: number;
  averageConfidence: number;
  totalApiCalls: number;
  currentStrategy: string;
}

type PasteEventLike = {
  clipboardData: DataTransfer;
  preventDefault: () => void;
  isPDFSource?: boolean;
};

const FONT_OPTIONS: FontOption[] = [
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

const TEXT_SIZE_OPTIONS: TextSizeOption[] = [
  { value: '8pt', label: '8' },
  { value: '9pt', label: '9' },
  { value: '10pt', label: '10' },
  { value: '11pt', label: '11' },
  { value: '12pt', label: '12' },
  { value: '14pt', label: '14' },
  { value: '16pt', label: '16' },
  { value: '18pt', label: '18' },
  { value: '24pt', label: '24' },
  { value: '36pt', label: '36' }
];

const COLOR_OPTIONS = [
  '#000000',
  '#e03131',
  '#c2255c',
  '#9c36b5',
  '#6741d9',
  '#3b5bdb',
  '#1b6ec2',
  '#0c8599',
  '#099268',
  '#2f9e44',
  '#66a80f',
  '#f08c00',
  '#e8590c',
  '#5f676e',
  '#343a40'
];

const SCREENPLAY_FORMATS: ScreenplayFormat[] = [
  { id: 'basmala', label: 'بسملة', shortcut: '', color: 'bg-purple-100', icon: <BookHeart size={18} /> },
  { id: 'scene-header-1', label: 'عنوان المشهد (1)', shortcut: 'Ctrl+1', color: 'bg-blue-100', icon: <Film size={18} /> },
  { id: 'scene-header-2', label: 'عنوان المشهد (2)', shortcut: 'Tab', color: 'bg-blue-50', icon: <Camera size={18} /> },
  { id: 'scene-header-3', label: 'عنوان المشهد (3)', shortcut: 'Tab', color: 'bg-blue-25', icon: <Camera size={18} /> },
  { id: 'action', label: 'الفعل/الحدث', shortcut: 'Ctrl+4', color: 'bg-gray-100', icon: <Feather size={18} /> },
  { id: 'character', label: 'شخصية', shortcut: 'Ctrl+2', color: 'bg-green-100', icon: <UserSquare size={18} /> },
  { id: 'parenthetical', label: 'بين قوسين', shortcut: 'Tab', color: 'bg-yellow-100', icon: <MessageCircle size={18} /> },
  { id: 'dialogue', label: 'حوار', shortcut: 'Ctrl+3', color: 'bg-orange-100', icon: <MessageCircle size={18} /> },
  { id: 'transition', label: 'انتقال', shortcut: 'Ctrl+6', color: 'bg-red-100', icon: <FastForward size={18} /> }
];

const stripLeadingBullet = (raw: string): string => {
  let result = raw.replace(/^[\u200F\u200E]+/, '');
  if (/^[-–—•▪►▸□■●◇◆]\s+/.test(result)) {
    result = result.replace(/^[-–—•▪►▸□■●◇◆]\s+/, '');
  }
  return result;
};

const detectInlineCharacter = (line: string): { name: string; dialogue: string } | null => {
  const match = line.match(/^([^:]{1,60}?)\s*:\s*(.+)$/);
  if (!match) return null;
  const namePart = match[1].trim();
  const dialoguePart = match[2].trim();
  if (!dialoguePart) return null;
  if (/\s/.test(namePart) && namePart.split(/\s+/).length > 4) return null;
  return { name: namePart, dialogue: dialoguePart };
};

const needsEmptyLine = (previous: ScreenplayFormatId, current: ScreenplayFormatId): boolean => {
  const rules: Record<ScreenplayFormatId, ScreenplayFormatId[]> = {
    basmala: ['scene-header-1'],
    'scene-header-1': ['scene-header-3', 'action'],
    'scene-header-2': ['scene-header-3'],
    'scene-header-3': ['action'],
    action: ['character', 'transition'],
    character: ['dialogue', 'parenthetical'],
    parenthetical: ['dialogue'],
    dialogue: ['action', 'character', 'transition'],
    transition: ['scene-header-1']
  };
  return rules[previous]?.includes(current) ?? false;
};

const normalizeSpacing = (lines: ParsedLine[], preserveEmpty = false): ParsedLine[] => {
  const normalized: ParsedLine[] = [];
  let previousFormat: ScreenplayFormatId | null = null;

  lines.forEach((line) => {
    if (line.isEmpty) {
      if (preserveEmpty) normalized.push(line);
      return;
    }

    if (previousFormat && needsEmptyLine(previousFormat, line.format)) {
      normalized.push({ content: '', format: 'action', isEmpty: true });
    }

    normalized.push(line);
    previousFormat = line.format;
  });

  return normalized;
};

const smartProcessPDFText = (text: string): string => {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
};

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => (
  <div className="relative group">
    {children}
    <div className="tooltip">{text}</div>
  </div>
);

interface SidebarTool {
  id: string;
  label: string;
  icon: JSX.Element;
  action: () => void | Promise<void>;
}

interface SidebarButtonProps {
  tool: SidebarTool;
  isDarkMode: boolean;
  orientation?: 'left' | 'right';
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ tool, isDarkMode, orientation = 'left' }) => (
  <button
    onClick={tool.action}
    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 mb-2 group relative ${
      isDarkMode
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
    }`}
    title={tool.label}
  >
    {tool.icon}
    <div
      className={`absolute ${
        orientation === 'left' ? 'left-14' : 'right-14'
      } top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50`}
    >
      {tool.label}
    </div>
  </button>
);

interface DialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDarkMode: boolean;
}

const Dialog: React.FC<DialogProps> = ({ title, isOpen, onClose, children, isDarkMode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div
        className={`rounded-lg shadow-xl p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4" dir="rtl">
          <h3 className="text-lg font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  isDarkMode: boolean;
  size: number;
}

const Ruler: React.FC<RulerProps> = ({ orientation, isDarkMode, size }) => {
  const marks: JSX.Element[] = [];
  const numMarks = Math.floor(size / (PIXELS_PER_CM / 10));
  for (let i = 0; i < numMarks; i += 1) {
    const pos = i * (PIXELS_PER_CM / 10);
    const major = i % 10 === 0;
    const medium = i % 5 === 0 && !major;
    const markClass = major ? 'major' : medium ? 'medium' : 'minor';
    if (orientation === 'horizontal') {
      marks.push(
        <React.Fragment key={i}>
          <div className={`h-ruler-mark ${markClass}`} style={{ right: `${pos}px` }} />
          {major && (
            <span className="h-ruler-number" style={{ right: `${pos + 2}px` }}>
              {i / 10}
            </span>
          )}
        </React.Fragment>
      );
    } else {
      marks.push(
        <React.Fragment key={i}>
          <div className={`v-ruler-mark ${markClass}`} style={{ top: `${pos}px` }} />
          {major && (
            <span className="v-ruler-number" style={{ top: `${pos}px` }}>
              {i / 10}
            </span>
          )}
        </React.Fragment>
      );
    }
  }

  return (
    <div className={`${orientation}-ruler ${isDarkMode ? 'dark' : ''}`}>{marks}</div>
  );
};

const ScreenplayEditor: React.FC = () => {
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
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showCharacterRename, setShowCharacterRename] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [useAgentSystem, setUseAgentSystem] = useState(true);
  const [useWorkflowSystem, setUseWorkflowSystem] = useState(true);
  const [agentSystemStats, setAgentSystemStats] = useState<AgentSystemStats>({
    totalClassifications: 0,
    agentDecisions: 0,
    coordinatorDecisions: 0,
    workflowDecisions: 0,
    averageConfidence: 0,
    totalApiCalls: 0,
    currentStrategy: 'fast-sequential'
  });
  const [generatorState, setGeneratorState] = useState<GeneratorState>({
    isOpen: false,
    type: null,
    input: '',
    result: '',
    isLoading: false
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const classifierRef = useRef(new ScreenplayClassifier());
  const globalLineCounterRef = useRef(0);
  const lastAuditTimeRef = useRef(Date.now());
  const lastModifiedLinesRef = useRef(new Set<number>());

  const getFormatStyles = useCallback(
    (formatType: ScreenplayFormatId): React.CSSProperties => {
      const base: React.CSSProperties = {
        fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`,
        fontSize: selectedSize,
        direction: 'rtl',
        margin: '0',
        lineHeight: '1.6',
        minHeight: '1.6em'
      };
      const overrides: Record<ScreenplayFormatId, React.CSSProperties> = {
        basmala: { textAlign: 'left', fontWeight: 'bold', fontSize: BASMALA_FONT_SIZE },
        'scene-header-1': { textTransform: 'uppercase', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' },
        'scene-header-2': { textAlign: 'left', fontStyle: 'italic' },
        'scene-header-3': { textAlign: 'center', fontWeight: 'bold' },
        action: { textAlign: 'right' },
        character: { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', margin: `0 ${CHARACTER_MARGIN}` },
        parenthetical: { textAlign: 'center', fontStyle: 'italic', margin: `0 ${PARENTHETICAL_MARGIN}` },
        dialogue: { textAlign: 'center', margin: `0 ${DIALOGUE_MARGIN}` },
        transition: { textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase' }
      };
      return { ...base, ...(overrides[formatType] ?? {}) };
    },
    [selectedFont, selectedSize]
  );

  const calculateStats = useCallback(() => {
    if (!editorRef.current) return;
    const content = editorRef.current.textContent ?? '';
    const characters = content.length;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const scenes = editorRef.current.querySelectorAll('.scene-header-1').length;
    const pages = Math.max(1, Math.ceil(editorRef.current.scrollHeight / (A4_PAGE_HEIGHT_PX + 20)));
    setDocumentStats({ characters, words, pages, scenes });
    setPageCount(pages);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    const divs = editorRef.current.querySelectorAll<HTMLDivElement>('div[class]');
    divs.forEach((div) => {
      const cls = div.className as ScreenplayFormatId;
      Object.assign(div.style, getFormatStyles(cls));
    });
    calculateStats();
  }, [selectedFont, selectedSize, htmlContent, getFormatStyles, calculateStats]);

  const updateContent = useCallback(
    (shouldSaveToUndo = true) => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      if (shouldSaveToUndo && html !== htmlContent) {
        setUndoStack((prev) => [...prev.slice(-19), htmlContent]);
        setRedoStack([]);
      }
      setHtmlContent(html);
      calculateStats();

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
        while (node && (node as HTMLElement).nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }
        if (node && node instanceof HTMLDivElement && node.className) {
          setCurrentFormat(node.className as ScreenplayFormatId);
          if (ENABLE_GEMINI_AUDIT && useWorkflowSystem) {
            queueForGeminiReview(
              {
                element: node,
                content: node.textContent ?? '',
                format: node.className,
                timestamp: Date.now(),
                lineIndex: node.getAttribute('data-line-index')
              },
              processQueuedReview
            );
          }
        }
      }
    },
    [calculateStats, htmlContent, processQueuedReview, useWorkflowSystem]
  );

  const mapCorrections = useCallback(
    (corrections: Correction[]) => {
      if (!editorRef.current || corrections.length === 0) return;
      const map = new Map<number, string>();
      corrections.forEach((c) => map.set(c.index, c.suggestedClass));
      const children = editorRef.current.children;
      for (let i = 0; i < children.length; i += 1) {
        const child = children.item(i) as HTMLElement | null;
        if (!child) continue;
        const indexAttr = child.getAttribute('data-line-index');
        if (!indexAttr) continue;
        const lineIndex = Number.parseInt(indexAttr, 10);
        if (!map.has(lineIndex)) continue;
        const newFormat = map.get(lineIndex)! as ScreenplayFormatId;
        if (child.className !== newFormat) {
          child.className = newFormat;
          Object.assign(child.style, getFormatStyles(newFormat));
        }
      }
      setHtmlContent(editorRef.current.innerHTML);
    },
    [getFormatStyles]
  );

  const processQueuedReview = useCallback(
    async (
      items: Array<{
        element: HTMLElement;
        content: string;
        format: string;
        timestamp: number;
        lineIndex: string | null;
      }>
    ) => {
      if (!ENABLE_GEMINI_AUDIT || !useWorkflowSystem) return;
      const payload: AuditLine[] = items
        .map((item) => {
          const idx = item.lineIndex ?? item.element.getAttribute('data-line-index');
          if (!idx) return null;
          const text = item.content.trim();
          if (!text) return null;
          return { index: Number.parseInt(idx, 10), raw: text, cls: item.format };
        })
        .filter((item): item is AuditLine => Boolean(item));
      if (payload.length === 0) return;
      try {
        setIsAuditing(true);
        const corrections = await auditWithGemini(payload.slice(-GEMINI_AUDIT_WINDOW));
        mapCorrections(corrections);
        if (corrections.length > 0) {
          setAgentSystemStats((prev) => ({
            ...prev,
            workflowDecisions: prev.workflowDecisions + corrections.length
          }));
        }
      } catch (error) {
        console.error('[QueuedReview] error:', error);
      } finally {
        setIsAuditing(false);
      }
    },
    [mapCorrections, useWorkflowSystem]
  );

  const classifyLine = useCallback(
    async (
      line: string,
      previousFormat: ScreenplayFormatId
    ): Promise<{ classification: ScreenplayFormatId; confidence: number }>
    => {
      const classifier = classifierRef.current;
      const base = classifier.classifyLine(line, previousFormat);
      let finalFormat = base;
      let confidence = 0.6;
      let usedRemote = false;

      if (useAgentSystem && useWorkflowSystem) {
        try {
          usedRemote = true;
          const corrections = await auditWithGemini([{ index: 0, raw: line, cls: base }]);
          if (corrections.length > 0) {
            finalFormat = corrections[0].suggestedClass as ScreenplayFormatId;
            confidence = 0.9;
          }
        } catch (error) {
          usedRemote = false;
          console.error('[AgentClassification] error:', error);
        }
      }

      setAgentSystemStats((prev) => {
        const total = prev.totalClassifications + 1;
        const averageConfidence = (prev.averageConfidence * prev.totalClassifications + confidence) / total;
        return {
          ...prev,
          totalClassifications: total,
          coordinatorDecisions: prev.coordinatorDecisions + (finalFormat !== base ? 1 : 0),
          totalApiCalls: prev.totalApiCalls + (usedRemote ? 1 : 0),
          averageConfidence
        };
      });

      return { classification: finalFormat, confidence };
    },
    [useAgentSystem, useWorkflowSystem]
  );

  const handlePaste = useCallback(
    async (event: PasteEventLike) => {
      event.preventDefault();
      if (!editorRef.current) return;
      const textData = event.clipboardData.getData('text/plain');
      if (!textData) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const lines = textData.replace(/\r\n?/g, '\n').split('\n');
      const parsedLines: ParsedLine[] = [];
      const batch: AuditLine[] = [];
      let previousFormat = currentFormat;

      for (const rawLine of lines) {
        let trimmed = rawLine.trimEnd();
        if (STRIP_LEADING_BULLETS) {
          trimmed = stripLeadingBullet(trimmed);
        }
        if (!trimmed.trim()) {
          parsedLines.push({ content: '', format: 'action', isEmpty: true });
          continue;
        }

        const inline = detectInlineCharacter(trimmed);
        if (inline) {
          parsedLines.push({ content: `${inline.name} :`, format: 'character' });
          parsedLines.push({ content: inline.dialogue, format: 'dialogue' });
          previousFormat = 'dialogue';
          continue;
        }

        const classification = await classifyLine(trimmed, previousFormat);
        let formatClass = classification.classification;
        if (formatClass === 'character' && !/[:：]$/.test(trimmed)) {
          trimmed = `${trimmed} :`;
        }
        if (formatClass === 'scene-header-1') {
          const split = classifierRef.current.parseSceneHeaderLine(trimmed);
          if (split) {
            const html = `<span>${split.sceneNumber}</span><span>${split.sceneInfo}</span>`;
            parsedLines.push({ content: html, format: 'scene-header-1', isHtml: true });
            previousFormat = 'scene-header-1';
            continue;
          }
        }

        parsedLines.push({ content: trimmed.trim(), format: formatClass });
        previousFormat = formatClass;
      }

      const normalized = normalizeSpacing(parsedLines, event.isPDFSource ?? false);
      const fragment = document.createDocumentFragment();
      normalized.forEach((line) => {
        const div = document.createElement('div');
        const index = globalLineCounterRef.current;
        div.setAttribute('data-line-index', String(index));
        if (line.isEmpty) {
          div.className = 'action';
          div.innerHTML = '<br />';
          div.style.minHeight = '1.6em';
        } else {
          div.className = line.format;
          if (line.isHtml) {
            div.innerHTML = line.content;
          } else {
            div.textContent = line.content;
          }
          Object.assign(div.style, getFormatStyles(line.format));
          batch.push({ index, raw: line.content, cls: line.format });
        }
        fragment.appendChild(div);
        globalLineCounterRef.current += 1;
      });

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(fragment);
      selection.removeAllRanges();
      range.collapse(false);
      selection.addRange(range);

      updateContent();

      if (ENABLE_GEMINI_AUDIT && batch.length > 0) {
        try {
          setIsAuditing(true);
          const subset = batch.slice(-GEMINI_AUDIT_WINDOW);
          const corrections = await auditWithGemini(subset);
          mapCorrections(corrections);
        } catch (error) {
          console.error('[HandlePaste] Gemini audit error:', error);
        } finally {
          setIsAuditing(false);
        }
      }
    },
    [currentFormat, getFormatStyles, mapCorrections, updateContent, classifyLine]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      void handlePaste({
        clipboardData: e.clipboardData,
        preventDefault: () => e.preventDefault()
      });
    },
    [handlePaste]
  );

  const formatText = useCallback(
    (command: string, value: string | null = null) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand(command, false, value);
      updateContent();
    },
    [updateContent]
  );

  const applyFormatToCurrentLine = useCallback(
    (formatType: ScreenplayFormatId) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      let element = selection.getRangeAt(0).commonAncestorContainer as HTMLElement | null;
      while (element && element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement;
      }
      if (!element || element.tagName !== 'DIV') {
        document.execCommand('formatBlock', false, 'div');
        element = selection.anchorNode?.parentElement ?? null;
      }
      if (!element) return;
      element.className = formatType;
      Object.assign(element.style, getFormatStyles(formatType));
      setCurrentFormat(formatType);
      updateContent();
    },
    [getFormatStyles, updateContent]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!editorRef.current) return;
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === 'b') {
          event.preventDefault();
          formatText('bold');
        } else if (key === 'i') {
          event.preventDefault();
          formatText('italic');
        } else if (key === 'u') {
          event.preventDefault();
          formatText('underline');
        } else if (key === 'z') {
          event.preventDefault();
          undo();
        } else if (key === 'y') {
          event.preventDefault();
          redo();
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const nextFormat: Record<ScreenplayFormatId, ScreenplayFormatId> = {
          basmala: 'scene-header-1',
          'scene-header-1': 'scene-header-3',
          'scene-header-2': 'scene-header-3',
          'scene-header-3': 'action',
          action: 'action',
          character: 'dialogue',
          parenthetical: 'dialogue',
          dialogue: 'action',
          transition: 'scene-header-1'
        };
        applyFormatToCurrentLine(nextFormat[currentFormat] ?? 'action');
        document.execCommand('insertParagraph');
        updateContent();
      }
    },
    [applyFormatToCurrentLine, currentFormat, formatText, redo, undo, updateContent]
  );

  const createNewDocument = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'action';
    div.innerHTML = '<br />';
    div.setAttribute('data-line-index', '0');
    Object.assign(div.style, getFormatStyles('action'));
    editorRef.current.appendChild(div);
    globalLineCounterRef.current = 1;
    setUndoStack([]);
    setRedoStack([]);
    setHtmlContent(div.outerHTML);
    calculateStats();
  }, [calculateStats, getFormatStyles]);

  const saveDocument = useCallback(() => {
    const content = editorRef.current?.innerHTML ?? '';
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'screenplay.html';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);

  const printDocument = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = editorRef.current?.outerHTML ?? '';
    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة السيناريو</title>
          <style>
            body { direction: rtl; font-family: 'Amiri', Arial, sans-serif; }
            .page-content { padding: 2cm; }
          </style>
        </head>
        <body>
          <div class="page-content">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, []);

  const smartNormalizeDocument = useCallback(async () => {
    if (!editorRef.current) return;
    const children = Array.from(editorRef.current.children) as HTMLDivElement[];
    const parsed: ParsedLine[] = [];
    const batch: AuditLine[] = [];
    let previous: ScreenplayFormatId = 'action';

    for (const child of children) {
      const content = (child.textContent ?? '').trim();
      if (!content) {
        parsed.push({ content: '', format: 'action', isEmpty: true });
        continue;
      }
      const result = await classifyLine(content, previous);
      let formatted = content;
      if (result.classification === 'character' && !/[:：]$/.test(formatted)) {
        formatted = `${formatted} :`;
      }
      parsed.push({ content: formatted, format: result.classification });
      batch.push({ index: Number(child.getAttribute('data-line-index') ?? 0), raw: formatted, cls: result.classification });
      previous = result.classification;
    }

    const normalized = normalizeSpacing(parsed, false);
    editorRef.current.innerHTML = '';
    globalLineCounterRef.current = 0;
    normalized.forEach((line) => {
      const div = document.createElement('div');
      const index = globalLineCounterRef.current;
      div.setAttribute('data-line-index', String(index));
      if (line.isEmpty) {
        div.className = 'action';
        div.innerHTML = '<br />';
        div.style.minHeight = '1.6em';
      } else {
        div.className = line.format;
        div.textContent = line.content;
        Object.assign(div.style, getFormatStyles(line.format));
      }
      editorRef.current?.appendChild(div);
      globalLineCounterRef.current += 1;
    });
    updateContent(false);

    if (ENABLE_GEMINI_AUDIT && batch.length > 0) {
      try {
        setIsAuditing(true);
        const corrections = await auditWithGemini(batch.slice(-GEMINI_AUDIT_WINDOW));
        mapCorrections(corrections);
      } catch (error) {
        console.error('[Normalize] Gemini audit error:', error);
      } finally {
        setIsAuditing(false);
      }
    }
  }, [classifyLine, getFormatStyles, mapCorrections, updateContent]);

  const undo = useCallback(() => {
    if (!editorRef.current || undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [htmlContent, ...prev.slice(0, 19)]);
    editorRef.current.innerHTML = previous;
    updateContent(false);
  }, [htmlContent, undoStack, updateContent]);

  const redo = useCallback(() => {
    if (!editorRef.current || redoStack.length === 0) return;
    const nextState = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setUndoStack((prev) => [...prev, htmlContent]);
    editorRef.current.innerHTML = nextState;
    updateContent(false);
  }, [htmlContent, redoStack, updateContent]);

  const handleFileImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        setIsImporting(true);
        createNewDocument();
        let text = await extractTextFromFile(file);
        if (file.name.toLowerCase().endsWith('.pdf')) {
          text = smartProcessPDFText(text);
        }
        const transfer = new DataTransfer();
        transfer.setData('text/plain', text);
        await handlePaste({ clipboardData: transfer, preventDefault: () => undefined, isPDFSource: file.name.endsWith('.pdf') });
      } catch (error) {
        console.error('File import error:', error);
        alert(`فشل استيراد الملف: ${(error as Error).message}`);
      } finally {
        setIsImporting(false);
      }
    },
    [createNewDocument, handlePaste]
  );

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      createNewDocument();
    }
    const handleSelectionChange = () => updateContent(false);
    document.addEventListener('selectionchange', handleSelectionChange);
    if (stickyHeaderRef.current) {
      setStickyHeaderHeight(stickyHeaderRef.current.offsetHeight);
    }
    startBackgroundAuditor(async () => {
      if (!ENABLE_GEMINI_AUDIT || !editorRef.current) return;
      const now = Date.now();
      if (now - lastAuditTimeRef.current < 10000) return;
      const children = Array.from(editorRef.current.children) as HTMLDivElement[];
      const recent: AuditLine[] = [];
      children.slice(-10).forEach((div) => {
        const indexAttr = div.getAttribute('data-line-index');
        if (!indexAttr) return;
        const idx = Number.parseInt(indexAttr, 10);
        const text = (div.textContent ?? '').trim();
        if (!text) return;
        recent.push({ index: idx, raw: text, cls: div.className });
      });
      if (recent.length === 0) return;
      try {
        setIsAuditing(true);
        const corrections = await auditWithGemini(recent);
        mapCorrections(corrections);
        lastAuditTimeRef.current = now;
        lastModifiedLinesRef.current.clear();
      } catch (error) {
        console.error('[BackgroundAuditor] error:', error);
      } finally {
        setIsAuditing(false);
      }
    }, 15000);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      stopBackgroundAuditor();
    };
  }, [createNewDocument, mapCorrections, updateContent]);

  useEffect(() => {
    if (!editorRef.current) return;
    const observer = new MutationObserver(() => updateContent(false));
    observer.observe(editorRef.current, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [updateContent]);

  useEffect(() => {
    if (stickyHeaderRef.current) {
      setTimeout(() => setStickyHeaderHeight(stickyHeaderRef.current?.offsetHeight ?? 0), 0);
    }
  }, [showRulers]);

  const tools: SidebarTool[] = useMemo(
    () => [
      { id: 'new', label: 'نص جديد', icon: <Sparkles size={20} />, action: createNewDocument },
      { id: 'import', label: 'استيراد ملف', icon: <Upload size={20} />, action: () => document.getElementById('file-import-input')?.click() },
      { id: 'undo', label: 'تراجع', icon: <RotateCcw size={20} />, action: undo },
      { id: 'redo', label: 'إعادة', icon: <RotateCw size={20} />, action: redo },
      { id: 'save', label: 'حفظ', icon: <Save size={20} />, action: saveDocument },
      { id: 'print', label: 'طباعة', icon: <Printer size={20} />, action: printDocument },
      { id: 'normalize', label: 'تدقيق ذكي', icon: <Sparkles size={20} />, action: smartNormalizeDocument }
    ],
    [createNewDocument, printDocument, redo, saveDocument, smartNormalizeDocument, undo]
  );

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-200 text-gray-800'}`} dir="rtl">
      <input id="file-import-input" type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleFileImport} />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans+Arabic:wght@100..900&family=Cairo:wght@200..1000&family=Tajawal:wght@200..900&display=swap"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .horizontal-ruler { position: relative; height: 30px; border-bottom: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}; }
            .vertical-ruler { position: relative; width: 30px; border-left: 1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}; }
            .h-ruler-mark { position: absolute; top: 0; width: 1px; background: ${isDarkMode ? '#4b5563' : '#9ca3af'}; }
            .h-ruler-mark.major { height: 15px; background: ${isDarkMode ? '#9ca3af' : '#4b5563'}; }
            .h-ruler-mark.medium { height: 10px; }
            .h-ruler-mark.minor { height: 6px; }
            .v-ruler-mark { position: absolute; left: 0; height: 1px; background: ${isDarkMode ? '#4b5563' : '#9ca3af'}; }
            .v-ruler-mark.major { width: 15px; background: ${isDarkMode ? '#9ca3af' : '#4b5563'}; }
            .v-ruler-mark.medium { width: 10px; }
            .v-ruler-mark.minor { width: 6px; }
            .h-ruler-number { position: absolute; font-size: 8px; color: ${isDarkMode ? '#6b7280' : '#6b7280'}; top: 18px; }
            .v-ruler-number { position: absolute; font-size: 8px; color: ${isDarkMode ? '#6b7280' : '#6b7280'}; left: 18px; transform: translateY(-50%) rotate(-90deg); }
            .page-content { outline: none; direction: rtl; unicode-bidi: bidi-override; padding: 0 96px 96px 96px; min-height: ${A4_PAGE_HEIGHT_PX}px; }
            .page-content::before { content: ''; display: block; height: 96px; }
            .page-background { position: relative; width: 100%; max-width: 1000px; height: ${A4_PAGE_HEIGHT_PX}px; margin: 0 auto 20px auto; background: ${isDarkMode ? '#1f2937' : '#ffffff'}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 3px; }
            .page-number { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); font-size: 12px; color: ${isDarkMode ? '#6b7280' : '#9ca3af'}; }
            .tooltip { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 8px; padding: 8px 12px; background: ${isDarkMode ? '#1f2937' : '#374151'}; color: white; font-size: 12px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; z-index: 1000; }
            .tooltip::after { content: ''; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-bottom-color: ${isDarkMode ? '#1f2937' : '#374151'}; }
            .group:hover .tooltip { opacity: 1; }
          `
        }}
      />

      <div className="flex-shrink-0 px-4 pt-2 shadow-sm z-30 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className="text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
              محرر السيناريو العربي
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAuditing && (
              <div className="flex items-center gap-2 text-sm text-purple-500">
                <Loader2 size={16} className="animate-spin" />
                <span>يجري التدقيق الذكي...</span>
              </div>
            )}
            {isImporting && (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <Loader2 size={16} className="animate-spin" />
                <span>جاري الاستيراد...</span>
              </div>
            )}
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {showRulers && (
          <div className="flex-shrink-0 flex flex-col" style={{ paddingTop: `${stickyHeaderHeight}px` }}>
            <div className="vertical-ruler bg-white dark:bg-gray-800">
              <Ruler orientation="vertical" isDarkMode={isDarkMode} size={A4_PAGE_HEIGHT_PX * pageCount} />
            </div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto" ref={scrollContainerRef}>
          <div ref={stickyHeaderRef} className={`sticky top-0 z-20 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
            <div className="p-2 w-full max-w-[1000px] mx-auto">
              <div className={`mb-2 p-2 rounded-lg border flex items-center gap-2 overflow-x-auto toolbar-container ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                {SCREENPLAY_FORMATS.map((format) => (
                  <Tooltip key={format.id} text={`${format.label} (${format.shortcut || 'Tab/Enter'})`}>
                    <button
                      onClick={() => applyFormatToCurrentLine(format.id)}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        currentFormat === format.id
                          ? `${format.color} text-gray-900 ring-2 ring-purple-500`
                          : isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {format.icon}
                    </button>
                  </Tooltip>
                ))}
              </div>
              <div className={`p-2 rounded-lg border flex items-center flex-wrap gap-x-3 gap-y-2 toolbar-container ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <div className="relative">
                  <button
                    onClick={() => setShowFontMenu((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <span style={{ fontFamily: selectedFont }}>{FONT_OPTIONS.find((f) => f.value === selectedFont)?.label}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showFontMenu && (
                    <div className={`absolute top-full right-0 mt-1 w-48 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => {
                            setSelectedFont(font.value);
                            setShowFontMenu(false);
                          }}
                          className={`w-full text-right block px-3 py-1.5 text-sm rounded ${
                            isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'
                          }`}
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowSizeMenu((prev) => !prev)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    <span>{selectedSize.replace('pt', '')}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showSizeMenu && (
                    <div className={`absolute top-full right-0 mt-1 w-20 p-1.5 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                      {TEXT_SIZE_OPTIONS.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => {
                            setSelectedSize(size.value);
                            setShowSizeMenu(false);
                          }}
                          className={`w-full text-right block px-3 py-1.5 text-sm rounded ${
                            isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`w-px h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                <Tooltip text="عريض">
                  <button
                    onClick={() => formatText('bold')}
                    className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                  >
                    <Bold size={16} />
                  </button>
                </Tooltip>
                <Tooltip text="تسطير">
                  <button
                    onClick={() => formatText('underline')}
                    className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                  >
                    <Underline size={16} />
                  </button>
                </Tooltip>
                <Tooltip text="محاذاة في الوسط">
                  <button
                    onClick={() => document.execCommand('justifyCenter')}
                    className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                  >
                    <AlignCenter size={16} />
                  </button>
                </Tooltip>
                <div className="relative">
                  <Tooltip text="لون النص">
                    <button
                      onClick={() => setShowColorPicker((prev) => !prev)}
                      className={`p-2 rounded-md ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                    >
                      <Palette size={16} />
                    </button>
                  </Tooltip>
                  {showColorPicker && (
                    <div className={`absolute top-full right-0 mt-1 p-2 grid grid-cols-5 gap-1 rounded-md shadow-lg z-50 border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            formatText('foreColor', color);
                            setShowColorPicker(false);
                          }}
                          className="w-6 h-6 rounded-full border border-gray-400"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {showRulers && (
              <div className="w-full max-w-[1000px] mx-auto bg-white dark:bg-gray-800">
                <Ruler orientation="horizontal" isDarkMode={isDarkMode} size={1000} />
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="relative w-full max-w-[1000px] mx-auto">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-testid="rich-text-editor"
                className="page-content"
                style={{ fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`, fontSize: selectedSize, lineHeight: '1.8' }}
                onInput={() => updateContent()}
                onPaste={onPaste}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute top-0 right-0 bottom-0 left-0 -z-10">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <div key={i} className="page-background">
                    <span className="page-number">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`w-16 flex-shrink-0 p-2 border-l overflow-y-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
          <div className="flex flex-col items-center">
            {tools.map((tool) => (
              <SidebarButton key={tool.id} tool={tool} isDarkMode={isDarkMode} orientation="right" />
            ))}
          </div>
        </div>
      </div>

      <div className={`flex-shrink-0 px-4 py-1.5 text-xs border-t ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`} dir="ltr">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
            <span>{documentStats.pages} صفحة</span>
            <span>{documentStats.words} كلمة</span>
            <span>{documentStats.characters} حرف</span>
            <span>{documentStats.scenes} مشهد</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {SCREENPLAY_FORMATS.find((f) => f.id === currentFormat)?.label ?? 'غير معروف'}
            </span>
            {useAgentSystem && agentSystemStats.totalClassifications > 0 && (
              <span
                className="text-blue-500"
                title={`WF: ${agentSystemStats.workflowDecisions}, A: ${agentSystemStats.agentDecisions}, G: ${agentSystemStats.coordinatorDecisions}`}
              >
                {(agentSystemStats.averageConfidence * 100).toFixed(0)}%
              </span>
            )}
            <button
              onClick={() => setUseWorkflowSystem((prev) => !prev)}
              className="text-purple-600 dark:text-purple-400 hover:underline text-xs"
            >
              {useWorkflowSystem ? 'تعطيل WF' : 'تفعيل WF'}
            </button>
            <button
              onClick={() => setUseAgentSystem((prev) => !prev)}
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
            >
              {useAgentSystem ? 'تعطيل الوكلاء' : 'تفعيل الوكلاء'}
            </button>
            <button onClick={() => setShowRulers((prev) => !prev)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
              {showRulers ? 'إخفاء المساطر' : 'إظهار المساطر'}
            </button>
          </div>
        </div>
      </div>

      <Dialog
        title={generatorState.type === 'character' ? '✨ إنشاء شخصية' : '✨ اقتراح مشهد'}
        isOpen={generatorState.isOpen}
        onClose={() => setGeneratorState((prev) => ({ ...prev, isOpen: false }))}
        isDarkMode={isDarkMode}
      >
        <div className="flex flex-col gap-4" dir="rtl">
          <textarea
            value={generatorState.input}
            onChange={(e) => setGeneratorState((prev) => ({ ...prev, input: e.target.value }))}
            className="w-full h-24 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            placeholder="اكتب هنا..."
          />
          <button
            onClick={() => {
              void (async () => {
                if (!generatorState.input.trim()) return;
                setGeneratorState((prev) => ({ ...prev, isLoading: true, result: '' }));
                const prompt = generatorState.type === 'character'
                  ? `أنت مساعد كتابة سيناريو خبير. قم بإنشاء ملف شخصية بناءً على الوصف التالي: "${generatorState.input}".`
                  : `أنت مساعد كتابة سيناريو إبداعي. اقترح ثلاثة مشاهد بناءً على هذا الملخص: "${generatorState.input}".`;
                try {
                  const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                  });
                  const text = await response.text();
                  setGeneratorState((prev) => ({ ...prev, result: text, isLoading: false }));
                } catch (error) {
                  console.error('Generator error:', error);
                  setGeneratorState((prev) => ({ ...prev, result: 'تعذّر توليد النص.', isLoading: false }));
                }
              })();
            }}
            disabled={generatorState.isLoading}
            className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
          >
            {generatorState.isLoading ? <Loader2 className="animate-spin" /> : '✨ توليد'}
          </button>
          {generatorState.result && (
            <div className="mt-4 p-4 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans">{generatorState.result}</pre>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        title="بحث"
        isOpen={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        isDarkMode={isDarkMode}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">ميزة البحث ستتوفر قريبًا.</p>
      </Dialog>

      <Dialog
        title="بحث واستبدال"
        isOpen={showReplaceDialog}
        onClose={() => setShowReplaceDialog(false)}
        isDarkMode={isDarkMode}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">ميزة الاستبدال ستتوفر قريبًا.</p>
      </Dialog>

      <Dialog
        title="إعادة تسمية شخصية"
        isOpen={showCharacterRename}
        onClose={() => setShowCharacterRename(false)}
        isDarkMode={isDarkMode}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">إعادة التسمية قيد التطوير.</p>
      </Dialog>
    </div>
  );
};

export default ScreenplayEditor;

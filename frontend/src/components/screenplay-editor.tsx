import React, { useRef, useState } from 'react';
import {
  ScreenplayFormat,
  classifyLineInstantly,
  getNextFormatOnEnter,
  normalizeSpacing,
  ProcessedLine
} from '../lib/editor/format';
import { getClipboardText, insertProcessedIntoDOM } from '../lib/editor/dom';
import { auditWithGemini, queueForGeminiReview } from '../lib/editor/gemini';
import EditorToolbar from './editor-toolbar';
import Ruler from './ruler';
import { toast } from '../lib/toast';

const ScreenplayEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [currentFormat, setCurrentFormat] = useState<ScreenplayFormat>('action');
  const [stats, setStats] = useState({ characters: 0, words: 0, scenes: 0, pages: 1 });
  const [isAuditing, setIsAuditing] = useState(false);
  const [rulerVisible, setRulerVisible] = useState(true);
  const lastModifiedLines = useRef<Set<number>>(new Set());

  const updateStats = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.textContent || '';
    const characters = content.length;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const scenes = editorRef.current.querySelectorAll('.scene-header-1').length;
    setStats({ characters, words, scenes, pages: 1 });
  };

  const processGeminiItems = async (items: any[]) => {
    const batch = items.map((it: any) => ({ index: Number(it.lineIndex), raw: it.content, cls: it.format }));
    const corrections = await auditWithGemini(batch, toast);
    corrections.forEach(c => {
      const el = editorRef.current?.querySelector(`div[data-line-index="${c.index}"]`) as HTMLElement | null;
      if (el) {
        el.className = c.suggestedClass;
        el.classList.add('bg-yellow-100');
        setTimeout(() => el.classList.remove('bg-yellow-100'), 500);
        lastModifiedLines.current.add(c.index);
      }
    });
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = getClipboardText(e);
    if (!text || !editorRef.current) return;
    const lines = text.split(/\r?\n/);
    let prev: ScreenplayFormat = currentFormat;
    const processed: ProcessedLine[] = lines.map(raw => {
      const fmt = classifyLineInstantly(raw, prev);
      prev = fmt;
      return { content: raw, format: fmt, isHtml: false };
    });
    const normalized = normalizeSpacing(processed);
    const { html, batchLinesForAudit } = insertProcessedIntoDOM(normalized);
    editorRef.current.innerHTML = html;
    if (isAuditing) {
      batchLinesForAudit.forEach(({ index, raw, cls }) => {
        const element = editorRef.current?.querySelector(`div[data-line-index="${index}"]`) as HTMLElement | null;
        if (element) {
          queueForGeminiReview(
            { element, content: raw, format: cls, timestamp: Date.now(), lineIndex: String(index) },
            processGeminiItems
          );
        }
      });
    }
    updateStats();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const next = getNextFormatOnEnter(currentFormat);
      const div = document.createElement('div');
      div.className = next;
      div.innerHTML = '<br>';
      editorRef.current?.appendChild(div);
      setCurrentFormat(next);
    }
  };

  const toggleGemini = () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      toast('مفتاح Gemini غير موجود');
      return;
    }
    setIsAuditing(v => !v);
  };

  return (
    <div className="p-4" dir="rtl">
      <EditorToolbar
        auditing={isAuditing}
        rulerVisible={rulerVisible}
        onToggleGemini={toggleGemini}
        onToggleRuler={() => setRulerVisible(r => !r)}
      />
      <Ruler visible={rulerVisible} />
      <div className="mb-2 text-sm text-gray-500">التنسيق الحالي: {currentFormat}</div>
      <div
        ref={editorRef}
        contentEditable
        className="border rounded p-2 min-h-[200px]" data-testid="rich-text-editor"
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{ textAlign: 'right', lineHeight: '1.8' }}
      />
      <div className="mt-2 text-xs text-gray-500">
        {stats.words} كلمة · {stats.characters} حرف · {stats.scenes} مشهد
      </div>
    </div>
  );
};

export default ScreenplayEditor;

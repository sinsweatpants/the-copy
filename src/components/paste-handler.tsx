// PasteHandler.tsx - Version 2.0 (Three-Component Scene Header)
import React, { useCallback } from 'react';
import DOMPurify from 'dompurify';
import { ScreenplayFormatId, IClassifier } from '../types/screenplay';

/* ──────────────────────────────
   Props للمكوّن
   ────────────────────────────── */
interface Props {
  classifier: IClassifier;
  /** إرجاع الستايل الخاص بكل تنسيق (يمكن ربطه بملف CSS) */
  getFormatStyles: (format: ScreenplayFormatId) => Partial<CSSStyleDeclaration>;
  /** استدعاء لتحديث الـ state أو أي منطق آخر بعد اللصق */
  updateContent: () => void;
}

function getClipboardText(e: React.ClipboardEvent<HTMLDivElement>): string | null {
  const html = e.clipboardData.getData('text/html');
  if (html) {
    // تسمح فقط ببعض العلامات البسيطة لتجنّب XSS
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'br'],
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    return doc.body.innerText;               // نص صافي مع الفواصل
  }
  return e.clipboardData.getData('text/plain') || null;
}

function splitLines(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

function buildSceneHeaderNode(
  parsed: { sceneNumber: string; sceneInfo: string },
  getStyle: (f: ScreenplayFormatId) => Partial<CSSStyleDeclaration>
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'scene-header';                // حاوية يمكن تنسيقها بـ flex / grid
  wrapper.setAttribute('data-format', 'scene-header');

  const spanNum = document.createElement('span');
  spanNum.className = 'scene-header-1';
  spanNum.textContent = parsed.sceneNumber;
  Object.assign(spanNum.style, getStyle('scene-header-1'));

  const spanInfo = document.createElement('span');
  spanInfo.className = 'scene-header-2';
  spanInfo.textContent = parsed.sceneInfo;
  Object.assign(spanInfo.style, getStyle('scene-header-2'));

  wrapper.appendChild(spanNum);
  wrapper.appendChild(spanInfo);
  return wrapper;
}

function buildLocationNode(
  line: string,
  getStyle: (f: ScreenplayFormatId) => Partial<CSSStyleDeclaration>
): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'scene-header-location';
  div.setAttribute('data-format', 'scene-header-location');
  Object.assign(div.style, getStyle('scene-header-location'));
  div.textContent = line;
  return div;
}

function buildDefaultDiv(
  format: ScreenplayFormatId,
  raw: string,
  getStyle: (f: ScreenplayFormatId) => Partial<CSSStyleDeclaration>
): HTMLDivElement {
  const div = document.createElement('div');
  div.className = format;
  div.setAttribute('data-format', format);
  Object.assign(div.style, getStyle(format));

  // تصحيح النص حسب النوع
  let clean = raw;
  if (format === 'character' && !/[：:]$/.test(clean)) {
    clean += ':';
  }
  if (format === 'parenthetical') {
    // النص بين الأقواس يبقى كما هو
  } else if (/^[\(（].*?[\)）]$/.test(clean) && format === 'action') {
    clean = clean.slice(1, -1).trim();
  }

  div.textContent = clean;
  return div;
}

function insertFragment(fragment: DocumentFragment) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  
  const range = sel.getRangeAt(0);
  range.deleteContents();
  range.insertNode(fragment);
  
  // وضع المؤشر بعد المحتوى المُدرج
  const last = fragment.lastChild;
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// Hook للاستخدام في المكونات
export const usePasteHandler = (
  classifier: IClassifier,
  getFormatStyles: (format: ScreenplayFormatId) => Partial<CSSStyleDeclaration>,
  updateContent: () => void
) => {
  return useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();

      const rawText = getClipboardText(e);
      if (!rawText) return;

      const lines = splitLines(rawText);
      if (lines.length === 0) return;

      const fragment = document.createDocumentFragment();

      /* -------------------------------------------------
         1️⃣  تصنيف كل سطر مسبقًا لتسهيل الـ look ahead
         ------------------------------------------------- */
      const classified: { line: string; format: ScreenplayFormatId }[] = [];
      let prev: ScreenplayFormatId = 'empty';
      
      for (const ln of lines) {
        const result = classifier.classifyLine(ln, prev);
        classified.push({ line: ln, format: result.format });
        prev = result.format;
      }

      /* -------------------------------------------------
         2️⃣  المرور على المصفوفة وإنشاء العناصر
         ------------------------------------------------- */
      for (let i = 0; i < classified.length; i++) {
        const { line, format } = classified[i];

        // ----- سطر عنوان المشهد الأول -----
        if (format === 'scene-header-line1') {
          const parsed = classifier.parseSceneHeaderLine(line);
          if (parsed) {
            const headerNode = buildSceneHeaderNode(parsed, getFormatStyles);
            fragment.appendChild(headerNode);
          } else {
            // فشل التحليل → fallback إلى action
            fragment.appendChild(buildDefaultDiv('action', line, getFormatStyles));
          }

          // ----- سطر الموقع (الجزء 3) إذا كان موجودًا -----
          const next = classified[i + 1];
          if (next && next.format === 'scene-header-location') {
            fragment.appendChild(buildLocationNode(next.line, getFormatStyles));
            i++; // تخطي سطر الموقع لأنه تم دمجه
          }
          continue; // انتقل للسطر التالي في الحلقة
        }

        // ----- سطر الموقع بمفرده (حالات غير متوقعة) -----
        if (format === 'scene-header-location') {
          fragment.appendChild(buildLocationNode(line, getFormatStyles));
          continue;
        }

        // ----- باقي الأنواع (action, character, …) -----
        fragment.appendChild(buildDefaultDiv(format, line, getFormatStyles));
      }

      /* -------------------------------------------------
         3️⃣  إدراج الـ fragment في موضع المؤشر
         ------------------------------------------------- */
      insertFragment(fragment);
      updateContent(); // إخطار المكوّن أنّ المحتوى تغيّر
    },
    [classifier, getFormatStyles, updateContent]
  );
};

// مكون PasteHandler للاستخدام المباشر
export const PasteHandler: React.FC<Props> = ({
  classifier,
  getFormatStyles,
  updateContent,
}) => {
  const handlePaste = usePasteHandler(classifier, getFormatStyles, updateContent);

  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onPaste={handlePaste}
      style={{ minHeight: '1rem', outline: 'none' }}
      className="screenplay-paste-handler"
    />
  );
};
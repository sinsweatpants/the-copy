import DOMPurify from 'dompurify';
import type { ProcessedLine } from './format';

export const getClipboardText = (
  e: React.ClipboardEvent<HTMLDivElement>
): string | null => {
  const html = e.clipboardData.getData('text/html');
  if (html) {
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'br', 'p', 'div']
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');
    return doc.body.innerText;
  }
  return e.clipboardData.getData('text/plain') || null;
};

export const insertFragment = (fragment: DocumentFragment) => {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const last = fragment.lastChild;
  range.insertNode(fragment);
  if (last) {
    const newRange = document.createRange();
    newRange.setStartAfter(last);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
};

export const insertProcessedIntoDOM = (processedLines: ProcessedLine[]) => {
  let html = '';
  const batchLinesForAudit: { index: number; raw: string; cls: string }[] = [];
  let idx = 0;
  for (const line of processedLines) {
    if (line.isEmpty) {
      html += `<div class="action" style="min-height:1.6em;" data-line-index="${idx}"><br></div>`;
    } else {
      batchLinesForAudit.push({ index: idx, raw: line.content, cls: line.format });
      const div = document.createElement('div');
      div.className = line.format;
      div.setAttribute('data-line-index', String(idx));
      if (line.isHtml) div.innerHTML = line.content;
      else div.textContent = line.content;
      html += div.outerHTML;
    }
    idx++;
  }
  return { html, batchLinesForAudit };
};

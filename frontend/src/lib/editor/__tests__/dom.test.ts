/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { insertProcessedIntoDOM } from '../dom';
import { ProcessedLine } from '../format';

describe('insertProcessedIntoDOM', () => {
  it('creates html with correct classes', () => {
    const lines: ProcessedLine[] = [
      { content: 'وصف', format: 'action', isHtml: false },
      { content: 'علي', format: 'character', isHtml: false },
      { content: 'مرحبا', format: 'dialogue', isHtml: false }
    ];
    const { html, batchLinesForAudit } = insertProcessedIntoDOM(lines);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    expect(doc.body.children).toHaveLength(3);
    expect(doc.body.children[1].className).toBe('character');
    expect(batchLinesForAudit.length).toBe(3);
  });
});

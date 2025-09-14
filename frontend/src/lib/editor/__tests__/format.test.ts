import { describe, it, expect } from 'vitest';
import {
  classifyLineInstantly,
  getNextFormatOnEnter,
  needsEmptyLine,
  getMarginTop,
  normalizeSpacing,
  ProcessedLine
} from '../format';

describe('classifyLineInstantly', () => {
  it('detects scene headers', () => {
    expect(classifyLineInstantly('مشهد 1', 'action')).toBe('scene-header-1');
  });
  it('follows character with dialogue', () => {
    expect(classifyLineInstantly('مرحبا بك', 'character')).toBe('dialogue');
  });
});

describe('getNextFormatOnEnter', () => {
  it('character to dialogue', () => {
    expect(getNextFormatOnEnter('character')).toBe('dialogue');
  });
  it('dialogue to action', () => {
    expect(getNextFormatOnEnter('dialogue')).toBe('action');
  });
});

describe('needsEmptyLine and getMarginTop', () => {
  it('detects need for empty line between action and character', () => {
    expect(needsEmptyLine('action', 'character')).toBe(true);
  });
  it('returns spacing value', () => {
    expect(getMarginTop('action', 'character')).toBe('1em');
  });
});

describe('normalizeSpacing', () => {
  it('inserts empty lines when needed', () => {
    const lines: ProcessedLine[] = [
      { content: 'وصف', format: 'action', isHtml: false },
      { content: 'علي', format: 'character', isHtml: false }
    ];
    const normalized = normalizeSpacing(lines);
    expect(normalized).toHaveLength(3);
    expect(normalized[1].isEmpty).toBe(true);
  });
});

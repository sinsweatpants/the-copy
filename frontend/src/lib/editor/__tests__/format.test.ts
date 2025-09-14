import { describe, it, expect } from 'vitest';
import { classifyLineInstantly, getNextFormatOnEnter } from '../format';

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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { auditWithGemini, buildAuditPrompt } from '../gemini';

afterEach(() => {
  vi.resetAllMocks();
});

describe('auditWithGemini', () => {
  it('warns when key missing', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const toast = vi.fn();
    const res = await auditWithGemini([{ index: 0, raw: 'hi', cls: 'action' }], toast);
    expect(res).toEqual([]);
    expect(toast).toHaveBeenCalled();
  });

  it('returns corrections from API', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'key');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '[{"index":0,"suggestedClass":"dialogue","reason":"x"}]' }] } }
        ]
      })
    }) as any;
    const res = await auditWithGemini([{ index: 0, raw: 'hi', cls: 'action' }]);
    expect(res[0].suggestedClass).toBe('dialogue');
  });
});

describe('buildAuditPrompt', () => {
  it('includes data in prompt', () => {
    const prompt = buildAuditPrompt([{ index: 1, raw: 'test', cls: 'action' }]);
    expect(prompt).toContain('test');
  });
});

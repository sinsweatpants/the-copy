import { SCREENPLAY_FORMATS } from './constants';

export interface AuditLine {
  index: number;
  raw: string;
  cls: string;
}

export interface Correction {
  index: number;
  suggestedClass: string;
  reason: string;
}

export const buildAuditPrompt = (lines: AuditLine[]): string => {
  const allowedClasses = JSON.stringify(SCREENPLAY_FORMATS.filter(f => f !== 'scene-header-2'));
  return `### Persona\nYou are an expert AI system specializing in the structural analysis and classification of Arabic screenplay text.\n### Primary Objective\nAudit the provided lines and return definite misclassifications as JSON.\n### DATA FOR ANALYSIS\n${JSON.stringify(lines, null, 2)}\n`;
};

export const auditWithGemini = async (
  batch: AuditLine[],
  toast?: (msg: string) => void
): Promise<Correction[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    toast?.('مفتاح Gemini غير موجود');
    return [];
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
      console.error('Gemini API Error:', resp.status, await resp.text());
      toast?.('تعذّر الاتصال بخدمة Gemini');
      return [];
    }
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const corrections: unknown = JSON.parse(rawText);
    if (!Array.isArray(corrections)) return [];
    const allowed = new Set(SCREENPLAY_FORMATS);
    return (corrections as Correction[]).filter(
      c => typeof c.index === 'number' && allowed.has(c.suggestedClass as any)
    );
  } catch (err) {
    console.error('Gemini audit exception:', err);
    toast?.('حدث خطأ أثناء الاتصال بـ Gemini');
    return [];
  }
};

interface ReviewItem {
  element: HTMLElement;
  content: string;
  format: string;
  timestamp: number;
  lineIndex: string | null;
}

const reviewQueue: ReviewItem[] = [];
let reviewTimeout: number | null = null;

export const queueForGeminiReview = (
  item: ReviewItem,
  process: (items: ReviewItem[]) => Promise<void>
) => {
  reviewQueue.push(item);
  if (reviewTimeout) clearTimeout(reviewTimeout);
  reviewTimeout = window.setTimeout(async () => {
    const items = [...reviewQueue];
    reviewQueue.length = 0;
    await process(items);
  }, 2000);
};

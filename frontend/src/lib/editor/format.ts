import { ScreenplayFormat, NEXT_FORMAT_ON_ENTER, NEEDS_EMPTY_LINE, SPACING_MAP } from './constants';

export const classifyLineInstantly = (text: string, previousFormat: ScreenplayFormat): ScreenplayFormat => {
  if (!text || text.length < 2) return 'action';
  const trimmed = text.trim();
  if (/^[^\s:]{1,15}:/.test(trimmed)) return 'character';
  if (/^(مشهد|scene|الفصل|chapter)/i.test(trimmed)) return 'scene-header-1';
  if (/^(داخلي|خارجي|ليل|نهار|صباح|مساء|interior|exterior)/i.test(trimmed)) return 'scene-header-2';
  if (/^(البيت|المدرسة|المكتب|الشارع|المستشفى|الغرفة)/i.test(trimmed)) return 'scene-header-3';
  if (/^(قطع|اختفاء|انتقال|cut|fade)/i.test(trimmed) && trimmed.length < 20) return 'transition';
  if (/^(أنا|أنت|نعم|لا|ربما|آه|أوه)/.test(trimmed)) return 'dialogue';
  if (/[؟!]$/.test(trimmed)) return 'dialogue';
  if (/^(يدخل|يخرج|يجلس|يقوم|يمشي|نرى|نشاهد)/.test(trimmed)) return 'action';
  if (previousFormat === 'character') return 'dialogue';
  if (previousFormat === 'dialogue' && /^(هو|هي|الرجل|المرأة)/.test(trimmed)) return 'action';
  return 'action';
};

export const getNextFormatOnEnter = (fmt: ScreenplayFormat): ScreenplayFormat =>
  NEXT_FORMAT_ON_ENTER[fmt] || 'action';

export const needsEmptyLine = (prev: ScreenplayFormat, cur: ScreenplayFormat): boolean =>
  NEEDS_EMPTY_LINE[prev]?.includes(cur) ?? false;

export const getMarginTop = (from: ScreenplayFormat, to: ScreenplayFormat): string =>
  SPACING_MAP[from]?.[to] || '0px';

export interface ProcessedLine {
  content: string;
  format: ScreenplayFormat;
  isHtml: boolean;
  isEmpty?: boolean;
}

export const normalizeSpacing = (
  contentLines: ProcessedLine[],
  preservePDFSpacing = false
): ProcessedLine[] => {
  const normalized: ProcessedLine[] = [];
  let prevFmt: ScreenplayFormat | null = null;

  for (let i = 0; i < contentLines.length; i++) {
    const cur = contentLines[i];
    const empty = !cur.content.trim();

    if (empty) {
      if (preservePDFSpacing) {
        normalized.push({ ...cur, isEmpty: true, format: 'action' });
      }
      continue;
    }

    if (!preservePDFSpacing && prevFmt && needsEmptyLine(prevFmt, cur.format)) {
      normalized.push({ content: '', format: 'action', isHtml: false, isEmpty: true });
    }

    normalized.push(cur);
    prevFmt = cur.format;
  }

  return normalized;
};
export const mapModelOutputToFormat = (
  modelResult: { label: string; score: number }[],
  text: string,
  context: { previousFormat: ScreenplayFormat }
): ScreenplayFormat => {
  const base = classifyLineInstantly(text, context.previousFormat);
  const top = modelResult[0];
  if (top?.score > 0.8) {
    const label = top.label.toLowerCase();
    if (label.includes('dialogue') || label.includes('conversation')) return 'dialogue';
    if (label.includes('action') || label.includes('description')) return 'action';
  }
  if (
    ['character', 'scene-header-1', 'scene-header-2', 'scene-header-3', 'transition'].includes(base)
  )
    return base;
  return base;
};

// screenplay-classifier.ts (نسخة مطوّرة)
// -----------------------------------------------------------------------------
// نسخة محسّنة من ScreenplayClassifier مع تحسين الأداء، تقليل التكرار، ودعم
// أفضل للغات متعددة.

export type ScreenplayFormatId =
  | 'basmala'
  | 'scene-header-1'
  | 'scene-header-2'
  | 'scene-header-3'
  | 'scene-header-line1'
  | 'scene-header-location'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'unknown'
  | 'empty';

export class ScreenplayClassifier {
  private static readonly sceneTimePattern = /\b(ليل|نهار|صباح|مساء|فجر|ظهر|عصر|مغرب|عشاء|day|night|morning|evening)\b/i;
  private static readonly sceneLocationPattern = /^(داخلي|خارجي|فوتو|مونتاج|int\.|ext\.)/i;
  private static readonly sceneHeaderPattern = /^(scene|مشهد)/i;
  private static readonly transitionPattern = /(قطع|اختفاء|تحول|مزج|انتقال|cut to|fade to|dissolve to)$/i;
  private static readonly commonVerbsPattern = /^(يقف|تقف|يجلس|تجلس|يدخل|تدخل|يخرج|تخرج|ينظر|تنظر|يقول|تقول|يمشي|تمشي|تركض|يركض|يكتب|تكتب|يقرأ|تقرأ|يصمت|تسكت|يصمتون|تشهق|يصرخ|تصرخ|يهمس|همس|يتنهد|تتنهد|يبتسم|تبتسم|يضحك|تضحك|ينهض|تنهض|يقترب|تقترب|يبتعد|تبتعد|يلتفت|تلتفت|يحدق|تحدق|يتلعثم|تتلعثم|walk|run|enter|exit|look|say|sit|stand|move|turn)\b/i;

  classifyLine(line: string, previousFormat: ScreenplayFormatId): ScreenplayFormatId {
    const trimmed = line.trim();
    if (!trimmed) return 'empty';

    // 1. Basmala (special case for Arabic screenplay)
    if (trimmed.match(/^بسم الله الرحمن الرحيم/i)) {
      return 'basmala';
    }

    // 2. Parenthetical
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) return 'parenthetical';

    // 3. Transition
    if (ScreenplayClassifier.transitionPattern.test(trimmed)) return 'transition';

    // 4. Scene Header
    const isSceneHeader = ScreenplayClassifier.sceneLocationPattern.test(trimmed) || ScreenplayClassifier.sceneHeaderPattern.test(trimmed);
    if (isSceneHeader) {
      if (ScreenplayClassifier.sceneTimePattern.test(trimmed)) return 'scene-header-3';
      if (ScreenplayClassifier.sceneLocationPattern.test(trimmed)) return 'scene-header-2';
      return 'scene-header-1';
    }

    // 5. Character
    const endsWithColon = /[:：]$/.test(trimmed);
    const isCharacterCaps = /^[A-Z\s\p{P}]+$/u.test(trimmed) && trimmed.split(/\s+/).length <= 4;
    if (endsWithColon || isCharacterCaps) return 'character';

    // 6. Dialogue
    if (previousFormat === 'character' || previousFormat === 'parenthetical') return 'dialogue';

    // 7. Action
    if (ScreenplayClassifier.commonVerbsPattern.test(trimmed)) return 'action';

    // 8. Default
    return 'action';
  }

  parseSceneHeaderLine(line: string): { sceneNumber: string; sceneInfo: string } | null {
    const trimmed = line.trim();
    const match = trimmed.match(/(مشهد\s*\d+|scene\s*\d+)/i);
    if (!match) return null;

    const sceneNumber = match[0].trim();
    const sceneInfo = trimmed.replace(match[0], '').replace(/^[\s\-–—]+/, '').trim();
    return { sceneNumber, sceneInfo };
  }
}
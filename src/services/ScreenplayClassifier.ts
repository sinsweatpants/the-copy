import { IClassifier, ScreenplayFormatId } from '../types/screenplay';

export class ScreenplayClassifier implements IClassifier {
  private sceneHeaderRegex = /^مشهد\s+\d+/;
  private characterRegex = /^[A-Z\u0600-\u06FF\s]{2,}$/;
  private transitionRegex = /^(قطع إلى|انتقال إلى|تلاشي|ظهور)/;
  private basmalaRegex = /^بسم الله الرحمن الرحيم/;
  private settingKeywords = ['ليل', 'نهار', 'صباح', 'مساء', 'داخلي', 'خارجي'];

  classifyLine(line: string, previousFormat: ScreenplayFormatId | null): ScreenplayFormatId {
    const trimmedLine = line.trim();
    
    // Empty lines
    if (!trimmedLine) return 'unknown';

    // Basmala check
    if (this.basmalaRegex.test(trimmedLine)) {
      return 'basmala';
    }

    // Scene header check
    if (this.sceneHeaderRegex.test(trimmedLine)) {
      return 'scene-header-1';
    }

    // Check if this is the location line (second line of scene header)
    if (previousFormat === 'scene-header-1' || previousFormat === 'scene-header-2') {
      return 'scene-header-location';
    }

    // Transition check
    if (this.transitionRegex.test(trimmedLine)) {
      return 'transition';
    }

    // Character name check (usually all caps, after action or transition)
    if (this.characterRegex.test(trimmedLine) && 
        (previousFormat === 'action' || previousFormat === 'transition' || 
         previousFormat === 'scene-header-location' || previousFormat === null)) {
      return 'character';
    }

    // Parenthetical check (usually in parentheses after character)
    if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')') && 
        previousFormat === 'character') {
      return 'parenthetical';
    }

    // Dialogue check (after character or parenthetical)
    if (previousFormat === 'character' || previousFormat === 'parenthetical') {
      return 'dialogue';
    }

    // Continue dialogue if previous was dialogue
    if (previousFormat === 'dialogue' && !this.characterRegex.test(trimmedLine)) {
      return 'dialogue';
    }

    // Default to action
    return 'action';
  }

  parseSceneHeaderLine(line: string): { sceneNumber: string; sceneInfo: string } | null {
    const match = line.match(/^(مشهد\s+\d+)\s+(.+)$/);
    if (match) {
      return {
        sceneNumber: match[1],
        sceneInfo: match[2]
      };
    }

    // Handle scene header with just number
    const numberMatch = line.match(/^(مشهد\s+\d+)$/);
    if (numberMatch) {
      return {
        sceneNumber: numberMatch[1],
        sceneInfo: ''
      };
    }

    return null;
  }

  private containsSettingKeyword(text: string): boolean {
    return this.settingKeywords.some(keyword => text.includes(keyword));
  }
}
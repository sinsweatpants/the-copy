import { IClassifier, ScreenplayFormatId } from "@/types/screenplay";

/**
 * Rule-based classifier for Arabic screenplay lines.
 * Heuristics keep context via previous format; tuned for paste-handling.
 */
export class ScreenplayClassifier implements IClassifier {

  private readonly re = {
    basmala: /^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*$/u,
    sceneHeader: /^\s*(مشهد\s*\d+)\s+(.+)\s*$/u, // e.g., "مشهد 1 ليل - داخلي"
    locationOnly: /^\s*[^\-]+$/u, // loose match for location line if centered next
    character: /^(?:[\p{L}\s]{2,30})$/u, // short, letters/spaces only
    parenthetical: /^\s*[\(（][^)）]+[\)）]\s*$/u,
    transition: /^\s*(قطع\s+إلى|ذوبان\s+إلى|محو\s+تدريجي)\s*$/u,
    blank: /^\s*$/
  };

  classifyLine(line: string, previous: ScreenplayFormatId | null): ScreenplayFormatId {
    const s = line.trim();

    if (this.re.blank.test(s)) return 'unknown';
    if (this.re.basmala.test(s)) return 'basmala';

    // Scene header (line 1) e.g., "مشهد 1 ليل - داخلي"
    if (this.re.sceneHeader.test(s)) return 'scene-header-1';

    // If previous line was header line1, and this looks like location => location
    if (previous === 'scene-header-1' && this.re.locationOnly.test(s)) {
      return 'scene-header-location';
    }

    // Parenthetical takes priority before dialogue
    if (this.re.parenthetical.test(s)) {
      return previous === 'character' || previous === 'dialogue' ? 'parenthetical' : 'action';
    }

    // Character heuristic: short all-letters token, and the next line likely dialogue (handled by look-ahead externally)
    if (this.re.character.test(s) && this.isLikelyCharacter(s)) {
      return 'character';
    }

    if (this.re.transition.test(s)) return 'transition';

    // If previous was character or parenthetical, default to dialogue
    if (previous === 'character' || previous === 'parenthetical' || previous === 'dialogue') {
      return 'dialogue';
    }

    return 'action';
  }

  parseSceneHeaderLine(line: string): { sceneNumber: string; sceneInfo: string } | null {
    const m = line.trim().match(this.re.sceneHeader);
    if (!m) return null;
    return { sceneNumber: m[1].trim(), sceneInfo: m[2].trim() };
  }

  private isLikelyCharacter(s: string): boolean {
    // Arabic names are often 2–3 words, no punctuation. Reject if contains digits or hyphens.
    if (/[0-9\-:،.]/u.test(s)) return false;
    // Uppercase heuristic doesn't apply; use length/words
    const words = s.split(/\s+/).filter(Boolean);
    return words.length <= 4 && s.length <= 30;
  }
}
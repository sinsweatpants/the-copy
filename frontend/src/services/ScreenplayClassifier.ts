export type ScreenplayFormatId = 'basmala' | 'scene-header-1' | 'scene-header-2' | 'scene-header-3' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';

export class ScreenplayClassifier {
    sceneTimeKeywords: string[] = ['ليل', 'نهار', 'صباح', 'مساء', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'day', 'night', 'morning', 'evening'];
    sceneLocationKeywords: string[] = ['داخلي', 'خارجي', 'فوتو', 'مونتاج', 'int.', 'ext.'];
    sceneKeywords: string[] = [...this.sceneTimeKeywords, ...this.sceneLocationKeywords];
    transitionKeywords: string[] = ['قطع', 'اختفاء', 'تحول', 'انتقال', 'cut to', 'fade to', 'dissolve to'];
    commonVerbs: string[] = ['يقف', 'تقف', 'يجلس', 'تجلس', 'يدخل', 'تدخل', 'يخرج', 'تخرج', 'ينظر', 'تنظر', 'يقول', 'تقول', 'يمشي', 'تمشي', 'تركض', 'يركض', 'يكتب', 'تكتب', 'يقرأ', 'تقرأ'];
    locationNames: string[] = ['مسجد', 'جامع', 'كنيسة', 'مدرسة', 'مستشفى', 'شارع', 'ميدان', 'حديقة', 'مقهى', 'مطعم', 'محل', 'بيت', 'منزل', 'فيلا', 'عمارة', 'برج', 'القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة', 'أسوان', 'الأقصر', 'طنطا', 'المنيا'];

    classifyLine(line: string, previousFormat: ScreenplayFormatId): ScreenplayFormatId | 'scene-header-1-split' {
        const trimmedLine = line.trim();
        const wordCount = trimmedLine.split(/\s+/).filter(Boolean).length;
        const firstWord = trimmedLine.split(/[\s-]/)[0];

        if (trimmedLine.match(/^بسم الله الرحمن الرحيم/i)) {
            return 'basmala';
        }
        if (this.transitionKeywords.some(keyword => trimmedLine.toLowerCase().startsWith(keyword))) {
            return 'transition';
        }
        if (trimmedLine.match(/^(مشهد\s*\d+|scene\s*\d+)/i)) {
            const match = trimmedLine.match(/^(مشهد\s*\d+)\s+(.+)$/i);
            if (match && this.sceneKeywords.some(kw => match[2].toLowerCase().includes(kw))) {
                return 'scene-header-1';
            }
            return 'scene-header-1';
        }
        if (previousFormat === 'scene-header-1' || previousFormat === 'scene-header-2') {
            if (wordCount <= 5 && (trimmedLine.endsWith(':') || trimmedLine.endsWith('：'))) {
                 return 'scene-header-3';
            }
            if (this.commonVerbs.includes(firstWord)){
                return 'scene-header-3';
            }
            if (wordCount <= 7 && !trimmedLine.match(/[:：]/)) {
                 return 'scene-header-3';
            }
        }
        if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
            if (previousFormat === 'character' || previousFormat === 'dialogue') {
                return 'parenthetical';
            }
            return 'action';
        }
        if (trimmedLine.endsWith(':') || trimmedLine.endsWith('：')) {
            return 'character';
        }
        if (trimmedLine.match(/^[A-Z\s]+$/) && wordCount <= 4) {
            return 'character';
        }
        if (trimmedLine.match(/^(الرجل|الشاب|المرأة|الفتاة|الطفل)\s+\d+/i)) {
            return 'character';
        }
        if (wordCount <= 4 && !this.commonVerbs.includes(firstWord) && !this.locationNames.some(loc => trimmedLine.includes(loc))) {
            if(previousFormat === 'action' || previousFormat === 'dialogue' || previousFormat === 'transition') {
                return 'character';
            }
        }
        if (previousFormat === 'character' || previousFormat === 'parenthetical') {
            return 'dialogue';
        }
        return 'action';
    }

    splitSceneHeader(line: string): { sceneNumber: string; sceneInfo: string } | null {
        const match = line.match(/^(مشهد\s*\d+)\s+(.+)$/i);
        if (match) {
            return {
                sceneNumber: match[1].trim(),
                sceneInfo: match[2].trim()
            };
        }
        return null;
    }
}

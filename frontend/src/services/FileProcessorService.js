/**
 * @module FileProcessorService
 * 
 * خدمة مُحدَّثة لمعالجة الملفات، مصممة للتكامل مع البنية الموحدة في ScreenplayEditor.
 * تتمثل مسؤوليتها الوحيدة في استخراج النص الخام (raw text) من مختلف أنواع الملفات،
 * تاركةً مهمة التصنيف والتنسيق لخط أنابيب المعالجة الرئيسي في التطبيق.
 * هذا يضمن أن استيراد ملف يتبع نفس منطق لصق النص تمامًا.
 */

// استيراد الخدمات الأساسية التي يعتمد عليها المحرر المتقدم
// نفترض أن fileReaderService هو الواجهة الموحدة لقراءة (txt, docx)
// و ocrService يحتوي على المنطق المتقدم لمعالجة PDF
import { fileReaderService } from './services/fileReaderService.js';
import { processPDFWithTesseract } from './services/ocrService.js'; // افتراض وجود هذا الملف

/**
 * يعالج قائمة من كائنات الملفات (Files) ويعيد محتواها النصي الخام مدمجًا في سلسلة نصية واحدة.
 * هذه هي نقطة الدخول لعملية استيراد الملفات، حيث تقوم بإعداد النص لتمريره
 * إلى نظام التصنيف والتنسيق في المحرر.
 *
 * @param {FileList|Array<File>} files - قائمة الملفات التي اختارها المستخدم.
 * @returns {Promise<{rawText: string, isPDF: boolean}>} - كائن يحتوي على النص الخام المستخرج
 * وما إذا كان المصدر ملف PDF، وهي معلومة مفيدة لمسار المعالGجة.
 */
export const processImportedFiles = async (files) => {
  const allTexts = [];
  let isPDFSource = false; // تتبع ما إذا كان أي من الملفات هو PDF

  // تحويل FileList إلى مصفوفة للتعامل معها بسهولة
  for (const file of Array.from(files)) {
    const fileName = file.name.toLowerCase();
    let textContent = '';

    try {
      // التعامل مع ملفات PDF بشكل خاص باستخدام مسار OCR المتقدم المذكور في الكود المصدري
      if (fileName.endsWith('.pdf')) {
        console.log(`[FileProcessor] استخدام مسار OCR المتقدم للملف: ${file.name}`);
        isPDFSource = true;
        // استدعاء الدالة المخصصة لمعالجة PDF مع Tesseract
        textContent = await processPDFWithTesseract(file);
        
      } else {
        // لجميع الأنواع الأخرى المدعومة (مثل txt, docx), نستخدم خدمة القراءة الموحدة
        console.log(`[FileProcessor] استخدام القارئ القياسي للملف: ${file.name}`);
        textContent = await fileReaderService.extractTextFromFile(file);
      }

      // إضافة المحتوى المستخرج فقط إذا كان يحتوي على نص
      if (textContent && textContent.trim()) {
        allTexts.push(textContent.trim());
      }

    } catch (error) {
      // في حالة فشل معالجة ملف، نسجل الخطأ وننتقل إلى الملف التالي
      console.error(`[FileProcessor] فشل معالجة الملف "${file.name}":`, error);
      // يمكن إضافة إشعار للمستخدم هنا بأن ملفًا معينًا قد فشل
      continue;
    }
  }

  // دمج النصوص من جميع الملفات مع فواصل أسطر مزدوجة.
  // هذا يساعد المصنف على التمييز بين محتويات الملفات المختلفة إذا تم استيراد أكثر من ملف.
  const rawText = allTexts.join('\n\n');

  return { rawText, isPDF: isPDFSource };
};
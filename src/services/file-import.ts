import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";

/** Extract plain text from File (.txt, .docx, .pdf) */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "txt") return await file.text();

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }

  if (ext === "pdf") {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = __PDF_WORKER__;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
    let collected = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      const items = textContent.items ?? [];
      const text = items.map((i: any) => i.str).join(" ").trim();

      if (text.length > 20) {
        collected += text + "\n";
      } else {
        // Likely image page – OCR
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const worker = await createWorker("ara"); // Arabic lang
        const { data: { text: ocrText } } = await worker.recognize(canvas);
        await worker.terminate();
        collected += (ocrText ?? "") + "\n";
      }
    }
    return collected;
  }

  throw new Error("Unsupported file type");
}
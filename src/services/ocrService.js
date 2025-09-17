/**
 * PDF → images (per page) → OCR (Tesseract) → plain text.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function processPDFWithTesseract(file) {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const { TesseractWorker } = await import("./tesseractService.js");

  // pdfjs need a workerSrc (the bundled version works fine)
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  // 1. Load PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pagesText = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // high res for OCR

    // a canvas to render the page
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;

    // b) OCR via Tesseract
    const imgData = canvas.toDataURL("image/png");
    const text = await TesseractWorker.recognizeToString(imgData, {
      lang: "ara+eng", // arabic & english
    });
    pagesText.push(text);
  }

  return pagesText.join("\n\n");
}

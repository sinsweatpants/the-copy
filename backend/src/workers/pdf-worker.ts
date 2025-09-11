import { Worker } from 'bullmq';
import puppeteer from 'puppeteer';
import logger from '../logger/enhanced-logger.js';

const connection = {
    url: process.env.REDIS_URL,
};

const worker = new Worker('pdf-export-queue', async (job) => {
    const { html, title = "screenplay", userId } = job.data;
    logger.info({ job: job.id, userId }, "Processing PDF export job");

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        const style = `
          <style>
            @page { size: A4; margin: 1in 1in 1in 1.5in; }
            html, body { font-family: system-ui, sans-serif; }
            body { direction: rtl; }
            .screenplay-page { padding: 0; }
            .action { margin: 0.08in 0; text-align: right; }
            .dialogue { margin-right: 1.5in; margin-left: 1.5in; text-align: center; margin-top: 0.06in; margin-bottom: 0.06in; }
            .character { font-weight: 700; text-align: center; }
            .parenthetical { text-align: center; font-style: italic; }
            .transition { text-align: center; margin: 0.12in 0; }
            .scene-header-line1 { display: flex; justify-content: space-between; margin: 0.2in 0 0 0; font-weight: bold; }
            .scene-header-location { text-align: center; margin-top: 0.05in; font-weight: bold; text-decoration: underline; }
            .basmala { text-align: left; margin: 0.2in 0; font-weight: bold; }
          </style>
        `;

        await page.setContent(`
          <!doctype html>
          <html lang="ar" dir="rtl">
            <head><meta charset="utf-8"/>${style}</head>
            <body>
              <div class="screenplay-page">
                ${html}
              </div>
            </body>
          </html>
        `, { waitUntil: "networkidle0" });

        const pdf = await page.pdf({
          format: "A4",
          margin: { top: "1in", bottom: "1in", left: "1in", right: "1.5in" },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: `<div style="font-size:8px; width:100%; padding:0 1in; text-align:center; direction:rtl;"></div>`,
          footerTemplate: `
            <div style="font-size:10px; width:100%; padding:0 1in; direction:rtl;">
              <div style="text-align:center; width:100%;">
                <span class="pageNumber"></span> / <span class="totalPages"></span>
              </div>
            </div>`,
        });

        await browser.close();

        // Here you would typically save the PDF to a storage service (like S3)
        // and notify the user, for example via websockets or email.
        // For this example, we'll just log that it's done.
        logger.info({ job: job.id, userId, title }, "PDF generated successfully.");

        // You can return a result, which gets stored in the job object.
        return { success: true, title };

    } catch (error: any) {
        logger.error({ job: job.id, error: error.message }, "PDF export job failed");
        throw error; // This will mark the job as failed
    }
}, { connection });

worker.on('completed', (job) => {
  logger.info({ job: job.id }, `Job completed successfully`);
});

worker.on('failed', (job, err) => {
  if (job) {
    logger.error({ job: job.id, error: err.message }, `Job failed`);
  } else {
    logger.error({ error: err.message }, `Job failed with no job object`);
  }
});

logger.info("PDF worker started");

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
  Job: class {},
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn(),
    close: jest.fn(),
  }),
}));

test('puppeteer is invoked with --no-sandbox', async () => {
  const puppeteer = await import('puppeteer');
  const { launchPdfBrowser } = await import('../workers/pdf-worker.js');

  await launchPdfBrowser();

  expect((puppeteer as any).launch).toHaveBeenCalledWith(
    expect.objectContaining({
      args: expect.arrayContaining(['--no-sandbox', '--disable-setuid-sandbox']),
    }),
  );
});

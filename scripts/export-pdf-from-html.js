'use strict';

/**
 * Export PDF HTML sources to api/_private/pdfs/ via Playwright.
 * Usage: node scripts/export-pdf-from-html.js
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'api', '_private', 'pdfs');
const SAMPLES_DIR = path.join(ROOT, 'assets', 'samples');

const SOURCES = [
  {
    html: path.join(ROOT, 'docs', 'pdf-source', 'beginner-personalas-hr.html'),
    pdf: path.join(OUT_DIR, 'beginner-guide.pdf')
  },
  {
    html: path.join(ROOT, 'docs', 'pdf-source', 'advanced-personalas-hr.html'),
    pdf: path.join(OUT_DIR, 'advanced-guide.pdf')
  },
  {
    html: path.join(ROOT, 'docs', 'pdf-source', 'sample-kickoff-excerpt.html'),
    pdf: path.join(SAMPLES_DIR, 'prompt-anatomy-hiring-kickoff-sample.pdf')
  },
  {
    html: path.join(ROOT, 'docs', 'pdf-source', 'sample-advanced-scorecard-excerpt.html'),
    pdf: path.join(SAMPLES_DIR, 'prompt-anatomy-advanced-scorecard-sample.pdf')
  }
];

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const item of SOURCES) {
    if (!fs.existsSync(item.html)) {
      console.warn('Skip missing:', item.html);
      continue;
    }
    const fileUrl = 'file:///' + item.html.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    // Block until web fonts (Inter, JetBrains Mono) have loaded — otherwise
    // the PDF can be exported mid-swap from system fallback fonts, breaking
    // the typography contract documented in docs/pdf-source/README.md.
    await page.evaluate(async () => {
      if (document.fonts && typeof document.fonts.ready === 'object') {
        await document.fonts.ready;
      }
    });
    await page.pdf({
      path: item.pdf,
      format: 'Letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('Wrote', path.relative(ROOT, item.pdf));
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

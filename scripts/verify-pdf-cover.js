'use strict';

/**
 * Renders PDF pages to PNG for cover + optional PREVIEW watermarked samples.
 * Preview page indices from config/sot.json (previewPages per guide).
 * Usage:
 *   node scripts/verify-pdf-cover.js
 *   node scripts/verify-pdf-cover.js --preview
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');
const { loadSot, getPreviewPages } = require('./pdf-preview-config');

const ROOT = path.resolve(__dirname, '..');
const sot = loadSot();

function pdfSourcePages(label) {
  const guide = sot && sot.pdfGuides && sot.pdfGuides[label];
  if (guide && typeof guide.pages === 'number') return guide.pages;
  return label === 'beginner' ? 16 : 24;
}

const PDFS = [
  {
    label: 'beginner',
    pdf: path.join(ROOT, 'api', '_private', 'pdfs', 'beginner-guide.pdf'),
    coverOut: path.join(ROOT, 'scripts', 'pdf-cover-beginner.png'),
    previewOutDir: path.join(ROOT, 'assets', 'pdf-covers'),
    previewPrefix: 'beginner',
    previewPages: getPreviewPages(sot, 'beginner'),
    expectedPages: pdfSourcePages('beginner')
  },
  {
    label: 'advanced',
    pdf: path.join(ROOT, 'api', '_private', 'pdfs', 'advanced-guide.pdf'),
    coverOut: path.join(ROOT, 'scripts', 'pdf-cover-advanced.png'),
    previewOutDir: path.join(ROOT, 'assets', 'pdf-covers'),
    previewPrefix: 'advanced',
    previewPages: getPreviewPages(sot, 'advanced'),
    expectedPages: pdfSourcePages('advanced')
  }
];

const RENDER_PREVIEWS = process.argv.includes('--preview');

function buildHtml(dataUri, pageIndex, watermark) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#888;">
<canvas id="c"></canvas>
<script type="module">
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
const pdf = await pdfjs.getDocument(${JSON.stringify(dataUri)}).promise;
const page = await pdf.getPage(${pageIndex});
const viewport = page.getViewport({ scale: 1.2 });
const canvas = document.getElementById('c');
canvas.width = viewport.width;
canvas.height = viewport.height;
await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
const wm = ${JSON.stringify(watermark || '')};
if (wm) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.fillStyle = 'rgba(16, 59, 90, 0.16)';
  ctx.font = 'bold 84px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 6);
  for (let y = -canvas.height; y <= canvas.height; y += 220) {
    for (let x = -canvas.width; x <= canvas.width; x += 374) {
      ctx.fillText(wm, x, y);
    }
  }
  ctx.restore();
}
window.__rendered = true;
</script></body></html>`;
}

async function renderToFile(page, dataUri, outputPath, pageIndex, watermark) {
  await page.setContent(buildHtml(dataUri, pageIndex, watermark), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__rendered === true, { timeout: 60000 });
  const canvas = page.locator('#c');
  await canvas.screenshot({ path: outputPath });
}

function buildAssertHtml(dataUri) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script type="module">
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
const pdf = await pdfjs.getDocument(${JSON.stringify(dataUri)}).promise;
const pageCount = pdf.numPages;
const footerHits = [];
for (let i = 1; i <= pageCount; i++) {
  const page = await pdf.getPage(i);
  // pdf.js may split a URL across multiple text items at glyph/positioning
  // boundaries (e.g. "www", ".", "promptanatomy", ".", "app"). Join without
  // separator and strip whitespace so the substring match is robust to
  // typographic kerning runs.
  const joined = (await page.getTextContent()).items.map((it) => it.str).join('');
  const compact = joined.replace(/\\s+/g, '');
  footerHits.push(compact.includes('www.promptanatomy.app'));
}
window.__assertResult = { pageCount, footerHits };
</script></body></html>`;
}

async function assertPdfShape(page, dataUri, label, expectedPages) {
  await page.setContent(buildAssertHtml(dataUri), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__assertResult, { timeout: 60000 });
  const result = await page.evaluate(() => window.__assertResult);
  const errors = [];
  if (result.pageCount !== expectedPages) {
    errors.push(`${label}: expected ${expectedPages} pages, got ${result.pageCount}`);
  }
  const missingFooters = result.footerHits
    .map((ok, idx) => (ok ? null : idx + 1))
    .filter((n) => n !== null);
  if (missingFooters.length > 0) {
    errors.push(`${label}: footer "www.promptanatomy.app" missing on page(s) ${missingFooters.join(', ')}`);
  }
  if (errors.length === 0) {
    console.log(`${label}: ${result.pageCount} pages, footer URL on every page OK`);
  }
  return errors;
}

function pruneStalePreviews(dir, prefix, keepPageNums) {
  if (!fs.existsSync(dir)) return;
  const keep = new Set(keepPageNums.map((n) => `${prefix}-p${n}.png`));
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(prefix + '-p') && name.endsWith('.png') && !keep.has(name)) {
      fs.unlinkSync(path.join(dir, name));
      console.log('Removed stale preview', name);
    }
  }
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 900, height: 1200 } });
  const page = await ctx.newPage();
  const assertionErrors = [];

  for (const item of PDFS) {
    if (!fs.existsSync(item.pdf)) {
      console.warn(`Skipping ${item.label}: ${item.pdf} not found. Run npm run pdf:export first.`);
      continue;
    }
    const dataUri = `data:application/pdf;base64,${fs.readFileSync(item.pdf).toString('base64')}`;

    const errs = await assertPdfShape(page, dataUri, item.label, item.expectedPages);
    assertionErrors.push(...errs);

    await renderToFile(page, dataUri, item.coverOut, 1, '');
    console.log('Cover ->', path.relative(ROOT, item.coverOut));

    const publicCover = path.join(item.previewOutDir, `${item.previewPrefix}.png`);
    fs.copyFileSync(item.coverOut, publicCover);
    console.log('Public cover ->', path.relative(ROOT, publicCover));

    if (!RENDER_PREVIEWS) continue;
    if (!fs.existsSync(item.previewOutDir)) fs.mkdirSync(item.previewOutDir, { recursive: true });
    pruneStalePreviews(item.previewOutDir, item.previewPrefix, item.previewPages);
    for (const pageNum of item.previewPages) {
      const out = path.join(item.previewOutDir, `${item.previewPrefix}-p${pageNum}.png`);
      await renderToFile(page, dataUri, out, pageNum, 'PREVIEW');
      console.log(`Preview p${pageNum} ->`, path.relative(ROOT, out));
    }
  }

  await browser.close();

  if (assertionErrors.length > 0) {
    console.error('\nPDF verification failed:');
    for (const e of assertionErrors) console.error(' -', e);
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

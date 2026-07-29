'use strict';

/**
 * Capture DS v2.0 visual baseline PNGs (1440 / 768 / 375).
 * Usage: npx serve -s . -l 3000  (or pass BASE_URL)
 *        node scripts/capture-ds-baseline.js
 */

const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'qa', 'screenshots', 'v2.0-baseline');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const WIDTHS = [1440, 768, 375];
const PAGES = [
  { path: '/en/', name: 'en' },
  { path: '/success.html', name: 'success' },
  { path: '/terms.html', name: 'terms' },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const p of PAGES) {
      const url = BASE.replace(/\/$/, '') + p.path;
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(800);
      // Guard against accidental /en/en/... redirect loops from misconfigured static servers
      if (/\/en\/en\//.test(page.url())) {
        throw new Error('Redirect loop detected at ' + page.url());
      }
      const file = path.join(OUT, p.name + '-' + w + '.png');
      await page.screenshot({ path: file, fullPage: true, type: 'png' });
      const kb = Math.round(fs.statSync(file).size / 1024);
      console.log('Wrote', path.relative(ROOT, file), kb + 'KB');
    }
  }

  await browser.close();
  console.log('Baseline capture complete →', OUT);
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

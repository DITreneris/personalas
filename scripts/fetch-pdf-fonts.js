'use strict';

/**
 * Fetches the .woff2 font files referenced by docs/pdf-source/pdf-print.css
 * @font-face declarations and writes them into docs/pdf-source/fonts/.
 *
 * Result: `npm run pdf:export` no longer needs egress to fonts.googleapis.com —
 * Playwright resolves every font from local files via the file:// URL.
 *
 * Usage:
 *   node scripts/fetch-pdf-fonts.js          # idempotent (skips existing files)
 *   node scripts/fetch-pdf-fonts.js --force  # re-download even if files exist
 *
 * The Google Fonts CSS2 API serves .woff2 URLs only when the User-Agent looks
 * like a modern browser. We send a recent Chrome UA so we get the woff2 variants
 * (not woff, ttf, or older formats).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'docs', 'pdf-source', 'fonts');

const CSS_URL =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;600;700;800' +
  '&family=JetBrains+Mono:wght@400;600' +
  '&display=swap';

// Chrome 124 on Windows — recent enough to be served woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FORCE = process.argv.includes('--force');

// Map (family, weight) -> the filename pdf-print.css expects in ./fonts/.
const TARGETS = [
  { family: 'Inter', weight: 400, file: 'Inter-Regular.woff2' },
  { family: 'Inter', weight: 600, file: 'Inter-SemiBold.woff2' },
  { family: 'Inter', weight: 700, file: 'Inter-Bold.woff2' },
  { family: 'Inter', weight: 800, file: 'Inter-ExtraBold.woff2' },
  { family: 'JetBrains Mono', weight: 400, file: 'JetBrainsMono-Regular.woff2' },
  { family: 'JetBrains Mono', weight: 600, file: 'JetBrainsMono-SemiBold.woff2' }
];

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          httpsGet(res.headers.location, headers).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function fetchCss() {
  const buf = await httpsGet(CSS_URL, {
    'User-Agent': UA,
    Accept: 'text/css,*/*;q=0.1'
  });
  return buf.toString('utf8');
}

// Google Fonts CSS2 splits each (family, weight) into many @font-face blocks,
// one per unicode-range subset (cyrillic, greek, vietnamese, latin-ext, latin).
// Each block is preceded by a /* <subset-name> */ comment. We prefer `latin`
// (US English) and fall back to `latin-ext` for European diacritics — anything
// else (cyrillic, greek, etc.) is a wrong choice for HR PDFs.
const SUBSET_PRIORITY = { latin: 1, 'latin-ext': 2 };

function parseCss(css) {
  const out = [];
  // Match optional `/* subset */` comment immediately before each @font-face.
  const blockRe = /(?:\/\*\s*([\w-]+)\s*\*\/\s*)?@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(css)) !== null) {
    const subset = (m[1] || '').toLowerCase();
    const body = m[2];
    const family = (body.match(/font-family:\s*['"]?([^;'"]+)['"]?\s*;/) || [])[1];
    const weightStr = (body.match(/font-weight:\s*(\d+)/) || [])[1];
    const urlMatch = body.match(/src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/);
    if (!family || !weightStr || !urlMatch) continue;
    out.push({
      family: family.trim(),
      weight: Number(weightStr),
      subset,
      url: urlMatch[1].replace(/^['"]|['"]$/g, '')
    });
  }
  return out;
}

function pickFace(faces, family, weight) {
  const candidates = faces.filter((f) => f.family === family && f.weight === weight);
  if (!candidates.length) return null;
  // Prefer `latin`; then `latin-ext`; then whichever appears last (CSS2 puts
  // `latin` at the bottom, but if subset comments are stripped we still get
  // something usable).
  candidates.sort((a, b) => {
    const pa = SUBSET_PRIORITY[a.subset] || 99;
    const pb = SUBSET_PRIORITY[b.subset] || 99;
    return pa - pb;
  });
  return candidates[0];
}

(async () => {
  if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

  const css = await fetchCss();
  const faces = parseCss(css);
  if (!faces.length) {
    console.error('Could not parse any @font-face blocks from Google Fonts CSS.');
    console.error('First 200 chars:\n' + css.slice(0, 200));
    process.exit(1);
  }

  let written = 0;
  let skipped = 0;

  for (const target of TARGETS) {
    const dest = path.join(FONTS_DIR, target.file);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      console.log('skip (exists):', target.file);
      skipped += 1;
      continue;
    }
    const match = pickFace(faces, target.family, target.weight);
    if (!match) {
      console.error('MISS:', target.family, target.weight, '— not in Google Fonts response');
      process.exit(1);
    }
    const bin = await httpsGet(match.url, { 'User-Agent': UA });
    fs.writeFileSync(dest, bin);
    console.log(
      'wrote',
      target.file,
      '(' + Math.round(bin.length / 1024) + ' kB, subset=' + (match.subset || 'unknown') + ')'
    );
    written += 1;
  }

  console.log('\nDone. wrote=' + written + ' skipped=' + skipped + ' total=' + TARGETS.length);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

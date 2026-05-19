'use strict';

/**
 * Creates placeholder cover PNGs when PDF export is not available (CI / first clone).
 * Usage: node scripts/generate-pdf-cover-placeholders.js
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'pdf-covers');

const COVERS = [
  { name: 'beginner.png', title: 'Beginner', sub: 'HR Hiring Guide · 16 pages' },
  { name: 'advanced.png', title: 'Advanced', sub: 'HR Hiring Guide · 32 pages' }
];

const W = 734;
const H = 950;

async function makeCover(spec) {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#103b5a"/>
  <rect x="0" y="0" width="8" height="100%" fill="#cfa73a"/>
  <text x="48" y="120" fill="#cfa73a" font-family="Arial,sans-serif" font-size="14" font-weight="700">PROMPT ANATOMY</text>
  <text x="48" y="220" fill="#fff" font-family="Arial,sans-serif" font-size="42" font-weight="800">${spec.title}</text>
  <text x="48" y="280" fill="#E2E8F0" font-family="Arial,sans-serif" font-size="22">${spec.sub}</text>
  <text x="48" y="${H - 80}" fill="#cfa73a" font-family="Arial,sans-serif" font-size="16">promptanatomy.help</text>
  <text x="48" y="${H - 48}" fill="#A0AEC0" font-family="Arial,sans-serif" font-size="14">www.promptanatomy.app</text>
</svg>`;
  const outPath = path.join(OUT, spec.name);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log('Wrote', path.relative(ROOT, outPath));
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  for (const c of COVERS) await makeCover(c);
  for (const prefix of ['beginner', 'advanced']) {
    for (const p of [2, 3, 4]) {
      const src = path.join(OUT, `${prefix}.png`);
      const dest = path.join(OUT, `${prefix}-p${p}.png`);
      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        await sharp(src).resize(W, H).png().toFile(dest);
        console.log('Wrote', path.relative(ROOT, dest));
      }
    }
  }
})();

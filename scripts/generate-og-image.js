/**
 * One-off / CI: generate images/og-default.png (1200×630) from SVG via sharp.
 * Run: node scripts/generate-og-image.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Install sharp: npm install sharp --save-dev');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'images', 'og-default.png');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0b1320"/>
      <stop offset="55%" style="stop-color:#103b5a"/>
      <stop offset="100%" style="stop-color:#1f5e88"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="60" y="60" width="6" height="510" fill="#cfa73a"/>
  <text x="600" y="240" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="56" font-weight="700">HR hiring system</text>
  <text x="600" y="320" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="56" font-weight="700">AI prompts for US teams</text>
  <text x="600" y="410" text-anchor="middle" fill="#cfe1ee" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="28" font-weight="500">10 prompts · ChatGPT · Claude · Gemini</text>
  <text x="600" y="490" text-anchor="middle" fill="#cfa73a" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="22" font-weight="600">Prompt Anatomy · Series No. 3</text>
</svg>`;

async function run() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(OUT);
  console.log('Wrote', OUT);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

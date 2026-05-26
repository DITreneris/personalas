/**
 * One-off / CI: generate images/og-default-v3.png (1200×630) from SVG via sharp.
 * Copy from config/sot.json → marketing.seo.ogImage
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
const OUT = path.join(ROOT, 'images', 'og-default-v3.png');
const SOT_PATH = path.join(ROOT, 'config', 'sot.json');

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadOgImageCopy() {
  const raw = fs.readFileSync(SOT_PATH, 'utf8');
  const sot = JSON.parse(raw);
  const og = sot.marketing && sot.marketing.seo && sot.marketing.seo.ogImage;
  const keys = ['line1', 'line2', 'subline'];
  for (const k of keys) {
    if (!og || !og[k] || !String(og[k]).trim()) {
      throw new Error('config/sot.json: marketing.seo.ogImage.' + k + ' is required');
    }
  }
  return {
    line1: og.line1.trim(),
    line2: og.line2.trim(),
    subline: og.subline.trim(),
  };
}

function buildSvg(copy) {
  const l1 = escapeXml(copy.line1);
  const l2 = escapeXml(copy.line2);
  const sub = escapeXml(copy.subline);
  return `<?xml version="1.0" encoding="UTF-8"?>
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
  <text x="600" y="230" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="46" font-weight="700">${l1}</text>
  <text x="600" y="295" text-anchor="middle" fill="#ffffff" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="46" font-weight="700">${l2}</text>
  <text x="600" y="390" text-anchor="middle" fill="#cfe1ee" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="26" font-weight="500">${sub}</text>
  <text x="600" y="490" text-anchor="middle" fill="#cfa73a" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="22" font-weight="600">Prompt Anatomy</text>
</svg>`;
}

async function run() {
  const copy = loadOgImageCopy();
  const svg = buildSvg(copy);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(OUT);
  console.log('Wrote', OUT);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

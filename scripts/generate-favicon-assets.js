/**
 * Generate favicon.ico and apple-touch-icon.png from favicon.svg (sharp + to-ico).
 * Run: npm run generate:favicon
 */
'use strict';

const fs = require('fs');
const path = require('path');

let sharp;
let toIco;
try {
  sharp = require('sharp');
  toIco = require('to-ico');
} catch (e) {
  console.error('Install devDependencies: npm install');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const SVG_PATH = path.join(ROOT, 'favicon.svg');
const ICO_PATH = path.join(ROOT, 'favicon.ico');
const TOUCH_PATH = path.join(ROOT, 'apple-touch-icon.png');

async function run() {
  const svg = fs.readFileSync(SVG_PATH);
  const png16 = await sharp(svg).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svg).resize(32, 32).png().toBuffer();
  fs.writeFileSync(ICO_PATH, await toIco([png16, png32]));
  await sharp(svg).resize(180, 180).png().toFile(TOUCH_PATH);
  console.log('Wrote', ICO_PATH);
  console.log('Wrote', TOUCH_PATH);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

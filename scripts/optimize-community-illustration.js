/**
 * Optimize local master 02.png (gitignored; do not commit) → assets/community/
 * copy-paste-workflow variants (WebP + PNG).
 * Run: node scripts/optimize-community-illustration.js
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
const SRC = path.join(ROOT, '02.png');
const OUT_DIR = path.join(ROOT, 'assets', 'community');
const WEBP_WIDTHS = [800, 1200, 1672];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Missing source:', SRC);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const meta = await sharp(SRC).metadata();
  console.log('source', meta.width + 'x' + meta.height);

  for (const w of WEBP_WIDTHS) {
    const name = w === 1672 ? 'copy-paste-workflow.webp' : 'copy-paste-workflow-' + w + 'w.webp';
    await sharp(SRC)
      .resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(OUT_DIR, name));
  }

  await sharp(SRC)
    .resize(1200, null, { withoutEnlargement: true })
    .png({ compressionLevel: 9, quality: 80, palette: true, colors: 256, effort: 10 })
    .toFile(path.join(OUT_DIR, 'copy-paste-workflow.png'));

  for (const f of fs.readdirSync(OUT_DIR).sort()) {
    const st = fs.statSync(path.join(OUT_DIR, f));
    console.log(f, Math.round(st.size / 1024) + 'KB');
  }
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});

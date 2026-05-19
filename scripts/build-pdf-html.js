'use strict';

/**
 * Validates PDF HTML sources: page count and branding strings.
 * Usage: node scripts/build-pdf-html.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  { file: 'docs/pdf-source/beginner-personalas-hr.html', pages: 16 },
  { file: 'docs/pdf-source/advanced-personalas-hr.html', pages: 32 }
];

let failed = 0;

for (const spec of SOURCES) {
  const full = path.join(ROOT, spec.file);
  if (!fs.existsSync(full)) {
    console.error('Missing:', spec.file);
    failed += 1;
    continue;
  }
  const html = fs.readFileSync(full, 'utf8');
  const count = (html.match(/<section class="page/g) || []).length;
  const footers = (html.match(/www\.promptanatomy\.app/g) || []).length;
  const helpRefs = (html.match(/promptanatomy\.help/g) || []).length;

  if (count !== spec.pages) {
    console.error(`${spec.file}: expected ${spec.pages} .page blocks, found ${count}`);
    failed += 1;
  } else {
    console.log(`${spec.file}: ${count} pages OK`);
  }
  if (footers < spec.pages) {
    console.error(`${spec.file}: expected footer on every page (www.promptanatomy.app)`);
    failed += 1;
  }
  if (helpRefs < 2) {
    console.error(`${spec.file}: expected promptanatomy.help on cover + close`);
    failed += 1;
  }
}

if (failed) process.exit(1);
console.log('PDF HTML validation passed.');

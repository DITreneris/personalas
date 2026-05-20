'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const templatePath = path.join(ROOT, 'templates', 'index-lt.html');
const fragmentPath = path.join(ROOT, 'scripts', 'pdf-guides-section.fragment.html');

const template = fs.readFileSync(templatePath, 'utf8');
const fragment = fs.readFileSync(fragmentPath, 'utf8');

const fragMatch = fragment.match(
  /<section class="pdf-guides"[^>]*>([\s\S]*?)<\/section>\s*\n\s*<dialog id="pdfPreviewDialog"/
);
if (!fragMatch) {
  console.error('Could not extract pdf-guides inner from fragment');
  process.exit(1);
}
const inner = fragMatch[1];

const tplMatch = template.match(
  /<section class="pdf-guides"[^>]*>[\s\S]*?<\/section>\s*\n\s*<dialog id="pdfPreviewDialog"/
);
if (!tplMatch) {
  console.error('Could not find pdf-guides section in template');
  process.exit(1);
}

const replacement =
  '<section class="pdf-guides" id="pdf-guides" aria-labelledby="pdf-guides-title">' +
  inner +
  '</section>\n\n\n        <dialog id="pdfPreviewDialog"';

const updated = template.replace(tplMatch[0], replacement);
fs.writeFileSync(templatePath, updated);
console.log('Replaced #pdf-guides section from pdf-guides-section.fragment.html');

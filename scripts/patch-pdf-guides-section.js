'use strict';

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'templates', 'index-lt.html');
let html = fs.readFileSync(templatePath, 'utf8');

const start = html.indexOf('<section class="pdf-guides" id="pdf-guides"');
const end = html.indexOf('<section class="community" id="community"');
if (start < 0 || end < 0) {
  console.error('Could not find pdf-guides or community section');
  process.exit(1);
}

const replacement = fs.readFileSync(path.join(__dirname, 'pdf-guides-section.fragment.html'), 'utf8');
html = html.slice(0, start) + replacement + html.slice(end);
fs.writeFileSync(templatePath, html, 'utf8');
console.log('Patched templates/index-lt.html pdf-guides section');

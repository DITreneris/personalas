'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SOT_PATH = path.join(ROOT, 'config', 'sot.json');
const DEFAULT_PREVIEW_PAGES = [2, 3, 4];

function loadSot() {
  return JSON.parse(fs.readFileSync(SOT_PATH, 'utf8'));
}

function getPreviewPages(sot, guideKey) {
  const guide = sot && sot.pdfGuides && sot.pdfGuides[guideKey];
  if (guide && Array.isArray(guide.previewPages) && guide.previewPages.length > 0) {
    return guide.previewPages;
  }
  return DEFAULT_PREVIEW_PAGES.slice();
}

module.exports = {
  loadSot,
  getPreviewPages,
  DEFAULT_PREVIEW_PAGES
};

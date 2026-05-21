'use strict';

const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SOT_PATH = path.join(ROOT, 'config', 'sot.json');
/** Must match on-disk /assets/pdf-covers/{guide}-p{N}.png and generator.js fallbacks. */
const DEFAULT_PREVIEW_PAGES_BY_GUIDE = {
  beginner: [6, 8, 9],
  advanced: [10, 15, 17]
};

function loadSot() {
  return JSON.parse(fs.readFileSync(SOT_PATH, 'utf8'));
}

function getPreviewPages(sot, guideKey) {
  const guide = sot && sot.pdfGuides && sot.pdfGuides[guideKey];
  if (guide && Array.isArray(guide.previewPages) && guide.previewPages.length > 0) {
    return guide.previewPages;
  }
  const fallback = DEFAULT_PREVIEW_PAGES_BY_GUIDE[guideKey];
  return Array.isArray(fallback) ? fallback.slice() : [];
}

module.exports = {
  loadSot,
  getPreviewPages,
  DEFAULT_PREVIEW_PAGES_BY_GUIDE
};

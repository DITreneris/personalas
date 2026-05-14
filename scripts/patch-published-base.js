/**
 * Replace one public URL prefix with another in root HTML and SEO text files.
 * Use when the built default host (see PATCH_FROM_PREFIX) must match another deploy URL.
 *
 * Examples:
 * - Vercel preview: PATCH_FROM_PREFIX=https://promptanatomy.help PUBLISHED_SITE_BASE=https://xxx.vercel.app
 * - Legacy GitHub Pages: match PATCH_FROM_PREFIX to what `npm run build` emitted, then set PUBLISHED_SITE_BASE.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DEFAULT_FROM = (process.env.PATCH_FROM_PREFIX || 'https://promptanatomy.help').replace(/\/+$/, '');

function main() {
  const toRaw = process.env.PUBLISHED_SITE_BASE || '';
  const to = toRaw.replace(/\/+$/, '');
  const from = DEFAULT_FROM;
  if (!to || to === from) {
    console.log('patch-published-base: skip (same or empty PUBLISHED_SITE_BASE)');
    return;
  }
  const files = ['index.html', 'privatumas.html', 'robots.txt', 'sitemap.xml'];
  for (const rel of files) {
    const fp = path.join(ROOT, rel);
    if (!fs.existsSync(fp)) continue;
    let s = fs.readFileSync(fp, 'utf8');
    const next = s.split(from).join(to);
    if (next !== s) {
      fs.writeFileSync(fp, next, 'utf8');
      console.log('patch-published-base: updated', rel);
    }
  }
}

main();

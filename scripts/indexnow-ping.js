/**
 * IndexNow ping — submits sitemap URLs (or a diff of changed URLs) to the
 * IndexNow API endpoint shared by Bing, Yandex, and several AI-search backends.
 *
 * Usage:
 *   node scripts/indexnow-ping.js                 # ping every URL in sitemap.xml
 *   node scripts/indexnow-ping.js --since-head    # ping only URLs touched by HEAD commit
 *   INDEXNOW_DRY_RUN=1 node scripts/indexnow-ping.js  # log what would be sent
 *
 * The site key is the same identifier hosted at /{INDEXNOW_KEY}.txt by the
 * build script (see scripts/build-locale-pages.js writeIndexNowKey). Keep both
 * in sync if the key is ever rotated.
 *
 * IndexNow protocol: https://www.indexnow.org/documentation
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const INDEXNOW_KEY = '7a4b9e2c8f1d4a3b9c6e5d2a1f8b7c4d';
const INDEXNOW_HOST = 'api.indexnow.org';
const INDEXNOW_PATH = '/IndexNow';
const DRY_RUN = process.env.INDEXNOW_DRY_RUN === '1';

function readSitemapUrls() {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    throw new Error('sitemap.xml not found at ' + sitemapPath + ' — run npm run build first');
  }
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const locs = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const u = m[1].trim();
    if (u) locs.push(u);
  }
  return locs;
}

/**
 * Map a changed source file (from git diff) to one or more public URLs. Mirrors
 * the entry table in buildSitemapXml so we only ping URLs whose content shifted.
 */
function fileToUrls(file, origin) {
  // Only sitemap-canonical URLs (no gateway redirects, no noindex success).
  const map = {
    'templates/index-lt.html': [origin + '/en/'],
    'templates/privacy.html': [origin + '/en/privacy.html'],
    'terms.html': [origin + '/terms.html'],
    'en/index.html': [origin + '/en/'],
    'en/privacy.html': [origin + '/en/privacy.html'],
    'config/sot.json': [origin + '/en/', origin + '/en/privacy.html', origin + '/terms.html'],
    'scripts/build-locale-pages.js': [origin + '/en/', origin + '/en/privacy.html', origin + '/terms.html'],
  };
  return map[file] || [];
}

function urlsChangedSinceHead(allUrls) {
  let changed;
  try {
    const out = execFileSync('git', ['diff', '--name-only', 'HEAD~1', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    changed = out.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
  } catch (_e) {
    console.warn('IndexNow: git diff failed — falling back to all sitemap URLs');
    return allUrls;
  }
  if (!changed.length) return [];
  const origin = new URL(allUrls[0]).origin;
  const set = new Set();
  changed.forEach(function (f) {
    fileToUrls(f.replace(/\\/g, '/'), origin).forEach(function (u) { set.add(u); });
  });
  return Array.from(set);
}

function postIndexNow(urlList) {
  if (!urlList.length) {
    console.log('IndexNow: no URLs to submit, exiting cleanly');
    return Promise.resolve({ status: 200, body: 'noop' });
  }
  const origin = new URL(urlList[0]).origin;
  const host = new URL(urlList[0]).host;
  const body = JSON.stringify({
    host: host,
    key: INDEXNOW_KEY,
    keyLocation: origin + '/' + INDEXNOW_KEY + '.txt',
    urlList: urlList,
  });

  if (DRY_RUN) {
    console.log('IndexNow DRY RUN — would POST to https://' + INDEXNOW_HOST + INDEXNOW_PATH);
    console.log(body);
    return Promise.resolve({ status: 200, body: 'dry-run' });
  }

  return new Promise(function (resolve, reject) {
    const req = https.request(
      {
        host: INDEXNOW_HOST,
        path: INDEXNOW_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'PromptAnatomy-IndexNow/1.0 (+https://promptanatomy.help/)',
        },
        timeout: 15000,
      },
      function (res) {
        let chunks = '';
        res.setEncoding('utf8');
        res.on('data', function (d) { chunks += d; });
        res.on('end', function () { resolve({ status: res.statusCode, body: chunks }); });
      }
    );
    req.on('timeout', function () { req.destroy(new Error('IndexNow request timed out')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const sinceHead = args.includes('--since-head');
  const allUrls = readSitemapUrls();
  const targets = sinceHead ? urlsChangedSinceHead(allUrls) : allUrls;
  console.log('IndexNow: submitting ' + targets.length + ' URL(s)' + (sinceHead ? ' (diff vs HEAD~1)' : ''));
  targets.forEach(function (u) { console.log('  - ' + u); });

  try {
    const res = await postIndexNow(targets);
    console.log('IndexNow response: status=' + res.status + ' body=' + (res.body || '(empty)'));
    if (res.status >= 400) {
      process.exit(1);
    }
  } catch (e) {
    console.error('IndexNow ping failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

main();

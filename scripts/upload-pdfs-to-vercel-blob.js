'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PDF_DIR = path.join(ROOT, 'api', '_private', 'pdfs');

const UPLOADS = [
  { file: 'beginner-guide.pdf', pathname: 'prompt-anatomy/pdfs/beginner-guide.pdf', envKey: 'PDF_BEGINNER_SOURCE_URL' },
  { file: 'advanced-guide.pdf', pathname: 'prompt-anatomy/pdfs/advanced-guide.pdf', envKey: 'PDF_ADVANCED_SOURCE_URL' }
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(ROOT, '.env'));
loadEnvFile(path.join(ROOT, '.env.local'));

async function main() {
  const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
  if (!token) {
    console.error('Missing BLOB_READ_WRITE_TOKEN in .env or .env.local');
    process.exit(1);
  }

  const { put } = require('@vercel/blob');
  const results = {};

  for (const item of UPLOADS) {
    const localPath = path.join(PDF_DIR, item.file);
    if (!fs.existsSync(localPath)) {
      console.error('Missing', localPath, '— run: npm run pdf:export');
      process.exit(1);
    }
    const body = fs.readFileSync(localPath);
    console.log('Uploading', item.file, '(' + Math.round(body.length / 1024) + ' kB)');
    const blob = await put(item.pathname, body, {
      access: 'private',
      contentType: 'application/pdf',
      allowOverwrite: true,
      token
    });
    results[item.envKey] = blob.url;
    console.log('  ', blob.url);
  }

  console.log('\n--- Vercel env (Production + Preview) ---\n');
  for (const item of UPLOADS) {
    console.log(item.envKey + '=' + results[item.envKey]);
  }
  console.log('\nBLOB_READ_WRITE_TOKEN: already in Vercel when Blob store is linked to the project.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

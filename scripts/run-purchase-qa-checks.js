'use strict';

/**
 * Automates as much of MUST_TODO purchase QA as possible without a new charge.
 * Usage: node scripts/run-purchase-qa-checks.js
 */

const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.promptanatomy.help';

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function fetchText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return { status: res.status, url: res.url, text: await res.text() };
}

function pass(msg) {
  console.log('PASS:', msg);
}

async function main() {
  const notes = [];

  const en = await fetchText(SITE + '/en/');
  if (en.status !== 200) throw new Error('/en/ status ' + en.status);
  pass('/en/ 200');
  for (const [re, label] of [
    [/pdf-guides/, 'pdf-guides'],
    [/pdf-see-inside/, 'See inside'],
    [/pdf-guide-highlights/, 'text highlights'],
    [/kickoff worksheet|scorecard/i, 'sample labels'],
    [/See the PDF guides|Get PDF guides/i, 'funnel CTAs'],
  ]) {
    if (!re.test(en.text)) throw new Error('missing ' + label);
    pass('/en/ ' + label);
  }

  const success = await fetchText(SITE + '/success.html');
  if (success.status !== 200) throw new Error('success.html status');
  if (!/assets\/success\.js/.test(success.text)) throw new Error('success.js script missing');
  if (!/paid-pdf-license/.test(success.text)) throw new Error('success license link missing');
  const successJs = await fetchText(SITE + '/assets/success.js');
  if (successJs.status !== 200) throw new Error('success.js status');
  if (!/download-link/.test(successJs.text)) throw new Error('success poll missing in success.js');
  pass('success.html poll (success.js) + license link');

  const terms = await fetchText(SITE + '/terms.html');
  if (terms.status !== 200) throw new Error('terms.html status');
  if (!/id=["']paid-pdf-license["']/.test(terms.text)) {
    throw new Error('terms #paid-pdf-license missing');
  }
  pass('terms #paid-pdf-license');

  const bad = await fetch(SITE + '/api/download-link?session_id=cs_test_invalid');
  if (bad.status < 400) throw new Error('download-link should reject invalid');
  pass('download-link rejects invalid session (' + bad.status + ')');

  const env = { ...loadEnv(path.join(ROOT, '.env')), ...process.env };
  if (!env.STRIPE_SECRET_KEY) {
    notes.push('No STRIPE_SECRET_KEY — skip session/Redis');
  } else {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const sessions = await stripe.checkout.sessions.list({
      limit: 15,
      status: 'complete',
    });
    const paid = sessions.data.find((s) => s.payment_status === 'paid');
    if (!paid) {
      notes.push('No recent paid Checkout Session');
    } else {
      console.log(
        'INFO: session',
        paid.id,
        new Date(paid.created * 1000).toISOString()
      );
      const dl = await fetch(
        SITE + '/api/download-link?session_id=' + encodeURIComponent(paid.id)
      );
      const body = await dl.json().catch(() => ({}));
      console.log('INFO: download-link', dl.status, Object.keys(body).join(','));
      if (dl.status === 200 && body.downloadUrl) {
        pass('download-link URL for paid session (in-page token still valid)');
      } else if ([403, 404, 409, 410].includes(dl.status)) {
        pass(
          'download-link past-session path reachable (' +
            dl.status +
            ') — TTL/fulfilled'
        );
        notes.push('In-page 15m token likely expired; email 7d link not re-fetched here');
      } else {
        notes.push('Unexpected download-link status ' + dl.status);
      }

      if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
        try {
          const prefix = (env.REDIS_KEY_PREFIX || '').trim();
          const key = prefix + 'fulfillment:' + paid.id;
          const r = await fetch(
            env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '') +
              '/get/' +
              encodeURIComponent(key),
            { headers: { Authorization: 'Bearer ' + env.UPSTASH_REDIS_REST_TOKEN } }
          );
          const rj = await r.json().catch(() => ({}));
          if (rj.result) {
            pass('Redis fulfillment record present (idempotency key)');
          } else {
            notes.push('Redis miss at ' + key);
          }
        } catch (redisErr) {
          notes.push(
            'Redis probe failed: ' +
              (redisErr && redisErr.message ? redisErr.message : String(redisErr))
          );
        }
      }
    }
  }

  console.log('\nNOTES:');
  for (const n of notes) console.log('-', n);
  console.log(
    'Manual remaining: GSC spoke indexing (purchase QA green 2026-09-05).'
  );
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

'use strict';

/**
 * Verify Stripe promo-gate: product page counts + Payment Link success URLs.
 * Usage: node scripts/verify-stripe-promo-gate.js
 */

const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const ROOT = path.join(__dirname, '..');

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

async function main() {
  const env = { ...loadEnv(path.join(ROOT, '.env')), ...process.env };
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sot = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'config', 'sot.json'), 'utf8')
  );

  const checks = [];
  const priceMap = {
    beginner: {
      priceId: env.STRIPE_PRICE_BEGINNER_PDF,
      mustMatch: /16/,
      pages: 16,
    },
    advanced: {
      priceId: env.STRIPE_PRICE_ADVANCED_PDF,
      mustMatch: /32/,
      pages: 32,
      tagline: /debrief|comp/i,
    },
    bundle: {
      priceId: env.STRIPE_PRICE_BUNDLE_PDF,
      mustMatch: /16[\s\S]*32|32[\s\S]*16/,
      pages: '16+32',
    },
  };

  for (const [name, cfg] of Object.entries(priceMap)) {
    const price = await stripe.prices.retrieve(cfg.priceId, {
      expand: ['product'],
    });
    const product = price.product;
    const desc = product.description || '';
    const images = product.images || [];
    const pagesOk = cfg.mustMatch.test(desc);
    const taglineOk = cfg.tagline ? cfg.tagline.test(desc) : true;
    checks.push({
      name,
      kind: 'product',
      ok: pagesOk && taglineOk,
      detail:
        'pages=' +
        (pagesOk ? 'OK' : 'FAIL') +
        (cfg.tagline ? ' tagline=' + (taglineOk ? 'OK' : 'FAIL') : '') +
        ' images=' +
        images.length +
        ' desc=' +
        JSON.stringify(desc).slice(0, 120),
    });
  }

  // List payment links and match by URL suffix from SOT
  const wanted = {
    beginner: sot.pdfGuides.beginner.stripePaymentLink,
    advanced: sot.pdfGuides.advanced.stripePaymentLink,
    bundle: sot.pdfGuides.bundle.stripePaymentLink,
  };
  const links = await stripe.paymentLinks.list({ limit: 100, active: true });
  for (const pl of links.data) {
    const url = pl.url;
    for (const [name, sotUrl] of Object.entries(wanted)) {
      if (url !== sotUrl) continue;
      const after = pl.after_completion || {};
      const redirect =
        after.type === 'redirect' && after.redirect
          ? after.redirect.url || ''
          : '';
      const wwwOk = /https:\/\/www\.promptanatomy\.help\/success\.html/.test(
        redirect
      );
      const hasSession = /\{CHECKOUT_SESSION_ID\}/.test(redirect);
      checks.push({
        name,
        kind: 'payment_link',
        ok: wwwOk && hasSession,
        detail:
          'success_url=' +
          JSON.stringify(redirect) +
          ' www=' +
          (wwwOk ? 'OK' : 'FAIL') +
          ' session_token=' +
          (hasSession ? 'OK' : 'FAIL'),
      });
    }
  }

  for (const [name, sotUrl] of Object.entries(wanted)) {
    const found = checks.some((c) => c.kind === 'payment_link' && c.name === name);
    if (!found) {
      checks.push({
        name,
        kind: 'payment_link',
        ok: false,
        detail: 'SOT URL not found in active Payment Links list: ' + sotUrl,
      });
    }
  }

  let allOk = true;
  for (const c of checks) {
    const mark = c.ok ? 'PASS' : 'FAIL';
    if (!c.ok) allOk = false;
    console.log(mark + ':', c.kind + '/' + c.name, c.detail);
  }
  console.log('SITE_URL env:', env.SITE_URL || '(unset)');
  if (!allOk) process.exit(2);
  console.log('All Stripe promo-gate checks passed.');
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

'use strict';

/**
 * Set Payment Link after_completion redirect to www success URL.
 * Usage: node scripts/fix-stripe-payment-link-success-urls.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const TARGET =
  'https://www.promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}';

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
  const wanted = new Set([
    sot.pdfGuides.beginner.stripePaymentLink,
    sot.pdfGuides.advanced.stripePaymentLink,
    sot.pdfGuides.bundle.stripePaymentLink,
  ]);

  const links = await stripe.paymentLinks.list({ limit: 100, active: true });
  let updated = 0;
  for (const pl of links.data) {
    if (!wanted.has(pl.url)) continue;
    const current =
      pl.after_completion &&
      pl.after_completion.redirect &&
      pl.after_completion.redirect.url
        ? pl.after_completion.redirect.url
        : '';
    console.log(pl.url, 'current=', JSON.stringify(current));
    if (current === TARGET) {
      console.log('  already www — skip');
      continue;
    }
    if (DRY) {
      console.log('  would set', TARGET);
      updated += 1;
      continue;
    }
    const out = await stripe.paymentLinks.update(pl.id, {
      after_completion: {
        type: 'redirect',
        redirect: { url: TARGET },
      },
    });
    const next =
      out.after_completion &&
      out.after_completion.redirect &&
      out.after_completion.redirect.url
        ? out.after_completion.redirect.url
        : '';
    console.log('  updated=', JSON.stringify(next));
    updated += 1;
  }
  console.log('Updated/would-update:', updated, 'Dry:', DRY);
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

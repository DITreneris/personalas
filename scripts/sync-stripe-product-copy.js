'use strict';

/**
 * Sync Stripe Product descriptions/images to match SOT page counts (promo gate).
 * Usage: node scripts/sync-stripe-product-copy.js [--dry-run]
 * Reads repo-root .env (never logs secrets).
 */

const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const ROOT = path.join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

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

function modeOf(key) {
  if (!key) return 'missing';
  if (key.startsWith('sk_live')) return 'live';
  if (key.startsWith('sk_test')) return 'test';
  return 'unknown';
}

async function resolveProductId(stripe, priceId) {
  const price = await stripe.prices.retrieve(priceId);
  const product = price.product;
  return typeof product === 'string' ? product : product.id;
}

async function main() {
  const env = { ...loadEnv(path.join(ROOT, '.env')), ...process.env };
  const key = env.STRIPE_SECRET_KEY || '';
  const mode = modeOf(key);
  console.log('Stripe mode:', mode);
  console.log('SITE_URL:', env.SITE_URL || '(unset)');
  console.log('Dry run:', DRY);

  if (mode === 'missing' || mode === 'unknown') {
    throw new Error('STRIPE_SECRET_KEY missing or invalid in .env');
  }

  const prices = {
    beginner: env.STRIPE_PRICE_BEGINNER_PDF,
    advanced: env.STRIPE_PRICE_ADVANCED_PDF,
    bundle: env.STRIPE_PRICE_BUNDLE_PDF,
  };
  for (const [name, id] of Object.entries(prices)) {
    if (!id || String(id).includes('REPLACE')) {
      throw new Error('Missing price id for ' + name);
    }
  }

  const sot = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'config', 'sot.json'), 'utf8')
  );
  const updates = {
    beginner: {
      priceId: prices.beginner,
      description:
        'Beginner HR Hiring Guide — ' +
        sot.pdfGuides.beginner.pages +
        ' pages. Kickoff worksheet, scorecard starter, and a repeatable US hiring loop.',
      // cover upload needs multipart; skip unless file provided later
    },
    advanced: {
      priceId: prices.advanced,
      description:
        'Advanced HR Hiring Guide — ' +
        sot.pdfGuides.advanced.pages +
        ' pages. Senior HR playbook with sample debrief transcript and comp/pay-transparency worksheet.',
    },
    bundle: {
      priceId: prices.bundle,
      description:
        'Both PDF guides — Beginner ' +
        sot.pdfGuides.beginner.pages +
        ' + Advanced ' +
        sot.pdfGuides.advanced.pages +
        ' pages (bundle).',
    },
  };

  const stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' });

  for (const [name, u] of Object.entries(updates)) {
    const productId = await resolveProductId(stripe, u.priceId);
    const current = await stripe.products.retrieve(productId);
    console.log(
      name + ':',
      'product=' + productId,
      'current_desc=' + JSON.stringify(current.description || '')
    );
    console.log(name + ':', 'new_desc=' + JSON.stringify(u.description));
    if (!DRY) {
      const updated = await stripe.products.update(productId, {
        description: u.description,
      });
      console.log(
        name + ':',
        'updated_ok',
        'desc=' + JSON.stringify(updated.description || '')
      );
    }
  }

  // Verify Payment Links exist in SOT (success URL is Dashboard-only for Payment Links)
  const links = [
    sot.pdfGuides.beginner.stripePaymentLink,
    sot.pdfGuides.advanced.stripePaymentLink,
    sot.pdfGuides.bundle.stripePaymentLink,
  ];
  for (const link of links) {
    if (!link || !link.startsWith('https://buy.stripe.com/')) {
      throw new Error('Invalid Payment Link in SOT: ' + link);
    }
  }
  console.log('Payment Links in SOT: 3 OK (buy.stripe.com)');
  console.log(
    'Manual still required: Payment Link success_url → https://www.promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}'
  );
  console.log(
    'Manual still required: Advanced product cover image = assets/pdf-covers/advanced.png'
  );
}

main().catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

/**
 * Diagnostinis CLI: patikrina vienos Stripe checkout session būseną
 * (Stripe + Upstash Redis + Resend) ir leidžia rankiniu būdu PERSIŲSTI
 * fulfillment laišką, jei pirminis pristatymas nepavyko.
 *
 * Naudojimas:
 *   node scripts/check-fulfillment.js --session=cs_live_a1b2c3...
 *   node scripts/check-fulfillment.js --payment_intent=pi_3TYl...
 *   node scripts/check-fulfillment.js --session=cs_live_a1b2c3... --resend
 *   node scripts/check-fulfillment.js --payment_intent=pi_3TYl... --resend --to=other@email.com
 *
 * --session         Stripe Checkout Session ID iš success.html?session_id=... arba
 *                   Stripe Dashboard → Payments → Events → "Checkout Session was completed".
 * --payment_intent  (Alternatyva) PaymentIntent ID iš Stripe Dashboard → Payments → Details.
 *                   Skriptas automatiškai susiras Checkout Session.
 * --resend          Persiunčia fulfillment laišką (jei session apmokėta).
 *                   Jei fulfillment'as dar neatliktas — pilnai jį atlieka (token + Redis + email).
 * --to              (Pasirinktinai) perrašo pirkėjo email; naudinga, jei jis pateikė
 *                   netinkamą email ir paprašė resend'inti į kitą.
 *
 * Reikalauja .env / .env.local su tomis pačiomis reikšmėmis kaip Vercel production.
 */

const path = require('path');
const fs = require('fs');

function loadEnv() {
  const candidates = ['.env.local', '.env'];
  for (const name of candidates) {
    const p = path.join(__dirname, '..', name);
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
    return name;
  }
  return null;
}

const envFile = loadEnv();
if (envFile) {
  console.log(`[env] Loaded ${envFile}`);
} else {
  console.warn('[env] WARNING: no .env or .env.local found in repo root.');
}

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) {
      out[arg.slice(2)] = true;
    } else {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
    }
  }
  return out;
}

const args = parseArgs(process.argv);
let sessionId = args.session || args.s || '';
const paymentIntentId = args.payment_intent || args.pi || '';
const doResend = Boolean(args.resend);
const overrideTo = args.to || '';

if (!sessionId && !paymentIntentId) {
  console.error('Usage: node scripts/check-fulfillment.js (--session=cs_live_... | --payment_intent=pi_...) [--resend] [--to=email]');
  process.exit(1);
}
if (sessionId && !/^cs_(test|live)_[A-Za-z0-9]{20,}$/.test(String(sessionId))) {
  console.error('[args] Invalid --session value. Expected cs_live_... or cs_test_...');
  process.exit(1);
}
if (paymentIntentId && !/^pi_[A-Za-z0-9]{20,}$/.test(String(paymentIntentId))) {
  console.error('[args] Invalid --payment_intent value. Expected pi_...');
  process.exit(1);
}

const REQUIRED_FOR_READ = [
  'STRIPE_SECRET_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN'
];
const REQUIRED_FOR_RESEND = ['RESEND_API_KEY', 'FULFILLMENT_FROM_EMAIL', 'DOWNLOAD_TOKEN_SECRET'];

function ensureEnv(keys) {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('[env] MISSING: ' + missing.join(', '));
    process.exit(2);
  }
}

(async function main() {
  ensureEnv(REQUIRED_FOR_READ);
  if (doResend) ensureEnv(REQUIRED_FOR_RESEND);

  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });

  const prefix = (process.env.REDIS_KEY_PREFIX || '').trim();
  const key = (k) => (prefix ? (prefix.endsWith(':') ? prefix : prefix + ':') : '') + k;

  if (!sessionId && paymentIntentId) {
    console.log(`\n--- Resolving Checkout Session from ${paymentIntentId} ---`);
    try {
      const list = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
      if (!list.data.length) {
        console.error('[stripe] no Checkout Session found for that PaymentIntent.');
        process.exit(3);
      }
      sessionId = list.data[0].id;
      console.log('  resolved →', sessionId);
    } catch (err) {
      console.error('[stripe] list by payment_intent failed:', err.message || err);
      process.exit(3);
    }
  }

  console.log('\n--- Stripe Checkout Session ---');
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items', 'payment_intent'] });
  } catch (err) {
    console.error('[stripe] retrieve failed:', err.message || err);
    process.exit(3);
  }

  const customerEmail = (session.customer_details && session.customer_details.email) || session.customer_email || '';
  console.log('  id           ', session.id);
  console.log('  mode         ', session.mode);
  console.log('  payment_status', session.payment_status);
  console.log('  amount_total ', (session.amount_total || 0) / 100, session.currency && session.currency.toUpperCase());
  console.log('  customer     ', customerEmail || '(none)');
  console.log('  created      ', new Date(session.created * 1000).toISOString());
  console.log('  metadata     ', JSON.stringify(session.metadata || {}));

  const lineItems = (session.line_items && session.line_items.data) || [];
  for (const li of lineItems) {
    const priceId = li.price && li.price.id;
    console.log('  line item    ', li.description, '|', li.quantity, 'x', priceId);
  }

  console.log('\n--- Configured Stripe Price IDs in env ---');
  const cfg = {
    beginner: process.env.STRIPE_PRICE_BEGINNER_PDF || '(unset)',
    advanced: process.env.STRIPE_PRICE_ADVANCED_PDF || '(unset)',
    bundle: process.env.STRIPE_PRICE_BUNDLE_PDF || '(unset)'
  };
  for (const [k, v] of Object.entries(cfg)) console.log('  ', k.padEnd(8), v);

  const sessionPriceIds = lineItems.map((li) => li.price && li.price.id).filter(Boolean);
  const matchedProduct = sessionPriceIds.find((pid) =>
    pid === cfg.beginner || pid === cfg.advanced || pid === cfg.bundle
  );
  if (matchedProduct) {
    console.log('  MATCH: session price', matchedProduct, '→ recognized product.');
  } else {
    console.error('  MISMATCH: session price not in env. Webhook would fail with "PDF product" error.');
  }

  console.log('\n--- Redis fulfillment record ---');
  const ffKey = key(`fulfillment:${session.id}`);
  console.log('  key:', ffKey);
  const ffRaw = await redis.get(ffKey);
  if (!ffRaw) {
    console.log('  (no record) — webhook never ran successfully for this session.');
  } else {
    const ff = typeof ffRaw === 'string' ? JSON.parse(ffRaw) : ffRaw;
    console.log(' ', JSON.stringify(ff, null, 2));
  }

  if (!doResend) {
    console.log('\nDone. Re-run with --resend to (re)send the fulfillment email.');
    process.exit(0);
  }

  if (session.payment_status !== 'paid') {
    console.error('\n[resend] Aborting: session is not paid.');
    process.exit(4);
  }

  console.log('\n--- Manual fulfillment / resend ---');

  if (overrideTo) {
    if (session.customer_details) {
      session.customer_details.email = overrideTo;
    } else {
      session.customer_email = overrideTo;
    }
    console.log('  override email →', overrideTo);
  }

  await redis.del(ffKey);
  await redis.del(key(`fulfillment-lock:${session.id}`));
  console.log('  cleared previous fulfillment + lock keys.');

  const stripeForLib = {
    checkout: {
      sessions: {
        retrieve: async () => session
      }
    }
  };

  const { fulfillCheckoutSession } = require('../api/_lib/fulfillment');
  const origin = (process.env.SITE_URL || 'https://www.promptanatomy.help').replace(/\/$/, '');
  let result;
  try {
    result = await fulfillCheckoutSession(stripeForLib, session.id, origin);
  } catch (err) {
    console.error('[resend] fulfillCheckoutSession threw:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(5);
  }
  console.log('  result:', JSON.stringify(result));
  console.log('\nDone. Ask the buyer to check inbox + spam for the new email.');
})();

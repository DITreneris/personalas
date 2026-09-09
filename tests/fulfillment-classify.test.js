/**
 * Product classifier for shared-account Stripe webhooks.
 * Run: node tests/fulfillment-classify.test.js
 */
'use strict';

process.env.STRIPE_PRICE_BEGINNER_PDF = 'price_test_beginner';
process.env.STRIPE_PRICE_ADVANCED_PDF = 'price_test_advanced';
process.env.STRIPE_PRICE_BUNDLE_PDF = 'price_test_bundle';

const {
  classifyCheckoutSession,
  isUnknownPdfProductError,
  UNKNOWN_PDF_PRODUCT_ERROR,
  UNCONFIGURED_HIRE_PRODUCT_ERROR,
  UNKNOWN_PDF_PRODUCT_CODE,
  UNCONFIGURED_HIRE_PRODUCT_CODE
} = require('../api/_lib/fulfillment');

function session(opts) {
  const priceIds = opts.priceIds || (opts.priceId ? [opts.priceId] : []);
  return {
    line_items: {
      data: priceIds.map((id) => ({ price: { id } }))
    },
    metadata: opts.metadata || {},
    success_url: opts.successUrl || ''
  };
}

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    return false;
  }
  console.log('PASS: ' + message);
  return true;
}

function run() {
  let passed = 0;
  let failed = 0;
  const tally = (ok) => { if (ok) passed++; else failed++; };

  const hireHelpUrl = 'https://www.promptanatomy.help/success.html?session_id={CHECKOUT_SESSION_ID}';
  const ceoUrl = 'https://www.promptanatomy.ceo/en/success.html?session_id={CHECKOUT_SESSION_ID}';
  const appUrl = 'https://www.promptanatomy.app/success?session_id={CHECKOUT_SESSION_ID}';

  let c = classifyCheckoutSession(session({
    priceId: 'price_test_advanced',
    successUrl: hireHelpUrl
  }));
  tally(assert(c.action === 'fulfill' && c.product && c.product.id === 'advanced',
    'Hire advanced price ID → fulfill advanced'));

  c = classifyCheckoutSession(session({
    priceId: 'price_test_beginner',
    successUrl: hireHelpUrl
  }));
  tally(assert(c.action === 'fulfill' && c.product.id === 'beginner',
    'Hire beginner price ID → fulfill beginner'));

  c = classifyCheckoutSession(session({
    priceId: 'price_test_bundle',
    successUrl: hireHelpUrl
  }));
  tally(assert(c.action === 'fulfill' && c.product.id === 'bundle',
    'Hire bundle price ID → fulfill bundle'));

  c = classifyCheckoutSession(session({
    priceId: 'price_ceo_operating',
    metadata: { product: 'beginner' },
    successUrl: hireHelpUrl
  }));
  tally(assert(c.action === 'fulfill' && c.product.id === 'beginner',
    'Unmatched price + metadata.product=beginner → fulfill (metadata fallback)'));

  c = classifyCheckoutSession(session({
    priceId: 'price_ceo_operating',
    metadata: { product: 'operating' },
    successUrl: ceoUrl
  }));
  tally(assert(c.action === 'ack' && c.code === UNKNOWN_PDF_PRODUCT_CODE,
    'metadata.product=operating + .ceo success_url → ACK'));

  c = classifyCheckoutSession(session({
    priceId: 'price_ceo_operating',
    metadata: {},
    successUrl: ceoUrl
  }));
  tally(assert(c.action === 'ack' && c.code === UNKNOWN_PDF_PRODUCT_CODE && c.successHost === 'www.promptanatomy.ceo',
    'empty metadata + .ceo success_url → ACK'));

  c = classifyCheckoutSession(session({
    priceId: 'price_hub_starter',
    metadata: { plan: '3' },
    successUrl: appUrl
  }));
  tally(assert(c.action === 'ack' && c.code === UNKNOWN_PDF_PRODUCT_CODE,
    'metadata.plan=3 + .app success_url → ACK'));

  c = classifyCheckoutSession(session({
    priceId: 'price_unknown',
    metadata: {},
    successUrl: hireHelpUrl
  }));
  tally(assert(c.action === 'reject' && c.code === UNCONFIGURED_HIRE_PRODUCT_CODE,
    'unmatched price + empty metadata + .help success_url → reject'));

  c = classifyCheckoutSession(session({
    priceId: 'price_unknown',
    metadata: {},
    successUrl: 'https://stripe.com'
  }));
  tally(assert(c.action === 'reject' && c.code === UNCONFIGURED_HIRE_PRODUCT_CODE,
    'unmatched + empty + stripe.com → reject (fail closed)'));

  c = classifyCheckoutSession(session({
    priceId: 'price_test_advanced',
    metadata: { product: 'operating' },
    successUrl: ceoUrl
  }));
  tally(assert(c.action === 'fulfill' && c.product.id === 'advanced',
    'Hire price match even if success_url is .ceo → fulfill (price wins)'));

  const ackErr = new Error(UNKNOWN_PDF_PRODUCT_ERROR);
  ackErr.code = UNKNOWN_PDF_PRODUCT_CODE;
  tally(assert(isUnknownPdfProductError(ackErr),
    'isUnknownPdfProductError true for UNKNOWN_PDF_PRODUCT code'));

  const rejectErr = new Error(UNCONFIGURED_HIRE_PRODUCT_ERROR);
  rejectErr.code = UNCONFIGURED_HIRE_PRODUCT_CODE;
  tally(assert(!isUnknownPdfProductError(rejectErr),
    'isUnknownPdfProductError false for UNCONFIGURED_HIRE_PRODUCT'));

  tally(assert(isUnknownPdfProductError(new Error(UNKNOWN_PDF_PRODUCT_ERROR)),
    'isUnknownPdfProductError true on legacy message without code'));

  console.log('');
  console.log('Result: ' + passed + ' passed, ' + failed + ' failed');
  if (failed) process.exit(1);
}

run();

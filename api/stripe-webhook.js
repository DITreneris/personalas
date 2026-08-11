'use strict';

const Stripe = require('stripe');
const { fulfillCheckoutSession } = require('./_lib/fulfillment');

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;

    function fail(error) {
      if (settled) return;
      settled = true;
      reject(error);
      try {
        req.destroy();
      } catch (_e) {
        // ignore
      }
    }

    req.on('data', (chunk) => {
      const buf = Buffer.from(chunk);
      size += buf.length;
      if (size > MAX_WEBHOOK_BODY_BYTES) {
        const err = new Error('Request body too large');
        err.statusCode = 413;
        fail(err);
        return;
      }
      chunks.push(buf);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on('error', fail);
  });
}

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `${proto}://${host}` : '';
}

module.exports = async function stripeWebhook(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    sendJson(res, 500, { error: 'Stripe webhook is not configured' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    if (error && error.statusCode === 413) {
      sendJson(res, 413, { error: 'Payload too large' });
      return;
    }
    sendJson(res, 400, { error: 'Invalid request body' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed:', error && error.message ? error.message : error);
    sendJson(res, 400, { error: 'Invalid Stripe signature' });
    return;
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    sendJson(res, 200, { received: true, ignored: event.type });
    return;
  }

  // Preview/local may pass Host-derived origin; production uses SITE_URL only.
  const origin = process.env.VERCEL_ENV === 'production' ? '' : getOrigin(req);

  try {
    const result = await fulfillCheckoutSession(stripe, event.data.object.id, origin);
    sendJson(res, 200, { received: true, fulfillment: result.status });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    console.error('[stripe-webhook] fulfillment failed for', event.data.object.id, '-', message);
    if (error && error.stack) console.error(error.stack);
    sendJson(res, 500, { error: 'Fulfillment failed' });
  }
};

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');
const { Resend } = require('resend');

const DOWNLOAD_TOKEN_TTL_SECONDS = Number(process.env.DOWNLOAD_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);
const IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS = Number(process.env.IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS || 60 * 15);
const REDIS_STATE_TTL_SECONDS = Number(process.env.FULFILLMENT_STATE_TTL_SECONDS || 60 * 60 * 24 * 90);

const PRODUCTS = {
  beginner: {
    id: 'beginner',
    publicId: 'beginner-pdf',
    name: 'Beginner PDF Guide',
    price: '$5.99',
    priceEnv: 'STRIPE_PRICE_BEGINNER_PDF',
    sourceUrlEnv: 'PDF_BEGINNER_SOURCE_URL',
    localFileName: 'beginner-guide.pdf',
    downloadFileName: 'personalas-beginner-guide.pdf'
  },
  advanced: {
    id: 'advanced',
    publicId: 'advanced-pdf',
    name: 'Advanced PDF Guide',
    price: '$11.99',
    priceEnv: 'STRIPE_PRICE_ADVANCED_PDF',
    sourceUrlEnv: 'PDF_ADVANCED_SOURCE_URL',
    localFileName: 'advanced-guide.pdf',
    downloadFileName: 'personalas-advanced-guide.pdf'
  }
};

let redisClient = null;
let resendClient = null;

function getRedis() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.VERCEL_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error('Redis REST environment variables are not configured.');
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function getResend() {
  if (resendClient) return resendClient;
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.');
  }
  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

function getProductById(productId) {
  return Object.values(PRODUCTS).find((p) => p.id === productId || p.publicId === productId) || null;
}

function getProductByPriceId(priceId) {
  if (!priceId) return null;
  return Object.values(PRODUCTS).find((p) => process.env[p.priceEnv] === priceId) || null;
}

function getProductFromSession(session) {
  const metadataProduct = session && session.metadata ? getProductById(session.metadata.product) : null;
  if (metadataProduct) return metadataProduct;

  const lineItems = session && session.line_items && Array.isArray(session.line_items.data)
    ? session.line_items.data
    : [];

  for (const item of lineItems) {
    const priceId = item && item.price ? item.price.id : '';
    const product = getProductByPriceId(priceId);
    if (product) return product;
  }

  throw new Error('Checkout Session does not contain a configured PDF product.');
}

function getCustomerEmail(session) {
  if (session && session.customer_details && session.customer_details.email) {
    return session.customer_details.email;
  }
  if (session && session.customer_email) {
    return session.customer_email;
  }
  throw new Error('Checkout Session has no customer email.');
}

function base64url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signEncodedPayload(encodedPayload) {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) {
    throw new Error('DOWNLOAD_TOKEN_SECRET is not configured.');
  }
  return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function createDownloadToken(sessionId, productId, ttlSeconds) {
  const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : DOWNLOAD_TOKEN_TTL_SECONDS;
  const payload = {
    v: 1,
    sid: sessionId,
    product: productId,
    jti: crypto.randomBytes(18).toString('base64url'),
    exp: Math.floor(Date.now() / 1000) + ttl
  };

  const encodedPayload = base64url(JSON.stringify(payload));
  return {
    token: `${encodedPayload}.${signEncodedPayload(encodedPayload)}`,
    payload
  };
}

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const atIndex = email.indexOf('@');
  if (atIndex <= 0 || atIndex === email.length - 1) return email;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length === 1) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function verifyDownloadToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) {
    throw new Error('Invalid download token.');
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid download token.');
  }

  const expectedSignature = signEncodedPayload(parts[0]);
  const actualSignature = parts[1];
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(actualSignature);

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error('Invalid download token signature.');
  }

  const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Download token has expired.');
  }

  return payload;
}

async function redisGetJson(key) {
  const value = await getRedis().get(key);
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

async function redisSetJson(key, value, ttlSeconds, options) {
  const setOptions = Object.assign({}, options || {}, ttlSeconds ? { ex: ttlSeconds } : {});
  return getRedis().set(key, JSON.stringify(value), setOptions);
}

async function acquireLock(key, ttlSeconds) {
  const result = await redisSetJson(key, { lockedAt: new Date().toISOString() }, ttlSeconds, { nx: true });
  return result === 'OK' || result === true;
}

async function releaseLock(key) {
  await getRedis().del(key);
}

function getSiteUrl(origin) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (origin) return origin.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://promptanatomy.help';
}

function getLocalPdfPath(product) {
  return path.join(__dirname, '..', '_private', 'pdfs', product.localFileName);
}

async function assertProductAssetAvailable(product) {
  if (process.env[product.sourceUrlEnv]) return;
  if (fs.existsSync(getLocalPdfPath(product))) return;
  throw new Error(`${product.name} PDF source is not configured.`);
}

function getSourceHeaders() {
  const headers = {};
  if (process.env.PDF_SOURCE_AUTH_HEADER) {
    const separatorIndex = process.env.PDF_SOURCE_AUTH_HEADER.indexOf(':');
    if (separatorIndex > 0) {
      const name = process.env.PDF_SOURCE_AUTH_HEADER.slice(0, separatorIndex).trim();
      const value = process.env.PDF_SOURCE_AUTH_HEADER.slice(separatorIndex + 1).trim();
      if (name && value) headers[name] = value;
    }
  }
  if (process.env.PDF_SOURCE_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.PDF_SOURCE_AUTH_TOKEN}`;
  }
  return headers;
}

async function loadProductPdf(product) {
  const sourceUrl = process.env[product.sourceUrlEnv];
  if (sourceUrl) {
    const response = await globalThis.fetch(sourceUrl, { headers: getSourceHeaders() });
    if (!response.ok) {
      throw new Error(`${product.name} PDF source returned ${response.status}.`);
    }
    return {
      type: 'buffer',
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || 'application/pdf'
    };
  }

  const localPath = getLocalPdfPath(product);
  if (!fs.existsSync(localPath)) {
    throw new Error(`${product.name} PDF file is missing.`);
  }

  return {
    type: 'stream',
    body: fs.createReadStream(localPath),
    contentType: 'application/pdf'
  };
}

function buildDownloadUrl(token, origin) {
  const url = new URL('/api/download', getSiteUrl(origin));
  url.searchParams.set('t', token);
  return url.toString();
}

function buildEmailText(product, downloadUrl) {
  return [
    `Thank you for buying the ${product.name}.`,
    '',
    `Download link: ${downloadUrl}`,
    '',
    `This secure link expires in ${Math.round(DOWNLOAD_TOKEN_TTL_SECONDS / 86400)} days.`,
    'You also received a Stripe receipt under separate cover.',
    '',
    'Personal license: use this guide within your own HR team. Do not redistribute as-is.',
    'Full terms: https://promptanatomy.help/terms.html#paid-pdf-license',
    '',
    '14-day no-questions refund: just reply to this email or to your Stripe receipt.',
    'Need help? Contact info@promptanatomy.help.',
    '',
    'Personalas — Prompt Anatomy'
  ].join('\n');
}

function buildEmailHtml(product, downloadUrl) {
  const days = Math.round(DOWNLOAD_TOKEN_TTL_SECONDS / 86400);
  return [
    '<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1A202C; max-width: 560px;">',
    `<h1 style="font-size: 1.25rem;">Your ${product.name}</h1>`,
    '<p>Thank you for your purchase. Use the button below to download your PDF.</p>',
    `<p><a href="${downloadUrl}" style="display:inline-block;padding:12px 18px;background:#2B6CB0;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Download PDF</a></p>`,
    `<p style="color:#4A5568;font-size:0.95rem;">This secure link expires in ${days} days. You also received a Stripe receipt under separate cover.</p>`,
    '<hr style="border:none;border-top:1px solid #E2E8F0;margin:1.25rem 0;">',
    '<p style="color:#4A5568;font-size:0.9rem;">Personal license. Use this guide within your own HR team. Do not redistribute as-is. <a href="https://promptanatomy.help/terms.html#paid-pdf-license">Full terms.</a></p>',
    '<p style="color:#4A5568;font-size:0.9rem;">14-day no-questions refund. Reply to this email or to your Stripe receipt and we will revoke this link.</p>',
    '<p style="color:#4A5568;font-size:0.9rem;">Need help? Contact <a href="mailto:info@promptanatomy.help">info@promptanatomy.help</a>.</p>',
    '<p style="color:#718096;font-size:0.85rem;margin-top:1rem;">Personalas — Prompt Anatomy</p>',
    '</div>'
  ].join('');
}

async function sendFulfillmentEmail(email, product, downloadUrl) {
  if (!process.env.FULFILLMENT_FROM_EMAIL) {
    throw new Error('FULFILLMENT_FROM_EMAIL is not configured.');
  }

  await getResend().emails.send({
    from: process.env.FULFILLMENT_FROM_EMAIL,
    to: email,
    subject: `Your ${product.name} download`,
    text: buildEmailText(product, downloadUrl),
    html: buildEmailHtml(product, downloadUrl)
  });
}

async function fulfillCheckoutSession(stripe, sessionId, origin) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
  if (session.payment_status !== 'paid') {
    return { status: 'not_paid', sessionId };
  }

  const fulfillmentKey = `fulfillment:${session.id}`;
  const existing = await redisGetJson(fulfillmentKey);
  if (existing && existing.status === 'fulfilled') {
    return { status: 'already_fulfilled', sessionId };
  }

  const lockKey = `fulfillment-lock:${session.id}`;
  const locked = await acquireLock(lockKey, 300);
  if (!locked) {
    return { status: 'locked', sessionId };
  }

  try {
    const lockedExisting = await redisGetJson(fulfillmentKey);
    if (lockedExisting && lockedExisting.status === 'fulfilled') {
      return { status: 'already_fulfilled', sessionId };
    }

    const product = getProductFromSession(session);
    await assertProductAssetAvailable(product);
    const email = getCustomerEmail(session);
    const token = createDownloadToken(session.id, product.id, DOWNLOAD_TOKEN_TTL_SECONDS);
    const downloadUrl = buildDownloadUrl(token.token, origin);
    const now = new Date().toISOString();

    await redisSetJson(`download-token:${token.payload.jti}`, {
      sessionId: session.id,
      productId: product.id,
      email,
      createdAt: now,
      expiresAt: new Date(token.payload.exp * 1000).toISOString()
    }, DOWNLOAD_TOKEN_TTL_SECONDS);

    await redisSetJson(fulfillmentKey, {
      status: 'email_pending',
      sessionId: session.id,
      productId: product.id,
      email,
      createdAt: now
    }, REDIS_STATE_TTL_SECONDS);

    await sendFulfillmentEmail(email, product, downloadUrl);

    await redisSetJson(fulfillmentKey, {
      status: 'fulfilled',
      sessionId: session.id,
      productId: product.id,
      email,
      fulfilledAt: new Date().toISOString()
    }, REDIS_STATE_TTL_SECONDS);

    return { status: 'fulfilled', sessionId: session.id, productId: product.id };
  } finally {
    await releaseLock(lockKey);
  }
}

async function resolveDownload(token) {
  const payload = verifyDownloadToken(token);
  const product = getProductById(payload.product);
  if (!product) {
    throw new Error('Unknown PDF product.');
  }

  const tokenRecord = await redisGetJson(`download-token:${payload.jti}`);
  if (!tokenRecord || tokenRecord.sessionId !== payload.sid || tokenRecord.productId !== product.id) {
    throw new Error('Download token is not active.');
  }

  const fulfillment = await redisGetJson(`fulfillment:${payload.sid}`);
  if (!fulfillment || fulfillment.status !== 'fulfilled' || fulfillment.productId !== product.id) {
    throw new Error('Purchase has not been fulfilled.');
  }

  return { product, fulfillment };
}

/**
 * Re-mint a short-lived download token for an already-fulfilled Checkout Session
 * so the buyer can click "Download" right after the Stripe redirect, without
 * waiting for the email.
 */
async function getDownloadUrlBySessionId(sessionId, origin) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Missing session id.');
  }

  const fulfillment = await redisGetJson(`fulfillment:${sessionId}`);
  if (!fulfillment) {
    throw new Error('Unknown checkout session.');
  }
  if (fulfillment.status !== 'fulfilled') {
    return { status: 'processing' };
  }

  const product = getProductById(fulfillment.productId);
  if (!product) {
    throw new Error('Unknown PDF product on fulfillment record.');
  }

  const token = createDownloadToken(sessionId, product.id, IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS);
  await redisSetJson(`download-token:${token.payload.jti}`, {
    sessionId,
    productId: product.id,
    email: fulfillment.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(token.payload.exp * 1000).toISOString(),
    inPage: true
  }, IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS);

  return {
    status: 'ready',
    downloadUrl: buildDownloadUrl(token.token, origin),
    expiresAt: new Date(token.payload.exp * 1000).toISOString(),
    maskedEmail: maskEmail(fulfillment.email),
    productId: product.id,
    productName: product.name
  };
}

module.exports = {
  PRODUCTS,
  fulfillCheckoutSession,
  loadProductPdf,
  resolveDownload,
  getDownloadUrlBySessionId,
  maskEmail
};

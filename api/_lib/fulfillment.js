'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');
const { Resend } = require('resend');

const DOWNLOAD_TOKEN_TTL_SECONDS = Number(process.env.DOWNLOAD_TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);
const IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS = Number(process.env.IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS || 60 * 15);
const REDIS_STATE_TTL_SECONDS = Number(process.env.FULFILLMENT_STATE_TTL_SECONDS || 60 * 60 * 24 * 90);

// CAN-SPAM Act § 7704(a)(5) — every commercial email to US recipients must include a valid
// physical postal address. Source: config/sot.json (single source of truth). The env override
// allows rotating the address without a redeploy if the virtual mailbox changes.
const SOT = require('../../config/sot.json');
const BUSINESS_ADDRESS = (function loadBusinessAddress() {
  const override = (process.env.BUSINESS_ADDRESS_OVERRIDE || '').trim();
  if (override) {
    try {
      const parsed = JSON.parse(override);
      if (parsed && parsed.name && parsed.street && parsed.city) return parsed;
    } catch (_e) {
      // Fall through to SOT.
    }
  }
  return SOT && SOT.product && SOT.product.businessAddress
    ? SOT.product.businessAddress
    : null;
})();

function businessAddressTextLines() {
  if (!BUSINESS_ADDRESS) return [];
  const a = BUSINESS_ADDRESS;
  const street = a.unit ? a.street + ', ' + a.unit : a.street;
  const locality = a.city + ', ' + a.region + ' ' + a.postalCode;
  const country = a.countryName || a.country || '';
  return country ? [a.name, street, locality, country] : [a.name, street, locality];
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildBusinessAddressHtml() {
  const lines = businessAddressTextLines();
  if (!lines.length) return '';
  const safe = lines.map(escapeHtml);
  return (
    '<address style="font-style:normal;color:#718096;font-size:0.85rem;line-height:1.55;margin-top:1rem;">' +
    '<strong style="color:#4A5568;">' + safe[0] + '</strong><br>' +
    safe.slice(1).join('<br>') +
    '</address>'
  );
}

const PRODUCTS = {
  beginner: {
    id: 'beginner',
    publicId: 'beginner-pdf',
    name: 'Beginner PDF Guide',
    price: '$5.99',
    priceEnv: 'STRIPE_PRICE_BEGINNER_PDF',
    sourceUrlEnv: 'PDF_BEGINNER_SOURCE_URL',
    localFileName: 'beginner-guide.pdf',
    downloadFileName: 'Beginner_HR_Hiring_Guide.pdf'
  },
  advanced: {
    id: 'advanced',
    publicId: 'advanced-pdf',
    name: 'Advanced PDF Guide',
    price: '$11.99',
    priceEnv: 'STRIPE_PRICE_ADVANCED_PDF',
    sourceUrlEnv: 'PDF_ADVANCED_SOURCE_URL',
    localFileName: 'advanced-guide.pdf',
    downloadFileName: 'Advanced_HR_Hiring_Guide.pdf'
  },
  bundle: {
    id: 'bundle',
    publicId: 'bundle-pdf',
    name: 'Beginner + Advanced PDF Guides',
    price: '$15.99',
    priceEnv: 'STRIPE_PRICE_BUNDLE_PDF',
    delivers: ['beginner', 'advanced'],
    isBundle: true
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

/** Optional namespace when sharing Upstash with another app (env: REDIS_KEY_PREFIX=personalas:) */
function redisKey(key) {
  const prefix = (process.env.REDIS_KEY_PREFIX || '').trim();
  if (!prefix) return key;
  return prefix.endsWith(':') ? prefix + key : `${prefix}:${key}`;
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
  return Object.values(PRODUCTS).find((p) => p.priceEnv && process.env[p.priceEnv] === priceId) || null;
}

function getBundleDeliverables() {
  return [PRODUCTS.beginner, PRODUCTS.advanced];
}

function isBundleFulfillment(fulfillment) {
  return fulfillment && fulfillment.productId === PRODUCTS.bundle.id;
}

function getProductFromSession(session) {
  // Prefer paid line_items price IDs over metadata so a mis-set Payment Link
  // metadata.product cannot upgrade the fulfilled tier above what was charged.
  const lineItems = session && session.line_items && Array.isArray(session.line_items.data)
    ? session.line_items.data
    : [];

  for (const item of lineItems) {
    const priceId = item && item.price ? item.price.id : '';
    const product = getProductByPriceId(priceId);
    if (product) return product;
  }

  const metadataProduct = session && session.metadata ? getProductById(session.metadata.product) : null;
  if (metadataProduct) return metadataProduct;

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
  const value = await getRedis().get(redisKey(key));
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : value;
}

async function redisSetJson(key, value, ttlSeconds, options) {
  const setOptions = Object.assign({}, options || {}, ttlSeconds ? { ex: ttlSeconds } : {});
  return getRedis().set(redisKey(key), JSON.stringify(value), setOptions);
}

async function acquireLock(key, ttlSeconds) {
  const result = await redisSetJson(key, { lockedAt: new Date().toISOString() }, ttlSeconds, { nx: true });
  return result === 'OK' || result === true;
}

async function releaseLock(key) {
  await getRedis().del(redisKey(key));
}

function getSiteUrl(origin) {
  const configured = (process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  // Production must not build download URLs from Host / X-Forwarded-Host.
  if (process.env.VERCEL_ENV === 'production') {
    throw new Error('SITE_URL is required in production.');
  }
  if (origin) return origin.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://www.promptanatomy.help';
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
    const headers = getSourceHeaders();
    if (
      !headers.Authorization &&
      /\.blob\.vercel-storage\.com/i.test(sourceUrl) &&
      process.env.BLOB_READ_WRITE_TOKEN
    ) {
      headers.Authorization = 'Bearer ' + process.env.BLOB_READ_WRITE_TOKEN;
    }
    const response = await globalThis.fetch(sourceUrl, { headers });
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
  const lines = [
    `Thank you for buying the ${product.name}.`,
    '',
    `Download link: ${downloadUrl}`,
    '',
    `This secure link expires in ${Math.round(DOWNLOAD_TOKEN_TTL_SECONDS / 86400)} days.`,
    'You also received a Stripe receipt under separate cover.',
    '',
    'Personal license: use this guide within your own HR team. Do not redistribute as-is.',
    'Full terms: https://www.promptanatomy.help/terms.html#paid-pdf-license',
    '',
    '14-day no-questions refund: just reply to this email or to your Stripe receipt.',
    'Need help? Contact info@promptanatomy.app.',
    '',
    'This email was sent to fulfill your purchase. Our mailing address is below.',
    ''
  ];
  const addr = businessAddressTextLines();
  if (addr.length) {
    lines.push.apply(lines, addr);
  } else {
    lines.push('Prompt Anatomy');
  }
  return lines.join('\n');
}

function buildEmailHtml(product, downloadUrl) {
  const days = Math.round(DOWNLOAD_TOKEN_TTL_SECONDS / 86400);
  const addressBlock = buildBusinessAddressHtml() ||
    '<p style="color:#718096;font-size:0.85rem;margin-top:1rem;">Prompt Anatomy</p>';
  return [
    '<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1A202C; max-width: 560px;">',
    `<h1 style="font-size: 1.25rem;">Your ${product.name}</h1>`,
    '<p>Thank you for your purchase. Use the button below to download your PDF.</p>',
    `<p><a href="${downloadUrl}" style="display:inline-block;padding:12px 18px;background:#2B6CB0;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Download PDF</a></p>`,
    `<p style="color:#4A5568;font-size:0.95rem;">This secure link expires in ${days} days. You also received a Stripe receipt under separate cover.</p>`,
    '<hr style="border:none;border-top:1px solid #E2E8F0;margin:1.25rem 0;">',
    '<p style="color:#4A5568;font-size:0.9rem;">Personal license. Use this guide within your own HR team. Do not redistribute as-is. <a href="https://www.promptanatomy.help/terms.html#paid-pdf-license">Full terms.</a></p>',
    '<p style="color:#4A5568;font-size:0.9rem;">14-day no-questions refund. Reply to this email or to your Stripe receipt and we will revoke this link.</p>',
    '<p style="color:#4A5568;font-size:0.9rem;">Need help? Contact <a href="mailto:info@promptanatomy.app">info@promptanatomy.app</a>.</p>',
    '<p style="color:#718096;font-size:0.8rem;margin-top:1rem;">This email was sent to fulfill your purchase. Our mailing address is below.</p>',
    addressBlock,
    '</div>'
  ].join('');
}

function buildBundleEmailText(downloads) {
  const lines = [
    'Thank you for buying the Beginner + Advanced PDF Guides.',
    '',
    'Your download links:'
  ];
  for (const item of downloads) {
    lines.push(`- ${item.name}: ${item.url}`);
  }
  lines.push(
    '',
    `Each secure link expires in ${Math.round(DOWNLOAD_TOKEN_TTL_SECONDS / 86400)} days.`,
    'You also received a Stripe receipt under separate cover.',
    'Personal license: use within your HR team. Do not redistribute as-is.',
    'Full terms: https://www.promptanatomy.help/terms.html#paid-pdf-license',
    '',
    '14-day no-questions refund: just reply to this email or to your Stripe receipt.',
    'Need help? Contact info@promptanatomy.app.',
    '',
    'This email was sent to fulfill your purchase. Our mailing address is below.',
    ''
  );
  const addr = businessAddressTextLines();
  if (addr.length) {
    lines.push.apply(lines, addr);
  } else {
    lines.push('Prompt Anatomy');
  }
  return lines.join('\n');
}

function buildBundleEmailHtml(downloads) {
  const days = Math.round(DOWNLOAD_TOKEN_TTL_SECONDS / 86400);
  let buttons = '';
  for (const item of downloads) {
    buttons += `<p><a href="${item.url}" style="display:inline-block;padding:12px 18px;background:#2B6CB0;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:4px 0;">Download ${item.name}</a></p>`;
  }
  const addressBlock = buildBusinessAddressHtml() ||
    '<p style="color:#718096;font-size:0.85rem;">Prompt Anatomy</p>';
  return [
    '<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1A202C; max-width: 560px;">',
    '<h1 style="font-size: 1.25rem;">Your Beginner + Advanced PDF Guides</h1>',
    '<p>Thank you for your purchase.</p>',
    buttons,
    `<p style="color:#4A5568;font-size:0.95rem;">Links expire in ${days} days. You also received a Stripe receipt under separate cover.</p>`,
    '<p style="color:#4A5568;font-size:0.9rem;">Personal license. Use within your HR team. Do not redistribute as-is. <a href="https://www.promptanatomy.help/terms.html#paid-pdf-license">Full terms.</a></p>',
    '<p style="color:#4A5568;font-size:0.9rem;">14-day no-questions refund. Reply to this email or to your Stripe receipt and we will revoke this link.</p>',
    '<p style="color:#4A5568;font-size:0.9rem;">Need help? Contact <a href="mailto:info@promptanatomy.app">info@promptanatomy.app</a>.</p>',
    '<p style="color:#718096;font-size:0.8rem;margin-top:1rem;">This email was sent to fulfill your purchase. Our mailing address is below.</p>',
    addressBlock,
    '</div>'
  ].join('');
}

async function sendBundleFulfillmentEmail(email, downloads) {
  if (!process.env.FULFILLMENT_FROM_EMAIL) {
    throw new Error('FULFILLMENT_FROM_EMAIL is not configured.');
  }
  await getResend().emails.send({
    from: process.env.FULFILLMENT_FROM_EMAIL,
    to: email,
    subject: 'Your Beginner + Advanced PDF Guides',
    text: buildBundleEmailText(downloads),
    html: buildBundleEmailHtml(downloads)
  });
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
    const email = getCustomerEmail(session);
    const now = new Date().toISOString();

    if (product.isBundle) {
      const deliverables = getBundleDeliverables();
      for (const item of deliverables) {
        await assertProductAssetAvailable(item);
      }
      const downloads = [];
      for (const item of deliverables) {
        const token = createDownloadToken(session.id, item.id, DOWNLOAD_TOKEN_TTL_SECONDS);
        await redisSetJson(`download-token:${token.payload.jti}`, {
          sessionId: session.id,
          productId: item.id,
          bundle: true,
          email,
          createdAt: now,
          expiresAt: new Date(token.payload.exp * 1000).toISOString()
        }, DOWNLOAD_TOKEN_TTL_SECONDS);
        downloads.push({
          productId: item.id,
          name: item.name,
          url: buildDownloadUrl(token.token, origin)
        });
      }

      await redisSetJson(fulfillmentKey, {
        status: 'email_pending',
        sessionId: session.id,
        productId: product.id,
        email,
        createdAt: now
      }, REDIS_STATE_TTL_SECONDS);

      await sendBundleFulfillmentEmail(email, downloads);

      await redisSetJson(fulfillmentKey, {
        status: 'fulfilled',
        sessionId: session.id,
        productId: product.id,
        email,
        fulfilledAt: new Date().toISOString()
      }, REDIS_STATE_TTL_SECONDS);

      return { status: 'fulfilled', sessionId: session.id, productId: product.id };
    }

    await assertProductAssetAvailable(product);
    const token = createDownloadToken(session.id, product.id, DOWNLOAD_TOKEN_TTL_SECONDS);
    const downloadUrl = buildDownloadUrl(token.token, origin);

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
  if (!fulfillment || fulfillment.status !== 'fulfilled') {
    throw new Error('Purchase has not been fulfilled.');
  }
  if (isBundleFulfillment(fulfillment)) {
    if (!getBundleDeliverables().some((p) => p.id === product.id)) {
      throw new Error('Download token does not match bundle purchase.');
    }
  } else if (fulfillment.productId !== product.id) {
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

  if (isBundleFulfillment(fulfillment)) {
    const downloads = [];
    const now = new Date().toISOString();
    for (const item of getBundleDeliverables()) {
      const token = createDownloadToken(sessionId, item.id, IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS);
      await redisSetJson(`download-token:${token.payload.jti}`, {
        sessionId,
        productId: item.id,
        bundle: true,
        email: fulfillment.email,
        createdAt: now,
        expiresAt: new Date(token.payload.exp * 1000).toISOString(),
        inPage: true
      }, IN_PAGE_DOWNLOAD_TOKEN_TTL_SECONDS);
      downloads.push({
        productId: item.id,
        productName: item.name,
        downloadUrl: buildDownloadUrl(token.token, origin),
        expiresAt: new Date(token.payload.exp * 1000).toISOString()
      });
    }
    return {
      status: 'ready',
      downloads,
      maskedEmail: maskEmail(fulfillment.email),
      productId: PRODUCTS.bundle.id,
      productName: PRODUCTS.bundle.name
    };
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

'use strict';

const { loadProductPdf, resolveDownload } = require('./_lib/fulfillment');
const { checkRateLimit, clientIp } = require('./_lib/rate-limit');

const MAX_TOKEN_LENGTH = 2048;
const IP_LIMIT = 30;
const IP_WINDOW_SECONDS = 60;

function sendText(res, statusCode, message) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(message);
}

module.exports = async function download(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendText(res, 405, 'Method not allowed');
    return;
  }

  const token = req.query && req.query.t ? String(req.query.t) : '';
  if (!token) {
    sendText(res, 400, 'Missing download token.');
    return;
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    sendText(res, 400, 'Invalid download token.');
    return;
  }

  try {
    const ipLimit = await checkRateLimit('download', clientIp(req), IP_LIMIT, IP_WINDOW_SECONDS);
    if (!ipLimit.allowed) {
      res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
      sendText(res, 429, 'Too many requests. Try again shortly.');
      return;
    }
  } catch (error) {
    console.error('[download] rate limit check failed:', error && error.message ? error.message : error);
    sendText(res, 503, 'Service temporarily unavailable.');
    return;
  }

  let product;
  try {
    const resolved = await resolveDownload(token);
    product = resolved.product;
  } catch (_error) {
    sendText(res, 403, 'Download link is invalid or expired.');
    return;
  }

  let pdf;
  try {
    pdf = await loadProductPdf(product);
  } catch (_error) {
    sendText(res, 503, 'PDF is not available yet. Please contact support.');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', pdf.contentType || 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${product.downloadFileName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (pdf.type === 'buffer') {
    res.end(pdf.body);
    return;
  }

  pdf.body.pipe(res);
};

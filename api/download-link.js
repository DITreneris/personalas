'use strict';

const { getDownloadUrlBySessionId } = require('./_lib/fulfillment');
const { checkRateLimit, clientIp } = require('./_lib/rate-limit');

const STRIPE_SESSION_ID_PATTERN = /^cs_(?:test|live)_[A-Za-z0-9]{20,}$/;
const IP_LIMIT = 30;
const IP_WINDOW_SECONDS = 60;
const SESSION_LIMIT = 10;
const SESSION_WINDOW_SECONDS = 60 * 15;

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(payload));
}

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return host ? `${proto}://${host}` : '';
}

function sendRateLimited(res, retryAfterSeconds) {
  res.setHeader('Retry-After', String(retryAfterSeconds));
  sendJson(res, 429, { status: 'error', error: 'Too many requests. Try again shortly.' });
}

module.exports = async function downloadLink(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const sessionId = req.query && req.query.session_id ? String(req.query.session_id) : '';
  if (!sessionId || !STRIPE_SESSION_ID_PATTERN.test(sessionId)) {
    sendJson(res, 400, { status: 'error', error: 'Invalid session id.' });
    return;
  }

  try {
    const ipLimit = await checkRateLimit('download-link', clientIp(req), IP_LIMIT, IP_WINDOW_SECONDS);
    if (!ipLimit.allowed) {
      sendRateLimited(res, ipLimit.retryAfterSeconds);
      return;
    }
    const sessionLimit = await checkRateLimit(
      'dl-session',
      sessionId,
      SESSION_LIMIT,
      SESSION_WINDOW_SECONDS
    );
    if (!sessionLimit.allowed) {
      sendRateLimited(res, sessionLimit.retryAfterSeconds);
      return;
    }
  } catch (error) {
    console.error('[download-link] rate limit check failed:', error && error.message ? error.message : error);
    sendJson(res, 503, { status: 'error', error: 'Service temporarily unavailable.' });
    return;
  }

  // Preview/local may pass Host-derived origin; production uses SITE_URL only.
  const origin = process.env.VERCEL_ENV === 'production' ? '' : getOrigin(req);

  let result;
  try {
    result = await getDownloadUrlBySessionId(sessionId, origin);
  } catch (_error) {
    sendJson(res, 404, { status: 'error', error: 'Unknown checkout session.' });
    return;
  }

  if (result.status === 'processing') {
    sendJson(res, 202, { status: 'processing' });
    return;
  }

  sendJson(res, 200, result);
};

'use strict';

const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Verify the Meta `X-Hub-Signature-256` header against the raw request body.
 *
 * Meta signs every webhook POST with:
 *   HMAC-SHA256(app_secret, raw_body)
 *
 * We MUST verify this before processing any webhook payload.
 * Without it, anyone can POST fake WhatsApp events to our endpoint.
 *
 * Reference: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function verifyMetaSignature(req, res, next) {
  // Skip in sandbox/test mode — tests don't have a real app secret
  if (process.env.SANDBOX_MODE === 'true' || process.env.NODE_ENV === 'test') {
    return next();
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    logger.warn('WHATSAPP_APP_SECRET not set — skipping Meta signature verification');
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature || typeof signature !== 'string') {
    logger.warn('Webhook rejected: missing X-Hub-Signature-256 header');
    return res.sendStatus(401);
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    logger.error('Webhook rejected: raw body not available for signature check');
    return res.sendStatus(500);
  }

  const expected = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')}`;

  // Use timingSafeEqual to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    logger.warn('Webhook rejected: invalid Meta signature');
    return res.sendStatus(401);
  }

  return next();
}

/**
 * Capture the raw body buffer before JSON parsing, so that
 * verifyMetaSignature can access it.  Mount this BEFORE express.json().
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Buffer} buf
 */
function captureRawBody(req, res, buf) {
  req.rawBody = buf;
}

module.exports = { verifyMetaSignature, captureRawBody };

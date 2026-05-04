'use strict';

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * Global rate limiter — 200 requests / 15 minutes per IP.
 * Protects against brute-force and DoS from a single IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logger.warn('Global rate limit exceeded', { ip: req.ip });
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  },
});

/**
 * Webhook-specific rate limiter — 60 requests / 1 minute per IP.
 * The Meta platform should send at most a handful of messages per second
 * per phone number; this prevents abuse from non-Meta sources.
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    logger.warn('Webhook rate limit exceeded', { ip: req.ip });
    // Return 200 to prevent Meta from retrying (it would interpret 4xx as failure)
    res.sendStatus(200);
  },
});

module.exports = { globalLimiter, webhookLimiter };

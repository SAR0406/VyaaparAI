'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const { whatsappRouter } = require('./bot/whatsapp');
const { logger } = require('./utils/logger');
const { checkEnv } = require('./utils/envCheck');
const { globalLimiter } = require('./middleware/rateLimiter');
const { captureRawBody } = require('./middleware/webhookAuth');

// Validate required environment variables at startup
checkEnv();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet());
// Disable powered-by header to avoid fingerprinting
app.disable('x-powered-by');

// Trust proxy for accurate IP in rate limiters (set to 1 if behind 1 proxy/LB)
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false);

// ── Global rate limiting ───────────────────────────────────────────────────
app.use(globalLimiter);

// ── Body parsing with raw-body capture for HMAC verification ──────────────
// Capture raw body BEFORE JSON parsing so the webhook signature check works
app.use(
  express.json({
    limit: '64kb',
    verify: captureRawBody,
  }),
);
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

// ── Health check (minimal information) ────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'VyapaarAI' });
});

// ── WhatsApp webhook routes ────────────────────────────────────────────────
app.use('/webhook', whatsappRouter);

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.sendStatus(404);
});

// ── Generic error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.sendStatus(500);
});

app.listen(PORT, () => {
  logger.info(`VyapaarAI server running on port ${PORT}`);
});

module.exports = app;

'use strict';

const express = require('express');
const { routeMessage } = require('./messageRouter');
const { verifyMetaSignature } = require('../middleware/webhookAuth');
const { webhookLimiter } = require('../middleware/rateLimiter');
const { isValidPhone } = require('../utils/validate');
const { logger } = require('../utils/logger');

const router = express.Router();

// Expected phone number ID from environment — reject payloads targeting other IDs
const EXPECTED_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * GET /webhook — Meta verification handshake
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    // Validate challenge is a safe numeric string before reflecting it
    if (typeof challenge !== 'string' || !/^\d+$/.test(challenge)) {
      return res.sendStatus(400);
    }
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * POST /webhook — Incoming WhatsApp messages
 * Order of middleware:
 *   1. webhookLimiter  — rate-limit non-Meta sources
 *   2. verifyMetaSignature — HMAC-SHA256 check against WHATSAPP_APP_SECRET
 *   3. handler         — process the validated payload
 */
router.post('/', webhookLimiter, verifyMetaSignature, async (req, res) => {
  // Acknowledge receipt immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value || !value.messages) continue;

        // Verify the incoming phone_number_id matches our configured number
        const incomingPhoneId = value.metadata?.phone_number_id;
        if (EXPECTED_PHONE_ID && incomingPhoneId !== EXPECTED_PHONE_ID) {
          logger.warn('Webhook payload for unexpected phone number ID — ignoring');
          continue;
        }

        for (const message of value.messages) {
          const from = message.from; // sender's phone number (with country code)
          const businessPhoneId = incomingPhoneId;

          // Validate sender phone number format before any processing
          if (!isValidPhone(from)) {
            logger.warn('Rejected message with invalid sender phone', { from });
            continue;
          }

          await routeMessage({ message, from, businessPhoneId });
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
  }
});

module.exports = { whatsappRouter: router };

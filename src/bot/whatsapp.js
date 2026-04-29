'use strict';

const express = require('express');
const { routeMessage } = require('./messageRouter');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /webhook — Meta verification handshake
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/**
 * POST /webhook — Incoming WhatsApp messages
 */
router.post('/', async (req, res) => {
  // Acknowledge receipt immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value || !value.messages) continue;

        for (const message of value.messages) {
          const from = message.from; // sender's phone number (with country code)
          const businessPhoneId = value.metadata.phone_number_id;

          await routeMessage({ message, from, businessPhoneId });
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
  }
});

module.exports = { whatsappRouter: router };

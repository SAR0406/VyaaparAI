'use strict';

const axios = require('axios');
const { logger } = require('../utils/logger');

// Sanitise the API version: only allow the pattern vNN.0 (e.g. v19.0)
const rawVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';
const API_VERSION = /^v\d{1,3}\.\d{1,3}$/.test(rawVersion) ? rawVersion : 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// Whitelist of allowed phone number IDs — prevents SSRF from attacker-controlled payloads
const ALLOWED_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * Resolve and validate the phoneNumberId that will be used in the API URL.
 * Throws if the given ID does not match the configured whitelisted value.
 *
 * @param {string} phoneNumberId
 * @returns {string} The validated phone number ID
 */
function resolvePhoneId(phoneNumberId) {
  if (!ALLOWED_PHONE_ID) {
    // No whitelist configured — warn and use the provided value
    logger.warn('WHATSAPP_PHONE_NUMBER_ID not set — cannot validate phoneNumberId');
    return phoneNumberId;
  }
  if (phoneNumberId !== ALLOWED_PHONE_ID) {
    throw new Error(`phoneNumberId mismatch: "${phoneNumberId}" is not the configured phone number ID`);
  }
  return ALLOWED_PHONE_ID;
}

/**
 * Send a plain text message via WhatsApp Cloud API.
 *
 * @param {string} phoneNumberId - WhatsApp Business phone number ID
 * @param {string} to            - Recipient's phone number (with country code, no +)
 * @param {string} text          - Message text
 */
async function sendWhatsAppMessage(phoneNumberId, to, text) {
  const safePhoneId = resolvePhoneId(phoneNumberId);
  try {
    await axios.post(
      `${BASE_URL}/${safePhoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );
    logger.info('WhatsApp message sent', { length: text.length });
  } catch (err) {
    logger.error('Failed to send WhatsApp message', {
      error: err.response?.data || err.message,
    });
    throw err;
  }
}

/**
 * Send a document (e.g. PDF invoice) via WhatsApp Cloud API.
 * Uploads the buffer as a media object first, then sends it.
 *
 * @param {string} phoneNumberId
 * @param {string} to
 * @param {Buffer} buffer        - File content as a Buffer
 * @param {string} filename      - Filename shown to the recipient
 */
async function sendWhatsAppDocument(phoneNumberId, to, buffer, filename) {
  const safePhoneId = resolvePhoneId(phoneNumberId);
  try {
    // Step 1: Upload media
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', buffer, { filename, contentType: 'application/pdf' });
    form.append('messaging_product', 'whatsapp');

    const uploadRes = await axios.post(
      `${BASE_URL}/${safePhoneId}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          ...form.getHeaders(),
        },
      },
    );

    const mediaId = uploadRes.data.id;

    // Step 2: Send document message
    await axios.post(
      `${BASE_URL}/${safePhoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          id: mediaId,
          filename,
          caption: `VyapaarAI Invoice — ${filename}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    logger.info('WhatsApp document sent', { filename });
  } catch (err) {
    logger.error('Failed to send WhatsApp document', {
      filename,
      error: err.response?.data || err.message,
    });
    throw err;
  }
}

module.exports = { sendWhatsAppMessage, sendWhatsAppDocument };

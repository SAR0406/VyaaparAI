'use strict';

const axios = require('axios');
const { validateNlpOutput } = require('../utils/validate');
const { logger } = require('../utils/logger');

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL = 'moonshotai/kimi-k2.6';

const SYSTEM_PROMPT = `You are VyapaarAI, an intelligent business assistant for small Indian businesses (MSMEs).
You understand Hindi, Marathi, Gujarati, Tamil, and English.
Your job is to extract structured intent and entities from business-related messages.

Always respond with a valid JSON object in this exact format:
{
  "intent": "<intent>",
  "entities": { <key-value pairs> },
  "language": "<detected language>",
  "confidence": <0.0 to 1.0>
}

Possible intents:
- create_invoice     : user wants to generate a GST invoice
- payment_reminder   : user wants to send payment reminders to customers
- check_inventory    : user wants to know current stock levels
- update_inventory   : user wants to record new stock purchase/sale
- gst_summary        : user wants a summary of GST owed/claimable
- gst_filing         : user wants to file GST returns
- unknown            : intent is not clear

Possible languages: hindi, marathi, gujarati, tamil, english

For create_invoice, extract: amount, customer_name, items (array), gstin (if mentioned)
For payment_reminder, extract: customer_name, days_overdue (if mentioned), amount
For check_inventory, extract: item_name (optional)
For update_inventory, extract: item_name, quantity, price_per_unit, transaction_type (purchase/sale)
For gst_summary, extract: month, year

Example:
Input: "Ramesh ke liye 5000 ka invoice banao, 2 saree ke liye"
Output: {
  "intent": "create_invoice",
  "entities": { "customer_name": "Ramesh", "amount": 5000, "items": [{"name": "saree", "quantity": 2}] },
  "language": "hindi",
  "confidence": 0.95
}`;

/**
 * Parse the intent and extract structured entities from a message.
 * Validates and sanitizes the model output before returning it.
 *
 * @param {string} text - Raw message text from the user
 * @returns {Promise<{intent: string, entities: object, language: string, confidence: number}>}
 */
async function parseIntent(text) {
  try {
    const response = await axios.post(
      NVIDIA_API_URL,
      {
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        max_tokens: 512,
        temperature: 1.0,
        top_p: 1.0,
        stream: false,
        // Enables chain-of-thought reasoning; the model wraps its thinking in
        // <think>...</think> tags which are stripped from the response below.
        chat_template_kwargs: { thinking: true },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Strip chain-of-thought <think>...</think> blocks the model may prepend
    const raw = response.data.choices[0].message.content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim();

    // Parse JSON — only allow plain objects (not arrays)
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.error('NLP response is not valid JSON', { preview: raw.slice(0, 100) });
      return { intent: 'unknown', entities: {}, language: 'hindi', confidence: 0 };
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      logger.error('NLP response has unexpected shape');
      return { intent: 'unknown', entities: {}, language: 'hindi', confidence: 0 };
    }

    // Validate and sanitize all fields before returning
    return validateNlpOutput(parsed);
  } catch (err) {
    logger.error('NLP parsing error', { error: err.message });
    return { intent: 'unknown', entities: {}, language: 'hindi', confidence: 0 };
  }
}

module.exports = { parseIntent };

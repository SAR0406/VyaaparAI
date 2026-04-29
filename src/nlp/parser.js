'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { logger } = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

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
 *
 * @param {string} text - Raw message text from the user
 * @returns {Promise<{intent: string, entities: object, language: string, confidence: number}>}
 */
async function parseIntent(text) {
  try {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const raw = response.content[0].text.trim();
    const parsed = JSON.parse(raw);

    return {
      intent: parsed.intent || 'unknown',
      entities: parsed.entities || {},
      language: parsed.language || 'hindi',
      confidence: parsed.confidence || 0.5,
    };
  } catch (err) {
    logger.error('NLP parsing error', { error: err.message, text });
    return { intent: 'unknown', entities: {}, language: 'hindi', confidence: 0 };
  }
}

module.exports = { parseIntent };

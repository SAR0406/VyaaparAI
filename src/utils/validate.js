'use strict';

/**
 * Input validation and sanitization utilities.
 * All public functions are pure (no side-effects) so they are easy to unit-test.
 */

// E.164-ish: 7–15 digits, optional leading + (Meta strips the +)
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

// Item/customer names: printable Unicode, no control characters, max 200 chars
const NAME_MAX_LEN = 200;
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F-\u009F]/g;

// Invoice amount bounds (in INR)
const AMOUNT_MIN = 0.01;
const AMOUNT_MAX = 10_000_000; // ₹1 crore per invoice — generous upper bound

/**
 * Validate a WhatsApp phone number (E.164 without leading +).
 *
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone);
}

/**
 * Sanitize a free-text name (customer, item, etc.):
 *  - Strips control characters
 *  - Trims whitespace
 *  - Caps at NAME_MAX_LEN characters
 *
 * @param {string} name
 * @returns {string}
 */
function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(CONTROL_CHAR_RE, '').trim().slice(0, NAME_MAX_LEN);
}

/**
 * Validate and coerce an invoice amount.
 * Returns the amount as a finite number, or null if invalid.
 *
 * @param {*} raw
 * @returns {number|null}
 */
function validateAmount(raw) {
  const num = Number(raw);
  if (!isFinite(num)) return null;
  if (num < AMOUNT_MIN || num > AMOUNT_MAX) return null;
  return parseFloat(num.toFixed(2));
}

/**
 * Validate a quantity (must be a positive integer or positive decimal ≤ 1,000,000).
 *
 * @param {*} raw
 * @returns {number|null}
 */
function validateQuantity(raw) {
  const num = Number(raw);
  if (!isFinite(num) || num <= 0 || num > 1_000_000) return null;
  return parseFloat(num.toFixed(4));
}

/**
 * Validate the structured output from the NLP parser to ensure it has the
 * expected shape and that entity values are sane before downstream use.
 *
 * @param {*} parsed - The object returned by Claude
 * @returns {{ intent: string, entities: object, language: string, confidence: number }}
 */
function validateNlpOutput(parsed) {
  const VALID_INTENTS = new Set([
    'create_invoice',
    'payment_reminder',
    'check_inventory',
    'update_inventory',
    'gst_summary',
    'gst_filing',
    'unknown',
  ]);

  const VALID_LANGUAGES = new Set(['hindi', 'marathi', 'gujarati', 'tamil', 'english']);

  // Intent
  const intent = (typeof parsed.intent === 'string' && VALID_INTENTS.has(parsed.intent))
    ? parsed.intent
    : 'unknown';

  // Language
  const language = (typeof parsed.language === 'string' && VALID_LANGUAGES.has(parsed.language))
    ? parsed.language
    : 'hindi';

  // Confidence
  const rawConf = Number(parsed.confidence);
  const confidence = (isFinite(rawConf) && rawConf >= 0 && rawConf <= 1) ? rawConf : 0.5;

  // Entities — accept only a plain object, never an array or prototype trick
  let rawEntities = parsed.entities;
  if (
    typeof rawEntities !== 'object' ||
    rawEntities === null ||
    Array.isArray(rawEntities) ||
    Object.getPrototypeOf(rawEntities) !== Object.prototype
  ) {
    rawEntities = {};
  }

  // Sanitize entity values that we know about
  const entities = { ...rawEntities };

  if (entities.customer_name != null) {
    entities.customer_name = sanitizeName(String(entities.customer_name));
  }
  if (entities.item_name != null) {
    entities.item_name = sanitizeName(String(entities.item_name));
  }
  if (entities.amount != null) {
    entities.amount = validateAmount(entities.amount);
  }
  if (entities.quantity != null) {
    entities.quantity = validateQuantity(entities.quantity);
  }
  if (entities.price_per_unit != null) {
    entities.price_per_unit = validateAmount(entities.price_per_unit);
  }
  if (entities.days_overdue != null) {
    const d = Math.floor(Number(entities.days_overdue));
    entities.days_overdue = (isFinite(d) && d >= 0 && d <= 3650) ? d : null;
  }
  if (entities.gstin != null) {
    entities.gstin = typeof entities.gstin === 'string'
      ? entities.gstin.trim().toUpperCase().slice(0, 15)
      : null;
  }
  if (entities.transaction_type != null) {
    entities.transaction_type = ['purchase', 'sale'].includes(entities.transaction_type)
      ? entities.transaction_type
      : 'purchase';
  }

  // Remove any prototype-polluting keys that slipped through
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    delete entities[key];
  }

  return { intent, entities, language, confidence };
}

/**
 * Partially mask a phone number for safe logging.
 * Keeps only the last 4 digits visible.
 *
 * @param {string} phone
 * @returns {string}  e.g. "******1234"
 */
function maskPhone(phone) {
  if (typeof phone !== 'string' || phone.length < 4) return '****';
  return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}

module.exports = {
  isValidPhone,
  sanitizeName,
  validateAmount,
  validateQuantity,
  validateNlpOutput,
  maskPhone,
  AMOUNT_MIN,
  AMOUNT_MAX,
  NAME_MAX_LEN,
};

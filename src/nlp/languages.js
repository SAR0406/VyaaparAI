'use strict';

/**
 * Supported languages and their configuration
 */
const SUPPORTED_LANGUAGES = {
  hindi: {
    code: 'hi',
    name: 'Hindi',
    script: 'Devanagari',
    greetings: ['नमस्ते', 'नमस्कार', 'हेलो', 'हाय'],
    keywords: ['invoice', 'बिल', 'भुगतान', 'stock', 'स्टॉक', 'GST', 'जीएसटी'],
  },
  marathi: {
    code: 'mr',
    name: 'Marathi',
    script: 'Devanagari',
    greetings: ['नमस्कार', 'नमस्ते'],
    keywords: ['invoice', 'बिल', 'पेमेंट', 'stock', 'स्टॉक', 'GST'],
  },
  gujarati: {
    code: 'gu',
    name: 'Gujarati',
    script: 'Gujarati',
    greetings: ['નમસ્તે', 'નમસ્કાર', 'હેલો'],
    keywords: ['invoice', 'બિલ', 'ચૂકવણી', 'stock', 'સ્ટોક', 'GST'],
  },
  tamil: {
    code: 'ta',
    name: 'Tamil',
    script: 'Tamil',
    greetings: ['வணக்கம்', 'ஹலோ'],
    keywords: ['invoice', 'பில்', 'கட்டணம்', 'stock', 'GST'],
  },
  english: {
    code: 'en',
    name: 'English',
    script: 'Latin',
    greetings: ['hello', 'hi', 'hey', 'namaste'],
    keywords: ['invoice', 'bill', 'payment', 'stock', 'inventory', 'GST'],
  },
};

/**
 * Simple heuristic language detection based on Unicode ranges.
 * Claude performs more accurate detection; this is a fast pre-filter.
 *
 * @param {string} text
 * @returns {string} language key (e.g. 'hindi')
 */
function detectLanguage(text) {
  if (!text) return 'hindi';

  const lower = text.toLowerCase();

  // Gujarati script: U+0A80–U+0AFF
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gujarati';

  // Tamil script: U+0B80–U+0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tamil';

  // Devanagari script (Hindi + Marathi): U+0900–U+097F
  if (/[\u0900-\u097F]/.test(text)) {
    // Basic Marathi distinguishing keywords
    if (/आहे|करा|सांगा|महिना/.test(text)) return 'marathi';
    return 'hindi';
  }

  // Latin script — default to English
  if (/^[a-z0-9\s\W]+$/.test(lower)) return 'english';

  return 'hindi'; // fallback
}

/**
 * Format a currency amount in Indian locale.
 *
 * @param {number} amount - Amount in INR
 * @param {string} language
 * @returns {string}
 */
function formatCurrency(amount, language = 'hindi') {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

  return formatted;
}

/**
 * Get a localised label for a given key.
 *
 * @param {string} key
 * @param {string} language
 * @returns {string}
 */
function getLabel(key, language = 'hindi') {
  const labels = {
    invoice: { hindi: 'बिल/इनवॉइस', marathi: 'बिल', gujarati: 'બિલ', tamil: 'பில்', english: 'Invoice' },
    total: { hindi: 'कुल राशि', marathi: 'एकूण रक्कम', gujarati: 'કુલ રકમ', tamil: 'மொத்தம்', english: 'Total Amount' },
    customer: { hindi: 'ग्राहक', marathi: 'ग्राहक', gujarati: 'ગ્રાહક', tamil: 'வாடிக்கையாளர்', english: 'Customer' },
    date: { hindi: 'तारीख', marathi: 'तारीख', gujarati: 'તારીખ', tamil: 'தேதி', english: 'Date' },
    gst: { hindi: 'जीएसटी', marathi: 'जीएसटी', gujarati: 'GST', tamil: 'GST', english: 'GST' },
    stock: { hindi: 'स्टॉक', marathi: 'स्टॉक', gujarati: 'સ્ટોક', tamil: 'ஸ்டாக்', english: 'Stock' },
    payment: { hindi: 'भुगतान', marathi: 'पेमेंट', gujarati: 'ચૂકવણી', tamil: 'பணம்', english: 'Payment' },
  };

  return (labels[key] && labels[key][language]) || (labels[key] && labels[key].english) || key;
}

module.exports = { detectLanguage, formatCurrency, getLabel, SUPPORTED_LANGUAGES };

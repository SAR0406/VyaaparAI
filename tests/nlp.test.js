'use strict';

const { detectLanguage, formatCurrency, getLabel, SUPPORTED_LANGUAGES } = require('../src/nlp/languages');

describe('Language Detection', () => {
  test('detects Hindi from Devanagari text', () => {
    expect(detectLanguage('नमस्ते, invoice बनाओ')).toBe('hindi');
  });

  test('detects Gujarati from Gujarati script', () => {
    expect(detectLanguage('નમસ્તે, invoice banavo')).toBe('gujarati');
  });

  test('detects Tamil from Tamil script', () => {
    expect(detectLanguage('வணக்கம், invoice')).toBe('tamil');
  });

  test('detects Marathi from Devanagari with Marathi keywords', () => {
    expect(detectLanguage('invoice तयार करा')).toBe('marathi');
  });

  test('defaults to Hindi for unknown script', () => {
    expect(detectLanguage('')).toBe('hindi');
    expect(detectLanguage(null)).toBe('hindi');
  });

  test('detects English for Latin script', () => {
    expect(detectLanguage('create invoice for 5000')).toBe('english');
  });
});

describe('Currency Formatting', () => {
  test('formats INR amounts correctly', () => {
    const result = formatCurrency(5000);
    expect(result).toContain('5,000');
    expect(result).toContain('₹');
  });

  test('formats large amounts with Indian numbering', () => {
    const result = formatCurrency(100000);
    expect(result).toContain('1,00,000');
  });

  test('handles zero amount', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('Label Localisation', () => {
  test('returns correct Hindi labels', () => {
    expect(getLabel('invoice', 'hindi')).toBe('बिल/इनवॉइस');
    expect(getLabel('customer', 'hindi')).toBe('ग्राहक');
  });

  test('returns correct English labels', () => {
    expect(getLabel('invoice', 'english')).toBe('Invoice');
    expect(getLabel('total', 'english')).toBe('Total Amount');
  });

  test('falls back to English for unsupported language', () => {
    expect(getLabel('invoice', 'swahili')).toBe('Invoice');
  });

  test('returns key for completely unknown labels', () => {
    expect(getLabel('unknown_key', 'hindi')).toBe('unknown_key');
  });
});

describe('Supported Languages', () => {
  test('includes all 5 supported languages', () => {
    expect(Object.keys(SUPPORTED_LANGUAGES)).toEqual(
      expect.arrayContaining(['hindi', 'marathi', 'gujarati', 'tamil', 'english']),
    );
  });

  test('each language has required fields', () => {
    for (const [, lang] of Object.entries(SUPPORTED_LANGUAGES)) {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('name');
      expect(lang).toHaveProperty('keywords');
      expect(Array.isArray(lang.keywords)).toBe(true);
    }
  });
});

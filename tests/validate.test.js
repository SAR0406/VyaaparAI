'use strict';

const {
  isValidPhone,
  sanitizeName,
  validateAmount,
  validateQuantity,
  validateNlpOutput,
  maskPhone,
  AMOUNT_MIN,
  AMOUNT_MAX,
  NAME_MAX_LEN,
} = require('../src/utils/validate');

describe('isValidPhone', () => {
  test('accepts valid 10-digit Indian numbers (no +)', () => {
    expect(isValidPhone('919876543210')).toBe(true); // +91 prefix
    expect(isValidPhone('9876543210')).toBe(true);   // 10 digits
  });

  test('accepts numbers with leading +', () => {
    expect(isValidPhone('+919876543210')).toBe(true);
  });

  test('rejects numbers that are too short', () => {
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('123456')).toBe(false);
  });

  test('rejects numbers that are too long', () => {
    expect(isValidPhone('1234567890123456')).toBe(false); // 16 digits
  });

  test('rejects non-string inputs', () => {
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
    expect(isValidPhone(9876543210)).toBe(false);
  });

  test('rejects numbers starting with 0', () => {
    expect(isValidPhone('01234567890')).toBe(false);
  });

  test('rejects strings with non-digit characters', () => {
    expect(isValidPhone('9876abc210')).toBe(false);
  });
});

describe('sanitizeName', () => {
  test('trims whitespace', () => {
    expect(sanitizeName('  Ramesh  ')).toBe('Ramesh');
  });

  test('strips control characters', () => {
    expect(sanitizeName('Ram\u0000esh')).toBe('Ramesh');
    expect(sanitizeName('Ram\u001Fesh')).toBe('Ramesh');
  });

  test('caps at NAME_MAX_LEN', () => {
    const long = 'A'.repeat(300);
    expect(sanitizeName(long).length).toBe(NAME_MAX_LEN);
  });

  test('returns empty string for non-string inputs', () => {
    expect(sanitizeName(null)).toBe('');
    expect(sanitizeName(undefined)).toBe('');
    expect(sanitizeName(123)).toBe('');
  });

  test('preserves Unicode (Hindi names)', () => {
    expect(sanitizeName('रमेश')).toBe('रमेश');
  });
});

describe('validateAmount', () => {
  test('accepts valid positive amounts', () => {
    expect(validateAmount(5000)).toBe(5000);
    expect(validateAmount('5000')).toBe(5000);
    expect(validateAmount(0.01)).toBe(0.01);
  });

  test('rounds to 2 decimal places', () => {
    expect(validateAmount(5000.999)).toBe(5001);
    expect(validateAmount(99.996)).toBe(100);
  });

  test('rejects zero', () => {
    expect(validateAmount(0)).toBeNull();
  });

  test('rejects negative amounts', () => {
    expect(validateAmount(-100)).toBeNull();
  });

  test(`rejects amounts above AMOUNT_MAX (${AMOUNT_MAX})`, () => {
    expect(validateAmount(AMOUNT_MAX + 1)).toBeNull();
  });

  test('rejects NaN and Infinity', () => {
    expect(validateAmount(NaN)).toBeNull();
    expect(validateAmount(Infinity)).toBeNull();
    expect(validateAmount(-Infinity)).toBeNull();
  });

  test('rejects non-numeric strings', () => {
    expect(validateAmount('abc')).toBeNull();
  });

  test('returns null for null/undefined', () => {
    expect(validateAmount(null)).toBeNull();
    expect(validateAmount(undefined)).toBeNull();
  });
});

describe('validateQuantity', () => {
  test('accepts positive quantities', () => {
    expect(validateQuantity(10)).toBe(10);
    expect(validateQuantity('50.5')).toBe(50.5);
  });

  test('rejects zero and negative', () => {
    expect(validateQuantity(0)).toBeNull();
    expect(validateQuantity(-5)).toBeNull();
  });

  test('rejects quantities above 1,000,000', () => {
    expect(validateQuantity(1_000_001)).toBeNull();
  });

  test('rejects NaN', () => {
    expect(validateQuantity(NaN)).toBeNull();
  });
});

describe('validateNlpOutput', () => {
  const good = {
    intent: 'create_invoice',
    entities: { customer_name: 'Ramesh', amount: 5000 },
    language: 'hindi',
    confidence: 0.95,
  };

  test('passes through a valid response', () => {
    const out = validateNlpOutput(good);
    expect(out.intent).toBe('create_invoice');
    expect(out.language).toBe('hindi');
    expect(out.confidence).toBe(0.95);
    expect(out.entities.customer_name).toBe('Ramesh');
    expect(out.entities.amount).toBe(5000);
  });

  test('falls back intent to "unknown" for unrecognised value', () => {
    const out = validateNlpOutput({ ...good, intent: 'delete_all' });
    expect(out.intent).toBe('unknown');
  });

  test('falls back language to "hindi" for unrecognised value', () => {
    const out = validateNlpOutput({ ...good, language: 'klingon' });
    expect(out.language).toBe('hindi');
  });

  test('clamps confidence to [0,1]', () => {
    expect(validateNlpOutput({ ...good, confidence: 99 }).confidence).toBe(0.5);
    expect(validateNlpOutput({ ...good, confidence: -1 }).confidence).toBe(0.5);
  });

  test('strips __proto__ from entities to prevent prototype pollution', () => {
    const malicious = {
      intent: 'unknown',
      entities: JSON.parse('{"__proto__":{"hacked":true},"item":"ok"}'),
      language: 'english',
      confidence: 0.5,
    };
    const out = validateNlpOutput(malicious);
    // __proto__ key should have been deleted — it must not appear as own property
    expect(Object.prototype.hasOwnProperty.call(out.entities, '__proto__')).toBe(false);
    // Prototype pollution must not have occurred on Object.prototype
    expect({}.hacked).toBeUndefined();
  });

  test('sanitizes customer_name', () => {
    const out = validateNlpOutput({
      ...good,
      entities: { customer_name: 'Ram\u0000esh  ' },
    });
    expect(out.entities.customer_name).toBe('Ramesh');
  });

  test('validates amount in entities', () => {
    const out = validateNlpOutput({ ...good, entities: { amount: -9999 } });
    expect(out.entities.amount).toBeNull();
  });

  test('validates transaction_type in entities — rejects unknown', () => {
    const out = validateNlpOutput({
      ...good,
      entities: { transaction_type: 'steal' },
    });
    expect(out.entities.transaction_type).toBe('purchase');
  });

  test('handles entities that is not a plain object', () => {
    const out = validateNlpOutput({ ...good, entities: [1, 2, 3] });
    expect(out.entities).toEqual({});
  });

  test('handles entirely missing fields gracefully', () => {
    const out = validateNlpOutput({});
    expect(out.intent).toBe('unknown');
    expect(out.language).toBe('hindi');
    expect(out.entities).toEqual({});
  });
});

describe('maskPhone', () => {
  test('hides all but last 4 digits', () => {
    expect(maskPhone('919876543210')).toBe('********3210');
  });

  test('works for short numbers', () => {
    expect(maskPhone('1234')).toBe('1234');
  });

  test('handles non-string inputs gracefully', () => {
    expect(maskPhone(null)).toBe('****');
    expect(maskPhone('')).toBe('****');
  });
});

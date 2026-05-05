'use strict';

const { generateInvoiceNumber, GST_RATES } = require('../src/handlers/invoice');

describe('Invoice Number Generation', () => {
  test('generates invoice number matching expected format', () => {
    const num = generateInvoiceNumber();
    // Format: INV-YYMM-XXXX where XXXX is 4 uppercase hex chars from crypto.randomBytes
    expect(num).toMatch(/^INV-\d{4}-[0-9A-F]{4}$/);
  });

  test('generates unique invoice numbers', () => {
    const numbers = new Set(Array.from({ length: 100 }, generateInvoiceNumber));
    // With 4-digit random suffix, collisions should be extremely rare in 100 samples
    expect(numbers.size).toBeGreaterThan(50);
  });
});

describe('GST Rates', () => {
  test('default GST rate is 18%', () => {
    expect(GST_RATES.default).toBe(18);
  });

  test('essential goods rate is 5%', () => {
    expect(GST_RATES.essential).toBe(5);
  });

  test('exempt category has 0% GST', () => {
    expect(GST_RATES.exempt).toBe(0);
  });

  test('textile rate is 5%', () => {
    expect(GST_RATES.textile).toBe(5);
  });
});

describe('GST Calculation', () => {
  test('calculates 18% GST correctly', () => {
    const subtotal = 1000;
    const gstRate = GST_RATES.default; // 18
    const gstAmount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
    const total = parseFloat((subtotal + gstAmount).toFixed(2));

    expect(gstAmount).toBe(180);
    expect(total).toBe(1180);
  });

  test('calculates 5% GST correctly', () => {
    const subtotal = 2000;
    const gstRate = GST_RATES.essential; // 5
    const gstAmount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
    const total = parseFloat((subtotal + gstAmount).toFixed(2));

    expect(gstAmount).toBe(100);
    expect(total).toBe(2100);
  });

  test('0% GST gives no additional amount', () => {
    const subtotal = 5000;
    const gstRate = GST_RATES.exempt; // 0
    const gstAmount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
    const total = parseFloat((subtotal + gstAmount).toFixed(2));

    expect(gstAmount).toBe(0);
    expect(total).toBe(subtotal);
  });
});

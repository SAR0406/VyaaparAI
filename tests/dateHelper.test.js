'use strict';

const { formatIndianDate, getGstPeriod, getGstr3bDueDate, checkPaymentOverdue } = require('../src/utils/dateHelper');

describe('formatIndianDate', () => {
  test('returns a date string in DD/MM/YYYY format', () => {
    const date = new Date('2025-04-15');
    const result = formatIndianDate(date);
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toContain('2025');
  });

  test('defaults to today when no date provided', () => {
    const result = formatIndianDate();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getGstPeriod', () => {
  test('returns MMYYYY format', () => {
    const date = new Date('2025-04-01');
    const result = getGstPeriod(date);
    expect(result).toBe('042025');
  });

  test('pads single-digit months with zero', () => {
    const date = new Date('2025-03-01');
    const result = getGstPeriod(date);
    expect(result).toBe('032025');
  });

  test('handles December correctly', () => {
    const date = new Date('2025-12-01');
    const result = getGstPeriod(date);
    expect(result).toBe('122025');
  });
});

describe('getGstr3bDueDate', () => {
  test('returns the 20th of the following month', () => {
    const date = new Date('2025-04-01');
    const dueDate = getGstr3bDueDate(date);
    expect(dueDate.getDate()).toBe(20);
    expect(dueDate.getMonth()).toBe(4); // May (0-indexed)
    expect(dueDate.getFullYear()).toBe(2025);
  });

  test('handles December correctly (rolls to January next year)', () => {
    const date = new Date('2025-12-01');
    const dueDate = getGstr3bDueDate(date);
    expect(dueDate.getDate()).toBe(20);
    expect(dueDate.getMonth()).toBe(0); // January
    expect(dueDate.getFullYear()).toBe(2026);
  });
});

describe('checkPaymentOverdue', () => {
  test('correctly identifies an overdue payment', () => {
    const invoiceDate = new Date();
    invoiceDate.setDate(invoiceDate.getDate() - 45); // 45 days ago
    const { overdue, daysOverdue } = checkPaymentOverdue(invoiceDate, 30);
    expect(overdue).toBe(true);
    expect(daysOverdue).toBe(15);
  });

  test('correctly identifies a non-overdue payment', () => {
    const invoiceDate = new Date(); // today
    const { overdue, daysOverdue } = checkPaymentOverdue(invoiceDate, 30);
    expect(overdue).toBe(false);
    expect(daysOverdue).toBe(0);
  });

  test('uses 30-day default payment terms', () => {
    const invoiceDate = new Date();
    invoiceDate.setDate(invoiceDate.getDate() - 35);
    const { overdue } = checkPaymentOverdue(invoiceDate);
    expect(overdue).toBe(true);
  });
});

'use strict';

const { validateGstin } = require('../src/integrations/gstPortal');

// Run in sandbox mode during tests
process.env.SANDBOX_MODE = 'true';

describe('validateGstin', () => {
  test('returns false for null/empty GSTIN', async () => {
    expect(await validateGstin(null)).toBe(false);
    expect(await validateGstin('')).toBe(false);
    expect(await validateGstin(undefined)).toBe(false);
  });

  test('returns false for GSTIN with invalid format (too short)', async () => {
    expect(await validateGstin('27ABCDE1234')).toBe(false);
  });

  test('returns false for GSTIN with invalid characters (special chars)', async () => {
    // Contains special characters — will never match the regex
    expect(await validateGstin('27!@#DE1234F1Z5')).toBe(false);
  });

  test('returns false for GSTIN missing Z in position 14', async () => {
    // Position 14 (0-indexed 13) must be Z
    expect(await validateGstin('27ABCDE1234F1A5')).toBe(false);
  });

  test('returns true for a valid GSTIN format in sandbox mode', async () => {
    // Valid format: 2-digit state + 5 uppercase letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
    expect(await validateGstin('27AAPFU0939F1ZV')).toBe(true);
  });

  test('returns true for another valid GSTIN format', async () => {
    expect(await validateGstin('29AABCT1332L1ZD')).toBe(true);
  });
});

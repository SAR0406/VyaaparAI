'use strict';

const { getHelpMessage } = require('../src/bot/messageRouter');

describe('getHelpMessage', () => {
  test('returns Hindi help message for hindi language', () => {
    const msg = getHelpMessage('hindi');
    expect(msg).toContain('VyapaarAI');
    expect(msg).toContain('invoice');
  });

  test('returns English help message for english language', () => {
    const msg = getHelpMessage('english');
    expect(msg).toContain('VyapaarAI');
    expect(msg).toContain('Invoice');
    expect(msg).toContain('Stock');
    expect(msg).toContain('GST');
  });

  test('returns Marathi help message for marathi language', () => {
    const msg = getHelpMessage('marathi');
    expect(msg).toContain('VyapaarAI');
  });

  test('returns Gujarati help message for gujarati language', () => {
    const msg = getHelpMessage('gujarati');
    expect(msg).toContain('VyapaarAI');
  });

  test('defaults to Hindi for unknown language', () => {
    const msg = getHelpMessage('unknown');
    // Falls back to Hindi (same as hindi message)
    expect(msg).toBe(getHelpMessage('hindi'));
  });
});

'use strict';

const { buildReminderMessage } = require('../src/handlers/reminder');

describe('buildReminderMessage', () => {
  test('builds Hindi reminder with amount and days overdue', () => {
    const msg = buildReminderMessage({
      customerName: 'Ramesh',
      amount: 5000,
      daysOverdue: 15,
      language: 'hindi',
    });
    expect(msg).toContain('Ramesh');
    expect(msg).toContain('5,000');
    expect(msg).toContain('15 दिन');
  });

  test('builds English reminder', () => {
    const msg = buildReminderMessage({
      customerName: 'Suresh',
      amount: 10000,
      daysOverdue: 7,
      language: 'english',
    });
    expect(msg).toContain('Suresh');
    expect(msg).toContain('10,000');
    expect(msg).toContain('7 days');
  });

  test('builds Marathi reminder', () => {
    const msg = buildReminderMessage({
      customerName: 'Ganesh',
      amount: 2500,
      daysOverdue: null,
      language: 'marathi',
    });
    expect(msg).toContain('Ganesh');
  });

  test('builds Gujarati reminder', () => {
    const msg = buildReminderMessage({
      customerName: 'Hasmukh',
      amount: 7500,
      daysOverdue: 30,
      language: 'gujarati',
    });
    expect(msg).toContain('Hasmukh');
  });

  test('falls back to Hindi for unknown language', () => {
    const msg = buildReminderMessage({
      customerName: 'Test',
      amount: 1000,
      daysOverdue: 5,
      language: 'swahili',
    });
    // Should still return a valid message (hindi fallback)
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  test('handles missing amount gracefully', () => {
    const msg = buildReminderMessage({
      customerName: 'Ram',
      amount: undefined,
      daysOverdue: 10,
      language: 'hindi',
    });
    expect(msg).toContain('Ram');
    expect(typeof msg).toBe('string');
  });
});

'use strict';

/**
 * Startup environment-variable check.
 * Call this once at application boot.  Throws (or logs + exits) if required
 * variables are missing so the server never starts in a broken state.
 */

const REQUIRED_VARS = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_VERIFY_TOKEN',
  'CLAUDE_API_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

// Optional but warn if absent
const RECOMMENDED_VARS = [
  'DATABASE_URL',
  'WHATSAPP_APP_SECRET',
];

/**
 * Validate required environment variables.
 * In production, exits the process on failure.
 * In test/dev, logs a warning so tests can still run without real credentials.
 *
 * @param {{ exitOnError?: boolean }} [options]
 */
function checkEnv({ exitOnError = process.env.NODE_ENV === 'production' } = {}) {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);
  const recommended = RECOMMENDED_VARS.filter((v) => !process.env[v]);

  if (recommended.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[VyapaarAI] Recommended env vars not set: ${recommended.join(', ')}`);
  }

  if (missing.length > 0) {
    const msg = `[VyapaarAI] FATAL: Required environment variables are not set: ${missing.join(', ')}`;
    if (exitOnError) {
      // eslint-disable-next-line no-console
      console.error(msg);
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.warn(msg);
    }
  }
}

module.exports = { checkEnv, REQUIRED_VARS };

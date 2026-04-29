'use strict';

const axios = require('axios');
const { logger } = require('../utils/logger');

const GST_API_BASE = process.env.GST_API_BASE_URL || 'https://api.gst.gov.in';

function isSandbox() {
  return process.env.SANDBOX_MODE === 'true';
}

/**
 * Validate a GSTIN number using the Government's GST API.
 *
 * A GSTIN is 15 characters: 2-digit state code + 10-char PAN + 1 entity +
 * 1 check digit with a specific regex pattern.
 *
 * @param {string} gstin
 * @returns {Promise<boolean>}
 */
async function validateGstin(gstin) {
  if (!gstin) return false;

  // Basic format validation (regex) before API call
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!GSTIN_REGEX.test(gstin.toUpperCase())) {
    logger.info('GSTIN failed format check', { gstin });
    return false;
  }

  if (isSandbox()) {
    logger.info('GSTIN validation skipped (sandbox mode)', { gstin });
    return true;
  }

  try {
    const response = await axios.get(`${GST_API_BASE}/commonapi/V1.1/search`, {
      params: { action: 'TP', gstin: gstin.toUpperCase() },
      timeout: 5000,
    });

    const isActive = response.data?.sts === 'Active';
    logger.info('GSTIN validation result', { gstin, isActive });
    return isActive;
  } catch (err) {
    logger.error('GSTIN validation API error', { gstin, error: err.message });
    // Fail open on API error — don't block the user
    return true;
  }
}

/**
 * Generate an e-Invoice (IRN) via the Invoice Registration Portal (IRP).
 * This is required for businesses with turnover > ₹10 Cr (from April 2025).
 *
 * @param {object} invoiceData
 * @returns {Promise<{irn: string, qrCode: string}|null>}
 */
async function generateEInvoice(invoiceData) {
  if (isSandbox()) {
    logger.info('E-Invoice generation skipped (sandbox mode)');
    return { irn: `SANDBOX-IRN-${Date.now()}`, qrCode: null };
  }

  try {
    const response = await axios.post(
      `${process.env.IRP_API_URL}/eivital/v1.04/Invoice`,
      invoiceData,
      {
        headers: {
          'Content-Type': 'application/json',
          'user_name': process.env.GST_USERNAME,
          'AuthToken': process.env.GST_AUTH_TOKEN,
          'Gstin': process.env.BUSINESS_GSTIN,
        },
        timeout: 10000,
      },
    );

    return {
      irn: response.data?.Irn,
      qrCode: response.data?.SignedQRCode,
    };
  } catch (err) {
    logger.error('E-Invoice generation failed', { error: err.message });
    return null;
  }
}

/**
 * Fetch GSTR-1 data for a given period.
 *
 * @param {string} gstin
 * @param {string} period - Format: MMYYYY (e.g., '042025')
 * @returns {Promise<object|null>}
 */
async function getGstr1Data(gstin, period) {
  if (isSandbox()) {
    return { status: 'Not Filed', period, gstin };
  }

  try {
    const response = await axios.get(`${GST_API_BASE}/returns/gstr1`, {
      params: { gstin, ret_period: period },
      headers: { AuthToken: process.env.GST_AUTH_TOKEN },
      timeout: 10000,
    });
    return response.data;
  } catch (err) {
    logger.error('Failed to fetch GSTR-1 data', { gstin, period, error: err.message });
    return null;
  }
}

module.exports = { validateGstin, generateEInvoice, getGstr1Data };

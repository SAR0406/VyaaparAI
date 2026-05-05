'use strict';

const crypto = require('crypto');
const Razorpay = require('razorpay');
const { logger } = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Subscription plan IDs — create these in the Razorpay dashboard
const PLANS = {
  starter: {
    name: 'Starter',
    amount: parseInt(process.env.PLAN_STARTER_AMOUNT || '49900', 10), // ₹499 in paise
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    description: 'GST Invoice + Payment Reminders + Basic Inventory',
  },
  growth: {
    name: 'Growth',
    amount: parseInt(process.env.PLAN_GROWTH_AMOUNT || '99900', 10), // ₹999 in paise
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    description: 'Everything in Starter + Auto GST Filing + P&L + Cash Flow Prediction',
  },
  enterprise: {
    name: 'Enterprise',
    amount: parseInt(process.env.PLAN_ENTERPRISE_AMOUNT || '299900', 10), // ₹2,999 in paise
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    description: 'Everything + B2B Marketplace + Embedded Lending + API Access',
  },
};

/**
 * Create a new Razorpay subscription for a business.
 *
 * @param {object} params
 * @param {string} params.planId  - Razorpay Plan ID (created in dashboard)
 * @param {number} params.totalCount - Total billing cycles (e.g., 12 for annual)
 * @param {string} params.customerPhone
 * @param {string} params.customerName
 * @returns {Promise<object>} Razorpay subscription object
 */
async function createSubscription({ planId, totalCount = 12, customerPhone, customerName }) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        phone: customerPhone,
        name: customerName,
        source: 'VyapaarAI WhatsApp',
      },
    });

    logger.info('Razorpay subscription created', { subscriptionId: subscription.id });

    return subscription;
  } catch (err) {
    logger.error('Failed to create Razorpay subscription', { error: err.message });
    throw err;
  }
}

/**
 * Verify a Razorpay payment signature for order-based payments.
 *
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean}
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex'),
  );
}

/**
 * Verify a Razorpay webhook event signature.
 * Razorpay signs webhook payloads using HMAC-SHA256 with the webhook secret.
 *
 * @param {Buffer|string} rawBody   - Raw request body (must not be parsed)
 * @param {string}        signature - Value of 'X-Razorpay-Signature' header
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not set — skipping webhook signature check');
    return false;
  }
  if (!signature || !rawBody) return false;

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');

  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Express middleware that validates the Razorpay webhook signature.
 * Mount on the Razorpay webhook route BEFORE parsing the body.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function razorpayWebhookAuth(req, res, next) {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody;

  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Razorpay webhook rejected: invalid signature');
    return res.sendStatus(401);
  }
  return next();
}

/**
 * Get the payment link URL for onboarding a new subscriber via WhatsApp.
 *
 * @param {object} params
 * @param {string} params.planKey
 * @param {string} params.customerPhone
 * @param {string} params.customerName
 * @returns {Promise<string>} Payment link URL
 */
async function createPaymentLink({ planKey, customerPhone, customerName }) {
  const plan = PLANS[planKey] || PLANS.starter;

  try {
    const link = await razorpay.paymentLink.create({
      amount: plan.amount,
      currency: 'INR',
      accept_partial: false,
      description: `VyapaarAI ${plan.name} Plan — ${plan.description}`,
      customer: {
        name: customerName,
        contact: `+${customerPhone}`,
      },
      notify: { sms: true, whatsapp: true },
      reminder_enable: true,
      notes: { source: 'VyapaarAI', plan: planKey },
    });

    return link.short_url;
  } catch (err) {
    logger.error('Failed to create payment link', { error: err.message });
    throw err;
  }
}

module.exports = {
  createSubscription,
  verifyPaymentSignature,
  verifyWebhookSignature,
  razorpayWebhookAuth,
  createPaymentLink,
  PLANS,
};

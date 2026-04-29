'use strict';

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
 * @param {string} params.planKey - 'starter' | 'growth' | 'enterprise'
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

    logger.info('Razorpay subscription created', {
      subscriptionId: subscription.id,
      customerPhone,
    });

    return subscription;
  } catch (err) {
    logger.error('Failed to create Razorpay subscription', { error: err.message });
    throw err;
  }
}

/**
 * Verify a Razorpay payment signature (webhook validation).
 *
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean}
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const crypto = require('crypto');
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
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

module.exports = { createSubscription, verifyPaymentSignature, createPaymentLink, PLANS };

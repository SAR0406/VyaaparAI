'use strict';

/**
 * Date utility helpers for VyapaarAI.
 * Handles Indian locale formatting and GST-specific date calculations.
 */

/**
 * Format a date in Indian locale (DD/MM/YYYY).
 *
 * @param {Date} date
 * @returns {string}
 */
function formatIndianDate(date = new Date()) {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Get the GST return period string for a given date.
 * Format: MMYYYY — used in GST portal API calls.
 *
 * @param {Date} date
 * @returns {string}  e.g. '042025'
 */
function getGstPeriod(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}${year}`;
}

/**
 * Get the GSTR-3B due date for a given month.
 * Due date is the 20th of the following month.
 *
 * @param {Date} date
 * @returns {Date}
 */
function getGstr3bDueDate(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 20);
}

/**
 * Check whether a payment is overdue given the invoice date and net days.
 *
 * @param {Date} invoiceDate
 * @param {number} netDays - Payment terms in days (e.g. 30)
 * @returns {{ overdue: boolean, daysOverdue: number }}
 */
function checkPaymentOverdue(invoiceDate, netDays = 30) {
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + netDays);
  const today = new Date();
  const diffMs = today - dueDate;
  const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return {
    overdue: daysOverdue > 0,
    daysOverdue: Math.max(0, daysOverdue),
  };
}

module.exports = { formatIndianDate, getGstPeriod, getGstr3bDueDate, checkPaymentOverdue };

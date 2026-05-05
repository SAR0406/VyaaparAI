'use strict';

const { sendWhatsAppMessage } = require('../integrations/whatsapp');
const { validateGstin } = require('../integrations/gstPortal');
const { formatCurrency } = require('../nlp/languages');
const { logger } = require('../utils/logger');

/**
 * Handle GST-related intents (summary or filing).
 *
 * @param {object} params
 * @param {string} params.from
 * @param {object} params.entities
 * @param {string} params.language
 * @param {string} params.businessPhoneId
 * @param {string} params.intent - 'gst_summary' | 'gst_filing'
 */
async function handleGst({ from, entities, language, businessPhoneId, intent }) {
  if (intent === 'gst_summary') {
    await gstSummary({ from, entities, language, businessPhoneId });
  } else {
    await gstFiling({ from, entities, language, businessPhoneId });
  }
}

async function gstSummary({ from, entities, language, businessPhoneId }) {
  const now = new Date();
  const month = entities.month || now.toLocaleString('en-IN', { month: 'long' });
  const year = entities.year || now.getFullYear();

  // In production: fetch actual transaction data from DB and compute real figures
  // This is placeholder data for MVP demonstration
  const summary = {
    month,
    year,
    totalSales: 125000,
    totalPurchases: 78000,
    outputGst: 22500,   // GST collected from customers
    inputGst: 14040,    // GST paid on purchases (ITC)
    netGstPayable: 8460, // outputGst - inputGst
    dueDate: getGstDueDate(now),
  };

  const msg = getGstSummaryMessage({ summary, language });
  await sendWhatsAppMessage(businessPhoneId, from, msg);

  logger.info('GST summary sent', { from, month, year });
}

async function gstFiling({ from, entities, language, businessPhoneId }) {
  // Phase 2 feature: auto-file GSTR-1 and GSTR-3B via GST portal API
  const comingSoonMessages = {
    hindi: `🚧 *GST Auto-Filing जल्द आ रहा है!*

अभी आप अपना GST Summary देखें और CA को forward करें।

Type करें: "GST summary dikhao"`,
    marathi: `🚧 *GST Auto-Filing लवकरच येत आहे!*

सध्या GST Summary पहा.`,
    gujarati: `🚧 *GST Auto-Filing ટૂંક સમયમાં આવી રહ્યું છે!*`,
    english: `🚧 *GST Auto-Filing coming soon!*

For now, view your GST Summary and share with your CA.

Type: "show GST summary"`,
  };

  await sendWhatsAppMessage(businessPhoneId, from, comingSoonMessages[language] || comingSoonMessages.hindi);
}

function getGstDueDate(date) {
  // GSTR-3B is due on the 20th of the next month
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 20);
  return nextMonth.toLocaleDateString('en-IN');
}

function getGstSummaryMessage({ summary, language }) {
  const { month, year, totalSales, totalPurchases, outputGst, inputGst, netGstPayable, dueDate } = summary;

  const messages = {
    hindi: `📊 *${month} ${year} — GST Summary*

💰 कुल बिक्री: ${formatCurrency(totalSales)}
🛒 कुल खरीद: ${formatCurrency(totalPurchases)}

━━━━━━━━━━━━━━━
📤 Output GST (जो मिला): ${formatCurrency(outputGst)}
📥 Input Tax Credit (ITC): ${formatCurrency(inputGst)}
━━━━━━━━━━━━━━━
💵 *Net GST जमा करना है: ${formatCurrency(netGstPayable)}*
📅 Due Date: ${dueDate}

${netGstPayable > 0 ? '⚠️ समय पर payment करें, penalty से बचें!' : '✅ इस महीने कोई GST नहीं देना है!'}`,

    marathi: `📊 *${month} ${year} — GST Summary*

💰 एकूण विक्री: ${formatCurrency(totalSales)}
🛒 एकूण खरेदी: ${formatCurrency(totalPurchases)}
📤 Output GST: ${formatCurrency(outputGst)}
📥 ITC: ${formatCurrency(inputGst)}
💵 *भरायचे GST: ${formatCurrency(netGstPayable)}*
📅 Due Date: ${dueDate}`,

    gujarati: `📊 *${month} ${year} — GST Summary*

💰 કુલ વેચાણ: ${formatCurrency(totalSales)}
🛒 કુલ ખરીદી: ${formatCurrency(totalPurchases)}
📤 Output GST: ${formatCurrency(outputGst)}
📥 ITC: ${formatCurrency(inputGst)}
💵 *ભરવાનો GST: ${formatCurrency(netGstPayable)}*
📅 Due Date: ${dueDate}`,

    english: `📊 *${month} ${year} — GST Summary*

💰 Total Sales: ${formatCurrency(totalSales)}
🛒 Total Purchases: ${formatCurrency(totalPurchases)}
📤 Output GST (collected): ${formatCurrency(outputGst)}
📥 Input Tax Credit (ITC): ${formatCurrency(inputGst)}
💵 *Net GST Payable: ${formatCurrency(netGstPayable)}*
📅 Due Date: ${dueDate}

${netGstPayable > 0 ? '⚠️ Pay on time to avoid penalty!' : '✅ No GST payable this month!'}`,
  };

  return messages[language] || messages.hindi;
}

module.exports = { handleGst, getGstDueDate };

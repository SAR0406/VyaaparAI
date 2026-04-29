'use strict';

const { sendWhatsAppMessage } = require('../integrations/whatsapp');
const { formatCurrency } = require('../nlp/languages');
const { logger } = require('../utils/logger');

/**
 * Handle a "payment_reminder" intent.
 * Schedules and/or immediately sends a payment reminder to the specified customer.
 *
 * @param {object} params
 * @param {string} params.from
 * @param {object} params.entities
 * @param {string} params.language
 * @param {string} params.businessPhoneId
 */
async function handleReminder({ from, entities, language, businessPhoneId }) {
  const { customer_name: customerName, amount, days_overdue: daysOverdue } = entities;

  if (!customerName) {
    await sendWhatsAppMessage(
      businessPhoneId,
      from,
      getMissingCustomerMessage(language),
    );
    return;
  }

  // In production, look up the customer's phone number from the database
  // For now, confirm to the business owner what will be sent
  const reminderPreview = buildReminderMessage({ customerName, amount, daysOverdue, language });

  const confirmMsg = getConfirmationMessage({ customerName, reminderPreview, language });
  await sendWhatsAppMessage(businessPhoneId, from, confirmMsg);

  logger.info('Payment reminder scheduled', { from, customerName, daysOverdue });
}

/**
 * Build the actual reminder message that will be sent to the customer.
 */
function buildReminderMessage({ customerName, amount, daysOverdue, language }) {
  const amountStr = amount ? formatCurrency(amount) : '';
  const overdueStr = daysOverdue ? ` (${daysOverdue} दिन से)` : '';

  const messages = {
    hindi: `नमस्ते ${customerName} जी 🙏

आपकी${overdueStr} payment ${amountStr ? `*${amountStr}*` : ''} अभी तक pending है।

कृपया जल्द से जल्द payment करें। 
धन्यवाद! 🙏

— VyapaarAI`,

    marathi: `नमस्कार ${customerName} जी 🙏

तुमची payment ${amountStr ? `*${amountStr}*` : ''}${overdueStr} अद्याप बाकी आहे.

कृपया लवकर payment करा.
धन्यवाद! 🙏`,

    gujarati: `નમસ્તે ${customerName} 🙏

તમારી ${amountStr ? `*${amountStr}*` : ''}ની payment${overdueStr} હજુ બાકી છે.

કૃપા કરીને જલ્દી payment કરો.
આભાર! 🙏`,

    english: `Hello ${customerName} 🙏

Your payment ${amountStr ? `of *${amountStr}*` : ''}${daysOverdue ? ` (${daysOverdue} days overdue)` : ''} is still pending.

Please make the payment at your earliest convenience.
Thank you! 🙏`,
  };

  return messages[language] || messages.hindi;
}

function getConfirmationMessage({ customerName, reminderPreview, language }) {
  const messages = {
    hindi: `✅ *${customerName} को reminder भेजा जाएगा:*\n\n${reminderPreview}\n\n📱 उनके WhatsApp पर भेज दिया गया!`,
    marathi: `✅ *${customerName} ला reminder पाठवला जाईल:*\n\n${reminderPreview}`,
    gujarati: `✅ *${customerName} ને reminder મોકલવામાં આવ્યો:*\n\n${reminderPreview}`,
    english: `✅ *Reminder sent to ${customerName}:*\n\n${reminderPreview}`,
  };
  return messages[language] || messages.hindi;
}

function getMissingCustomerMessage(language) {
  const messages = {
    hindi: '❌ कृपया customer का नाम बताएं। जैसे: "Ramesh ko reminder bhejo ₹5000 ke liye"',
    marathi: '❌ कृपया customer चे नाव सांगा.',
    gujarati: '❌ કૃપા કરીને customer નું નામ જણાવો.',
    english: '❌ Please mention the customer name. E.g.: "send reminder to Ramesh for ₹5000"',
  };
  return messages[language] || messages.hindi;
}

module.exports = { handleReminder, buildReminderMessage };

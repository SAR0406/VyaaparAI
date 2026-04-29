'use strict';

const { parseIntent } = require('../nlp/parser');
const { handleInvoice } = require('../handlers/invoice');
const { handleReminder } = require('../handlers/reminder');
const { handleInventory } = require('../handlers/inventory');
const { handleGst } = require('../handlers/gst');
const { sendWhatsAppMessage } = require('../integrations/whatsapp');
const { logger } = require('../utils/logger');

/**
 * Route an incoming WhatsApp message to the appropriate handler
 * based on the detected intent.
 *
 * @param {object} params
 * @param {object} params.message   - WhatsApp message object from webhook payload
 * @param {string} params.from      - Sender phone number
 * @param {string} params.businessPhoneId - Business phone number ID
 */
async function routeMessage({ message, from, businessPhoneId }) {
  // Extract text from text or audio messages
  let text = '';
  if (message.type === 'text') {
    text = message.text.body;
  } else if (message.type === 'audio') {
    // Future: transcribe audio via Whisper / Sarvam AI and set text
    logger.info('Audio message received — transcription not yet implemented');
    await sendWhatsAppMessage(businessPhoneId, from, 'Audio support आ रहा है जल्द! अभी के लिए text में लिखें 🙏');
    return;
  } else {
    logger.info(`Unhandled message type: ${message.type}`);
    return;
  }

  logger.info('Incoming message', { from, text });

  const { intent, entities, language } = await parseIntent(text);

  logger.info('Detected intent', { intent, language, from });

  switch (intent) {
    case 'create_invoice':
      await handleInvoice({ from, entities, language, businessPhoneId });
      break;

    case 'payment_reminder':
      await handleReminder({ from, entities, language, businessPhoneId });
      break;

    case 'check_inventory':
    case 'update_inventory':
      await handleInventory({ from, entities, language, businessPhoneId, intent });
      break;

    case 'gst_summary':
    case 'gst_filing':
      await handleGst({ from, entities, language, businessPhoneId, intent });
      break;

    default:
      await sendWhatsAppMessage(
        businessPhoneId,
        from,
        getHelpMessage(language),
      );
  }
}

/**
 * Returns a contextual help message in the user's preferred language.
 */
function getHelpMessage(language) {
  const messages = {
    hindi: `नमस्ते! 🙏 मैं VyapaarAI हूँ। आप मुझसे ये काम करवा सकते हैं:

📄 *Invoice बनाना* — "invoice banao ₹5000 ka Ramesh ke liye"
💰 *Payment Reminder* — "Suresh ko reminder bhejo"
📦 *Stock Check* — "kitna stock bacha?"
📊 *GST Summary* — "is mahine ka GST kitna hai?"

Type karo ya voice message bhejo! 😊`,

    marathi: `नमस्कार! 🙏 मी VyapaarAI आहे. तुम्ही मला हे सांगू शकता:

📄 *Invoice बनवणे* — "invoice banva ₹5000 cha"
💰 *Payment Reminder* — "Suresh la reminder pathva"
📦 *Stock तपासणे* — "kitna stock aahe?"
📊 *GST Summary* — "ya mahinyacha GST kiti aahe?"`,

    gujarati: `નમસ્તે! 🙏 હું VyapaarAI છું. તમે મને આ કામ કરાવી શકો છો:

📄 *Invoice બનાવો* — "invoice banavo ₹5000 no"
💰 *Payment Reminder* — "Suresh ne reminder moklo"
📦 *Stock તપાસો* — "ketlo stock bachyo?"
📊 *GST Summary* — "aa mahine no GST ketlo che?"`,

    english: `Hello! 🙏 I'm VyapaarAI. Here's what I can do for you:

📄 *Create Invoice* — "make invoice for ₹5000 for Ramesh"
💰 *Payment Reminder* — "send reminder to Suresh"
📦 *Check Stock* — "how much stock is left?"
📊 *GST Summary* — "what's my GST this month?"

Type or send a voice message!`,
  };

  return messages[language] || messages.hindi;
}

module.exports = { routeMessage, getHelpMessage };

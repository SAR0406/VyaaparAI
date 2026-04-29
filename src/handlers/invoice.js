'use strict';

const { generateInvoicePdf } = require('../utils/pdfGenerator');
const { sendWhatsAppMessage, sendWhatsAppDocument } = require('../integrations/whatsapp');
const { validateGstin } = require('../integrations/gstPortal');
const { formatCurrency } = require('../nlp/languages');
const { logger } = require('../utils/logger');

// GST rates (%) for common product categories
const GST_RATES = {
  default: 18,
  essential: 5,    // essential goods
  textile: 5,      // garments under ₹1000
  jewellery: 3,
  services: 18,
  exempt: 0,
};

/**
 * Handle a "create_invoice" intent.
 *
 * @param {object} params
 * @param {string} params.from             - Sender phone number
 * @param {object} params.entities         - Extracted entities from NLP
 * @param {string} params.language         - Detected language
 * @param {string} params.businessPhoneId  - WhatsApp Business phone ID
 */
async function handleInvoice({ from, entities, language, businessPhoneId }) {
  const {
    customer_name: customerName = 'Customer',
    amount,
    items = [],
    gstin,
  } = entities;

  if (!amount && items.length === 0) {
    const msg = getErrorMessage('missing_amount', language);
    await sendWhatsAppMessage(businessPhoneId, from, msg);
    return;
  }

  // Validate GSTIN if provided
  if (gstin) {
    const isValid = await validateGstin(gstin);
    if (!isValid) {
      await sendWhatsAppMessage(
        businessPhoneId,
        from,
        getErrorMessage('invalid_gstin', language),
      );
      return;
    }
  }

  const subtotal = amount || items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);
  const gstRate = GST_RATES.default;
  const gstAmount = parseFloat(((subtotal * gstRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + gstAmount).toFixed(2));

  const invoiceData = {
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toLocaleDateString('en-IN'),
    customerName,
    gstin: gstin || null,
    items: items.length > 0 ? items : [{ name: 'Services/Goods', quantity: 1, price: subtotal }],
    subtotal,
    gstRate,
    gstAmount,
    total,
    language,
  };

  try {
    const pdfBuffer = await generateInvoicePdf(invoiceData);

    // Send confirmation text first
    const confirmMsg = getInvoiceConfirmation(invoiceData, language);
    await sendWhatsAppMessage(businessPhoneId, from, confirmMsg);

    // Send the PDF
    await sendWhatsAppDocument(businessPhoneId, from, pdfBuffer, `invoice_${invoiceData.invoiceNumber}.pdf`);

    logger.info('Invoice created and sent', { from, invoiceNumber: invoiceData.invoiceNumber });
  } catch (err) {
    logger.error('Invoice creation failed', { error: err.message, from });
    await sendWhatsAppMessage(businessPhoneId, from, getErrorMessage('invoice_failed', language));
  }
}

function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}-${random}`;
}

function getInvoiceConfirmation(invoice, language) {
  const messages = {
    hindi: `✅ *Invoice बन गया!*

📄 Invoice No: ${invoice.invoiceNumber}
👤 ग्राहक: ${invoice.customerName}
📅 तारीख: ${invoice.date}
💰 Amount: ${formatCurrency(invoice.subtotal)}
🏛️ GST (${invoice.gstRate}%): ${formatCurrency(invoice.gstAmount)}
💵 *Total: ${formatCurrency(invoice.total)}*

PDF नीचे भेज दिया है। ग्राहक को forward करें! 👇`,

    marathi: `✅ *Invoice तयार झाला!*

📄 Invoice No: ${invoice.invoiceNumber}
👤 ग्राहक: ${invoice.customerName}
📅 तारीख: ${invoice.date}
💰 रक्कम: ${formatCurrency(invoice.subtotal)}
🏛️ GST (${invoice.gstRate}%): ${formatCurrency(invoice.gstAmount)}
💵 *एकूण: ${formatCurrency(invoice.total)}*`,

    gujarati: `✅ *Invoice બની ગઈ!*

📄 Invoice No: ${invoice.invoiceNumber}
👤 ગ્રાહક: ${invoice.customerName}
📅 તારીખ: ${invoice.date}
💰 રકમ: ${formatCurrency(invoice.subtotal)}
🏛️ GST (${invoice.gstRate}%): ${formatCurrency(invoice.gstAmount)}
💵 *કુલ: ${formatCurrency(invoice.total)}*`,

    english: `✅ *Invoice Created!*

📄 Invoice No: ${invoice.invoiceNumber}
👤 Customer: ${invoice.customerName}
📅 Date: ${invoice.date}
💰 Amount: ${formatCurrency(invoice.subtotal)}
🏛️ GST (${invoice.gstRate}%): ${formatCurrency(invoice.gstAmount)}
💵 *Total: ${formatCurrency(invoice.total)}*

PDF sent below. Forward to your customer! 👇`,
  };

  return messages[language] || messages.hindi;
}

function getErrorMessage(type, language) {
  const errors = {
    missing_amount: {
      hindi: '❌ कृपया amount बताएं। जैसे: "Ramesh ke liye ₹5000 ka invoice banao"',
      english: '❌ Please mention the amount. E.g.: "make invoice for ₹5000 for Ramesh"',
    },
    invalid_gstin: {
      hindi: '❌ GSTIN नंबर गलत है। कृपया सही GSTIN डालें।',
      english: '❌ Invalid GSTIN. Please provide a valid GST number.',
    },
    invoice_failed: {
      hindi: '❌ Invoice बनाने में error आया। कृपया दोबारा try करें।',
      english: '❌ Failed to create invoice. Please try again.',
    },
  };

  const errGroup = errors[type] || {};
  return errGroup[language] || errGroup.hindi || errGroup.english || 'An error occurred.';
}

module.exports = { handleInvoice, generateInvoiceNumber, GST_RATES };

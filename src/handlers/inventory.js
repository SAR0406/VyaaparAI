'use strict';

const { sendWhatsAppMessage } = require('../integrations/whatsapp');
const { formatCurrency } = require('../nlp/languages');
const { logger } = require('../utils/logger');

// In-memory inventory store (replace with DB in production)
const inventoryStore = new Map();

/**
 * Handle inventory check or update intents.
 *
 * @param {object} params
 * @param {string} params.from
 * @param {object} params.entities
 * @param {string} params.language
 * @param {string} params.businessPhoneId
 * @param {string} params.intent - 'check_inventory' | 'update_inventory'
 */
async function handleInventory({ from, entities, language, businessPhoneId, intent }) {
  if (intent === 'check_inventory') {
    await checkInventory({ from, entities, language, businessPhoneId });
  } else {
    await updateInventory({ from, entities, language, businessPhoneId });
  }
}

async function checkInventory({ from, entities, language, businessPhoneId }) {
  const { item_name: itemName } = entities;
  const key = businessKey(from);

  const stock = inventoryStore.get(key) || {};

  if (itemName) {
    const itemKey = itemName.toLowerCase();
    const item = stock[itemKey];
    if (!item) {
      const msg = getNotFoundMessage(itemName, language);
      await sendWhatsAppMessage(businessPhoneId, from, msg);
      return;
    }
    const msg = getItemStockMessage({ item, itemName, language });
    await sendWhatsAppMessage(businessPhoneId, from, msg);
  } else {
    // Return all items
    const msg = getAllStockMessage({ stock, language });
    await sendWhatsAppMessage(businessPhoneId, from, msg);
  }

  logger.info('Inventory checked', { from, itemName });
}

async function updateInventory({ from, entities, language, businessPhoneId }) {
  const {
    item_name: itemName,
    quantity = 0,
    price_per_unit: pricePerUnit = 0,
    transaction_type: txType = 'purchase',
  } = entities;

  if (!itemName || quantity === 0) {
    await sendWhatsAppMessage(businessPhoneId, from, getMissingInfoMessage(language));
    return;
  }

  const key = businessKey(from);
  const stock = inventoryStore.get(key) || {};
  const itemKey = itemName.toLowerCase();

  const currentItem = stock[itemKey] || { quantity: 0, pricePerUnit: 0, totalValue: 0 };

  if (txType === 'purchase') {
    currentItem.quantity += quantity;
  } else if (txType === 'sale') {
    currentItem.quantity = Math.max(0, currentItem.quantity - quantity);
  }
  currentItem.pricePerUnit = pricePerUnit || currentItem.pricePerUnit;
  currentItem.totalValue = currentItem.quantity * currentItem.pricePerUnit;
  currentItem.lastUpdated = new Date().toLocaleDateString('en-IN');

  stock[itemKey] = currentItem;
  inventoryStore.set(key, stock);

  const msg = getUpdateConfirmMessage({ itemName, quantity, txType, currentItem, language });
  await sendWhatsAppMessage(businessPhoneId, from, msg);

  logger.info('Inventory updated', { from, itemName, quantity, txType });
}

function businessKey(phone) {
  return `biz_${phone}`;
}

function getItemStockMessage({ item, itemName, language }) {
  const messages = {
    hindi: `📦 *${itemName} का stock:*\n\nमात्रा: *${item.quantity} units*\nकीमत: ${formatCurrency(item.pricePerUnit)} प्रति unit\nकुल मूल्य: ${formatCurrency(item.totalValue)}\nअंतिम update: ${item.lastUpdated || 'N/A'}`,
    marathi: `📦 *${itemName} चा stock:*\n\nप्रमाण: *${item.quantity} units*\nकिंमत: ${formatCurrency(item.pricePerUnit)} प्रति unit\nएकूण मूल्य: ${formatCurrency(item.totalValue)}`,
    gujarati: `📦 *${itemName} નો stock:*\n\nજથ્થો: *${item.quantity} units*\nકિંમત: ${formatCurrency(item.pricePerUnit)} per unit\nકુલ મૂલ્ય: ${formatCurrency(item.totalValue)}`,
    english: `📦 *${itemName} Stock:*\n\nQuantity: *${item.quantity} units*\nPrice: ${formatCurrency(item.pricePerUnit)} per unit\nTotal Value: ${formatCurrency(item.totalValue)}\nLast Updated: ${item.lastUpdated || 'N/A'}`,
  };
  return messages[language] || messages.hindi;
}

function getAllStockMessage({ stock, language }) {
  const entries = Object.entries(stock);
  if (entries.length === 0) {
    const empty = {
      hindi: '📦 अभी कोई stock नहीं है। पहले stock add करें।\nजैसे: "100 saree laye ₹500 each"',
      english: '📦 No stock found. Add stock first.\nE.g.: "bought 100 sarees at ₹500 each"',
    };
    return empty[language] || empty.hindi;
  }

  const lines = entries.map(([name, item]) => `• ${name}: *${item.quantity} units* @ ${formatCurrency(item.pricePerUnit)}`);

  const headers = {
    hindi: `📦 *आपका पूरा stock:*\n\n${lines.join('\n')}`,
    marathi: `📦 *तुमचा संपूर्ण stock:*\n\n${lines.join('\n')}`,
    gujarati: `📦 *તમારો સંપૂર્ણ stock:*\n\n${lines.join('\n')}`,
    english: `📦 *Your Complete Inventory:*\n\n${lines.join('\n')}`,
  };
  return headers[language] || headers.hindi;
}

function getUpdateConfirmMessage({ itemName, quantity, txType, currentItem, language }) {
  const txLabel = { hindi: { purchase: 'खरीदे', sale: 'बेचे' }, english: { purchase: 'purchased', sale: 'sold' } };
  const tx = (txLabel[language] || txLabel.hindi)[txType] || txType;

  const messages = {
    hindi: `✅ *Stock update हो गया!*\n\n${quantity} ${itemName} ${tx}\nबचा हुआ stock: *${currentItem.quantity} units*\nकुल मूल्य: ${formatCurrency(currentItem.totalValue)}`,
    marathi: `✅ *Stock update झाला!*\n\n${quantity} ${itemName} ${tx}\nउरलेला stock: *${currentItem.quantity} units*`,
    gujarati: `✅ *Stock update થઈ ગઈ!*\n\n${quantity} ${itemName} ${tx}\nબાકી stock: *${currentItem.quantity} units*`,
    english: `✅ *Stock Updated!*\n\n${quantity} ${itemName} ${tx}\nRemaining stock: *${currentItem.quantity} units*\nTotal value: ${formatCurrency(currentItem.totalValue)}`,
  };
  return messages[language] || messages.hindi;
}

function getNotFoundMessage(itemName, language) {
  const msgs = {
    hindi: `❌ "${itemName}" stock में नहीं मिला। पहले add करें।`,
    english: `❌ "${itemName}" not found in inventory. Add it first.`,
  };
  return msgs[language] || msgs.hindi;
}

function getMissingInfoMessage(language) {
  const msgs = {
    hindi: '❌ item का नाम और quantity बताएं। जैसे: "50 saree laye ₹500 each"',
    english: '❌ Please mention item name and quantity. E.g.: "bought 50 sarees at ₹500 each"',
  };
  return msgs[language] || msgs.hindi;
}

module.exports = { handleInventory, inventoryStore };

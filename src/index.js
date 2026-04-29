'use strict';

require('dotenv').config();
const express = require('express');
const { whatsappRouter } = require('./bot/whatsapp');
const { logger } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VyapaarAI',
    version: '0.1.0',
    message: 'AI Business Operating System for Indian MSMEs',
  });
});

// WhatsApp webhook routes
app.use('/webhook', whatsappRouter);

app.listen(PORT, () => {
  logger.info(`VyapaarAI server running on port ${PORT}`);
});

module.exports = app;

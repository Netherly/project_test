const express = require('express');
const { handleTelegramUpdate } = require('../bot/webhook');
const router = express.Router();


router.post('/telegram/webhook', handleTelegramUpdate);

module.exports = router;

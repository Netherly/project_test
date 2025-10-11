// src/routes/telegram.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth.middleware'); // это функция
const { createLinkToken, consumeLinkToken } = require('../controllers/telegram.controller');

// защищённый роут — создать deep-link токен
router.post('/link/create', auth, createLinkToken);

// публичный роут — бот или фронт может подтвердить токен
router.post('/link/consume', consumeLinkToken);

module.exports = router;

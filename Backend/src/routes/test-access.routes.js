const express = require('express');
const controller = require('../controllers/test-access.controller');

const router = express.Router();

router.get('/page', controller.page);
router.post('/login', controller.login);
router.get('/check', controller.check);
router.post('/logout', controller.logout);

module.exports = router;

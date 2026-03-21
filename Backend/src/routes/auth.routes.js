const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authRateLimit } = require('../middlewares/rate-limit.middleware');

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;

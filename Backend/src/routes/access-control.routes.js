const express = require('express');
const ctrl = require('../controllers/access-control.controller');

const router = express.Router();

router.get('/me', ctrl.getMe);
router.get('/employees', ctrl.listEmployees);
router.get('/', ctrl.getConfig);
router.put('/', ctrl.saveConfig);

module.exports = router;

// src/routes/fields.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/fields.controller');

router.get('/', ctrl.getBundle);
router.put('/', ctrl.saveBundle);

module.exports = router;

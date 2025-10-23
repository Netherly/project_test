// Backend/src/routes/transactions.routes.js
const express = require('express');
const TransactionsController = require('../controllers/transactions.controller');

const router = express.Router();

router.get('/', TransactionsController.list);
router.get('/:id', TransactionsController.byId);
router.post('/', TransactionsController.create);
router.put('/:id', TransactionsController.update);
router.delete('/:id', TransactionsController.delete);

module.exports = router;
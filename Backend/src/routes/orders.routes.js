const express = require('express');
const router = express.Router();
const OrdersController = require('../controllers/orders.controller');

router.get('/', OrdersController.list);
router.get('/:id', OrdersController.byId);
router.post('/', OrdersController.create);
router.put('/:id', OrdersController.update);
router.patch('/:id/stage', OrdersController.changeStage);
router.delete('/:id', OrdersController.delete);

module.exports = router;

// src/routes/transaction.routes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/transaction.controller');

// Список с пагинацией и фильтрами
router.get('/', auth, ctrl.list);

// Получить по ID
router.get('/:id', auth, ctrl.getById);

// Создать (одна или массив транзакций)
router.post('/', auth, ctrl.create);

// Обновить по ID
router.put('/:id', auth, ctrl.update);

// Удалить по ID
router.delete('/:id', auth, ctrl.removeOne);

// Дублировать транзакцию
router.post('/:id/duplicate', auth, ctrl.duplicate);

module.exports = router;

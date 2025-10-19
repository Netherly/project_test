const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, taskController.createTask);

module.exports = router;

const express = require('express');
const EmployeesController = require('../controllers/employees.controller');

const router = express.Router();

router.get('/', EmployeesController.list);
router.get('/:id', EmployeesController.byId);
router.post('/', EmployeesController.create);
router.put('/:id', EmployeesController.update);
router.delete('/:id', EmployeesController.delete);

module.exports = router;
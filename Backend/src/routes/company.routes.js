const router = require('express').Router();
const controller = require('../controllers/company.controller');

router.get('/', controller.listCompanies);
router.post('/', controller.createCompany);

module.exports = router;

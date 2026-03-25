const router = require('express').Router();
const controller = require('../controllers/company.controller');

router.get('/', controller.listCompanies);
router.post('/', controller.createCompany);
router.get('/:id', controller.getCompanyById);
router.put('/:id', controller.updateCompany);
router.delete('/:id', controller.deleteCompany);

module.exports = router;

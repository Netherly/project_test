const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assets.controller'); // NOTE: без .js тоже ок

router.get('/',                 ctrl.list);
router.get('/:id',              ctrl.byId);
router.post('/',                ctrl.create);
router.patch('/:id',            ctrl.update);
router.delete('/:id',           ctrl.remove);
router.post('/:id/duplicate',   ctrl.duplicate);
router.patch('/:id/requisites', ctrl.upsertRequisites);
router.post('/recalc-month',    ctrl.recalcMonth);

module.exports = router;

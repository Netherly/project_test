// src/routes/index.js
const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transaction.routes');
const authRoutes = require('./auth.routes');
const taskRoutes = require('./task.routes');
const clientRoutes = require('./client.routes');
const ratesRoutes = require('./rates.routes');
const fieldsRoutes = require('./fields.routes');
const uploadRoutes = require('./upload.routes');
const assetsRoutes = require('./assets.routes');
const telegramRoutes = require('./telegram.routes');
const testAccessRoutes = require('./test-access.routes');
const accessControlRoutes = require('./access-control.routes');
const profileRoutes = require('./profile.routes');
const employeesRoutes = require('./employees.routes');
const ordersRoutes = require('./orders.routes');
const companyRoutes = require('./company.routes');
const regularPaymentsRoutes = require('./regular-payments.routes');


const authJwt = require('../middlewares/auth.middleware');
const { requireModuleAccess } = require('../middlewares/access-permissions.middleware');

router.use('/auth', authRoutes);
router.use('/telegram', telegramRoutes);
router.use('/test-access', testAccessRoutes);
router.use('/access-control', authJwt, accessControlRoutes);

router.use('/tasks', authJwt, requireModuleAccess('objectives'), taskRoutes);
router.use('/employees', authJwt, requireModuleAccess('employees'), employeesRoutes);
router.use('/clients', authJwt, requireModuleAccess('clients'), clientRoutes);
router.use('/transactions', authJwt, requireModuleAccess('finance'), transactionRoutes);
router.use('/rates', authJwt, requireModuleAccess('finance'), ratesRoutes);
router.use('/upload', authJwt, uploadRoutes);
router.use('/assets', authJwt, requireModuleAccess('assets'), assetsRoutes);
router.use('/fields', authJwt, requireModuleAccess('settings'), fieldsRoutes);
router.use('/profile', authJwt, profileRoutes);
router.use('/orders', authJwt, requireModuleAccess('orders'), ordersRoutes);
router.use('/companies', authJwt, requireModuleAccess('settings'), companyRoutes);
router.use('/regular-payments', authJwt, requireModuleAccess('finance'), regularPaymentsRoutes);

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use((req, res) => res.status(404).json({ error: 'Not Found' }));

module.exports = router;

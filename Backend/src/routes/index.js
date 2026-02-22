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
const profileRoutes = require('./profile.routes');
const employeesRoutes = require('./employees.routes');
const ordersRoutes = require('./orders.routes');
const companyRoutes = require('./company.routes');
const regularPaymentsRoutes = require('./regular-payments.routes');


const authJwt = require('../middlewares/auth.middleware');

router.use('/auth', authRoutes);
router.use('/telegram', telegramRoutes);
router.use('/test-access', testAccessRoutes);

router.use('/tasks', authJwt, taskRoutes);
router.use('/employees',authJwt,employeesRoutes);
router.use('/clients', authJwt, clientRoutes);
router.use('/transactions', authJwt, transactionRoutes);
router.use('/rates', authJwt, ratesRoutes);
router.use('/upload', authJwt, uploadRoutes);
router.use('/assets', authJwt, assetsRoutes);
router.use('/fields', authJwt, fieldsRoutes);
router.use('/profile', authJwt, profileRoutes);
router.use('/orders', authJwt, ordersRoutes);
router.use('/companies', authJwt, companyRoutes);
router.use('/regular-payments', authJwt, regularPaymentsRoutes);

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use((req, res) => res.status(404).json({ error: 'Not Found' }));

module.exports = router;

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
const profileRoutes = require('./profile.routes');

const authJwt = require('../middlewares/auth.middleware');

router.use('/auth', authRoutes);
router.use('/telegram', telegramRoutes);

router.use('/tasks', authJwt, taskRoutes);
router.use('/clients', authJwt, clientRoutes);
router.use('/transactions', authJwt, transactionRoutes);
router.use('/rates', authJwt, ratesRoutes);
router.use('/upload', authJwt, uploadRoutes);
router.use('/assets', authJwt, assetsRoutes);
router.use('/fields', authJwt, fieldsRoutes);
router.use('/profile', authJwt, profileRoutes);

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use((req, res) => res.status(404).json({ error: 'Not Found' }));

module.exports = router;

// src/routes/index.js
const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transaction.routes');
const authRoutes        = require('./auth.routes');
const taskRoutes        = require('./task.routes');
const clientRoutes      = require('./client.routes'); 
const ratesRoutes       = require('./rates.routes');
const fieldsRoutes      = require('./fields.routes');
const uploadRoutes      = require('./upload.routes');
const assetsRoutes      = require('./assets.routes');
const telegramRoutes    = require('./telegram.routes');     // <— добавили

const authJwt = require('../middlewares/authMiddleware');
 // <— JWT защита

// === Публичные ===
router.use('/auth', authRoutes);            // /auth/register, /auth/login
router.use('/telegram', telegramRoutes);    // /telegram/webhook  (без JWT)

// === Приватные (под JWT) ===
router.use('/tasks',         authJwt, taskRoutes);
router.use('/clients',       authJwt, clientRoutes);
router.use('/transactions',  authJwt, transactionRoutes);
router.use('/rates',         authJwt, ratesRoutes);
router.use('/upload',        authJwt, uploadRoutes);
router.use('/assets',        authJwt, assetsRoutes);
router.use('/fields',        authJwt, fieldsRoutes);

// Health (удобно для мониторинга)
router.get('/health', (_req, res) => res.json({ ok: true }));

// 404 для несуществующих путей внутри /api
router.use((req, res) => res.status(404).json({ error: 'Not Found' }));

module.exports = router;

const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transaction.routes');
const authRoutes = require('./auth.routes');
const taskRoutes = require('./task.routes');
const clientRoutes = require('./client.routes'); 
const ratesRoutes = require('./rates.routes');
const fieldsRoutes = require('./fields.routes');
const uploadRoutes = require('./upload.routes');
const assetsRoutes = require('./assets.routes'); // <-- додали

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/clients', clientRoutes);
router.use('/transactions', transactionRoutes);
router.use('/rates', ratesRoutes);  
router.use('/upload', uploadRoutes); 
router.use('/assets', assetsRoutes);   // <-- зареєстрували assets
router.use('/fields', fieldsRoutes);

module.exports = router;

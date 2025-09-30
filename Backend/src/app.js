const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const routes = require('./routes/index');

app.use(cors({
   origin: ['http://gsse.work', 'https://gsse.work', 'http://localhost:5173'],
  credentials: true
}));

// увеличили лимиты
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname,'..', 'uploads')));
app.use('/api', routes);

module.exports = app;

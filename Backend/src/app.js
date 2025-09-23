const express = require('express');
const cors = require('cors');
<<<<<<< HEAD
=======
const path = require('path');
>>>>>>> update_last_changes
const app = express();

const routes = require('./routes/index');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
<<<<<<< HEAD
 // <-- ЭТО ОЧЕНЬ ВАЖНО
app.use(express.json());
=======

// увеличили лимиты
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname,'..', 'uploads')));
>>>>>>> update_last_changes
app.use('/api', routes);

module.exports = app;

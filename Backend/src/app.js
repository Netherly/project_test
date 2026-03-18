const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();

const routes = require('./routes/index');
const { toPublicError } = require('./utils/http-error');

function parseCorsOrigins(raw) {
  const fromEnv = String(raw || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return fromEnv;
  }

  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

// The app runs behind nginx in both prod and test, so trust X-Forwarded-*.
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      // curl/health checks/server-to-server requests can have no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);


app.set('json replacer', (key, value) => (typeof value === 'bigint' ? value.toString() : value));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname,'..', 'uploads')));
app.use('/api', routes);

app.use((err, _req, res, _next) => {
  const rawMessage = String(err?.message || '').trim();
  const { status, message } = toPublicError(err);

  if (status >= 500 || (rawMessage && rawMessage !== message)) {
    console.error('[api] unhandled error:', err);
  }

  res.status(status).json({
    ok: false,
    status,
    error: message,
    message,
  });
});

module.exports = app;

const { rateLimit } = require('express-rate-limit');
const { parsePositiveInt } = require('../utils/ttl-cache');

function buildLimiter({
  windowMs,
  max,
  message,
}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res, _next, options) {
      return res.status(options.statusCode).json({
        ok: false,
        error: message,
        message,
      });
    },
  });
}

const authRateLimit = buildLimiter({
  windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 25),
  message: 'Слишком много попыток входа. Попробуйте позже.',
});

const uploadRateLimit = buildLimiter({
  windowMs: parsePositiveInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS, 5 * 60 * 1000),
  max: parsePositiveInt(process.env.UPLOAD_RATE_LIMIT_MAX, 60),
  message: 'Слишком много загрузок. Попробуйте позже.',
});

module.exports = {
  authRateLimit,
  uploadRateLimit,
};

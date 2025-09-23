// src/middlewares/validateRates.js

// YYYY-MM-DD (без времени)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// базовые обязательные поля
const REQUIRED_NUMERIC = ['uah', 'usd', 'rub', 'usdt'];

// необязательные (если присланы — должны быть числа)
const OPTIONAL_NUMERIC = [
  'uah_rub','uah_usd','uah_usdt',
  'usd_uah','usd_rub','usd_usdt',
  'usdt_uah','usdt_usd','usdt_rub',
  'rub_uah','rub_usd','rub_usdt',
];

// попытка привести к числу
function toNumber(v) {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function isValidDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

function normalizeItem(i = {}) {
  const errors = [];

  // date
  if (!i.date || !isValidDateString(String(i.date))) {
    errors.push('date is required and must be in YYYY-MM-DD format');
  }

  // required numeric
  for (const k of REQUIRED_NUMERIC) {
    const n = toNumber(i[k]);
    if (Number.isNaN(n)) errors.push(`${k} is required and must be a number`);
  }

  // optional numeric
  for (const k of OPTIONAL_NUMERIC) {
    if (i[k] !== undefined) {
      const n = toNumber(i[k]);
      if (Number.isNaN(n)) errors.push(`${k} must be a number when provided`);
    }
  }

  if (errors.length) return { errors };

  // нормализованный объект (строго нужные поля + признаём кросс-поля, если есть)
  const out = {
    date: String(i.date).slice(0, 10),
    uah: toNumber(i.uah),
    usd: toNumber(i.usd),
    rub: toNumber(i.rub),
    usdt: toNumber(i.usdt),
  };

  for (const k of OPTIONAL_NUMERIC) {
    if (i[k] !== undefined) out[k] = toNumber(i[k]);
  }

  return { value: out };
}

module.exports = function validateRates(req, res, next) {
  const body = req.body;

  if (body == null || (Array.isArray(body) && body.length === 0)) {
    return res.status(400).json({ message: 'Validation failed', errors: ['empty payload'] });
  }

  if (Array.isArray(body)) {
    const normalized = [];
    const errors = [];

    body.forEach((item, idx) => {
      const { value, errors: e } = normalizeItem(item);
      if (e && e.length) {
        errors.push({ index: idx, errors: e });
      } else {
        normalized.push(value);
      }
    });

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    req.validatedRates = normalized;
    return next();
  }

  // одиночный объект
  const { value, errors: e } = normalizeItem(body);
  if (e && e.length) {
    return res.status(400).json({ message: 'Validation failed', errors: e });
  }

  req.validatedRates = value;
  next();
};

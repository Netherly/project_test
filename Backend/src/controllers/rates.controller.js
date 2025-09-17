// src/controllers/rates.controller.js
const svc = require('../services/rates.service');

// ===== helpers =====
const US_LABELS = [
  'Дата','UAH','USD','RUB','USDT',
  'UAH:RUB','UAH:USD','UAH:USDT',
  'USD:UAH','USD:RUB','USD:USDT',
  'USDT:UAH','USDT:USD','USDT:RUB',
  'RUB:UAH','RUB:USD','RUB:USDT',
];

/** Безопасное преобразование к числу (или null) */
function toNumOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Пропускаем только белый список полей в сервис */
function pickAllowedRateFields(input) {
  const allowed = [
    // базовые
    'date', 'uah', 'usd', 'rub', 'usdt',
    // кроссы (сервис может пересчитать, но не запрещаем принимать)
    'uah_rub','uah_usd','uah_usdt',
    'usd_uah','usd_rub','usd_usdt',
    'usdt_uah','usdt_usd','usdt_rub',
    'rub_uah','rub_usd','rub_usdt',
  ];

  const out = {};
  for (const k of allowed) {
    if (k in input) out[k] = input[k];
  }
  return out;
}

/** YYYY-MM-DD -> именно такой формат (без локали и TZ) */
function toYYYYMMDD(input) {
  if (!input) return input;
  // Принимаем и Date, и строку
  if (input instanceof Date) {
    const y = input.getUTCFullYear();
    const m = String(input.getUTCMonth() + 1).padStart(2, '0');
    const d = String(input.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(input).slice(0, 10);
}

/** Для UI: отобразим как en-US дата (по требованию можно сменить) */
function toUSDate(d) {
  if (!d) return d;
  const dt = d instanceof Date ? d : new Date(d);
  // отрисовка — в локали en-US; хранение — UTC в сервисе
  return dt.toLocaleDateString('en-US');
}

const ok = (res, data) => res.status(200).json(data);
const created = (res, data) => res.status(201).json(data);
const noContent = (res) => res.status(204).send();

const asArray = (x) => (Array.isArray(x) ? x : [x]);

/** Простая проверка обязательных полей для одной записи (только для add) */
function requireBaseFields(item) {
  const need = ['date', 'uah', 'usd', 'rub', 'usdt'];
  for (const k of need) {
    if (item[k] === undefined || item[k] === null || item[k] === '') {
      const err = new Error(`Field "${k}" is required`);
      err.status = 400;
      throw err;
    }
  }
}

/** Нормализация одной записи: дата -> YYYY-MM-DD; числа -> Number */
function normalizeRateInput(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const x = pickAllowedRateFields(raw);
  if (x.date) x.date = toYYYYMMDD(x.date);

  // числовые поля
  const numKeys = [
    'uah','usd','rub','usdt',
    'uah_rub','uah_usd','uah_usdt',
    'usd_uah','usd_rub','usd_usdt',
    'usdt_uah','usdt_usd','usdt_rub',
    'rub_uah','rub_usd','rub_usdt',
  ];
  for (const k of numKeys) {
    if (k in x) {
      const v = toNumOrNull(x[k]);
      if (v === null) {
        // Если явно передали мусор — считаем это ошибкой клиента
        if (x[k] !== undefined && x[k] !== null && x[k] !== '') {
          const err = new Error(`Field "${k}" must be a valid number`);
          err.status = 400;
          throw err;
        }
        // иначе просто не задаём поле
        delete x[k];
      } else {
        x[k] = v;
      }
    }
  }
  return x;
}

// ================== READ ==================
exports.getLatest = async (_req, res, next) => {
  try {
    const row = await svc.getLatest();
    if (!row) return res.json({ columns: [], rows: [] });

    const mapped = { ...row, date: toUSDate(row.date) };
    return ok(res, { columns: US_LABELS, rows: [mapped] });
  } catch (e) { next(e); }
};

// список постранично
exports.list = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize ?? 20)));

    const data = await svc.list({ page, pageSize });
    data.rows = data.rows.map(r => ({ ...r, date: toUSDate(r.date) }));
    return ok(res, data);
  } catch (e) { next(e); }
};

// выборка по диапазону дат
exports.listByRange = async (req, res, next) => {
  try {
    const start = toYYYYMMDD(req.query.start);
    const end   = toYYYYMMDD(req.query.end);
    if (!start || !end) {
      return res.status(400).json({ message: 'start and end are required in YYYY-MM-DD format' });
    }
    const rows = await svc.listByRange({ start, end });
    return ok(res, rows.map(r => ({ ...r, date: toUSDate(r.date) })));
  } catch (e) { next(e); }
};

// ================== UPSERT ==================
exports.upsert = async (req, res, next) => {
  try {
    if (!req.body || (Array.isArray(req.body) && !req.body.length)) {
      return res.status(400).json({ message: 'Body must contain object or array of objects' });
    }

    if (Array.isArray(req.body)) {
      const payload = req.body.map(normalizeRateInput);
      const saved = await svc.upsertMany(payload);
      return ok(res, saved);
    }

    const saved = await svc.upsertOne(normalizeRateInput(req.body));
    return ok(res, saved);
  } catch (e) { next(e); }
};

// ================== ADD (create only) ==================
/**
 * ADD — создать один или несколько снэпшотов.
 * Падает при конфликте уникального индекса по date (ожидаем 409 от сервиса).
 * Если нужен create-or-update — используй upsert.
 */
exports.add = async (req, res, next) => {
  try {
    if (!req.body || (Array.isArray(req.body) && !req.body.length)) {
      return res.status(400).json({ message: 'Body must contain object or array of objects' });
    }

    const payload = asArray(req.body).map(normalizeRateInput);
    payload.forEach(requireBaseFields);

    const result = payload.length > 1
      ? await svc.addMany(payload)
      : await svc.addOne(payload[0]);

    return created(res, result);
  } catch (e) { next(e); }
};

// ================== UPDATE ==================
/**
 * UPDATE — обновить по :id, по массиву {id,...} / {date,...}, либо одиночным объектом.
 */
exports.update = async (req, res, next) => {
  try {
    // Вариант: /api/rates/:id
    if (req.params?.id) {
      const id = String(req.params.id);
      const patch = normalizeRateInput(req.body || {});
      const updated = await svc.updateById(id, patch);
      return ok(res, updated);
    }

    // Вариант: массив или одиночный объект в теле
    if (!req.body) {
      return res.status(400).json({ message: 'Body is required' });
    }

    const payload = asArray(req.body).map(normalizeRateInput);

    const updatesById   = payload.filter(x => x && x.id);
    const updatesByDate = payload.filter(x => x && !x.id && x.date);

    const results = [];

    if (updatesById.length) {
      const r1 = updatesById.length > 1
        ? await svc.updateManyById(updatesById)
        : [await svc.updateById(updatesById[0].id, updatesById[0])];
      results.push(...r1);
    }

    if (updatesByDate.length) {
      const r2 = updatesByDate.length > 1
        ? await svc.updateManyByDate(updatesByDate)
        : [await svc.updateByDate(updatesByDate[0].date, updatesByDate[0])];
      results.push(...r2);
    }

    if (!results.length) {
      return res.status(400).json({ message: 'Nothing to update. Provide id or date.' });
    }
    return ok(res, { updated: results.length, rows: results });
  } catch (e) { next(e); }
};

// ================== DELETE ==================
/**
 * DELETE — удалить записи:
 *  - по id:     DELETE /api/rates/:id
 *  - по date:   DELETE /api/rates?date=YYYY-MM-DD
 *  - по диапазону: DELETE /api/rates?start=YYYY-MM-DD&end=YYYY-MM-DD
 *  - пакетно из body: { ids:[], dates:[], range:{start,end} }
 */
exports.remove = async (req, res, next) => {
  try {
    // По :id
    if (req.params?.id) {
      const id = String(req.params.id);
      await svc.deleteById(id);
      return noContent(res);
    }

    // По query: date / start+end
    const { date, start, end } = req.query || {};
    if (date) {
      await svc.deleteByDate(toYYYYMMDD(date));
      return noContent(res);
    }
    if (start && end) {
      await svc.deleteByRange({ start: toYYYYMMDD(start), end: toYYYYMMDD(end) });
      return noContent(res);
    }

    // Пакетно из body
    const body = req.body || {};
    if (Array.isArray(body.ids) && body.ids.length) {
      await svc.deleteManyByIds(body.ids.map(String));
    }
    if (Array.isArray(body.dates) && body.dates.length) {
      await svc.deleteManyByDates(body.dates.map(toYYYYMMDD));
    }
    if (body.range?.start && body.range?.end) {
      await svc.deleteByRange({
        start: toYYYYMMDD(body.range.start),
        end: toYYYYMMDD(body.range.end),
      });
    }

    return noContent(res);
  } catch (e) { next(e); }
};

// ================== EXTRA: columns (если нужно для UI) ==================
exports.columns = (_req, res) => res.json(US_LABELS);

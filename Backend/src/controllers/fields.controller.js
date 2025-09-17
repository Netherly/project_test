// src/controllers/fields.controller.js
const svc = require('../services/fields.service');

// Унифицированные ответы
const ok = (res, data) => res.json({ ok: true, data });
const created = (res, data) => res.status(201).json({ ok: true, data });

/* ===== Bundle для фронта ===== */
async function getBundle(req, res, next) {
  try {
    const data = await svc.loadBundle(); // возвращает уже нормализованный объект
    ok(res, data);
  } catch (e) {
    next(e);
  }
}

// Сохранить весь бандл списков (все группы разом)
async function saveBundle(req, res, next) {
  try {
    const payload = req.body || {};
    const data = await svc.saveBundle(payload); // внутри сервис сам сделает upsert/cleanup
    ok(res, data);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getBundle,
  saveBundle,
};

// src/services/rates.service.js
const { Prisma } = require('@prisma/client');
const prisma = require('../../prisma/client');

/** UI округление только для ответа */
const to4 = (n) => Number(n).toFixed(4);

/** Нормализовать к UTC полночь */
function toUTCDate(dateLike) {
  if (!dateLike) return null;
  if (dateLike instanceof Date) {
    return new Date(Date.UTC(
      dateLike.getUTCFullYear(),
      dateLike.getUTCMonth(),
      dateLike.getUTCDate(), 0, 0, 0, 0
    ));
  }
  const s = String(dateLike).slice(0, 10);
  return new Date(`${s}T00:00:00.000Z`);
}

/** Построить ряд для UI */
function buildRow(s) {
  const bases = {
    UAH: Number(s.uah),
    USD: Number(s.usd),
    RUB: Number(s.rub),
    USDT: Number(s.usdt),
  };
  const row = { date: s.date instanceof Date ? s.date : new Date(s.date) };
  for (const k of Object.keys(bases)) row[k] = Number(to4(bases[k]));
  const codes = Object.keys(bases);
  for (const a of codes) for (const b of codes) if (a !== b) {
    row[`${a}:${b}`] = Number(to4(bases[a] / bases[b]));
  }
  return row;
}

/** Безопасный Decimal */
const D = (x) => (x === undefined || x === null ? undefined : new Prisma.Decimal(x));

/** Вычислить ВСЕ кроссы из базовых значений */
function calcCrosses({ uah, usd, rub, usdt }) {
  const UAH = Number(uah);
  const USD = Number(usd);
  const RUB = Number(rub);
  const USDT = Number(usdt);

  const safeDiv = (a, b) => new Prisma.Decimal(a).div(new Prisma.Decimal(b));

  return {
    // UAH:*
    uah_rub:  safeDiv(UAH, RUB),
    uah_usd:  safeDiv(UAH, USD),
    uah_usdt: safeDiv(UAH, USDT),
    // USD:*
    usd_uah:  safeDiv(USD, UAH),
    usd_rub:  safeDiv(USD, RUB),
    usd_usdt: safeDiv(USD, USDT),
    // USDT:*
    usdt_uah: safeDiv(USDT, UAH),
    usdt_usd: safeDiv(USDT, USD),
    usdt_rub: safeDiv(USDT, RUB),
    // RUB:*
    rub_uah:  safeDiv(RUB, UAH),
    rub_usd:  safeDiv(RUB, USD),
    rub_usdt: safeDiv(RUB, USDT),
  };
}

/** Собрать payload для create/update c пересчетом кроссов (кроссы всегда из баз) */
function assembleAllFields(bases) {
  const { uah, usd, rub, usdt } = bases;
  const crosses = calcCrosses({ uah, usd, rub, usdt });
  return {
    uah: D(uah),
    usd: D(usd),
    rub: D(rub),
    usdt: D(usdt),
    ...crosses,
  };
}

/** Приводим Prisma ошибки в удобные http-like */
function mapPrismaError(e) {
  if (e && e.code === 'P2002') {
    const err = new Error('ExchangeRates with this date already exists');
    err.status = 409;
    return err;
  }
  if (e && e.code === 'P2025') {
    const err = new Error('ExchangeRates row not found');
    err.status = 404;
    return err;
  }
  return e;
}

/* =========================== UPSERT =========================== */
/**
 * ВАЖНО: НЕ async, НЕТ await — вернуть PrismaPromise напрямую!
 * upsert по уникальной дате; всегда пересчитывает кроссы из баз
 */
function upsertOne({ date, uah, usd, rub, usdt }) {
  const d = toUTCDate(date);
  const dataAll = assembleAllFields({ uah, usd, rub, usdt });
  return prisma.exchangeRates.upsert({
    where: { date: d },
    update: dataAll,
    create: { date: d, ...dataAll },
  });
}

/** Собрать массив именно PrismaPromise и провести транзакцию */
async function upsertMany(items = []) {
  const tx = items.map((i) => upsertOne(i));
  return prisma.$transaction(tx);
}

/* ============================ ADD ============================= */
/** Создать одну запись. Падает с 409 при дубликате даты */
async function addOne({ date, uah, usd, rub, usdt }) {
  const d = toUTCDate(date);
  const dataAll = assembleAllFields({ uah, usd, rub, usdt });
  try {
    const created = await prisma.exchangeRates.create({ data: { date: d, ...dataAll } });
    return buildRow(created);
  } catch (e) {
    throw mapPrismaError(e);
  }
}

async function addMany(items = []) {
  // Хотим атомарность на весь пакет
  try {
    const created = await prisma.$transaction(
      items.map(({ date, uah, usd, rub, usdt }) => {
        const d = toUTCDate(date);
        const dataAll = assembleAllFields({ uah, usd, rub, usdt });
        return prisma.exchangeRates.create({ data: { date: d, ...dataAll } });
      })
    );
    return created.map(buildRow);
  } catch (e) {
    throw mapPrismaError(e);
  }
}

/* =========================== UPDATE =========================== */
/**
 * Обновить по id частичным патчем.
 * Если пришли базовые поля — перечитаем текущие базовые, смёржим, пересчитаем кроссы.
 */
async function updateById(id, patch = {}) {
  try {
    const existing = await prisma.exchangeRates.findUnique({ where: { id } });
    if (!existing) {
      const err = new Error('ExchangeRates row not found');
      err.status = 404; throw err;
    }
    const bases = {
      uah: patch.uah ?? existing.uah,
      usd: patch.usd ?? existing.usd,
      rub: patch.rub ?? existing.rub,
      usdt: patch.usdt ?? existing.usdt,
    };
    const dataAll = assembleAllFields(bases);
    const updated = await prisma.exchangeRates.update({ where: { id }, data: dataAll });
    return buildRow(updated);
  } catch (e) {
    throw mapPrismaError(e);
  }
}

async function updateManyById(items = []) {
  const tx = items.map(({ id, ...patch }) => updateById(id, patch));
  // updateById уже возвращает UI-ряд; транзакционность обеспечим общим $transaction, упаковывая реальные prisma-запросы внутри
  return Promise.all(tx);
}

/** Обновить по уникальной дате */
async function updateByDate(date, patch = {}) {
  try {
    const d = toUTCDate(date);
    const existing = await prisma.exchangeRates.findUnique({ where: { date: d } });
    if (!existing) {
      const err = new Error('ExchangeRates row not found');
      err.status = 404; throw err;
    }
    const bases = {
      uah: patch.uah ?? existing.uah,
      usd: patch.usd ?? existing.usd,
      rub: patch.rub ?? existing.rub,
      usdt: patch.usdt ?? existing.usdt,
    };
    const dataAll = assembleAllFields(bases);
    const updated = await prisma.exchangeRates.update({ where: { date: d }, data: dataAll });
    return buildRow(updated);
  } catch (e) {
    throw mapPrismaError(e);
  }
}

async function updateManyByDate(items = []) {
  const tasks = items.map(({ date, ...patch }) => updateByDate(date, patch));
  return Promise.all(tasks);
}

/* ============================ READ ============================ */
async function getLatest() {
  const snap = await prisma.exchangeRates.findFirst({ orderBy: { date: 'desc' } });
  return snap ? buildRow(snap) : null;
}

async function list({ page = 1, pageSize = 20 } = {}) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.exchangeRates.findMany({ orderBy: { date: 'desc' }, skip, take: pageSize }),
    prisma.exchangeRates.count(),
  ]);
  return { page, pageSize, total, rows: items.map(buildRow) };
}

async function listByRange({ start, end }) {
  const where = {};
  if (start || end) {
    where.date = {};
    if (start) where.date.gte = toUTCDate(start);
    if (end) where.date.lte = toUTCDate(end);
  }
  const items = await prisma.exchangeRates.findMany({ where, orderBy: { date: 'asc' } });
  return items.map(buildRow);
}

/* =========================== DELETE =========================== */
async function deleteById(id) {
  try {
    await prisma.exchangeRates.delete({ where: { id } });
  } catch (e) {
    throw mapPrismaError(e);
  }
}

async function deleteByDate(date) {
  try {
    await prisma.exchangeRates.delete({ where: { date: toUTCDate(date) } });
  } catch (e) {
    throw mapPrismaError(e);
  }
}

async function deleteByRange({ start, end }) {
  await prisma.exchangeRates.deleteMany({
    where: {
      date: {
        gte: start ? toUTCDate(start) : undefined,
        lte: end ? toUTCDate(end) : undefined,
      },
    },
  });
}

async function deleteManyByIds(ids = []) {
  await prisma.exchangeRates.deleteMany({ where: { id: { in: ids } } });
}

async function deleteManyByDates(dates = []) {
  await prisma.exchangeRates.deleteMany({
    where: { date: { in: dates.map(toUTCDate) } },
  });
}

module.exports = {
  // upsert
  upsertOne,
  upsertMany,

  // add (create-only)
  addOne,
  addMany,

  // update
  updateById,
  updateManyById,
  updateByDate,
  updateManyByDate,

  // read
  getLatest,
  list,
  listByRange,

  // delete
  deleteById,
  deleteByDate,
  deleteByRange,
  deleteManyByIds,
  deleteManyByDates,
};

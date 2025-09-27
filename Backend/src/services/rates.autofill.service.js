// Автодублирование курса на новую дату
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
require('dotenv').config();

const prisma = new PrismaClient();

const DEFAULT_TZ = 'Europe/Warsaw';
const DEFAULT_MODE = 'today';

/**
 * Копирует последнюю запись ExchangeRates на targetDate (строка YYYY-MM-DD).
 * Если запись на эту дату уже есть — ничего не делает (idempotent).
 */
async function copyLatestToDate(targetDateYMD) {
  // 1) Проверяем, нет ли уже записи на targetDate
  const existing = await prisma.exchangeRates.findUnique({
    where: { date: new Date(`${targetDateYMD}T00:00:00.000Z`) },
  });
  if (existing) return existing;

  // 2) Берём последнюю по дате
  const last = await prisma.exchangeRates.findFirst({
    orderBy: { date: 'desc' },
  });
  if (!last) {
    console.warn('[rates.autofill] Нет данных для копирования');
    return null;
  }

  // 3) Копируем все поля
  const data = {
    date: new Date(`${targetDateYMD}T00:00:00.000Z`),
    uah: last.uah,
    usd: last.usd,
    rub: last.rub,
    usdt: last.usdt,

    uah_rub: last.uah_rub,
    uah_usd: last.uah_usd,
    uah_usdt: last.uah_usdt,

    usd_uah: last.usd_uah,
    usd_rub: last.usd_rub,
    usd_usdt: last.usd_usdt,

    usdt_uah: last.usdt_uah,
    usdt_usd: last.usdt_usd,
    usdt_rub: last.usdt_rub,

    rub_uah: last.rub_uah,
    rub_usd: last.rub_usd,
    rub_usdt: last.rub_usdt,
  };

  // 4) Создаём новую запись
  return prisma.exchangeRates.create({ data });
}

/**
 * Возвращает YYYY-MM-DD для заданной TZ.
 * mode = "today" → текущий день
 * mode = "next"  → завтрашний день
 */
function getYMD(tz = DEFAULT_TZ, mode = DEFAULT_MODE) {
  const now = new Date();

  // Получаем дату в нужной TZ
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = fmt.format(now); // YYYY-MM-DD

  if (mode === 'today') return todayStr;

  const [y, m, d] = todayStr.split('-').map(Number);
  return dayjs(new Date(Date.UTC(y, m - 1, d)))
    .add(1, 'day')
    .format('YYYY-MM-DD');
}

/**
 * Утилита для получения даты с учётом ENV
 */
function getTargetDateFromEnv() {
  const tz = process.env.RATES_CRON_TZ || DEFAULT_TZ;
  const mode = process.env.RATES_CRON_MODE || DEFAULT_MODE;
  return getYMD(tz, mode);
}

module.exports = {
  copyLatestToDate,
  getYMD,
  getTargetDateFromEnv,
};

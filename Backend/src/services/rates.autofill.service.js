const dayjs = require('dayjs');
require('dotenv').config();

const prisma = require('../../prisma/client');
const { upsertOne } = require('./rates.service');

const DEFAULT_TZ = 'Europe/Kyiv';
const DEFAULT_MODE = 'today';
const DEFAULT_BASE_RATES = {
  uah: 1,
  usd: 41.25,
  rub: 0.44,
  usdt: 41.25,
};

function pickSnapshotFields(row = {}) {
  return {
    uah: row.uah,
    usd: row.usd,
    rub: row.rub,
    usdt: row.usdt,
    uah_rub: row.uah_rub,
    uah_usd: row.uah_usd,
    uah_usdt: row.uah_usdt,
    usd_uah: row.usd_uah,
    usd_rub: row.usd_rub,
    usd_usdt: row.usd_usdt,
    usdt_uah: row.usdt_uah,
    usdt_usd: row.usdt_usd,
    usdt_rub: row.usdt_rub,
    rub_uah: row.rub_uah,
    rub_usd: row.rub_usd,
    rub_usdt: row.rub_usdt,
  };
}

async function ensureLatestToDate(ymd) {
  const date = new Date(ymd + 'T00:00:00.000Z');
  const existing = await prisma.exchangeRates.findUnique({ where: { date } });
  if (existing) {
    return { created: false, row: existing };
  }

  const last = await prisma.exchangeRates.findFirst({
    orderBy: { date: 'desc' },
  });
  if (!last) {
    const created = await upsertOne({
      date,
      ...DEFAULT_BASE_RATES,
    });
    return { created: true, row: created };
  }

  const created = await prisma.exchangeRates.create({
    data: {
      date,
      ...pickSnapshotFields(last),
    },
  });

  return { created: true, row: created };
}

async function copyLatestToDate(ymd) {
  const { created } = await ensureLatestToDate(ymd);
  return created;
}

function getYMD(tz = DEFAULT_TZ, mode = DEFAULT_MODE) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const todayStr = fmt.format(now);
  if (mode === 'today') return todayStr;
  const [y, m, d] = todayStr.split('-').map(Number);
  return dayjs(new Date(Date.UTC(y, m - 1, d))).add(1, 'day').format('YYYY-MM-DD');
}

function getTargetDateFromEnv() {
  const tz = process.env.RATES_CRON_TZ || DEFAULT_TZ;
  const mode = process.env.RATES_CRON_MODE || DEFAULT_MODE;
  return getYMD(tz, mode);
}

function getTodayYMDFromEnv() {
  const tz = process.env.RATES_CRON_TZ || DEFAULT_TZ;
  return getYMD(tz, 'today');
}

module.exports = { copyLatestToDate, ensureLatestToDate, getYMD, getTargetDateFromEnv, getTodayYMDFromEnv };

const dayjs = require('dayjs');
require('dotenv').config();

const prisma = require('../../prisma/client');

const DEFAULT_TZ = 'Europe/Kyiv';
const DEFAULT_MODE = 'today';

async function copyLatestToDate(ymd) {
  const date = new Date(ymd + 'T00:00:00.000Z');
  const last = await prisma.exchangeRates.findFirst({
    orderBy: { date: 'desc' },
  });
  if (!last) return false;

  const data = {
    date,
    usd_uah: last.usd_uah,
    eur_uah: last.eur_uah,
    usd_eur: last.usd_eur,
    btc_usd: last.btc_usd,
    eth_usd: last.eth_usd,
    btc_uah: last.btc_uah,
    eth_uah: last.eth_uah,
    usdt_uah: last.usdt_uah,
    usdt_usd: last.usdt_usd,
    rub_uah: last.rub_uah,
    rub_usd: last.rub_usd,
    rub_usdt: last.rub_usdt,
  };

  await prisma.exchangeRates.upsert({
    where: { date },
    update: data,
    create: data,
  });

  return true;
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

module.exports = { copyLatestToDate, getYMD, getTargetDateFromEnv };

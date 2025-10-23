const cron = require('node-cron');
const { copyLatestToDate, getTargetDateFromEnv } = require('../services/rates.autofill.service');

const schedule = process.env.RATES_CRON_SCHEDULE || '1 0 * * *';
const timezone = process.env.RATES_CRON_TZ || 'Europe/Kyiv';

const task = cron.schedule(
  schedule,
  async () => {
    try {
      const ymd = getTargetDateFromEnv();
      const created = await copyLatestToDate(ymd);
      if (created) console.log(`[rates.autofill] created copy for ${ymd}`);
      else console.log('[rates.autofill] no source row to copy (skipped)');
    } catch (e) {
      console.error('[rates.autofill] failed:', e);
    }
  },
  { timezone, scheduled: false }
);

async function fetchAndSaveRates() {
  try {
    const rates = await fetchRates();
    if (!rates) {
      console.log('No rates fetched, skipping save.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    await prisma.exchangeRates.upsert({
      where: { date: today },
      update: {
        usd_uah: rates.usd_uah,
        eur_uah: rates.eur_uah,
        usd_eur: rates.usd_eur,
        btc_usd: rates.btc_usd,
        eth_usd: rates.eth_usd,
        btc_uah: rates.btc_uah,
        eth_uah: rates.eth_uah,
        usdt_uah: rates.usdt_uah,
        usdt_usd: rates.usdt_usd,
        rub_uah: rates.rub_uah,
        rub_usd: rates.rub_usd,
        rub_usdt: rates.rub_usdt,
      },
      create: {
        date: today,
        usd_uah: rates.usd_uah,
        eur_uah: rates.eur_uah,
        usd_eur: rates.usd_eur,
        btc_usd: rates.btc_usd,
        eth_usd: rates.eth_usd,
        btc_uah: rates.btc_uah,
        eth_uah: rates.eth_uah,
        usdt_uah: rates.usdt_uah,
        usdt_usd: rates.usdt_usd,
        rub_uah: rates.rub_uah,
        rub_usd: rates.rub_usd,
        rub_usdt: rates.rub_usdt,
      },
    });

    console.log('Rates saved successfully for', today.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error fetching or saving rates:', error);
  }
}

function initRatesAutofillJob() {
  task.start();
  console.log(`[rates.autofill] cron scheduled: "${schedule}" (${timezone})`);
}

module.exports = { initRatesAutofillJob };

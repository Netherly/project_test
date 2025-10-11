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
      if (created) {
        console.log(`[rates.autofill] created copy for ${ymd}`);
      } else {
        console.log('[rates.autofill] no source row to copy (skipped)');
      }
    } catch (e) {
      console.error('[rates.autofill] failed:', e);
    }
  },
  { timezone, scheduled: false }
);

function initRatesAutofillJob() {
  task.start();
  console.log(`[rates.autofill] cron scheduled: "${schedule}" (${timezone})`);
}

module.exports = { initRatesAutofillJob };

// src/jobs/rates.autofill.job.js
const cron = require('node-cron');
const { copyLatestToDate } = require('../services/rates.autofill.service');

// Универсальная функция "сегодня" в нужной TZ без сторонних библиотек
function todayYMD(timezone = 'Europe/Kyiv') {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA -> YYYY-MM-DD
  return fmt.format(new Date());
}

function initRatesAutofillJob() {
  const schedule = process.env.RATES_CRON_SCHEDULE || '1 0 * * *'; // каждый день в 00:01
  const timezone = process.env.RATES_CRON_TZ || 'Europe/Kyiv';

  // защита от двойного запуска при рестартах/горячей перезагрузке
  if (global.__RATES_JOB_STARTED__) {
    console.log('[rates.autofill] already scheduled');
    return;
  }

  cron.schedule(
    schedule,
    async () => {
      try {
        const ymd = todayYMD(timezone);
        const created = await copyLatestToDate(ymd); // должен вернуть true/false
        if (created) {
          console.log(`[rates.autofill] created copy for ${ymd}`);
        } else {
          console.log('[rates.autofill] no source row to copy (skipped)');
        }
      } catch (e) {
        console.error('[rates.autofill] failed:', e);
      }
    },
    { timezone } // scheduled=true по умолчанию — стартует сам
  );

  global.__RATES_JOB_STARTED__ = true;
  console.log(`[rates.autofill] cron scheduled: "${schedule}" (${timezone})`);
}

module.exports = { initRatesAutofillJob };

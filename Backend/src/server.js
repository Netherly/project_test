// src/server.js
require('dotenv').config();

const app =require('./app');
const { initRatesAutofillJob } = require('./jobs/rates.autofill.job');
const { scheduleTokenCleanup } = require('./jobs/tokens.cleanup.job');
const { initRegularPaymentsJob } = require('./jobs/regular-payments.job');
const { initTelegramAvatarJob } = require('./jobs/telegram-avatars.job');
const { initTelegramBot, stopTelegramBot } = require('./bot/bot');
const { ensureDefaultCompanies } = require('./seeds/companies.seed');
const { ensureDefaultClientGroups } = require('./seeds/client-groups.seed');
const prisma = require('../prisma/client');

const PORT = parseInt(process.env.PORT || '3000', 10);

function startJobs() {
  try {
    initRatesAutofillJob();
    scheduleTokenCleanup(); // Добавили запуск нашей новой задачи
    initTelegramAvatarJob();
    initRegularPaymentsJob();
    console.log('[cron] all jobs scheduled');
  } catch (e) {
    console.error('[cron] schedule failed:', e?.message || e);
  }
}

async function startBot() {
  const isDisabled = String(process.env.BOT_DISABLED || '') === '1';
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;

  if (isDisabled) {
    console.log('[bot] disabled via BOT_DISABLED=1');
    return false;
  }
  if (!hasToken) {
    console.log('[bot] skipped: no TELEGRAM_BOT_TOKEN');
    return false;
  }

  try {
    await initTelegramBot();
    console.log('[bot] started');
    return true;
  } catch (e) {
    console.error('[bot] start failed:', e?.message || e);
    return false;
  }
}

function setupGracefulShutdown(server, isBotActive) {
  const shutdown = async (signal) => {
    console.log(`[sys] ${signal} received -> shutting down`);

    if (isBotActive) {
      try {
        await stopTelegramBot();
        console.log('[bot] stopped');
      } catch (e) {
        console.warn('[bot] stop warning:', e?.message || e);
      }
    }

    server?.close(() => {
      console.log('[api] server closed');
      prisma
        .$disconnect()
        .catch((e) => console.warn('[db] disconnect warning:', e?.message || e))
        .finally(() => process.exit(0));
    });

    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

async function boot() {
  try {
    await ensureDefaultCompanies();
    console.log('[seed] default companies ensured');
  } catch (e) {
    console.error('[seed] companies failed:', e?.message || e);
  }
  try {
    await ensureDefaultClientGroups();
    console.log('[seed] default client groups ensured');
  } catch (e) {
    console.error('[seed] client groups failed:', e?.message || e);
  }

  const server = app.listen(PORT, () => {
    console.log(`[api] listening on :${PORT}`);
  });

  startJobs();
  const botIsActive = await startBot();
  setupGracefulShutdown(server, botIsActive);
}

boot();

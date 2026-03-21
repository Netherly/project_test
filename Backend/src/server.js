// src/server.js
require('dotenv').config({ override: true });

const app =require('./app');
const { initRatesAutofillJob } = require('./jobs/rates.autofill.job');
const { scheduleTokenCleanup } = require('./jobs/tokens.cleanup.job');
const { initRegularPaymentsJob } = require('./jobs/regular-payments.job');
const { initTelegramAvatarJob } = require('./jobs/telegram-avatars.job');
const { initTelegramBot, stopTelegramBot } = require('./bot/bot');
const { parseBool, runStartupBootstrap } = require('./bootstrap/runtime-bootstrap');
const { getTelegramBotToken } = require('./utils/telegram-token');
const prisma = require('../prisma/client');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startJobs() {
  try {
    initRatesAutofillJob();
    scheduleTokenCleanup(); // Добавили запуск нашей новой задачи
    initTelegramAvatarJob();
    await initRegularPaymentsJob();
    console.log('[cron] all jobs scheduled');
  } catch (e) {
    console.error('[cron] schedule failed:', e?.message || e);
  }
}

async function startBot() {
  const isDisabled = String(process.env.BOT_DISABLED || '') === '1';
  const hasToken = !!getTelegramBotToken();

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
  const server = app.listen(PORT, () => {
    console.log(`[api] listening on :${PORT}`);
  });

  const shouldBlockBootstrap = parseBool(
    process.env.STARTUP_BOOTSTRAP_BLOCKING,
    String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
  );
  const bootstrapPromise = runStartupBootstrap();

  if (shouldBlockBootstrap) {
    await bootstrapPromise;
  } else {
    bootstrapPromise.catch((e) => console.error('[bootstrap] unexpected failure:', e?.message || e));
  }

  await startJobs();
  const botIsActive = await startBot();
  setupGracefulShutdown(server, botIsActive);
}

boot();

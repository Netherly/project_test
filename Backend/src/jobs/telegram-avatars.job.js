const cron = require('node-cron');
const prisma = require('../../prisma/client');
const { fetchAndSaveTelegramAvatar } = require('../services/telegram-avatar.service');
const { getTelegramBotToken } = require('../utils/telegram-token');

const schedule = process.env.TELEGRAM_AVATAR_CRON || '0 0 * * 0';
const timezone = process.env.TELEGRAM_AVATAR_CRON_TZ || 'Europe/Kyiv';

const toText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'bigint') return value.toString();
  return String(value).trim();
};

async function refreshTelegramAvatars() {
  if (!getTelegramBotToken()) {
    console.log('[tg-avatar] skipped: no TELEGRAM_BOT_TOKEN');
    return;
  }

  try {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { telegramUserId: { not: null } },
          { telegramChatId: { not: null } },
        ],
      },
      select: { id: true, telegramUserId: true, telegramChatId: true, telegramLinkedAt: true },
    });

    let updated = 0;
    let unchanged = 0;
    let skipped = 0;

    for (const emp of employees) {
      const tgId = emp.telegramUserId ?? emp.telegramChatId;
      const tgIdText = toText(tgId);
      if (!tgIdText) {
        skipped += 1;
        continue;
      }
      const res = await fetchAndSaveTelegramAvatar({
        employeeId: emp.id,
        telegramUserId: tgIdText,
        telegramLinkedAt: emp.telegramLinkedAt,
      });
      if (res?.ok && res.updated) updated += 1;
      else if (res?.ok) unchanged += 1;
      else skipped += 1;
    }

    console.log(`[tg-avatar] refreshed: updated ${updated}, unchanged ${unchanged}, skipped ${skipped}`);
  } catch (e) {
    console.error('[tg-avatar] failed:', e?.message || e);
  }
}

const task = cron.schedule(
  schedule,
  refreshTelegramAvatars,
  { timezone, scheduled: false }
);

function initTelegramAvatarJob() {
  task.start();
  console.log(`[tg-avatar] cron scheduled: "${schedule}" (${timezone})`);
}

module.exports = { initTelegramAvatarJob };

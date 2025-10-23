// src/bot/bot.js
const { Telegraf } = require('telegraf');
const prisma = require('../../prisma/client');
const { consumeToken } = require('../services/link-token.service');
const { t } = require('./i18n');

let bot = null;

function toBigIntSafe(n) {
  return BigInt(String(n));
}

function readStartPayload(ctx) {
  if (ctx.startPayload) return String(ctx.startPayload).trim();
  const txt = ctx.message?.text || '';
  if (txt.startsWith('/start ')) return txt.slice(7).trim();
  return '';
}

async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

  bot = new Telegraf(token);

  bot.catch((err, ctx) => {
    console.error('TG error:', err, 'on update', ctx.update);
  });

  bot.start(async (ctx) => {
    const lang = ctx.from.language_code;

    try {
      const payload = readStartPayload(ctx);
      if (!payload) {
        return ctx.reply(t('greeting', lang));
      }

      const ticket = await consumeToken(payload);
      if (!ticket || !ticket.employee) {
        return ctx.reply(t('linkInvalid', lang));
      }

      const emp = ticket.employee;

      await prisma.employee.update({
        where: { id: emp.id },
        data: {
          telegramUserId: toBigIntSafe(ctx.from.id),
          telegramChatId: toBigIntSafe(ctx.chat.id),
          telegramUsername: ctx.from.username || null,
          telegramLinkedAt: new Date(),
          telegramVerified: true,
        },
      });

      await ctx.reply(
        t('linkSuccess', lang, { login: emp.login }),
        { parse_mode: 'HTML' }
      );
    } catch (e) {
      console.error('Telegram /start error:', e);
      try {
        await ctx.reply(t('errorGeneric', lang));
      } catch (err) {
        console.error('Failed to send error reply:', err);
      }
    }
  });

  await bot.launch();
  console.log('Telegram bot launched (long polling)');
  return bot;
}

async function stopTelegramBot() {
  if (!bot) return;
  try {
    await bot.stop('SIGTERM');
  } catch (e) {
    console.warn('Telegram bot stop warning:', e?.message || e);
  } finally {
    bot = null;
  }
}

async function sendToEmployee(employeeId, text) {
  if (!bot) throw new Error('Bot is not started');
  const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!emp?.telegramChatId) throw new Error('Employee is not linked to Telegram');
  await bot.telegram.sendMessage(Number(emp.telegramChatId), text, { parse_mode: 'HTML' });
}

module.exports = { initTelegramBot, stopTelegramBot, sendToEmployee };
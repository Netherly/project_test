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
    try {
      const ticket = await prisma.telegramLinkTicket.findFirst({
        where: { token: ctx.startPayload },
        include: { employee: true },
      });

      if (!ticket || ticket.expiresAt < new Date()) {
        return ctx.reply('Ссылка недействительна или истекла.');
      }

      const emp = ticket.employee;

      // Check if telegramUserId is already linked to another employee
      const existing = await prisma.employee.findFirst({
        where: { telegramUserId: ctx.from.id },
      });

      if (existing && existing.id !== emp.id) {
        return ctx.reply('Этот Telegram аккаунт уже привязан к другому сотруднику.');
      }

      await prisma.employee.update({
        where: { id: emp.id },
        data: { telegramUserId: ctx.from.id },
      });

      await prisma.telegramLinkTicket.delete({
        where: { id: ticket.id },
      });

      ctx.reply(`Привет, ${emp.full_name}! Ваш Telegram аккаунт успешно привязан.`);
    } catch (error) {
      console.error('Telegram /start error:', error);
      ctx.reply('Произошла ошибка при привязке аккаунта.');
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
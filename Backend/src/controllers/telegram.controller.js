const { v4: uuidv4 } = require('uuid');
const prisma = require('../../prisma/client');
const { fetchAndSaveTelegramAvatar } = require('../services/telegram-avatar.service');
const { logActivity } = require('../services/activity-log.service');

function minutesFromNow(min) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + min);
  return d;
}

async function createLinkToken(req, res, next) {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) return res.status(401).json({ error: 'Unauthorized' });

    const code = uuidv4().replace(/-/g, '').slice(0, 12).toUpperCase();
    const ticket = await prisma.telegramLinkTicket.create({
      data: { code, employeeId, expiresAt: minutesFromNow(60) },
    });

    const botName = String(process.env.PUBLIC_BOT_NAME || 'gsse_assistant_bot')
      .trim()
      .replace(/^@/, '');
    const link = `https://t.me/${botName}?start=${ticket.code}`;

    return res.json({ link, code: ticket.code, ttlMinutes: 60 });
  } catch (e) {
    next(e);
  }
}

function buildChatLink({ username, userId }) {
  const uname = String(username || "").trim().replace(/^@/, "");
  if (uname) return `https://t.me/${uname}`;
  if (userId) return `tg://user?id=${userId}`;
  return null;
}

async function consumeLinkToken(req, res, next) {
  try {
    const { code, tgUserId, tgChatId, tgUsername } = req.body || {};
    if (!code || !tgUserId || !tgChatId) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const ticket = await prisma.telegramLinkTicket.findFirst({
      where: { code, consumedAt: null, expiresAt: { gt: new Date() } },
      include: { employee: true },
    });
    if (!ticket) return res.status(400).json({ message: 'Invalid or expired token' });

    const employee = ticket.employee;
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (employee.telegramVerified || employee.telegramUserId || employee.telegramChatId) {
      return res.status(409).json({ message: 'Telegram уже привязан к этому аккаунту' });
    }

    const existing = await prisma.employee.findFirst({
      where: { telegramUserId: BigInt(tgUserId) },
      select: { id: true },
    });
    if (existing && existing.id !== ticket.employeeId) {
      return res.status(409).json({ message: 'Этот Telegram уже привязан к другому аккаунту' });
    }

    await prisma.telegramLinkTicket.update({
      where: { id: ticket.id },
      data: {
        consumedAt: new Date(),
        tgUserId: BigInt(tgUserId),
        tgChatId: BigInt(tgChatId),
        tgUsername: tgUsername || null,
      },
    });

    await prisma.employee.update({
      where: { id: ticket.employeeId },
      data: {
        telegramUserId: BigInt(tgUserId),
        telegramChatId: BigInt(tgChatId),
        telegramUsername: tgUsername || null,
        telegramNickname: tgUsername || null,
        telegramId: BigInt(tgChatId),
        telegramDateTime: new Date(),
        telegramLinkedAt: new Date(),
        telegramVerified: true,
        chatLink: buildChatLink({ username: tgUsername, userId: tgUserId }),
      },
    });

    const avatar = await fetchAndSaveTelegramAvatar({
      employeeId: ticket.employeeId,
      telegramUserId: Number(tgUserId),
    });

    try {
      await logActivity({
        entityType: 'employee',
        entityId: ticket.employeeId,
        action: 'telegram_linked',
        source: 'telegram',
        actorId: ticket.employeeId,
        actorName: employee.full_name || employee.login || null,
        message: tgUsername
          ? `Привязан Telegram @${tgUsername}`
          : `Привязан Telegram ID ${tgUserId}`,
      });
    } catch (err) {
      console.warn('[log] telegram link failed:', err?.message || err);
    }

    return res.json({ ok: true, avatar });
  } catch (e) {
    next(e);
  }
}

module.exports = { createLinkToken, consumeLinkToken };

const { v4: uuidv4 } = require('uuid');
const prisma = require('../../prisma/client');
const { fetchAndSaveTelegramAvatar } = require('../services/telegram-avatar.service');

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

    const botName = process.env.PUBLIC_BOT_NAME || 'gsse_assistant_bot';
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

    return res.json({ ok: true, avatar });
  } catch (e) {
    next(e);
  }
}

module.exports = { createLinkToken, consumeLinkToken };

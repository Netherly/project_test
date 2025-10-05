const prisma = require('../../prisma/client');

async function consumeTicketOrThrow(code) {
  const now = new Date();
  const ticket = await prisma.telegramLinkTicket.findFirst({
    where: { code, consumedAt: null, expiresAt: { gt: now } }
  });
  if (!ticket) {
    const err = new Error('Invalid or expired Telegram code');
    err.status = 400; throw err;
  }
  return ticket;
}

module.exports = { consumeTicketOrThrow };

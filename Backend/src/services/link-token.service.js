// src/services/link-token.service.js
const prisma = require('../../prisma/client');

/**
 * Создаёт временный токен для привязки Telegram.
 * @param {number} employeeId — ID сотрудника
 * @param {number} ttlMinutes — срок жизни токена
 */
async function createLinkTokenForEmployee(employeeId, ttlMinutes = 60) {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  const ticket = await prisma.telegramLinkTicket.create({
    data: {
      code,
      employeeId,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

/**
 * Проверяет и «поглощает» (consume) токен при старте бота.
 * @param {string} code — токен
 */
async function consumeToken(code) {
  const ticket = await prisma.telegramLinkTicket.findFirst({
    where: { code, consumedAt: null, expiresAt: { gt: new Date() } },
    include: { employee: true },
  });
  if (!ticket) return null;

  await prisma.telegramLinkTicket.update({
    where: { id: ticket.id },
    data: { consumedAt: new Date() },
  });

  return ticket;
}

module.exports = {
  createLinkTokenForEmployee,
  consumeToken,
};

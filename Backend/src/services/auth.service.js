const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { consumeTicketOrThrow } = require('./telegram-link.service');

async function register(payload) {
  const {
    full_name, birthDate, phone, email, login, password, tgCode
  } = payload;

  if (!tgCode) throw new Error('Telegram code is required');

  const ticket = await consumeTicketOrThrow(tgCode);
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();

  const employee = await prisma.$transaction(async (tx) => {
    const emp = await tx.employee.create({
      data: {
        full_name,
        // ЕСЛИ у тебя есть поле birthDate в Prisma — добавь сюда:
        // birthDate: birthDate ? new Date(birthDate) : null,
        phone,
        email,
        login,
        password: hashedPassword,
        telegramUserId: ticket.tgUserId,
        telegramChatId: ticket.tgChatId,
        telegramUsername: ticket.tgUsername,
        telegramLinkedAt: now,
        telegramVerified: true,
      }
    });

    await tx.telegramLinkTicket.update({
      where: { id: ticket.id },
      data: { consumedAt: now, employeeId: emp.id }
    });

    return emp;
  });

  return { id: employee.id };
}

async function login(login, password) {
  const employee = await prisma.employee.findUnique({ where: { login } });
  if (!employee) throw new Error('Employee not found');

  const isValid = await bcrypt.compare(password, employee.password);
  if (!isValid) throw new Error('Invalid password');

  const token = jwt.sign({ employeeId: employee.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

module.exports = { register, login };

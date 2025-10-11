const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createLinkTokenForEmployee } = require('./link-token.service');

function httpErr(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

async function register({ full_name, phone, email, login, password }) {
  const exists = await prisma.employee.findUnique({ where: { login } });
  if (exists) httpErr('Логин уже используется', 409);

  const hashed = await bcrypt.hash(password, 10);
  const employee = await prisma.employee.create({
    data: { full_name, phone, email, login, password: hashed },
  });

  const token = await createLinkTokenForEmployee(employee.id, 60);
  const telegramLink = `https://t.me/gsse_assistant_bot?start=${token}`;

  return { employee, telegramLink };
}

async function login(loginName, password) {
  const employee = await prisma.employee.findUnique({ where: { login: loginName } });
  if (!employee) httpErr('Пользователь не найден', 404);

  const ok = await bcrypt.compare(password, employee.password);
  if (!ok) httpErr('Неверный пароль', 401);

  const token = jwt.sign({ employeeId: employee.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token };
}

module.exports = { register, login };

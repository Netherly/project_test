const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createLinkTokenForEmployee } = require('./link-token.service');

function httpErr(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  throw e;
}

function genUserId8() {
  const n = Math.floor(Math.random() * 100_000_000);
  return String(n).padStart(8, '0');
}

async function generateUniqueUserId(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = genUserId8();
    const exists = await prisma.employee.findUnique({
      where: { userid: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  httpErr('Не удалось сгенерировать уникальный userid', 500);
}

async function register({ full_name, phone, email, login, password }) {
  const exists = await prisma.employee.findFirst({
    where: { OR: [{ login }, { email }] },
  });
  if (exists) httpErr('Логин или email уже используется', 409);

  const userid = await generateUniqueUserId();
  const hashed = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: { full_name, phone, email, login, password: hashed, userid },
  });

  const token = await createLinkTokenForEmployee(employee.id, 60);
  const telegramLink = `https://t.me/gsse_assistant_bot?start=${token}`;

  return { employee, telegramLink };
}

async function login(identifier, password) {
  const employee = await prisma.employee.findFirst({
    where: { OR: [{ login: identifier }, { email: identifier }] },
  });
  if (!employee) httpErr('Пользователь не найден', 404);

  const ok = await bcrypt.compare(password, employee.password);
  if (!ok) httpErr('Неверный пароль', 401);

  const token = jwt.sign(
    { employeeId: employee.id, userid: employee.userid },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { token };
}

module.exports = { register, login };

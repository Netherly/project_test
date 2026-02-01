const prisma = require('../../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createLinkTokenForEmployee } = require('./link-token.service');

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '3d';
const MAX_LOGIN_AGE_MS = Number(process.env.JWT_MAX_LOGIN_AGE_MS || '') || 3 * 24 * 60 * 60 * 1000;

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

async function register({ full_name, birthDate, phone, email, login, password }) {
  if (login) {
    const loginExists = await prisma.employee.findFirst({
      where: { login },
      select: { id: true },
    });
    if (loginExists) httpErr('Логин уже используется', 409);
  }
  if (email) {
    const emailExists = await prisma.employee.findFirst({
      where: { email },
      select: { id: true },
    });
    if (emailExists) httpErr('Email уже используется', 409);
  }

  const userid = await generateUniqueUserId();
  const hashed = await bcrypt.hash(password, 10);

  const employee = await prisma.employee.create({
    data: {
      full_name,
      birthDate: birthDate ? new Date(birthDate) : null,
      phone,
      email,
      login,
      password: hashed,
      userid,
    },
  });

  const token = await createLinkTokenForEmployee(employee.id, 60);
  const telegramLink = `https://t.me/gsse_assistant_bot?start=${token}`;

  return { employee, telegramLink };
}

function signAccessToken(employee) {
  if (!process.env.JWT_SECRET) httpErr('JWT secret is not configured', 500);
  return jwt.sign(
    { employeeId: employee.id, userid: employee.userid },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken(employee, loginAtMs) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) httpErr('JWT refresh secret is not configured', 500);
  const payload = { employeeId: employee.id };
  if (loginAtMs) payload.loginAt = Math.floor(loginAtMs / 1000);
  return jwt.sign(
    payload,
    secret,
    { expiresIn: REFRESH_TTL }
  );
}

async function login(identifier, password) {
  const employee = await prisma.employee.findFirst({
    where: { OR: [{ login: identifier }, { email: identifier }] },
  });
  if (!employee) httpErr('Неверный логин или пароль', 401);

  const ok = await bcrypt.compare(password, employee.password);
  if (!ok) httpErr('Неверный логин или пароль', 401);

  const loginAtMs = Date.now();
  const token = signAccessToken(employee);
  const refreshToken = signRefreshToken(employee, loginAtMs);

  return { token, refreshToken };
}

async function refreshTokens(refreshToken) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) httpErr('JWT refresh secret is not configured', 500);
  let payload;
  try {
    payload = jwt.verify(refreshToken, secret, { algorithms: ['HS256'], clockTolerance: 5 });
  } catch (e) {
    httpErr('Invalid refresh token', 401);
  }

  const employeeId = payload?.employeeId || payload?.id || payload?.sub;
  if (!employeeId) httpErr('Refresh token has no employee id', 401);

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) httpErr('Employee not found', 401);

  const loginAtSec = payload?.loginAt || payload?.login_at;
  const loginAtMs = loginAtSec
    ? Number(loginAtSec) * 1000
    : payload?.iat
    ? Number(payload.iat) * 1000
    : null;

  if (loginAtMs && Date.now() - loginAtMs > MAX_LOGIN_AGE_MS) {
    httpErr('Сессия истекла. Войдите снова', 401);
  }

  const nextLoginAtMs = loginAtMs || Date.now();

  return {
    token: signAccessToken(employee),
    refreshToken: signRefreshToken(employee, nextLoginAtMs),
  };
}

module.exports = { register, login, refreshTokens };

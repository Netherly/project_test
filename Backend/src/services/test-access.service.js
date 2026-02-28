const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'testAccess';
const COOKIE_SCOPE = 'test_gate';
const DEFAULT_TTL_DAYS = 7;

function httpErr(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isProd() {
  return process.env.NODE_ENV === 'production';
}

function ttlDays() {
  const raw = Number.parseInt(String(process.env.TEST_GATE_COOKIE_TTL_DAYS || ''), 10);
  if (Number.isFinite(raw) && raw > 0 && raw <= 365) return raw;
  return DEFAULT_TTL_DAYS;
}

function ttlMs() {
  return ttlDays() * 24 * 60 * 60 * 1000;
}

function getPassword() {
  return String(process.env.TEST_GATE_PASSWORD || '').trim();
}

function getSecret() {
  return String(process.env.TEST_GATE_SECRET || '').trim();
}

function isConfigured() {
  return Boolean(getPassword() && getSecret());
}

function assertConfigured() {
  if (!isConfigured()) throw httpErr('Test access gate is not configured', 503);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    path: '/',
    maxAge: ttlMs(),
  };
}

function clearCookieOptions() {
  return {
    sameSite: 'lax',
    secure: isProd(),
    path: '/',
  };
}

function timingSafeCompare(a, b) {
  const aBuf = Buffer.from(String(a ?? ''), 'utf8');
  const bBuf = Buffer.from(String(b ?? ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function verifyPassword(inputPassword) {
  assertConfigured();
  return timingSafeCompare(inputPassword, getPassword());
}

function createGateToken() {
  assertConfigured();
  return jwt.sign(
    { scope: COOKIE_SCOPE },
    getSecret(),
    {
      algorithm: 'HS256',
      expiresIn: `${ttlDays()}d`,
    }
  );
}

function verifyGateToken(token) {
  assertConfigured();
  const decoded = jwt.verify(String(token || ''), getSecret(), {
    algorithms: ['HS256'],
    clockTolerance: 5,
  });
  if (decoded?.scope !== COOKIE_SCOPE) {
    throw httpErr('Invalid test access token scope', 401);
  }
  return decoded;
}

function readGateCookie(req) {
  return req?.cookies?.[COOKIE_NAME] || null;
}

function hasValidGateCookie(req) {
  const token = readGateCookie(req);
  if (!token) return false;
  try {
    verifyGateToken(token);
    return true;
  } catch {
    return false;
  }
}

function normalizeNextPath(value) {
  const raw = String(value || '').trim();
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  if (raw.includes('\r') || raw.includes('\n')) return '/';
  if (raw === '/test-access' || raw.startsWith('/api/test-access') || raw.startsWith('/_test_gate_check')) {
    return '/';
  }
  return raw;
}

module.exports = {
  COOKIE_NAME,
  assertConfigured,
  isConfigured,
  cookieOptions,
  clearCookieOptions,
  createGateToken,
  verifyPassword,
  readGateCookie,
  hasValidGateCookie,
  normalizeNextPath,
};

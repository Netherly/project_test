const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../../prisma/client');
const { hasTable } = require('../utils/db-schema');
const { logActivity } = require('./activity-log.service');

const CONFIG_KEY = 'employee_temp_passwords_v1';
const TEMP_PASSWORD_TTL_MS = 24 * 60 * 60 * 1000;
const SALT_ROUNDS = 10;
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function httpErr(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function emptyConfig() {
  return {
    version: 1,
    records: {},
  };
}

function toText(value) {
  return String(value ?? '').trim();
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object') return null;

  const hash = toText(record.hash);
  const expiresAt = toText(record.expiresAt);
  if (!hash || !expiresAt) return null;

  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return null;

  return {
    hash,
    expiresAt: new Date(expiresMs).toISOString(),
    createdAt: toText(record.createdAt) || null,
    createdBy: toText(record.createdBy) || null,
    login: toText(record.login) || null,
  };
}

function normalizeConfig(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const recordsSource =
    source.records && typeof source.records === 'object' && !Array.isArray(source.records)
      ? source.records
      : {};

  const records = {};
  const now = Date.now();

  for (const [employeeId, record] of Object.entries(recordsSource)) {
    const key = toText(employeeId);
    if (!key) continue;
    const normalized = normalizeRecord(record);
    if (!normalized) continue;
    if (Date.parse(normalized.expiresAt) <= now) continue;
    records[key] = normalized;
  }

  return {
    version: 1,
    records,
  };
}

async function loadConfig() {
  if (!(await hasTable('AppConfig'))) {
    return emptyConfig();
  }

  const row = await prisma.appConfig.findUnique({
    where: { key: CONFIG_KEY },
    select: { value: true },
  });

  return normalizeConfig(row?.value);
}

async function saveConfig(config) {
  if (!(await hasTable('AppConfig'))) {
    throw httpErr('Temporary passwords require AppConfig table', 503);
  }

  const normalized = normalizeConfig(config);
  await prisma.appConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: normalized },
    update: { value: normalized },
  });
  return normalized;
}

function generateTemporaryPassword(length = 10) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return result;
}

async function safeLog(payload) {
  try {
    await logActivity(payload);
  } catch (error) {
    console.warn('[log] temporary password activity failed:', error?.message || error);
  }
}

async function createForEmployee(employeeId, actor = {}) {
  if (!(await hasTable('AppConfig'))) {
    throw httpErr('Temporary passwords require AppConfig table', 503);
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, login: true, full_name: true, email: true },
  });
  if (!employee) {
    throw httpErr('Employee not found', 404);
  }

  if (!toText(employee.login)) {
    throw httpErr('У сотрудника не заполнен логин', 400);
  }

  const password = generateTemporaryPassword();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TEMP_PASSWORD_TTL_MS).toISOString();
  const config = await loadConfig();

  const next = {
    ...config,
    records: {
      ...config.records,
      [employee.id]: {
        hash,
        expiresAt,
        createdAt: now.toISOString(),
        createdBy: toText(actor.actorId) || null,
        login: employee.login,
      },
    },
  };

  await saveConfig(next);

  const label = employee.full_name || employee.login || employee.email || employee.id;
  await safeLog({
    entityType: 'employee',
    entityId: employee.id,
    action: 'updated',
    source: actor.source || 'manual',
    actorId: actor.actorId || null,
    actorName: actor.actorName || null,
    ip: actor.ip,
    userAgent: actor.userAgent,
    message: `Создан временный пароль для "${label}" до ${expiresAt}`,
  });

  return {
    employeeId: employee.id,
    login: employee.login,
    password,
    expiresAt,
    ttlHours: 24,
  };
}

async function consumeIfMatches(employeeId, inputPassword) {
  const password = toText(inputPassword);
  const id = toText(employeeId);
  if (!password || !id) return { matched: false };
  if (!(await hasTable('AppConfig'))) return { matched: false };

  const config = await loadConfig();
  const record = config.records[id];
  if (!record) return { matched: false };

  const expiresMs = Date.parse(record.expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs <= Date.now()) {
    delete config.records[id];
    await saveConfig(config);
    return { matched: false, expired: true };
  }

  const matched = await bcrypt.compare(password, record.hash);
  if (!matched) return { matched: false };

  delete config.records[id];
  await saveConfig(config);

  await safeLog({
    entityType: 'employee',
    entityId: id,
    action: 'updated',
    source: 'temporary-password',
    actorId: id,
    message: 'Вход выполнен по временному паролю',
  });

  return {
    matched: true,
    expiresAt: record.expiresAt,
  };
}

module.exports = {
  createForEmployee,
  consumeIfMatches,
};

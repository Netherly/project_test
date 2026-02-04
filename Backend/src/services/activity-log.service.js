const prisma = require('../../prisma/client');

const ENTITY_LABELS = {
  client: 'клиент',
  employee: 'сотрудник',
};

const sanitizeUserAgent = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length > 255 ? text.slice(0, 255) : text;
};

const sanitizeIp = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.length > 45 ? text.slice(0, 45) : text;
};

const jsonReplacer = (_key, value) => (typeof value === 'bigint' ? value.toString() : value);

const toPlain = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value, jsonReplacer));
    } catch (_) {
      return String(value);
    }
  }
  return value;
};

const diffObjects = (before = {}, after = {}, { exclude = [] } = {}) => {
  const excluded = new Set(exclude);
  const changes = {};
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);

  for (const key of keys) {
    if (excluded.has(key)) continue;
    const left = toPlain(before ? before[key] : undefined);
    const right = toPlain(after ? after[key] : undefined);
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      changes[key] = {
        from: left === undefined ? null : left,
        to: right === undefined ? null : right,
      };
    }
  }

  return changes;
};

const resolveActorName = async (actorId, fallbackName) => {
  if (fallbackName) return fallbackName;
  if (!actorId) return null;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: actorId },
      select: { full_name: true, login: true },
    });
    return employee?.full_name || employee?.login || null;
  } catch (_) {
    return null;
  }
};

const logActivity = async ({
  entityType,
  entityId,
  action,
  source,
  actorId,
  actorName,
  message,
  changes,
  ip,
  userAgent,
}) => {
  if (!entityType || !entityId || !action) return null;
  const resolvedActorName = await resolveActorName(actorId, actorName);

  return prisma.activityLog.create({
    data: {
      entityType,
      entityId,
      action,
      source: source || null,
      actorId: actorId || null,
      actorName: resolvedActorName,
      message: message ?? null,
      changes: changes ?? null,
      ip: sanitizeIp(ip),
      userAgent: sanitizeUserAgent(userAgent),
    },
  });
};

const listLogs = async ({ entityType, entityId, limit = 200, order = 'asc' }) => {
  const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const sort = order === 'desc' ? 'desc' : 'asc';
  return prisma.activityLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: sort },
    take,
  });
};

const createNote = async ({
  entityType,
  entityId,
  actorId,
  actorName,
  message,
  source,
  ip,
  userAgent,
}) => {
  const text = String(message || '').trim();
  if (!text) return null;
  return logActivity({
    entityType,
    entityId,
    action: 'note',
    source: source || 'manual',
    actorId,
    actorName,
    message: text,
    ip,
    userAgent,
  });
};

module.exports = {
  ENTITY_LABELS,
  toPlain,
  diffObjects,
  logActivity,
  listLogs,
  createNote,
};

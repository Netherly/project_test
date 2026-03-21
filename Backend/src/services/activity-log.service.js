const prisma = require('../../prisma/client');
const LOG_META_KEY = '__meta';

const ENTITY_LABELS = {
  client: 'клиент',
  employee: 'сотрудник',
};
const IMPORTANT_EMPLOYEE_ACTIONS = new Set([
  'created',
  'deleted',
  'note',
  'telegram_linked',
  'telegram_unlinked',
  'asset_attached',
  'asset_detached',
  'asset_removed',
  'transaction_created',
  'transaction_updated',
  'transaction_deleted',
  'asset_transaction_created',
  'asset_transaction_updated',
  'asset_transaction_deleted',
]);

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
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

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

const extractLogMeta = (changes) => {
  if (!isPlainObject(changes) || !isPlainObject(changes[LOG_META_KEY])) return {};
  return changes[LOG_META_KEY];
};

const stripLogMeta = (changes) => {
  if (!isPlainObject(changes)) return changes ?? null;
  const next = { ...changes };
  delete next[LOG_META_KEY];
  return Object.keys(next).length ? next : null;
};

const applyLogMeta = (changes, patch = {}) => {
  const base = isPlainObject(changes) ? { ...changes } : {};
  const currentMeta = extractLogMeta(base);
  const nextMeta = { ...currentMeta };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value === null || value === false || value === '') {
      delete nextMeta[key];
    } else {
      nextMeta[key] = value;
    }
  }

  if (Object.keys(nextMeta).length) {
    base[LOG_META_KEY] = nextMeta;
  } else {
    delete base[LOG_META_KEY];
  }

  return Object.keys(base).length ? base : null;
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
  meta,
  ip,
  userAgent,
}) => {
  if (!entityType || !entityId || !action) return null;
  const resolvedActorName = await resolveActorName(actorId, actorName);
  const preparedChanges = meta ? applyLogMeta(changes, meta) : changes ?? null;

  return prisma.activityLog.create({
    data: {
      entityType,
      entityId,
      action,
      source: source || null,
      actorId: actorId || null,
      actorName: resolvedActorName,
      message: message ?? null,
      changes: preparedChanges,
      ip: sanitizeIp(ip),
      userAgent: sanitizeUserAgent(userAgent),
    },
  });
};

const decorateLog = (log) => {
  const meta = extractLogMeta(log?.changes);
  const cleanChanges = stripLogMeta(log?.changes);
  const isEmployeeImportant =
    log?.entityType === 'employee' &&
    IMPORTANT_EMPLOYEE_ACTIONS.has(log?.action);
  const presentation = log?.entityType === 'employee'
    ? isEmployeeImportant
      ? 'important'
      : 'inline'
    : 'card';

  return {
    ...log,
    changes: cleanChanges,
    target: isPlainObject(meta?.target) ? meta.target : null,
    pinned: Boolean(meta?.pinned),
    important: presentation === 'important',
    presentation,
    editable: log?.action === 'note',
    deletable: log?.action === 'note',
    pinnable: log?.entityType === 'employee' ? presentation === 'important' : log?.action === 'note',
  };
};

const getLogOrThrow = async ({ entityType, entityId, logId }) => {
  const log = await prisma.activityLog.findFirst({
    where: {
      id: logId,
      entityType,
      entityId,
    },
  });

  if (!log) {
    const err = new Error('Log not found');
    err.status = 404;
    throw err;
  }

  return log;
};

const listLogs = async ({ entityType, entityId, limit = 200, order = 'asc' }) => {
  const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const sort = order === 'desc' ? 'desc' : 'asc';
  const rows = await prisma.activityLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: sort },
    take,
  });
  return rows.map(decorateLog);
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
  const created = await logActivity({
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
  return decorateLog(created);
};

const updateNote = async ({
  entityType,
  entityId,
  logId,
  message,
}) => {
  const existing = await getLogOrThrow({ entityType, entityId, logId });
  if (existing.action !== 'note') {
    const err = new Error('Only notes can be edited');
    err.status = 400;
    throw err;
  }

  const text = String(message || '').trim();
  if (!text) {
    const err = new Error('message is required');
    err.status = 400;
    throw err;
  }

  const updated = await prisma.activityLog.update({
    where: { id: existing.id },
    data: {
      message: text,
      changes: applyLogMeta(existing.changes, {
        editedAt: new Date().toISOString(),
      }),
    },
  });

  return decorateLog(updated);
};

const deleteNote = async ({
  entityType,
  entityId,
  logId,
}) => {
  const existing = await getLogOrThrow({ entityType, entityId, logId });
  if (existing.action !== 'note') {
    const err = new Error('Only notes can be deleted');
    err.status = 400;
    throw err;
  }

  await prisma.activityLog.delete({
    where: { id: existing.id },
  });

  return existing;
};

const setPinned = async ({
  entityType,
  entityId,
  logId,
  pinned,
}) => {
  const existing = await getLogOrThrow({ entityType, entityId, logId });
  const updated = await prisma.activityLog.update({
    where: { id: existing.id },
    data: {
      changes: applyLogMeta(existing.changes, {
        pinned: Boolean(pinned),
        pinnedAt: pinned ? new Date().toISOString() : null,
      }),
    },
  });

  return decorateLog(updated);
};

module.exports = {
  ENTITY_LABELS,
  LOG_META_KEY,
  toPlain,
  diffObjects,
  logActivity,
  listLogs,
  createNote,
  updateNote,
  deleteNote,
  setPinned,
};

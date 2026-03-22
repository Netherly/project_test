const prisma = require('../../prisma/client');
const { hasTable } = require('../utils/db-schema');

const CONFIG_KEY = 'telegram_avatar_sync_v1';

function emptyConfig() {
  return {
    version: 1,
    records: {},
  };
}

function toText(value) {
  return String(value ?? '').trim();
}

function toIsoDate(value) {
  const text = toText(value);
  if (!text) return null;

  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString();
}

function normalizeRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;

  return {
    disabled: Boolean(record.disabled),
    lastFilePath: toText(record.lastFilePath) || null,
    lastFileUniqueId: toText(record.lastFileUniqueId) || null,
    storageUrl: toText(record.storageUrl) || null,
    linkedAt: toIsoDate(record.linkedAt),
    updatedAt: toIsoDate(record.updatedAt),
  };
}

function normalizeConfig(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const sourceRecords =
    source.records && typeof source.records === 'object' && !Array.isArray(source.records)
      ? source.records
      : {};

  const records = {};

  for (const [employeeId, record] of Object.entries(sourceRecords)) {
    const key = toText(employeeId);
    if (!key) continue;
    const normalized = normalizeRecord(record);
    if (!normalized) continue;
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
  const normalized = normalizeConfig(config);

  if (!(await hasTable('AppConfig'))) {
    return normalized;
  }

  await prisma.appConfig.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: normalized },
    update: { value: normalized },
  });

  return normalized;
}

async function getState(employeeId) {
  const key = toText(employeeId);
  if (!key) return null;
  const config = await loadConfig();
  return config.records[key] || null;
}

async function patchState(employeeId, patch) {
  const key = toText(employeeId);
  if (!key) return null;

  const config = await loadConfig();
  const current = config.records[key] || {
    disabled: false,
    lastFilePath: null,
    lastFileUniqueId: null,
    storageUrl: null,
    linkedAt: null,
    updatedAt: null,
  };

  const nextRecord = normalizeRecord({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  config.records[key] = nextRecord;
  await saveConfig(config);
  return nextRecord;
}

function buildMetaPatch(meta = {}) {
  const patch = {};

  if (Object.prototype.hasOwnProperty.call(meta, 'linkedAt')) {
    patch.linkedAt = toIsoDate(meta.linkedAt);
  }
  if (Object.prototype.hasOwnProperty.call(meta, 'lastFilePath')) {
    patch.lastFilePath = toText(meta.lastFilePath) || null;
  }
  if (Object.prototype.hasOwnProperty.call(meta, 'lastFileUniqueId')) {
    patch.lastFileUniqueId = toText(meta.lastFileUniqueId) || null;
  }
  if (Object.prototype.hasOwnProperty.call(meta, 'storageUrl')) {
    patch.storageUrl = toText(meta.storageUrl) || null;
  }

  return patch;
}

async function clearState(employeeId) {
  const key = toText(employeeId);
  if (!key) return;

  const config = await loadConfig();
  if (!config.records[key]) return;

  delete config.records[key];
  await saveConfig(config);
}

async function markSyncDisabled(employeeId, meta = {}) {
  return patchState(employeeId, {
    disabled: true,
    ...buildMetaPatch(meta),
  });
}

async function markSyncEnabled(employeeId, meta = {}) {
  return patchState(employeeId, {
    disabled: false,
    ...buildMetaPatch(meta),
  });
}

function shouldSkipAutoSync(state, meta = {}) {
  if (!state?.disabled) return false;

  const stateLinkedAt = toIsoDate(state.linkedAt);
  const currentLinkedAt = toIsoDate(meta.linkedAt);

  if (stateLinkedAt && currentLinkedAt && stateLinkedAt !== currentLinkedAt) {
    return false;
  }

  return true;
}

module.exports = {
  clearState,
  getState,
  markSyncDisabled,
  markSyncEnabled,
  shouldSkipAutoSync,
};

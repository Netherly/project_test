const CACHE_META_PREFIX = "cache-meta:";

const minute = 60 * 1000;

export const CACHE_TTL = {
  fields: 30 * minute,
  transactions: 2 * minute,
  lists: 2 * minute,
  assets: 2 * minute,
  companies: 10 * minute,
  profile: 10 * minute,
};

const hasStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getMetaKey = (key) => `${CACHE_META_PREFIX}${key}`;

const normalizeForSignature = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForSignature);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      const nextValue = value[key];
      if (nextValue === undefined) return acc;
      acc[key] = normalizeForSignature(nextValue);
      return acc;
    }, {});
};

export const createCacheSignature = (value) => {
  try {
    return JSON.stringify(normalizeForSignature(value));
  } catch (_) {
    return "";
  }
};

export const hasDataChanged = (currentValue, nextValue) =>
  createCacheSignature(currentValue) !== createCacheSignature(nextValue);

export function readCachedValue(key, fallback = null) {
  if (!hasStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

export function writeCachedValue(key, value) {
  if (!hasStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem(
      getMetaKey(key),
      JSON.stringify({
        savedAt: Date.now(),
        signature: createCacheSignature(value),
      })
    );
  } catch (_) {}
}

export function removeCachedValue(key) {
  if (!hasStorage()) return;

  try {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(getMetaKey(key));
  } catch (_) {}
}

export function readCacheSnapshot(key, { fallback = null, ttlMs = 0 } = {}) {
  if (!hasStorage()) {
    return {
      data: fallback,
      hasData: fallback !== null && fallback !== undefined,
      isFresh: false,
      savedAt: 0,
      signature: "",
    };
  }

  let hasData = false;
  let data = fallback;
  let savedAt = 0;
  let signature = "";

  try {
    const raw = window.localStorage.getItem(key);
    hasData = raw != null;
    if (hasData) {
      data = JSON.parse(raw);
    }
  } catch (_) {
    data = fallback;
    hasData = false;
  }

  try {
    const rawMeta = window.localStorage.getItem(getMetaKey(key));
    if (rawMeta) {
      const parsedMeta = JSON.parse(rawMeta);
      savedAt = Number(parsedMeta?.savedAt) || 0;
      signature = String(parsedMeta?.signature || "");
    }
  } catch (_) {}

  const isFresh = Boolean(
    hasData && ttlMs > 0 && savedAt > 0 && Date.now() - savedAt <= ttlMs
  );

  return {
    data,
    hasData,
    isFresh,
    savedAt,
    signature,
  };
}

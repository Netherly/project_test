function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createTtlCache({ ttlMs = 60_000, maxEntries = 32 } = {}) {
  const store = new Map();
  const cacheTtlMs = parsePositiveInt(ttlMs, 60_000);
  const cacheMaxEntries = parsePositiveInt(maxEntries, 32);

  function dropOverflow() {
    while (store.size > cacheMaxEntries) {
      const oldestKey = store.keys().next().value;
      if (oldestKey === undefined) break;
      store.delete(oldestKey);
    }
  }

  async function getOrLoad(key, loader) {
    const now = Date.now();
    const cached = store.get(key);

    if (cached?.value !== undefined && cached.expiresAt > now) {
      return cached.value;
    }

    if (cached?.promise) {
      return cached.promise;
    }

    const promise = Promise.resolve()
      .then(loader)
      .then((value) => {
        store.set(key, {
          value,
          expiresAt: Date.now() + cacheTtlMs,
        });
        dropOverflow();
        return value;
      })
      .catch((error) => {
        store.delete(key);
        throw error;
      });

    store.set(key, {
      promise,
      expiresAt: now + cacheTtlMs,
    });

    return promise;
  }

  function clear(key) {
    store.delete(key);
  }

  function clearAll() {
    store.clear();
  }

  return {
    clear,
    clearAll,
    getOrLoad,
  };
}

module.exports = {
  createTtlCache,
  parsePositiveInt,
};

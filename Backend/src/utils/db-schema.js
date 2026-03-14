const prisma = require('../../prisma/client');

const tableExistsCache = new Map();
const tableColumnsCache = new Map();

function cacheAsync(map, key, loader) {
  if (!map.has(key)) {
    map.set(
      key,
      Promise.resolve()
        .then(loader)
        .catch((err) => {
          map.delete(key);
          throw err;
        })
    );
  }
  return map.get(key);
}

async function hasTable(tableName) {
  const key = String(tableName || '');
  if (!key) return false;

  return cacheAsync(tableExistsCache, key, async () => {
    const rows = await prisma.$queryRaw`
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${key}
      LIMIT 1
    `;
    return rows.length > 0;
  });
}

async function getTableColumns(tableName) {
  const key = String(tableName || '');
  if (!key) return new Set();

  return cacheAsync(tableColumnsCache, key, async () => {
    const rows = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${key}
    `;
    return new Set(rows.map((row) => String(row.column_name)));
  });
}

async function hasColumn(tableName, columnName) {
  const columns = await getTableColumns(tableName);
  return columns.has(String(columnName || ''));
}

async function pickExistingColumns(tableName, data = {}) {
  const columns = await getTableColumns(tableName);
  return Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined && columns.has(key))
  );
}

module.exports = {
  hasTable,
  hasColumn,
  pickExistingColumns,
};

// CommonJS prisma client
const { PrismaClient } = require('@prisma/client');

const globalForPrisma = globalThis;
const buildDatasourceUrl = () => {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const fallbackLimit = process.env.NODE_ENV === 'production' ? '' : '3';
  const limit = process.env.PRISMA_CONNECTION_LIMIT || fallbackLimit;
  if (!limit) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', limit);
    }
    return url.toString();
  } catch (_) {
    return raw;
  }
};

const datasourceUrl = buildDatasourceUrl();

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;

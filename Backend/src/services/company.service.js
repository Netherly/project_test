const prisma = require('../../prisma/client');
const { randomUUID } = require('crypto');

const pickStr = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') return String(value.name ?? value.value ?? value.code ?? '').trim();
  return String(value).trim();
};

const CompanyService = {
  async list() {
    return prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  },

  async create(payload = {}) {
    const name = pickStr(payload.name);
    if (!name) {
      const err = new Error('Company name is required');
      err.status = 400;
      throw err;
    }

    const existing = await prisma.company.findFirst({
      where: { name },
      select: { id: true, name: true },
    });
    if (existing) return existing;

    try {
      return await prisma.company.create({
        data: { name },
        select: { id: true, name: true },
      });
    } catch (err) {
      const message = String(err?.message || '');
      const legacyIdBindingIssue =
        message.includes('22P03') ||
        message.includes('incorrect binary data format in bind parameter 1');

      if (!legacyIdBindingIssue) throw err;

      const rows = await prisma.$queryRaw`
        INSERT INTO "Company" ("id", "name")
        VALUES (${randomUUID()}, ${name})
        RETURNING "id", "name"
      `;
      return rows[0] || null;
    }
  },
};

module.exports = CompanyService;

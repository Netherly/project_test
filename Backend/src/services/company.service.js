const prisma = require('../../prisma/client');

const pickStr = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') return String(value.name ?? value.value ?? value.code ?? '').trim();
  return String(value).trim();
};

const CompanyService = {
  async list() {
    return prisma.company.findMany({ orderBy: { name: 'asc' } });
  },

  async create(payload = {}) {
    const name = pickStr(payload.name);
    if (!name) {
      const err = new Error('Company name is required');
      err.status = 400;
      throw err;
    }

    const existing = await prisma.company.findFirst({ where: { name } });
    if (existing) return existing;

    return prisma.company.create({ data: { name } });
  },
};

module.exports = CompanyService;

const prisma = require('../../prisma/client');

const DEFAULT_COMPANIES = [
  'ООО «Ромашка»',
  'Acme Corp',
  'Globex Corporation',
  'Initech',
  'Umbrella Corporation',
  'Hooli',
  'Stark Industries',
  'Wayne Enterprises',
  'Wonka Industries',
  'Cyberdyne Systems',
];

async function ensureDefaultCompanies() {
  for (const name of DEFAULT_COMPANIES) {
    if (!name) continue;
    const existing = await prisma.company.findFirst({ where: { name } });
    if (!existing) {
      await prisma.company.create({ data: { name } });
    }
  }
}

module.exports = { ensureDefaultCompanies };

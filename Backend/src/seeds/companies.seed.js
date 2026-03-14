const companyService = require('../services/company.service');

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
    await companyService.create({ name });
  }
}

module.exports = { ensureDefaultCompanies };

require('dotenv').config();

const prisma = require('../../prisma/client');
const { importRatesFromExcel, parseBool } = require('../services/rates.excel-import.service');

async function main() {
  const force = parseBool(process.env.RATES_EXCEL_IMPORT_FORCE, false);
  const result = await importRatesFromExcel({ force });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error('[rates.import] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

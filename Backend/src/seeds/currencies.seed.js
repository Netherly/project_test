const prisma = require('../../prisma/client');

const DEFAULT_CURRENCIES = [
  { code: 'UAH', name: 'Ukrainian Hryvnia', order: 0 },
  { code: 'USD', name: 'US Dollar', order: 1 },
  { code: 'EUR', name: 'Euro', order: 2 },
  { code: 'RUB', name: 'Russian Ruble', order: 3 },
  { code: 'USDT', name: 'Tether USDT', order: 4 },
];

async function ensureDefaultCurrencies() {
  for (const item of DEFAULT_CURRENCIES) {
    const existing = await prisma.currencyDict.findUnique({
      where: { code: item.code },
      select: { id: true, name: true, isActive: true, order: true },
    });

    if (existing?.id) {
      await prisma.currencyDict.update({
        where: { id: existing.id },
        data: {
          name: existing.name || item.name,
          isActive: true,
          order: Number.isFinite(Number(existing.order)) ? existing.order : item.order,
        },
      });
      continue;
    }

    await prisma.currencyDict.create({
      data: {
        code: item.code,
        name: item.name,
        isActive: true,
        order: item.order,
      },
    });
  }
}

module.exports = {
  DEFAULT_CURRENCIES,
  ensureDefaultCurrencies,
};

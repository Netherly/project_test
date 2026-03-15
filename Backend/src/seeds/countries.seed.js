const prisma = require('../../prisma/client');
const { buildCountryNames } = require('../utils/country-localization');

const EUROPE_ISO2 = [
  'AL', 'AD', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME',
  'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH',
  'TR', 'UA', 'GB', 'VA',
];

const ASIA_ISO2 = [
  'AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'GE', 'IN', 'ID', 'IR', 'IQ',
  'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP',
  'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL',
  'TM', 'AE', 'UZ', 'VN', 'YE',
];

const DEFAULT_COUNTRY_ISO2 = Array.from(new Set([...EUROPE_ISO2, ...ASIA_ISO2]));

const COUNTRY_SELECT = {
  id: true,
  name: true,
  nameEn: true,
  nameRu: true,
  nameUk: true,
  iso2: true,
  iso3: true,
  isActive: true,
  order: true,
};

const toText = (value) => String(value ?? '').trim();

const buildNameMatchers = (text) => [
  { name: { equals: text, mode: 'insensitive' } },
  { nameEn: { equals: text, mode: 'insensitive' } },
  { nameRu: { equals: text, mode: 'insensitive' } },
  { nameUk: { equals: text, mode: 'insensitive' } },
];

async function ensureDefaultCountries() {
  const existing = await prisma.country.findMany({
    select: COUNTRY_SELECT,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  let nextOrder = existing.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0);

  for (const iso2 of DEFAULT_COUNTRY_ISO2) {
    const names = buildCountryNames(iso2);
    if (!names) continue;

    const current = await prisma.country.findFirst({
      where: {
        OR: [
          { iso2: names.iso2 },
          ...buildNameMatchers(names.nameEn),
          ...buildNameMatchers(names.nameRu),
          ...buildNameMatchers(names.nameUk),
        ],
      },
      select: COUNTRY_SELECT,
    });

    if (current?.id) {
      const data = {};
      if (!toText(current.name)) data.name = names.name;
      if (!toText(current.nameEn)) data.nameEn = names.nameEn;
      if (!toText(current.nameRu)) data.nameRu = names.nameRu;
      if (!toText(current.nameUk)) data.nameUk = names.nameUk;
      if (!toText(current.iso2)) data.iso2 = names.iso2;
      if (!Object.keys(data).length) continue;

      await prisma.country.update({
        where: { id: current.id },
        data,
      });
      continue;
    }

    nextOrder += 1;
    await prisma.country.create({
      data: {
        name: names.name,
        nameEn: names.nameEn,
        nameRu: names.nameRu,
        nameUk: names.nameUk,
        iso2: names.iso2,
        isActive: true,
        order: nextOrder,
      },
    });
  }
}

module.exports = {
  DEFAULT_COUNTRY_ISO2,
  ensureDefaultCountries,
};

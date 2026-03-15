const { parsePhoneNumberFromString } = require('libphonenumber-js');

const LOCALE_BY_LANGUAGE = {
  ua: 'uk',
  uk: 'uk',
  ru: 'ru',
  en: 'en',
};

function toText(value) {
  return String(value ?? '').trim();
}

function normalizeCrmLanguage(language) {
  return LOCALE_BY_LANGUAGE[toText(language).toLowerCase()] || 'en';
}

function normalizeIso2(value) {
  const text = toText(value).toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : '';
}

function normalizeIso3(value) {
  const text = toText(value).toUpperCase();
  return /^[A-Z]{3}$/.test(text) ? text : '';
}

function inferPhoneCountryIso2(phone) {
  const input = toText(phone);
  if (!input) return '';

  try {
    const parsed = parsePhoneNumberFromString(input);
    return normalizeIso2(parsed?.country);
  } catch (_) {
    return '';
  }
}

function resolveDisplayName(locale, iso2) {
  const normalizedIso2 = normalizeIso2(iso2);
  if (!normalizedIso2) return '';

  try {
    const formatter = new Intl.DisplayNames([locale], { type: 'region' });
    return toText(formatter.of(normalizedIso2)) || normalizedIso2;
  } catch (_) {
    return normalizedIso2;
  }
}

function buildCountryNames(iso2) {
  const normalizedIso2 = normalizeIso2(iso2);
  if (!normalizedIso2) return null;

  const nameEn = resolveDisplayName('en', normalizedIso2);
  const nameRu = resolveDisplayName('ru', normalizedIso2);
  const nameUk = resolveDisplayName('uk', normalizedIso2);

  return {
    iso2: normalizedIso2,
    name: nameEn || normalizedIso2,
    nameEn: nameEn || normalizedIso2,
    nameRu: nameRu || nameEn || normalizedIso2,
    nameUk: nameUk || nameEn || normalizedIso2,
  };
}

function getCountryDisplayName(country, crmLanguage = 'ru') {
  const source = country && typeof country === 'object' ? country : null;
  if (!source) return toText(country);

  const locale = normalizeCrmLanguage(crmLanguage);
  if (locale === 'uk') {
    return (
      toText(source.nameUk) ||
      toText(source.name) ||
      toText(source.nameEn) ||
      toText(source.nameRu) ||
      normalizeIso2(source.iso2)
    );
  }
  if (locale === 'ru') {
    return (
      toText(source.nameRu) ||
      toText(source.name) ||
      toText(source.nameEn) ||
      toText(source.nameUk) ||
      normalizeIso2(source.iso2)
    );
  }

  return (
    toText(source.nameEn) ||
    toText(source.name) ||
    toText(source.nameUk) ||
    toText(source.nameRu) ||
    normalizeIso2(source.iso2)
  );
}

module.exports = {
  buildCountryNames,
  getCountryDisplayName,
  inferPhoneCountryIso2,
  normalizeCrmLanguage,
  normalizeIso2,
  normalizeIso3,
};

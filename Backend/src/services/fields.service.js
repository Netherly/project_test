const prisma = require('../../prisma/client');
const fs = require('fs');
const path = require('path');
const { hasTable } = require('../utils/db-schema');
const { buildCountryNames, normalizeIso2, normalizeIso3 } = require('../utils/country-localization');
const { httpErr } = require('../utils/http-error');

/* ==============================
   FS utils
================================ */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');
const CARD_DIR = path.join(UPLOADS_ROOT, 'card-designs');
ensureDir(CARD_DIR);
const MAX_CARD_DESIGN_BYTES = 2 * 1024 * 1024;

const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const EXTRA_FIELDS_CONFIG_KEY = 'fields.extra';
const DEFAULT_CURRENCY_ALIASES = {
  UAH: ['грн', 'гривна', 'гривня', 'hryvnia', 'ukrainian hryvnia', 'украинская гривна', 'українська гривня'],
  USD: ['$', 'usdollar', 'us dollar', 'dollar', 'доллар', 'долар', 'доллары сша', 'долари сша'],
  EUR: ['euro', 'евро', 'євро'],
  USDT: ['tether', 'tether usdt', 'usd tether', 'тезер', 'тетер'],
  PLN: ['zloty', 'polish zloty', 'zl', 'злотый', 'злотий', 'польский злотый', 'польський злотий'],
  GBP: ['pound', 'british pound', 'pound sterling', 'фунт', 'британский фунт', 'британський фунт'],
  CHF: ['swiss franc', 'franc', 'швейцарский франк', 'швейцарський франк'],
  CZK: ['czech koruna', 'koruna', 'чешская крона', 'чеська крона'],
  RUB: ['ruble', 'ruble', 'russian ruble', 'рубль', 'рубль рф', 'российский рубль', 'російський рубль'],
};
const SIMPLE_DICT_RULES = {
  currencyDict: {
    code: {
      max: 10,
      label: 'код валюты',
      normalize: (value) => value.toUpperCase(),
      validate: (value) => /^[A-Z0-9._-]+$/.test(value),
      invalidMessage: 'Некорректный код валюты',
      tooLongMessage: 'Некорректный код валюты',
    },
  },
  orderIntervalDict: { value: { max: 100, label: 'интервал' } },
  orderStatusDict: { name: { max: 100, label: 'статус заказа' } },
  orderCloseReasonDict: { name: { max: 150, label: 'причина закрытия' } },
  orderProjectDict: { name: { max: 255, label: 'проект' } },
  orderDiscountReasonDict: { name: { max: 255, label: 'причина скидки' } },
  executorRoleDict: { name: { max: 100, label: 'роль исполнителя' } },
  clientSourceDict: { name: { max: 100, label: 'источник клиента' } },
  clientCategoryDict: { name: { max: 100, label: 'категория клиента' } },
  assetTypeDict: { name: { max: 100, label: 'тип актива' } },
  paymentSystemDict: { name: { max: 100, label: 'платежная система' } },
  financeArticleDict: { name: { max: 150, label: 'статья' } },
  financeSubcategoryDict: { name: { max: 150, label: 'подкатегория' } },
  sundryTypeWorkDict: { name: { max: 150, label: 'тип работы' } },
};
const COUNTRY_FIELD_LIMITS = {
  name: 100,
  nameEn: 100,
  nameRu: 100,
  nameUk: 100,
  iso2: 2,
  iso3: 3,
};

async function saveDataUrlToFile(dataUrl, fileBaseName) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  const mime = m[1];
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_CARD_DESIGN_BYTES) {
    throw httpErr('Размер файла превышает 2 МБ');
  }
  const ext = (mime.split('/')[1] || 'png').toLowerCase();
  const fileName = `${fileBaseName}.${ext}`;
  const abs = path.join(CARD_DIR, fileName);
  await fs.promises.writeFile(abs, buf);
  return `/uploads/card-designs/${fileName}`;
}

async function safeUnlink(absPath) {
  try {
    await fs.promises.unlink(absPath);
  } catch (_) {}
}

function urlToAbsPath(url) {
  if (!url || !url.startsWith('/uploads/')) return null;
  return path.join(UPLOADS_ROOT, url.replace('/uploads/', ''));
}

/* ==============================
   Helpers
================================ */
const pickStr = (v) => {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') {
    const candidate =
      v.value ??
      v.name ??
      v.code ??
      v.articleValue ??
      v.categoryValue ??
      v.subarticleValue ??
      v.intervalValue ??
      v.categoryInterval ??
      v.subarticleInterval ??
      v.label ??
      '';
    return String(candidate).trim();
  }
  return '';
};

const ruleFor = (model, field) => SIMPLE_DICT_RULES?.[model]?.[field] || null;

const sanitizeDictValue = (value, options = {}) => {
  const rule = ruleFor(options?.model, options?.field);
  let normalized = String(value ?? '').trim();
  if (rule?.normalize) normalized = rule.normalize(normalized);
  if (!normalized) return '';

  if (rule?.validate && !rule.validate(normalized)) {
    throw httpErr(rule.invalidMessage || `Некорректное значение поля "${rule.label || options?.field || 'value'}"`);
  }
  if (rule?.max && normalized.length > rule.max) {
    throw httpErr(rule.tooLongMessage || `Значение поля "${rule.label || options?.field || 'value'}" слишком длинное`);
  }
  return normalized;
};

const sanitizeCountryField = (value, field) => {
  let normalized = pickStr(value);
  if (!normalized) return '';
  if (field === 'iso2' || field === 'iso3') normalized = normalized.toUpperCase();
  const max = COUNTRY_FIELD_LIMITS[field];
  if (max && normalized.length > max) {
    if (field === 'iso2' || field === 'iso3') throw httpErr('Некорректный код страны');
    throw httpErr('Название страны слишком длинное');
  }
  if (field === 'iso2' && !/^[A-Z]{2}$/.test(normalized)) throw httpErr('Некорректный код страны');
  if (field === 'iso3' && !/^[A-Z]{3}$/.test(normalized)) throw httpErr('Некорректный код страны');
  return normalized;
};

const pickCurrencyCode = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return value.code ?? value.value ?? '';
  }
  return '';
};

const normalizeCurrencyAliasKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яіїєґ$]+/gi, '');

const pickCurrencyCandidates = (value) => {
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') {
    return [
      value.code,
      value.value,
      value.name,
      value.label,
      value.currency,
    ].filter((item) => item !== undefined && item !== null && String(item).trim() !== '');
  }
  return [];
};

const buildCurrencyAliasMap = (rows = []) => {
  const aliases = new Map();

  const addAlias = (alias, code) => {
    const key = normalizeCurrencyAliasKey(alias);
    if (!key || !code) return;
    aliases.set(key, String(code).trim().toUpperCase());
  };

  rows.forEach((row) => {
    addAlias(row?.code, row?.code);
    addAlias(row?.name, row?.code);
  });

  Object.entries(DEFAULT_CURRENCY_ALIASES).forEach(([code, list]) => {
    addAlias(code, code);
    (Array.isArray(list) ? list : []).forEach((alias) => addAlias(alias, code));
  });

  return aliases;
};

const resolveCurrencyCode = (value, currencyAliases) => {
  const candidates = pickCurrencyCandidates(value);

  for (const candidate of candidates) {
    const key = normalizeCurrencyAliasKey(candidate);
    if (key && currencyAliases.has(key)) {
      return currencyAliases.get(key);
    }
  }

  for (const candidate of candidates) {
    try {
      const normalized = sanitizeDictValue(candidate, {
        model: 'currencyDict',
        field: 'code',
      });
      if (normalized) return normalized;
    } catch (_) {}
  }

  throw httpErr('Некорректный код валюты');
};

const arrToUniqueStrings = (list, key = 'name') => {
  const out = new Set();
  (Array.isArray(list) ? list : []).forEach((x) => {
    const s = pickStr(x?.[key] ?? x);
    if (s) out.add(s);
  });
  return Array.from(out);
};

const isHexColor = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ''));

const normalizeSimpleValues = (list, options = {}) => {
  const out = new Set();
  (Array.isArray(list) ? list : []).forEach((value) => {
    let v = value;
    if (v && typeof v === 'object') {
      v =
        v.value ??
        v.name ??
        v.code ??
        v.articleValue ??
        v.categoryValue ??
        v.subarticleValue ??
        v.intervalValue ??
        v.categoryInterval ??
        v.subarticleInterval ??
        v.label ??
        '';
    }
    if (v !== undefined && v !== null) {
      const s = sanitizeDictValue(v, options);
      if (s) out.add(s);
    }
  });
  return Array.from(out);
};

const normalizeCountryEntries = (list) => {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(list) ? list : []) {
    const source =
      item && typeof item === 'object'
        ? item
        : {
            name: pickStr(item),
          };

    const name = sanitizeCountryField(source?.name ?? source?.value, 'name');
    const nameEn = sanitizeCountryField(source?.nameEn, 'nameEn');
    const nameRu = sanitizeCountryField(source?.nameRu, 'nameRu');
    const nameUk = sanitizeCountryField(source?.nameUk, 'nameUk');
    const iso2 = normalizeIso2(sanitizeCountryField(source?.iso2, 'iso2'));
    const iso3 = normalizeIso3(sanitizeCountryField(source?.iso3, 'iso3'));
    const id = pickStr(source?.id);

    const displayName = name || nameEn || nameRu || nameUk || iso2;
    if (!displayName) continue;

    const key = id || iso2 || displayName.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: id || null,
      name: name || nameEn || nameRu || nameUk || iso2,
      nameEn: nameEn || '',
      nameRu: nameRu || '',
      nameUk: nameUk || '',
      iso2: iso2 || '',
      iso3: iso3 || '',
      order: Number.isFinite(Number(source?.order)) ? Number(source.order) : null,
    });
  }

  return out;
};

const mapCountry = (country) => ({
  id: country.id,
  name: country.name,
  nameEn: country.nameEn || null,
  nameRu: country.nameRu || null,
  nameUk: country.nameUk || null,
  iso2: country.iso2 || null,
  iso3: country.iso3 || null,
  order: Number.isFinite(Number(country.order)) ? Number(country.order) : 0,
});

const syncSimpleDict = async (tx, model, list, opts = {}) => {
  const field = opts.field || 'name';
  const hasIsActive = opts.hasIsActive !== false;
  const values = normalizeSimpleValues(list, { model, field });
  const dbModel = tx[model];

  if (!dbModel) return;

  if (!values || !values.length) {
    if (hasIsActive) {
      await dbModel.updateMany({ data: { isActive: false } });
    } else {
      await dbModel.deleteMany({});
    }
    return;
  }

  await Promise.all(
    values.map((value) =>
      dbModel.upsert({
        where: { [field]: value },
        update: { ...(hasIsActive ? { isActive: true } : {}) },
        create: { id: rid(), [field]: value, ...(hasIsActive ? { isActive: true } : {}) },
      })
    )
  );

  if (hasIsActive) {
    await dbModel.updateMany({
      where: { [field]: { notIn: values } },
      data: { isActive: false },
    });
  } else {
    await dbModel.deleteMany({
      where: { [field]: { notIn: values } },
    });
  }
};

const syncCountries = async (tx, list) => {
  const countries = normalizeCountryEntries(list);
  const dbModel = tx.country;

  if (!dbModel) return;

  if (!countries.length) {
    await dbModel.updateMany({ data: { isActive: false } });
    return;
  }

  const existing = await dbModel.findMany({
    select: {
      id: true,
      name: true,
      nameEn: true,
      nameRu: true,
      nameUk: true,
      iso2: true,
      iso3: true,
      isActive: true,
      order: true,
    },
  });
  const existingById = new Map(existing.map((item) => [item.id, item]));
  const existingByIso2 = new Map(
    existing.map((item) => [normalizeIso2(item.iso2), item]).filter(([key]) => key)
  );
  const existingByName = new Map();
  for (const item of existing) {
    [item.name, item.nameEn, item.nameRu, item.nameUk]
      .map((value) => pickStr(value).toLowerCase())
      .filter(Boolean)
      .forEach((key) => existingByName.set(key, item));
  }

  const keepIds = new Set();

  for (const [index, item] of countries.entries()) {
    const localizedNames = item.iso2 ? buildCountryNames(item.iso2) : null;
    const merged = {
      name: item.name || localizedNames?.name || item.iso2,
      nameEn: item.nameEn || localizedNames?.nameEn || item.name || null,
      nameRu: item.nameRu || localizedNames?.nameRu || item.name || null,
      nameUk: item.nameUk || localizedNames?.nameUk || item.name || null,
      iso2: item.iso2 || localizedNames?.iso2 || null,
      iso3: item.iso3 || null,
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    };

    const existingCountry =
      (item.id && existingById.get(item.id)) ||
      (merged.iso2 && existingByIso2.get(merged.iso2)) ||
      existingByName.get(pickStr(merged.name).toLowerCase()) ||
      existingByName.get(pickStr(merged.nameEn).toLowerCase()) ||
      existingByName.get(pickStr(merged.nameRu).toLowerCase()) ||
      existingByName.get(pickStr(merged.nameUk).toLowerCase()) ||
      null;

    if (existingCountry?.id) {
      keepIds.add(existingCountry.id);
      await dbModel.update({
        where: { id: existingCountry.id },
        data: {
          isActive: true,
          name: merged.name || existingCountry.name,
          nameEn: merged.nameEn || existingCountry.nameEn,
          nameRu: merged.nameRu || existingCountry.nameRu,
          nameUk: merged.nameUk || existingCountry.nameUk,
          iso2: merged.iso2 || existingCountry.iso2,
          iso3: merged.iso3 || existingCountry.iso3,
          order: merged.order,
        },
      });
      continue;
    }

    const created = await dbModel.create({
      data: {
        id: item.id || rid(),
        name: merged.name,
        nameEn: merged.nameEn,
        nameRu: merged.nameRu,
        nameUk: merged.nameUk,
        iso2: merged.iso2,
        iso3: merged.iso3,
        isActive: true,
        order: merged.order,
      },
      select: { id: true },
    });
    keepIds.add(created.id);
  }

  await dbModel.updateMany({
    where: { id: { notIn: Array.from(keepIds) } },
    data: { isActive: false },
  });
};

const normalizeExtraFieldList = (list) => {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(list) ? list : []) {
    const value = pickStr(item?.value ?? item?.name ?? item);
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: item?.id || rid(),
      value,
      isActive: item?.isActive !== false,
    });
  }

  return out;
};

const emptyExtraFields = () => ({
  generalFields: { businessLine: [] },
  orderFields: { minOrderAmount: [], readySolution: [] },
  clientFields: { business: [] },
});

function normalizeExtraConfig(raw) {
  const value = raw && typeof raw === 'object' ? raw : {};
  return {
    generalFields: {
      businessLine: normalizeExtraFieldList(value?.generalFields?.businessLine),
    },
    orderFields: {
      minOrderAmount: normalizeExtraFieldList(value?.orderFields?.minOrderAmount),
      readySolution: normalizeExtraFieldList(value?.orderFields?.readySolution),
    },
    clientFields: {
      business: normalizeExtraFieldList(value?.clientFields?.business),
    },
  };
}

async function loadExtraConfig(db) {
  if (!(await hasTable('AppConfig'))) {
    return emptyExtraFields();
  }

  const row = await (db || prisma).appConfig.findUnique({
    where: { key: EXTRA_FIELDS_CONFIG_KEY },
    select: { value: true },
  });

  return normalizeExtraConfig(row?.value);
}

function mergeExtraFieldList(existingList, incomingList) {
  const current = normalizeExtraFieldList(existingList);
  const incoming = normalizeExtraFieldList(incomingList).map((item) => ({
    id: item.id || null,
    value: item.value,
  }));

  const currentById = new Map(current.map((item) => [String(item.id), item]));
  const currentByValue = new Map(current.map((item) => [item.value.toLowerCase(), item]));
  const active = [];
  const activeIds = new Set();
  const activeKeys = new Set();

  for (const item of incoming) {
    const key = item.value.toLowerCase();
    if (activeKeys.has(key)) continue;
    activeKeys.add(key);

    const existing =
      (item.id && currentById.get(String(item.id))) ||
      currentByValue.get(key) ||
      null;

    const next = existing
      ? { ...existing, value: item.value, isActive: true }
      : { id: item.id || rid(), value: item.value, isActive: true };

    active.push(next);
    activeIds.add(String(next.id));
  }

  const inactive = current
    .filter((item) => !activeIds.has(String(item.id)))
    .map((item) => ({ ...item, isActive: false }));

  return [...active, ...inactive];
}

async function saveExtraConfig(tx, payload) {
  if (!(await hasTable('AppConfig'))) {
    return emptyExtraFields();
  }

  const current = await loadExtraConfig(tx);
  const next = {
    generalFields: {
      businessLine: mergeExtraFieldList(
        current?.generalFields?.businessLine,
        payload?.generalFields?.businessLine
      ),
    },
    orderFields: {
      minOrderAmount: mergeExtraFieldList(
        current?.orderFields?.minOrderAmount,
        payload?.orderFields?.minOrderAmount
      ),
      readySolution: mergeExtraFieldList(
        current?.orderFields?.readySolution,
        payload?.orderFields?.readySolution
      ),
    },
    clientFields: {
      business: mergeExtraFieldList(
        current?.clientFields?.business,
        payload?.clientFields?.business
      ),
    },
  };

  await tx.appConfig.upsert({
    where: { key: EXTRA_FIELDS_CONFIG_KEY },
    update: { value: next },
    create: { key: EXTRA_FIELDS_CONFIG_KEY, value: next },
  });

  return next;
}

const activeExtraValues = (list) =>
  normalizeExtraFieldList(list)
    .filter((item) => item.isActive !== false)
    .map((item) => ({ id: item.id, value: item.value }));

const inactiveExtraValues = (list) =>
  normalizeExtraFieldList(list)
    .filter((item) => item.isActive === false)
    .map((item) => ({ id: item.id, value: item.value }));

/* ==============================
   Tags (единая версия)
================================ */
async function ensureTagCategory(tx, code, name) {
  return tx.tagCategory.upsert({
    where: { code },
    update: { name },
    create: { code, name },
  });
}

async function upsertTags(
  tx,
  tagsList,
  { categoryCode = 'default', categoryName = 'General' } = {}
) {
  const tagCategory = await ensureTagCategory(tx, categoryCode, categoryName);

  const items = Array.isArray(tagsList) ? tagsList : [];
  const desiredNames = new Set();

  for (const t of items) {
    const name = pickStr(t?.name ?? t);
    if (!name) continue;
    const color = isHexColor(t?.color) ? t.color : '#ffffff';
    desiredNames.add(name);

    await tx.tag.upsert({
      where: { name_categoryId: { name, categoryId: tagCategory.id } },
      update: { color },
      create: { id: rid(), name, color, categoryId: tagCategory.id },
    });
  }

  await tx.tag.deleteMany({
    where: {
      categoryId: tagCategory.id,
      name: { notIn: Array.from(desiredNames) },
    },
  });

  return tx.tag.findMany({ where: { categoryId: tagCategory.id }, orderBy: { name: 'asc' } });
}

/* ==============================
   GET ACTIVE (Загрузка активных)
================================ */
async function getAll(db) {
  const _db = db || prisma;
  const whereActive = { where: { isActive: true } };
  const whereActiveHardDelete = {};
  const [clientGroupsEnabled, extraFields] = await Promise.all([
    hasTable('ClientGroup'),
    loadExtraConfig(_db),
  ]);

  const [
    orderCurrencies,
    countries,
    roles,
    sources,
    clientCategories,
    clientGroups,
    orderStatuses,
    orderCloseReasons,
    orderProjects,
    orderDiscountReasons,
    assetTypes,
    paymentSystems,
    articles,
    subcategories,
    typeWorks,
  ] = await Promise.all([
    _db.currencyDict.findMany({ ...whereActive, orderBy: { code: 'asc' } }),
    _db.country.findMany({ ...whereActive, orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
    _db.executorRoleDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientSourceDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.clientCategoryDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    clientGroupsEnabled ? _db.clientGroup.findMany({ orderBy: { order: 'asc' } }) : [],
    _db.orderStatusDict ? _db.orderStatusDict.findMany({ ...whereActive, orderBy: { order: 'asc' } }) : [],
    _db.orderCloseReasonDict
      ? _db.orderCloseReasonDict.findMany({ ...whereActive, orderBy: { order: 'asc' } })
      : [],
    _db.orderProjectDict ? _db.orderProjectDict.findMany({ ...whereActive, orderBy: { order: 'asc' } }) : [],
    _db.orderDiscountReasonDict
      ? _db.orderDiscountReasonDict.findMany({ ...whereActive, orderBy: { order: 'asc' } })
      : [],
    _db.assetTypeDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.paymentSystemDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.financeArticleDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.financeSubcategoryDict.findMany({ ...whereActive, orderBy: { name: 'asc' } }),
    _db.sundryTypeWorkDict
      ? _db.sundryTypeWorkDict.findMany({ ...whereActive, orderBy: { name: 'asc' } })
      : [],
  ]);

  const [intervals, orderCats, cardDesigns, subarticles, tagCategories] = await Promise.all([
    _db.orderIntervalDict.findMany({ ...whereActiveHardDelete, orderBy: { value: 'asc' } }),
    _db.orderCategoryDict.findMany({
      ...whereActiveHardDelete,
      select: { id: true, value: true, interval: { select: { id: true, value: true } } },
      orderBy: [{ interval: { value: 'asc' } }, { value: 'asc' }],
    }),
    _db.cardDesign.findMany({ where: { isActive: true }, orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
    _db.financeSubarticleDict.findMany({
      ...whereActiveHardDelete,
      select: {
        id: true,
        name: true,
        article: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
      },
      orderBy: [{ article: { name: 'asc' } }, { name: 'asc' }],
    }),
    _db.tagCategory.findMany({ select: { id: true, code: true } }),
  ]);

  const tagCategoryByCode = new Map(tagCategories.map((c) => [c.code, c.id]));
  const tagsByCode = async (code) => {
    const categoryId = tagCategoryByCode.get(code);
    if (!categoryId) return [];
    return _db.tag.findMany({ where: { categoryId }, orderBy: { name: 'asc' } });
  };

  const [
    orderTags,
    orderTechTags,
    orderTaskTags,
    clientTags,
    companyTags,
    employeeTags,
    taskTags,
  ] = await Promise.all([
    tagsByCode('order'),
    tagsByCode('order-tech'),
    tagsByCode('order-task'),
    tagsByCode('client'),
    tagsByCode('company'),
    tagsByCode('employee'),
    tagsByCode('task'),
  ]);

  const activeCardDesignIds = cardDesigns.map((item) => item.id);
  const linkedCardDesignIds = new Set(
    activeCardDesignIds.length
      ? (
          await _db.asset.findMany({
            where: { cardDesignId: { in: activeCardDesignIds } },
            select: { cardDesignId: true },
            distinct: ['cardDesignId'],
          })
        ).map((item) => item.cardDesignId).filter(Boolean)
      : []
  );

  const mapTags = (list) => list.map((t) => ({ id: t.id, name: t.name, color: t.color }));

  return {
    generalFields: {
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      country: countries.map(mapCountry),
      businessLine: activeExtraValues(extraFields?.generalFields?.businessLine),
    },

    orderFields: {
      intervals: intervals.map((x) => ({ id: x.id, value: x.value })),
      categories: orderCats.map((x) => ({
        id: x.id,
        value: x.value,
        intervalId: x.interval?.id || null,
        intervalValue: x.interval?.value || null,
      })),
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      statuses: orderStatuses.map((s) => ({ id: s.id, name: s.name })),
      closeReasons: orderCloseReasons.map((r) => ({ id: r.id, name: r.name })),
      projects: orderProjects.map((p) => ({ id: p.id, name: p.name })),
      discountReason: orderDiscountReasons.map((d) => ({ id: d.id, name: d.name })),
      minOrderAmount: activeExtraValues(extraFields?.orderFields?.minOrderAmount),
      readySolution: activeExtraValues(extraFields?.orderFields?.readySolution),
      tags: mapTags(orderTags),
      techTags: mapTags(orderTechTags),
      taskTags: mapTags(orderTaskTags),
    },

    executorFields: {
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      role: roles.map((r) => ({ id: r.id, name: r.name })),
    },

    clientFields: {
      source: sources.map((s) => ({ id: s.id, name: s.name })),
      category: clientCategories.map((c) => ({ id: c.id, name: c.name })),
      country: countries.map(mapCountry),
      business: activeExtraValues(extraFields?.clientFields?.business),
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      tags: mapTags(clientTags),
      groups: clientGroups.map((g) => ({ id: g.id, name: g.name, order: g.order })),
    },

    companyFields: {
      tags: mapTags(companyTags),
    },

    employeeFields: {
      country: countries.map(mapCountry),
      tags: mapTags(employeeTags),
    },

    assetsFields: {
      currency: orderCurrencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      type: assetTypes.map((t) => ({ id: t.id, name: t.name })),
      paymentSystem: paymentSystems.map((p) => ({ id: p.id, name: p.name })),
      cardDesigns: cardDesigns.map((d) => ({
        id: d.id,
        name: d.name,
        url: d.imageUrl || '',
        order: d.order,
        isLinked: linkedCardDesignIds.has(d.id),
      })),
    },

    financeFields: {
      articles: articles.map((a) => ({ id: a.id, name: a.name })),
      subarticles: subarticles.map((s) => ({
        id: s.id,
        name: s.name,
        articleId: s.article?.id || null,
        articleName: s.article?.name || null,
        subcategoryId: s.subcategory?.id || null,
        subcategoryName: s.subcategory?.name || null,
        subarticleInterval: s.article?.name || s.subcategory?.name || null,
      })),
      subcategory: subcategories.map((s) => ({ id: s.id, name: s.name })),
    },

    taskFields: {
      tags: mapTags(taskTags),
    },

    sundryFields: {
      typeWork: typeWorks.map((t) => ({ id: t.id, name: t.name })),
    },
  };
}

/* ==============================
   GET INACTIVE (Загрузка скрытых)
================================ */
async function getInactive(db) {
  const _db = db || prisma;
  const whereInactive = { where: { isActive: false } };
  const extraFields = await loadExtraConfig(_db);

  const [
    currencies,
    countries,
    roles,
    sources,
    clientCategories,
    assetTypes,
    paymentSystems,
    articles,
    subcategories,
    discountReasons,
    typeWorks,
  ] = await Promise.all([
    _db.currencyDict.findMany({ ...whereInactive, orderBy: { code: 'asc' } }),
    _db.country.findMany({ ...whereInactive, orderBy: [{ order: 'asc' }, { name: 'asc' }] }),
    _db.executorRoleDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.clientSourceDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.clientCategoryDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.assetTypeDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.paymentSystemDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.financeArticleDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.financeSubcategoryDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } }),
    _db.orderDiscountReasonDict
      ? _db.orderDiscountReasonDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } })
      : [],
    _db.sundryTypeWorkDict
      ? _db.sundryTypeWorkDict.findMany({ ...whereInactive, orderBy: { name: 'asc' } })
      : [],
  ]);

  const emptyArr = [];

  return {
    generalFields: {
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      country: countries.map(mapCountry),
      businessLine: inactiveExtraValues(extraFields?.generalFields?.businessLine),
    },
    orderFields: {
      intervals: emptyArr,
      categories: emptyArr,
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      discountReason: discountReasons.map((r) => ({ id: r.id, name: r.name })),
      minOrderAmount: inactiveExtraValues(extraFields?.orderFields?.minOrderAmount),
      readySolution: inactiveExtraValues(extraFields?.orderFields?.readySolution),
      tags: emptyArr,
      techTags: emptyArr,
      taskTags: emptyArr,
      statuses: emptyArr,
      closeReasons: emptyArr,
      projects: emptyArr,
    },
    executorFields: {
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      role: roles.map((r) => ({ id: r.id, name: r.name })),
    },
    clientFields: {
      source: sources.map((s) => ({ id: s.id, name: s.name })),
      category: clientCategories.map((c) => ({ id: c.id, name: c.name })),
      country: countries.map(mapCountry),
      business: inactiveExtraValues(extraFields?.clientFields?.business),
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      tags: emptyArr,
      groups: emptyArr,
    },
    companyFields: {
      tags: emptyArr,
    },
    employeeFields: {
      country: countries.map(mapCountry),
      tags: emptyArr,
    },
    assetsFields: {
      currency: currencies.map((c) => ({ id: c.id, code: c.code, name: c.name || c.code })),
      type: assetTypes.map((t) => ({ id: t.id, name: t.name })),
      paymentSystem: paymentSystems.map((p) => ({ id: p.id, name: p.name })),
      cardDesigns: await _db.cardDesign.findMany({
        ...whereInactive,
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }).then(async (items) => {
        const ids = items.map((item) => item.id);
        const linkedIds = new Set(
          ids.length
            ? (
                await _db.asset.findMany({
                  where: { cardDesignId: { in: ids } },
                  select: { cardDesignId: true },
                  distinct: ['cardDesignId'],
                })
              ).map((item) => item.cardDesignId).filter(Boolean)
            : []
        );

        return items.map((d) => ({
          id: d.id,
          name: d.name,
          url: d.imageUrl || '',
          order: d.order,
          isLinked: linkedIds.has(d.id),
        }));
      }),
    },
    financeFields: {
      articles: articles.map((a) => ({ id: a.id, name: a.name })),
      subarticles: emptyArr,
      subcategory: subcategories.map((s) => ({ id: s.id, name: s.name })),
    },
    sundryFields: {
      typeWork: typeWorks.map((t) => ({ id: t.id, name: t.name })),
    },
    taskFields: {
      tags: emptyArr,
    },
  };
}

/* ==============================
   PUT (Сохранение)
================================ */
async function saveAll(payload) {
  return prisma.$transaction(
    async (tx) => {
      // 1. ВАЛЮТЫ
      const existingCurrencies = await tx.currencyDict.findMany({
        select: { code: true, name: true },
      });
      const currencyAliases = buildCurrencyAliasMap(existingCurrencies);
      const currencyCodes = new Set();
      [
        payload?.generalFields?.currency,
        payload?.orderFields?.currency,
        payload?.executorFields?.currency,
        payload?.clientFields?.currency,
        payload?.assetsFields?.currency,
      ].forEach((list) => {
        (Array.isArray(list) ? list : []).forEach((item) => {
          const code = resolveCurrencyCode(item, currencyAliases);
          if (code) currencyCodes.add(code);
        });
      });
      await syncSimpleDict(tx, 'currencyDict', Array.from(currencyCodes), { field: 'code' });

      // 2. ЗАКАЗЫ (Интервалы и категории)
      const intervalValues = (Array.isArray(payload?.orderFields?.intervals) ? payload.orderFields.intervals : [])
        .map((i) => pickStr(i?.value ?? i?.intervalValue ?? i))
        .filter(Boolean);

      await syncSimpleDict(tx, 'orderIntervalDict', intervalValues, { field: 'value' });

      const existingIntervals = await tx.orderIntervalDict.findMany({ select: { id: true, value: true } });
      const keepSet = new Set(intervalValues);
      const intervalsToDeactivate = existingIntervals.filter((i) => !keepSet.has(i.value));
      if (intervalsToDeactivate.length) {
        const toDeactivateIds = intervalsToDeactivate.map((i) => i.id);
        await tx.orderCategoryDict.updateMany({
          where: { intervalId: { in: toDeactivateIds } },
          data: { isActive: false },
        });
        await tx.orderIntervalDict.updateMany({
          where: { id: { in: toDeactivateIds } },
          data: { isActive: false },
        });
      }

      const catsIncoming = (Array.isArray(payload?.orderFields?.categories) ? payload.orderFields.categories : [])
        .map((c) => ({
          intervalValue: pickStr(c?.intervalValue ?? c?.categoryInterval ?? c?.interval),
          value: pickStr(c?.value ?? c?.categoryValue),
        }))
        .filter((c) => c.intervalValue && c.value);

      const finalIntervals = await tx.orderIntervalDict.findMany({ select: { id: true, value: true } });
      const intervalByValue = new Map(finalIntervals.map((i) => [i.value, i.id]));

      for (const c of catsIncoming) {
        if (!intervalByValue.has(c.intervalValue)) {
          const created = await tx.orderIntervalDict.create({ data: { value: c.intervalValue } });
          intervalByValue.set(created.value, created.id);
        }
      }

      for (const c of catsIncoming) {
        const intervalId = intervalByValue.get(c.intervalValue);
        if (!intervalId) continue;
        const exists = await tx.orderCategoryDict.findFirst({ where: { value: c.value, intervalId } });
        if (!exists) {
          await tx.orderCategoryDict.create({ data: { value: c.value, intervalId } });
        }
      }

      for (const [value, intervalId] of intervalByValue.entries()) {
        const desired = new Set(catsIncoming.filter((c) => c.intervalValue === value).map((c) => c.value));

        await tx.orderCategoryDict.updateMany({
          where: { intervalId, NOT: { value: { in: Array.from(desired) } } },
          data: { isActive: false },
        });

        await tx.orderCategoryDict.updateMany({
          where: { intervalId, value: { in: Array.from(desired) } },
          data: { isActive: true },
        });
      }

      // 3. Справочники заказов
      if (tx.orderStatusDict) {
        await syncSimpleDict(tx, 'orderStatusDict', arrToUniqueStrings(payload?.orderFields?.statuses, 'name'));
      }
      if (tx.orderCloseReasonDict) {
        await syncSimpleDict(
          tx,
          'orderCloseReasonDict',
          arrToUniqueStrings(payload?.orderFields?.closeReasons, 'name')
        );
      }
      if (tx.orderProjectDict) {
        await syncSimpleDict(tx, 'orderProjectDict', arrToUniqueStrings(payload?.orderFields?.projects, 'name'));
      }
      if (tx.orderDiscountReasonDict) {
        await syncSimpleDict(
          tx,
          'orderDiscountReasonDict',
          arrToUniqueStrings(payload?.orderFields?.discountReason, 'name')
        );
      }

      // 4. EXECUTOR
      await syncSimpleDict(tx, 'executorRoleDict', arrToUniqueStrings(payload?.executorFields?.role, 'name'));

      // 5. CLIENTS
      await syncSimpleDict(tx, 'clientSourceDict', arrToUniqueStrings(payload?.clientFields?.source, 'name'));
      await syncSimpleDict(tx, 'clientCategoryDict', arrToUniqueStrings(payload?.clientFields?.category, 'name'));
      const allCountries = [
        ...(Array.isArray(payload?.generalFields?.country) ? payload.generalFields.country : []),
        ...(Array.isArray(payload?.clientFields?.country) ? payload.clientFields.country : []),
        ...(Array.isArray(payload?.employeeFields?.country) ? payload.employeeFields.country : []),
      ];
      await syncCountries(tx, allCountries);

      // 6. TAGS (единая система через TagCategory+Tag)
      await Promise.all([
        upsertTags(tx, payload?.orderFields?.tags, { categoryCode: 'order', categoryName: 'Order' }),
        upsertTags(tx, payload?.orderFields?.techTags, { categoryCode: 'order-tech', categoryName: 'Order Tech' }),
        upsertTags(tx, payload?.orderFields?.taskTags, { categoryCode: 'order-task', categoryName: 'Order Task' }),
        upsertTags(tx, payload?.clientFields?.tags ?? payload?.clientFields?.tag, {
          categoryCode: 'client',
          categoryName: 'Client',
        }),
        upsertTags(tx, payload?.companyFields?.tags, { categoryCode: 'company', categoryName: 'Company' }),
        upsertTags(tx, payload?.employeeFields?.tags, { categoryCode: 'employee', categoryName: 'Employee' }),
        upsertTags(tx, payload?.taskFields?.tags, { categoryCode: 'task', categoryName: 'Task' }),
      ]);

      // 7. ASSETS
      await syncSimpleDict(tx, 'assetTypeDict', arrToUniqueStrings(payload?.assetsFields?.type, 'name'));
      await syncSimpleDict(tx, 'paymentSystemDict', arrToUniqueStrings(payload?.assetsFields?.paymentSystem, 'name'));

      const incomingDesigns = (Array.isArray(payload?.assetsFields?.cardDesigns) ? payload.assetsFields.cardDesigns : [])
        .map((d, index) => ({
          id: d?.id || null,
          name: pickStr(d?.name),
          url: typeof d?.url === 'string' ? d.url : '',
          order: Number.isFinite(Number(d?.order)) ? Number(d.order) : index,
        }))
        .filter((d) => d.name);

      const existingDesigns = await tx.cardDesign.findMany({
        select: { id: true, name: true, imageUrl: true, isActive: true },
      });
      const existingById = new Map(existingDesigns.map((d) => [d.id, d]));

      for (const d of incomingDesigns) {
        let imageUrl = d.url;

        if (imageUrl && imageUrl.startsWith('data:image/')) {
          const baseName = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
          imageUrl = await saveDataUrlToFile(imageUrl, baseName);
        }

        if (d.id && existingById.has(d.id)) {
          const prev = existingById.get(d.id);
          const isNew = imageUrl && imageUrl !== prev.imageUrl;

          await tx.cardDesign.update({
            where: { id: d.id },
            data: {
              name: d.name,
              imageUrl: imageUrl || prev.imageUrl || null,
              isActive: true,
              order: d.order,
            },
          });

          if (isNew && prev.imageUrl) {
            const abs = urlToAbsPath(prev.imageUrl);
            if (abs) await safeUnlink(abs);
          }
        } else {
          await tx.cardDesign.create({
            data: {
              name: d.name,
              imageUrl: imageUrl || null,
              isActive: true,
              order: d.order,
            },
          });
        }
      }

      const incomingIds = new Set(incomingDesigns.filter((d) => d.id).map((d) => d.id));
      const removedActiveDesigns = existingDesigns.filter((d) => d.isActive && !incomingIds.has(d.id));
      if (removedActiveDesigns.length) {
        const removedIds = removedActiveDesigns.map((d) => d.id);
        const usedAssets = await tx.asset.findMany({
          where: { cardDesignId: { in: removedIds } },
          select: { cardDesignId: true },
          distinct: ['cardDesignId'],
        });
        const usedIds = new Set(usedAssets.map((item) => item.cardDesignId).filter(Boolean));

        const toHideIds = removedIds.filter((id) => usedIds.has(id));
        const toDelete = removedActiveDesigns.filter((d) => !usedIds.has(d.id));

        if (toHideIds.length) {
          await tx.cardDesign.updateMany({
            where: { id: { in: toHideIds } },
            data: { isActive: false },
          });
        }

        if (toDelete.length) {
          await tx.cardDesign.deleteMany({
            where: { id: { in: toDelete.map((d) => d.id) } },
          });

          for (const design of toDelete) {
            const abs = urlToAbsPath(design.imageUrl);
            if (abs) await safeUnlink(abs);
          }
        }
      }

      // 8. FINANCE
      await syncSimpleDict(tx, 'financeArticleDict', arrToUniqueStrings(payload?.financeFields?.articles, 'name'));
      await syncSimpleDict(
        tx,
        'financeSubcategoryDict',
        arrToUniqueStrings(payload?.financeFields?.subcategory, 'name')
      );

      const desiredSubs = (Array.isArray(payload?.financeFields?.subarticles) ? payload.financeFields.subarticles : [])
        .map((s) => ({
          parentName: pickStr(s?.parentName ?? s?.subarticleInterval ?? s?.parent),
          name: pickStr(s?.name ?? s?.subarticleValue),
        }))
        .filter((s) => s.name && s.parentName);

      const [arts, subcats, subsExisting] = await Promise.all([
        tx.financeArticleDict.findMany({ select: { id: true, name: true } }),
        tx.financeSubcategoryDict.findMany({ select: { id: true, name: true } }),
        tx.financeSubarticleDict.findMany({ select: { id: true, name: true, articleId: true, subcategoryId: true } }),
      ]);

      const artByName = new Map(arts.map((a) => [a.name, a.id]));
      const subcatByName = new Map(subcats.map((s) => [s.name, s.id]));

      for (const s of desiredSubs) {
        const articleId = artByName.get(s.parentName) || null;
        const subcategoryId = !articleId ? subcatByName.get(s.parentName) || null : null;
        if (!articleId && !subcategoryId) continue;

        const exists = await tx.financeSubarticleDict.findFirst({
          where: { name: s.name, articleId: articleId || undefined, subcategoryId: subcategoryId || undefined },
        });
        if (!exists) {
          await tx.financeSubarticleDict.create({ data: { name: s.name, articleId, subcategoryId } });
        }
      }

      const keyOf = (row) => `${row.name}|${row.articleId || ''}|${row.subcategoryId || ''}`;
      const desiredKeys = new Set();

      for (const s of desiredSubs) {
        const articleId = artByName.get(s.parentName) || null;
        const subcategoryId = !articleId ? subcatByName.get(s.parentName) || null : null;
        if (!articleId && !subcategoryId) continue;
        desiredKeys.add(`${s.name}|${articleId || ''}|${subcategoryId || ''}`);
      }

      const toDeactivateSubs = subsExisting.filter((r) => !desiredKeys.has(keyOf(r)));
      if (toDeactivateSubs.length) {
        await tx.financeSubarticleDict.updateMany({
          where: { id: { in: toDeactivateSubs.map((r) => r.id) } },
          data: { isActive: false },
        });
      }

      const desiredIds = subsExisting.filter((r) => desiredKeys.has(keyOf(r))).map((r) => r.id);
      if (desiredIds.length) {
        await tx.financeSubarticleDict.updateMany({
          where: { id: { in: desiredIds } },
          data: { isActive: true },
        });
      }

      // 9. SUNDRY
      if (tx.sundryTypeWorkDict) {
        await syncSimpleDict(
          tx,
          'sundryTypeWorkDict',
          arrToUniqueStrings(payload?.sundryFields?.typeWork, 'name')
        );
      }

      await saveExtraConfig(tx, payload);

      return getAll(tx);
    },
    { maxWait: 20000, timeout: 60000 }
  );
}

module.exports = {
  loadBundle: () => getAll(),
  saveBundle: (payload) => saveAll(payload),
  loadInactiveBundle: () => getInactive(),
  getAll,
  saveAll,
  getInactive,
};

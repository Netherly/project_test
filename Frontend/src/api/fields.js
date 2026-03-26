import { httpGet, httpPut, fileUrl } from "./http";
import { writeCachedValue } from "../utils/resourceCache";

export const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
export const tidy = (v) => String(v ?? "").trim();
export const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

export const sortByOrder = (arr) => {
  if (!Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const orderA = a && Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
    const orderB = b && Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
};

const normalizeCodeValue = (value) => tidy(value).toUpperCase();
const normalizeDeleteAction = (value) => {
  const action = tidy(value).toLowerCase();
  return action === "hide" ? "hide" : "";
};

const normalizeFieldTargetKey = (groupKey, fieldName) => `${tidy(groupKey)}.${tidy(fieldName)}`;

const createStringItem = (value, order, extraData = {}) => ({
  id: rid(),
  value,
  name: value,
  order,
  isDeleted: false,
  ...extraData,
});

const createTagItem = (value, order, extraData = {}) => ({
  id: rid(),
  name: value,
  color: isHex(extraData?.color) ? extraData.color : "#ffffff",
  order,
  isDeleted: false,
});

const createCurrencyItem = (value, order, extraData = {}) => {
  const code = normalizeCodeValue(value);
  return {
    id: rid(),
    value: code,
    code,
    name: tidy(extraData?.name) || code,
    label: tidy(extraData?.label) || tidy(extraData?.name) || code,
    order,
    isDeleted: false,
  };
};

const createCountryItem = (value, order, extraData = {}) => ({
  id: rid(),
  value,
  name: value,
  nameEn: tidy(extraData?.nameEn),
  nameRu: tidy(extraData?.nameRu),
  nameUk: tidy(extraData?.nameUk),
  iso2: tidy(extraData?.iso2).toUpperCase(),
  iso3: tidy(extraData?.iso3).toUpperCase(),
  order,
  isDeleted: false,
});

const createIntervalItem = (value, order, extraData = {}) => ({
  id: rid(),
  intervalValue: tidy(extraData?.intervalValue ?? value),
  order,
  isDeleted: false,
});

const createCategoryItem = (value, order, extraData = {}) => ({
  id: rid(),
  categoryInterval: tidy(extraData?.categoryInterval),
  categoryValue: tidy(extraData?.categoryValue ?? value),
  order,
  isDeleted: false,
});

const createArticleItem = (value, order) => ({
  id: rid(),
  articleValue: value,
  order,
  isDeleted: false,
});

const createSubarticleItem = (value, order, extraData = {}) => ({
  id: rid(),
  subarticleInterval: tidy(extraData?.subarticleInterval ?? extraData?.parentName),
  subarticleValue: tidy(extraData?.subarticleValue ?? value),
  order,
  isDeleted: false,
});

const normalizeIdentity = (value) => tidy(value).toLowerCase();
const stringifyCompoundIdentity = (...parts) => parts.map(normalizeIdentity).join("::");

const getStringIdentity = (item) => normalizeIdentity(item?.value ?? item?.name);
const getTagIdentity = (item) => normalizeIdentity(item?.name ?? item?.value);
const getCurrencyIdentity = (item) => normalizeCodeValue(item?.code ?? item?.value ?? item?.name);
const getCountryIdentity = (item) =>
  normalizeIdentity(item?.iso2 ?? item?.iso3 ?? item?.name ?? item?.value);
const getIntervalIdentity = (item) => normalizeIdentity(item?.intervalValue ?? item?.value);
const getCategoryIdentity = (item) =>
  stringifyCompoundIdentity(
    item?.categoryInterval ?? item?.intervalValue ?? item?.interval,
    item?.categoryValue ?? item?.value ?? item?.name
  );
const getArticleIdentity = (item) => normalizeIdentity(item?.articleValue ?? item?.value ?? item?.name);
const getSubarticleIdentity = (item) =>
  stringifyCompoundIdentity(
    item?.subarticleInterval ?? item?.parentName ?? item?.articleName ?? item?.subcategoryName,
    item?.subarticleValue ?? item?.value ?? item?.name
  );

const FIELD_OPTION_TARGETS = {
  "generalFields.country": {
    buildIncomingIdentity: (value, extraData = {}) =>
      normalizeIdentity(extraData?.iso2 ?? extraData?.iso3 ?? value),
    getItemIdentity: getCountryIdentity,
    createItem: createCountryItem,
  },
  "generalFields.currency": {
    buildIncomingIdentity: (value) => normalizeCodeValue(value),
    getItemIdentity: getCurrencyIdentity,
    createItem: createCurrencyItem,
  },
  "employeeFields.tags": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getTagIdentity,
    createItem: createTagItem,
  },
  "clientFields.category": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "clientFields.source": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "clientFields.business": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "clientFields.tags": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getTagIdentity,
    createItem: createTagItem,
  },
  "companyFields.tags": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getTagIdentity,
    createItem: createTagItem,
  },
  "executorFields.role": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "orderFields.intervals": {
    buildIncomingIdentity: (value, extraData = {}) => normalizeIdentity(extraData?.intervalValue ?? value),
    getItemIdentity: getIntervalIdentity,
    createItem: createIntervalItem,
  },
  "orderFields.categories": {
    buildIncomingIdentity: (value, extraData = {}) => {
      const interval = tidy(extraData?.categoryInterval);
      const categoryValue = tidy(extraData?.categoryValue ?? value);
      return interval && categoryValue ? stringifyCompoundIdentity(interval, categoryValue) : "";
    },
    getItemIdentity: getCategoryIdentity,
    createItem: createCategoryItem,
  },
  "orderFields.statuses": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "orderFields.closeReasons": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "orderFields.projects": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "orderFields.discountReason": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "orderFields.readySolution": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "orderFields.techTags": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getTagIdentity,
    createItem: createTagItem,
  },
  "orderFields.taskTags": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getTagIdentity,
    createItem: createTagItem,
  },
  "financeFields.articles": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getArticleIdentity,
    createItem: createArticleItem,
  },
  "financeFields.subarticles": {
    buildIncomingIdentity: (value, extraData = {}) => {
      const parent = tidy(extraData?.subarticleInterval ?? extraData?.parentName);
      const subarticleValue = tidy(extraData?.subarticleValue ?? value);
      return parent && subarticleValue ? stringifyCompoundIdentity(parent, subarticleValue) : "";
    },
    getItemIdentity: getSubarticleIdentity,
    createItem: createSubarticleItem,
  },
  "assetsFields.type": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
  "assetsFields.paymentSystem": {
    buildIncomingIdentity: (value) => normalizeIdentity(value),
    getItemIdentity: getStringIdentity,
    createItem: createStringItem,
  },
};

const FIELD_OPTION_ALIASES = {
  "employeeFields.country": "generalFields.country",
  "clientFields.country": "generalFields.country",
  "clientFields.currency": "generalFields.currency",
  "employeeFields.currency": "generalFields.currency",
  "executorFields.currency": "generalFields.currency",
  "orderFields.currency": "generalFields.currency",
  "assetsFields.currency": "generalFields.currency",
  "orderFields.tag": "orderFields.tags",
  "orderFields.status": "orderFields.statuses",
  "orderFields.closeReason": "orderFields.closeReasons",
  "orderFields.discountReasons": "orderFields.discountReason",
  "financeFields.article": "financeFields.articles",
  "financeFields.subarticle": "financeFields.subarticles",
  "clientFields.tag": "clientFields.tags",
  "companyFields.tag": "companyFields.tags",
  "employeeFields.tag": "employeeFields.tags",
  "assetsFields.cardDesign": "assetsFields.cardDesigns",
};

const normalizeFieldsBundle = (bundle) => withDefaults(bundle);
const writeFieldsBundleCache = (bundle) => {
  const normalized = normalizeFieldsBundle(bundle);
  writeCachedValue("fieldsData", normalized);
  return normalized;
};

const resolveFieldOptionTarget = (groupKey, fieldName) => {
  const rawKey = normalizeFieldTargetKey(groupKey, fieldName);
  const canonicalKey = FIELD_OPTION_ALIASES[rawKey] || rawKey;
  const [resolvedGroupKey = "", resolvedFieldName = ""] = canonicalKey.split(".");
  const config = FIELD_OPTION_TARGETS[canonicalKey] || null;

  return {
    key: canonicalKey,
    groupKey: resolvedGroupKey,
    fieldName: resolvedFieldName,
    config,
    supported: Boolean(config),
  };
};

const assertSupportedFieldOptionTarget = (target) => {
  if (target?.supported) return target;
  throw new Error(
    `Автодобавление поля "${target?.groupKey || ""}.${target?.fieldName || ""}" не поддерживается.`
  );
};

// --- Нормализация (чтение с сервера) ---

export const normStrs = (arr) => {
  const seen = new Set();
  const out = [];
  const source = sortByOrder(arr);
  let idx = 0;
  for (const item of source) {
    const v = typeof item === "string" ? tidy(item) : tidy(item?.value ?? item?.name ?? item?.code);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({
        id: item?.id || rid(),
        value: v,
        order: Number.isFinite(Number(item?.order)) ? Number(item.order) : out.length,
        isLinked: typeof item?.isLinked === "boolean" ? item.isLinked : undefined,
        isDeleted: item?.isDeleted || false,
        order: Number.isFinite(item?.order) ? item.order : idx
      });
      idx++;
    }
  }
  return out;
};

export const normCodeStrs = (arr) => {
  const seen = new Set();
  const out = [];
  const source = sortByOrder(arr);
  let idx = 0;
  for (const item of source) {
    const code = typeof item === "string" ? normalizeCodeValue(item) : normalizeCodeValue(item?.code ?? item?.value);
    if (!code) continue;
    const key = code.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const name = typeof item === "string" ? code : tidy(item?.name ?? item?.label ?? code);

    out.push({
      id: item?.id || rid(),
      value: code,
      code,
      name,
      label: name || code,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : out.length,
      isLinked: typeof item?.isLinked === "boolean" ? item.isLinked : undefined,
      isDeleted: item?.isDeleted || false,
      order: Number.isFinite(item?.order) ? item.order : idx
    });
    idx++;
  }
  return out;
};

export const normCountries = (arr) => {
  const seen = new Set();
  const out = [];
  const source = sortByOrder(arr);
  let idx = 0;
  for (const item of source) {
    if (typeof item === "string") {
      const name = tidy(item);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: rid(), value: name, name, isDeleted: false, order: idx });
      idx++;
      continue;
    }

    const name = tidy(item?.name ?? item?.value);
    const iso2 = tidy(item?.iso2).toUpperCase();
    const iso3 = tidy(item?.iso3).toUpperCase();
    const key = String(item?.id || iso2 || name).trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      ...item,
      id: item?.id || rid(),
      value: name || iso2 || iso3,
      name,
      nameEn: tidy(item?.nameEn),
      nameRu: tidy(item?.nameRu),
      nameUk: tidy(item?.nameUk),
      iso2,
      iso3,
      isLinked: typeof item?.isLinked === "boolean" ? item.isLinked : undefined,
      isDeleted: item?.isDeleted || false,
      order: Number.isFinite(item?.order) ? item.order : idx
    });
    idx++;
  }
  return out;
};

export const normIntervals = (arr) => {
  return sortByOrder(arr).map((it, idx) => ({
    id: it?.id || rid(),
    intervalValue: tidy(it?.intervalValue ?? it?.value ?? it),
    order: Number.isFinite(Number(it?.order)) ? Number(it.order) : undefined,
    isLinked: typeof it?.isLinked === "boolean" ? it.isLinked : undefined,
    isDeleted: it?.isDeleted || false,
    order: Number.isFinite(it?.order) ? it.order : idx
  }));
};

export const normCategories = (arr) => {
  return sortByOrder(arr).map((it, idx) => ({
    id: it?.id || rid(),
    categoryInterval: tidy(it?.categoryInterval ?? it?.interval?.value ?? it?.intervalValue ?? it?.interval ?? it?.group),
    categoryValue: tidy(it?.categoryValue ?? it?.value ?? it?.name),
    order: Number.isFinite(Number(it?.order)) ? Number(it.order) : undefined,
    isLinked: typeof it?.isLinked === "boolean" ? it.isLinked : undefined,
    isDeleted: it?.isDeleted || false,
    order: Number.isFinite(it?.order) ? it.order : idx
  }));
};

export const normArticles = (arr) => {
  return sortByOrder(arr).map((it, idx) => ({
    id: it?.id || rid(),
    articleValue: tidy(it?.articleValue ?? it?.value ?? it?.name ?? it),
    order: Number.isFinite(Number(it?.order)) ? Number(it.order) : undefined,
    isLinked: typeof it?.isLinked === "boolean" ? it.isLinked : undefined,
    isDeleted: it?.isDeleted || false,
    order: Number.isFinite(it?.order) ? it.order : idx
  }));
};

export const normSubarticles = (arr) => {
  return sortByOrder(arr).map((it, idx) => ({
    id: it?.id || rid(),
    subarticleInterval: tidy(it?.subarticleInterval ?? it?.interval ?? it?.group ?? it?.parentArticleName ?? it?.parentSubcategoryName),
    subarticleValue: tidy(it?.subarticleValue ?? it?.value ?? it?.name),
    order: Number.isFinite(Number(it?.order)) ? Number(it.order) : undefined,
    isLinked: typeof it?.isLinked === "boolean" ? it.isLinked : undefined,
    isDeleted: it?.isDeleted || false,
    order: Number.isFinite(it?.order) ? it.order : idx
  }));
};

const deriveCardDesignImageVersion = (explicitVersion, sourceUrl) => {
  const version = tidy(explicitVersion);
  if (version) return version;

  const rawUrl = tidy(sourceUrl);
  if (!rawUrl) return "";

  const [pathPart = ""] = rawUrl.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  return segments[segments.length - 1] || rawUrl;
};

export const normDesigns = (arr) =>
  (Array.isArray(arr) ? arr : []).map((d) => ({
    id: d?.id || rid(),
    name: tidy(d?.name),
    url: tidy(d?.url ?? d?.imageUrl ?? d?.src),
    imageVersion: deriveCardDesignImageVersion(d?.imageVersion ?? d?.version, d?.url ?? d?.imageUrl ?? d?.src),
    size: d?.size ?? null,
    isLinked: typeof d?.isLinked === "boolean" ? d.isLinked : undefined,
    isDeleted: d?.isDeleted || false,
    order: Number.isFinite(d?.order) ? d.order : undefined
  }));

export const normTags = (arr) => {
  const seen = new Set();
  const out = [];
  const source = sortByOrder(arr);
  let idx = 0;
  for (const t of source) {
    const name = typeof t === "string" ? tidy(t) : tidy(t?.name ?? t?.value);
    if (!name) continue;
    const k = name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      const color = typeof t === "string" ? "#ffffff" : isHex(t?.color) ? t.color : "#ffffff";
      out.push({ 
        id: t?.id || rid(), 
        name, 
        color, 
        isDeleted: t?.isDeleted || false,
        order: Number.isFinite(t?.order) ? t.order : idx
      });
      idx++;
    }
  }
  return out;
};

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.status = resp?.status;
    err.payload = resp;
    throw err;
  }
  return resp;
};

export async function fetchFields() {
  const r = await httpGet("/fields");
  return normalizeFieldsBundle(unwrap(r));
}

export async function saveFields(payload) {
  const r = await httpPut("/fields", payload);
  return normalizeFieldsBundle(unwrap(r));
}

export async function addFieldOption(groupKey, fieldName, rawValue, extraData = {}) {
  const value = tidy(rawValue);
  if (!value) {
    return fetchFields();
  }

  const target = assertSupportedFieldOptionTarget(resolveFieldOptionTarget(groupKey, fieldName));

  const normalized = await fetchFields();
  const list = Array.isArray(normalized?.[target.groupKey]?.[target.fieldName])
    ? [...normalized[target.groupKey][target.fieldName]]
    : [];
  const incomingIdentity = target.config.buildIncomingIdentity(value, extraData);

  if (!incomingIdentity) {
    throw new Error(`Недостаточно данных для добавления поля "${target.key}".`);
  }

  const exists = list.some((item) => target.config.getItemIdentity(item) === incomingIdentity);

  if (exists) {
    return normalized;
  }

  const nextOrder =
    list.reduce((max, item, index) => {
      const order = Number.isFinite(Number(item?.order)) ? Number(item.order) : index;
      return Math.max(max, order);
    }, -1) + 1;

  normalized[target.groupKey] = {
    ...(normalized[target.groupKey] || {}),
    [target.fieldName]: [
      ...list,
      target.config.createItem(value, nextOrder, extraData),
    ],
  };

  const saved = await saveFields(serializeForSave(normalized));
  return writeFieldsBundleCache(saved);
}

export async function fetchInactiveFields() {
  const r = await httpGet("/fields/inactive");
  return normalizeFieldsBundle(unwrap(r));
}

export function withDefaults(fields) {
  const safeObj = (x) => (x && typeof x === "object" ? x : {});
  const f = safeObj(fields);
  const sharedCountries = f?.generalFields?.country ?? f?.clientFields?.country ?? f?.employeeFields?.country;
  const sharedCurrencies = f?.generalFields?.currency ?? f?.orderFields?.currency ?? f?.executorFields?.currency ?? f?.clientFields?.currency ?? f?.assetsFields?.currency;

  return {
    generalFields: {
      currency: normCodeStrs(sharedCurrencies),
      country: normCountries(sharedCountries),
      businessLine: normStrs(f?.generalFields?.businessLine),
    },
    orderFields: {
      currency: normCodeStrs(f?.orderFields?.currency ?? sharedCurrencies),
      intervals: normIntervals(f?.orderFields?.intervals),
      categories: normCategories(f?.orderFields?.categories),
      statuses: normStrs(f?.orderFields?.statuses),
      closeReasons: normStrs(f?.orderFields?.closeReasons),
      projects: normStrs(f?.orderFields?.projects),
      minOrderAmount: normStrs(f?.orderFields?.minOrderAmount),
      readySolution: normStrs(f?.orderFields?.readySolution),
      tags: normTags(f?.orderFields?.tags),
      techTags: normTags(f?.orderFields?.techTags),
      taskTags: normTags(f?.orderFields?.taskTags),
      discountReason: normStrs(f?.orderFields?.discountReason),
    },
    executorFields: {
      currency: normCodeStrs(f?.executorFields?.currency ?? sharedCurrencies),
      role: normStrs(f?.executorFields?.role),
    },
    clientFields: {
      source: normStrs(f?.clientFields?.source),
      category: normStrs(f?.clientFields?.category),
      country: normCountries(f?.clientFields?.country),
      currency: normCodeStrs(f?.clientFields?.currency ?? sharedCurrencies),
      business: normStrs(f?.clientFields?.business),
      tags: normTags(f?.clientFields?.tags ?? f?.clientFields?.tag),
      groups: Array.isArray(f?.clientFields?.groups) ? f.clientFields.groups : [],
    },
    companyFields: {
      tags: normTags(f?.companyFields?.tags),
    },
    employeeFields: {
      country: normCountries(f?.employeeFields?.country),
      tags: normTags(f?.employeeFields?.tags),
    },
    assetsFields: {
      currency: normCodeStrs(f?.assetsFields?.currency ?? sharedCurrencies),
      type: normStrs(f?.assetsFields?.type),
      paymentSystem: normDesigns(f?.assetsFields?.paymentSystem).map((d) => ({
        ...d,
        viewUrl: fileUrl(d?.url || "", d?.imageVersion || ""),
      })),
      cardDesigns: normDesigns(f?.assetsFields?.cardDesigns).map((d) => ({
        ...d,
        viewUrl: fileUrl(d?.url || "", d?.imageVersion || ""),
      })),
    },
    financeFields: {
      articles: normArticles(f?.financeFields?.articles),
      subarticles: normSubarticles(f?.financeFields?.subarticles),
      subcategory: normStrs(f?.financeFields?.subcategory),
    },
    sundryFields: {
      typeWork: normStrs(f?.sundryFields?.typeWork),
    },
    taskFields: {
      tags: normTags(f?.taskFields?.tags),
    },
  };
}

export const serByName = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const item of source) {
    const v = tidy(item?.value ?? item?.name);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({
        id: item?.id || rid(),
        name: v,
        order: Number.isFinite(Number(item?.order)) ? Number(item.order) : out.length,
        ...(item?.isDeleted ? { isDeleted: true } : {}),
        ...(normalizeDeleteAction(item?.deleteAction)
          ? { deleteAction: normalizeDeleteAction(item?.deleteAction) }
          : {}),
      });
    }
  }
  return out;
};

export const serCountries = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  let idx = 0;
  for (const item of source) {
    const name = tidy(item?.value ?? item?.name);
    const iso2 = tidy(item?.iso2).toUpperCase();
    const iso3 = tidy(item?.iso3).toUpperCase();
    const key = String(item?.id || iso2 || name).trim().toLowerCase();
    if (!key || (!name && !iso2)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: item?.id || rid(),
      name: name || iso2,
      nameEn: tidy(item?.nameEn),
      nameRu: tidy(item?.nameRu),
      nameUk: tidy(item?.nameUk),
      iso2: iso2 || undefined,
      iso3: iso3 || undefined,
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : undefined,
      ...(item?.isDeleted ? { isDeleted: true } : {}),
      ...(normalizeDeleteAction(item?.deleteAction)
        ? { deleteAction: normalizeDeleteAction(item?.deleteAction) }
        : {}),
    });
    idx++;
  }
  return out;
};

export const serByCode = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const item of source) {
    const v = normalizeCodeValue(item?.code ?? item?.value);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({
        id: item?.id || rid(),
        code: v,
        order: Number.isFinite(Number(item?.order)) ? Number(item.order) : out.length,
        ...(item?.isDeleted ? { isDeleted: true } : {}),
        ...(normalizeDeleteAction(item?.deleteAction)
          ? { deleteAction: normalizeDeleteAction(item?.deleteAction) }
          : {}),
      });
    }
  }
  return out;
};

export const serIntervals = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it, index) => ({
      id: it?.id || rid(),
      value: tidy(it?.intervalValue ?? it?.value),
      order: Number.isFinite(Number(it?.order)) ? Number(it.order) : index,
      ...(it?.isDeleted ? { isDeleted: true } : {}),
      ...(normalizeDeleteAction(it?.deleteAction)
        ? { deleteAction: normalizeDeleteAction(it?.deleteAction) }
        : {}),
    }))
    .filter((x) => x.value !== "");

export const serCategories = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it, index) => ({
      id: it?.id || rid(),
      intervalValue: tidy(it?.categoryInterval),
      value: tidy(it?.categoryValue),
      order: Number.isFinite(Number(it?.order)) ? Number(it.order) : index,
      ...(it?.isDeleted ? { isDeleted: true } : {}),
      ...(normalizeDeleteAction(it?.deleteAction)
        ? { deleteAction: normalizeDeleteAction(it?.deleteAction) }
        : {}),
    }))
    .filter((x) => x.intervalValue && x.value);

export const serArticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it, index) => ({
      id: it?.id || rid(),
      name: tidy(it?.articleValue),
      order: Number.isFinite(Number(it?.order)) ? Number(it.order) : index,
      ...(it?.isDeleted ? { isDeleted: true } : {}),
      ...(normalizeDeleteAction(it?.deleteAction)
        ? { deleteAction: normalizeDeleteAction(it?.deleteAction) }
        : {}),
    }))
    .filter((x) => x.name !== "");

export const serSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((it, index) => ({
      id: it?.id || rid(),
      parentName: tidy(it?.subarticleInterval),
      name: tidy(it?.subarticleValue),
      order: Number.isFinite(Number(it?.order)) ? Number(it.order) : index,
      ...(it?.isDeleted ? { isDeleted: true } : {}),
      ...(normalizeDeleteAction(it?.deleteAction)
        ? { deleteAction: normalizeDeleteAction(it?.deleteAction) }
        : {}),
    }))
    .filter((x) => x.parentName && x.name);

export const serDesigns = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((d, index) => ({
      id: d?.id || rid(),
      name: tidy(d?.name),
      url: tidy(d?.url),
      size: d?.size ?? null,
      order: Number.isFinite(Number(d?.order)) ? Number(d.order) : index,
      ...(d?.isDeleted ? { isDeleted: true } : {}),
      ...(normalizeDeleteAction(d?.deleteAction)
        ? { deleteAction: normalizeDeleteAction(d?.deleteAction) }
        : {}),
    }))
    .filter((d) => d.name);

export const serTags = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter((item) => !item.isDeleted);
  let idx = 0;
  for (const t of source) {
    const name = tidy(t?.name);
    if (!name) continue;
    const color = isHex(t?.color) ? t.color : "#ffffff";
    const k = name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ id: t?.id || rid(), name, color, order: t?.order ?? idx });
      idx++;
    }
  }
  return out;
};

export function serializeForSave(values) {
  const currencyList = serByCode(values?.generalFields?.currency);

  return {
    generalFields: {
      currency: currencyList,
      country: serCountries(values?.generalFields?.country),
      businessLine: serByName(values?.generalFields?.businessLine),
    },
    orderFields: {
      currency: serByCode(values?.orderFields?.currency),
      intervals: serIntervals(values?.orderFields?.intervals),
      categories: serCategories(values?.orderFields?.categories),
      statuses: serByName(values?.orderFields?.statuses),
      closeReasons: serByName(values?.orderFields?.closeReasons),
      projects: serByName(values?.orderFields?.projects),
      discountReason: serByName(values?.orderFields?.discountReason),
      minOrderAmount: serByName(values?.orderFields?.minOrderAmount),
      readySolution: serByName(values?.orderFields?.readySolution),
      tags: serTags(values?.orderFields?.tags),
      techTags: serTags(values?.orderFields?.techTags),
      taskTags: serTags(values?.orderFields?.taskTags),
    },
    executorFields: {
      currency: serByCode(values?.executorFields?.currency),
      role: serByName(values?.executorFields?.role),
    },
    clientFields: {
      source: serByName(values?.clientFields?.source),
      category: serByName(values?.clientFields?.category),
      country: serCountries(values?.clientFields?.country),
      currency: serByCode(values?.clientFields?.currency),
      business: serByName(values?.clientFields?.business),
      tags: serTags(values?.clientFields?.tags),
    },
    companyFields: {
      tags: serTags(values?.companyFields?.tags),
    },
    employeeFields: {
      country: serCountries(values?.employeeFields?.country),
      tags: serTags(values?.employeeFields?.tags),
    },
    assetsFields: {
      currency: serByCode(values?.assetsFields?.currency),
      type: serByName(values?.assetsFields?.type),
      paymentSystem: serDesigns(values?.assetsFields?.paymentSystem),
      cardDesigns: serDesigns(values?.assetsFields?.cardDesigns),
    },
    financeFields: {
      articles: serArticles(values?.financeFields?.articles),
      subarticles: serSubarticles(values?.financeFields?.subarticles),
      subcategory: serByName(values?.financeFields?.subcategory),
    },
    sundryFields: {
      typeWork: serByName(values?.sundryFields?.typeWork),
    },
    taskFields: {
      tags: serTags(values?.taskFields?.tags),
    },
  };
}

export async function getGroup(groupKey) {
  const all = withDefaults(await fetchFields());
  return all[groupKey] || {};
}

export async function setGroup(groupKey, groupData) {
  const all = withDefaults(await fetchFields());
  const next = { ...all, [groupKey]: groupData || {} };
  return saveFields(serializeForSave(next));
}

const loadAll = async () => withDefaults(await fetchFields());

const updateBundle = async (mutator) => {
  const all = await loadAll();
  const next = mutator ? mutator(all) || all : all;
  return saveFields(serializeForSave(next));
};

export const FieldsAPI = {
  async getClient() {
    const all = await loadAll();
    return all.clientFields || {};
  },
  async getEmployee() {
    const all = await loadAll();
    return all.employeeFields || {};
  },
  async getExecutor() {
    const all = await loadAll();
    return all.executorFields || {};
  },
  async setClientCategories(list) {
    return updateBundle((all) => {
      all.clientFields.category = normStrs(list);
      return all;
    });
  },
  async setClientSources(list) {
    return updateBundle((all) => {
      all.clientFields.source = normStrs(list);
      return all;
    });
  },
  async setClientCountries(list) {
    return updateBundle((all) => {
      all.clientFields.country = normCountries(list);
      return all;
    });
  },
  async setClientTags(list) {
    return updateBundle((all) => {
      all.clientFields.tags = normTags(list);
      return all;
    });
  },
};

export default {
  fetchFields,
  saveFields,
  withDefaults,
  getGroup,
  setGroup,
  FieldsAPI,
};
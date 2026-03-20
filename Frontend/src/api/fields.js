import { httpGet, httpPut, fileUrl } from "./http";

export const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
export const tidy = (v) => String(v ?? "").trim();
export const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

const normalizeCodeValue = (value) => tidy(value).toUpperCase();

// --- Нормализация (чтение с сервера) ---

export const normStrs = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const item of source) {
    const v =
      typeof item === "string"
        ? tidy(item)
        : tidy(item?.value ?? item?.name ?? item?.code);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ id: item?.id || rid(), value: v, isDeleted: item?.isDeleted || false });
    }
  }
  return out;
};

export const normCodeStrs = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const item of source) {
    const code =
      typeof item === "string"
        ? normalizeCodeValue(item)
        : normalizeCodeValue(item?.code ?? item?.value);
    if (!code) continue;
    const key = code.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const name =
      typeof item === "string"
        ? code
        : tidy(item?.name ?? item?.label ?? code);

    out.push({
      id: item?.id || rid(),
      value: code,
      code,
      name,
      label: name || code,
      isDeleted: item?.isDeleted || false,
    });
  }
  return out;
};

export const normCountries = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const item of source) {
    if (typeof item === "string") {
      const name = tidy(item);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: rid(), value: name, name, isDeleted: false });
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
      order: Number.isFinite(Number(item?.order)) ? Number(item.order) : undefined,
      isDeleted: item?.isDeleted || false,
    });
  }
  return out;
};

export const normIntervals = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    intervalValue: tidy(it?.intervalValue ?? it?.value ?? it),
    isDeleted: it?.isDeleted || false,
  }));

export const normCategories = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    categoryInterval: tidy(
      it?.categoryInterval ?? it?.interval?.value ?? it?.intervalValue ?? it?.interval ?? it?.group
    ),
    categoryValue: tidy(it?.categoryValue ?? it?.value ?? it?.name),
    isDeleted: it?.isDeleted || false,
  }));

export const normArticles = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    articleValue: tidy(it?.articleValue ?? it?.value ?? it?.name ?? it),
    isDeleted: it?.isDeleted || false,
  }));

export const normSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    subarticleInterval: tidy(
      it?.subarticleInterval ??
        it?.interval ??
        it?.group ??
        it?.parentArticleName ??
        it?.parentSubcategoryName
    ),
    subarticleValue: tidy(it?.subarticleValue ?? it?.value ?? it?.name),
    isDeleted: it?.isDeleted || false,
  }));

export const normDesigns = (arr) =>
  (Array.isArray(arr) ? arr : []).map((d) => ({
    id: d?.id || rid(),
    name: tidy(d?.name),
    url: tidy(d?.url ?? d?.imageUrl ?? d?.src),
    size: d?.size ?? null,
    order: Number.isFinite(Number(d?.order)) ? Number(d.order) : undefined,
    isLinked: typeof d?.isLinked === "boolean" ? d.isLinked : undefined,
    isDeleted: d?.isDeleted || false,
  }));

export const normTags = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const t of source) {
    const name = typeof t === "string" ? tidy(t) : tidy(t?.name ?? t?.value);
    if (!name) continue;
    const k = name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      const color =
        typeof t === "string" ? "#ffffff" : isHex(t?.color) ? t.color : "#ffffff";
      out.push({ id: t?.id || rid(), name, color, isDeleted: t?.isDeleted || false });
    }
  }
  return out;
};

// --- API ---

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
  return unwrap(r);
}

export async function saveFields(payload) {
  const r = await httpPut("/fields", payload);
  return unwrap(r);
}

export async function fetchInactiveFields() {
  const r = await httpGet("/fields/inactive");
  return unwrap(r);
}

// --- Defaults (UI structure) ---

export function withDefaults(fields) {
  const safeObj = (x) => (x && typeof x === "object" ? x : {});
  const f = safeObj(fields);
  const sharedCountries =
    f?.generalFields?.country ?? f?.clientFields?.country ?? f?.employeeFields?.country;
  const sharedCurrencies =
    f?.generalFields?.currency ??
    f?.orderFields?.currency ??
    f?.executorFields?.currency ??
    f?.clientFields?.currency ??
    f?.assetsFields?.currency;

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
      paymentSystem: normStrs(f?.assetsFields?.paymentSystem),
      cardDesigns: normDesigns(f?.assetsFields?.cardDesigns).map((d) => ({
        ...d,
        viewUrl: fileUrl(d?.url || ""),
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

// --- Serializers (Подготовка к отправке) ---

export const serByName = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter((item) => !item.isDeleted);
  for (const item of source) {
    const v = tidy(item?.value ?? item?.name);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ id: item?.id || rid(), name: v });
    }
  }
  return out;
};

export const serCountries = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter((item) => !item?.isDeleted);
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
    });
  }
  return out;
};

export const serByCode = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter((item) => !item.isDeleted);
  for (const item of source) {
    const v = normalizeCodeValue(item?.code ?? item?.value);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ id: item?.id || rid(), code: v });
    }
  }
  return out;
};

export const serIntervals = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter((item) => !item.isDeleted)
    .map((it) => ({ id: it?.id || rid(), value: tidy(it?.intervalValue ?? it?.value) }))
    .filter((x) => x.value !== "");

export const serCategories = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter((item) => !item.isDeleted)
    .map((it) => ({
      id: it?.id || rid(),
      intervalValue: tidy(it?.categoryInterval),
      value: tidy(it?.categoryValue),
    }))
    .filter((x) => x.intervalValue && x.value);

export const serArticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter((item) => !item.isDeleted)
    .map((it) => ({ id: it?.id || rid(), name: tidy(it?.articleValue) }))
    .filter((x) => x.name !== "");

export const serSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter((item) => !item.isDeleted)
    .map((it) => ({
      id: it?.id || rid(),
      parentName: tidy(it?.subarticleInterval),
      name: tidy(it?.subarticleValue),
    }))
    .filter((x) => x.parentName && x.name);

export const serDesigns = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter((item) => !item.isDeleted)
    .map((d, index) => ({
      id: d?.id || rid(),
      name: tidy(d?.name),
      url: tidy(d?.url),
      size: d?.size ?? null,
      order: Number.isFinite(Number(d?.order)) ? Number(d.order) : index,
    }))
    .filter((d) => d.name);

export const serTags = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter((item) => !item.isDeleted);
  for (const t of source) {
    const name = tidy(t?.name);
    if (!name) continue;
    const color = isHex(t?.color) ? t.color : "#ffffff";
    const k = name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ id: t?.id || rid(), name, color });
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
      paymentSystem: serByName(values?.assetsFields?.paymentSystem),
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

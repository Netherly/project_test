// src/api/fields.js
import { httpGet, httpPut, fileUrl } from "./http";

/**
 * Ходим в единый эндпоинт:
 * GET  /api/fields  -> весь объект полей
 * PUT  /api/fields  -> сохранить весь объект полей (полная синхронизация)
 *
 * httpGet/httpPut уже используют базовый префикс из http.js
 */

export const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
export const tidy = (v) => String(v ?? "").trim();
export const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

// Нормализация простых списков (строк)
export const normStrs = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const item of source) {
    const v = (typeof item === 'string') ? tidy(item) : tidy(item?.value ?? item?.name ?? item?.code);
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push({
        id: item?.id || rid(),
        value: v,
        isDeleted: item?.isDeleted || false
      });
    }
  }
  return out;
};

// Нормализация интервалов
export const normIntervals = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    intervalValue: tidy(it?.intervalValue ?? it?.value ?? it),
    isDeleted: it?.isDeleted || false,
  }));

// Нормализация категорий
export const normCategories = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    categoryInterval: tidy(it?.categoryInterval ?? it?.interval ?? it?.group),
    categoryValue: tidy(it?.categoryValue ?? it?.value ?? it?.name),
    isDeleted: it?.isDeleted || false,
  }));

// Нормализация СТАТЕЙ
export const normArticles = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    articleValue: tidy(it?.articleValue ?? it?.value ?? it?.name ?? it), 
    isDeleted: it?.isDeleted || false,
  }));

// Нормализация ПОДСТАТЕЙ 
export const normSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : []).map((it) => ({
    id: it?.id || rid(),
    subarticleInterval: tidy(it?.subarticleInterval ?? it?.interval ?? it?.group ?? it?.parentArticleName),
    subarticleValue: tidy(it?.subarticleValue ?? it?.value ?? it?.name),
    isDeleted: it?.isDeleted || false,
  }));

// Нормализация дизайнов
export const normDesigns = (arr) =>
  (Array.isArray(arr) ? arr : []).map((d) => ({
    id: d?.id || rid(),
    name: tidy(d?.name),
    url: tidy(d?.url ?? d?.imageUrl ?? d?.src),
    size: d?.size ?? null,
    isDeleted: d?.isDeleted || false,
  }));

// Нормализация тегов
export const normTags = (arr) => {
  const seen = new Set();
  const out = [];
  const source = Array.isArray(arr) ? arr : [];
  for (const t of source) {
    const name = (typeof t === "string") ? tidy(t) : tidy(t?.name ?? t?.value);
    if (!name) continue;
    const k = name.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      const color = (typeof t === "string") ? "#ffffff" : (isHex(t?.color) ? t.color : "#ffffff");
      out.push({
        id: t?.id || rid(),
        name: name,
        color: color,
        isDeleted: t?.isDeleted || false
      });
    }
  }
  return out;
};


const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

// Получить все поля (как один объект)
export async function fetchFields() {
  const r = await httpGet("/fields");
  return unwrap(r);
}

// Сохранить все поля (ожидаем полный объект)
export async function saveFields(payload) {
  const r = await httpPut("/fields", payload);
  return unwrap(r);
}


export async function fetchInactiveFields() {
  const r = await httpGet("/fields/inactive"); // Новый эндпоинт
  return unwrap(r);
}

/**
 * Нормализация структуры на фронте
 */
export function withDefaults(fields) {
  const safeArr = (x) => (Array.isArray(x) ? x : []);
  const safeObj = (x) => (x && typeof x === "object" ? x : {});

  const f = safeObj(fields);

  return {
    generalFields: {
      currency: normStrs(f?.generalFields?.currency),
    },
    
    orderFields: {
      intervals: normIntervals(f?.orderFields?.intervals),
      categories: normCategories(f?.orderFields?.categories),
      tags: normTags(f?.orderFields?.tags),
      techTags: normTags(f?.orderFields?.techTags),
      taskTags: normTags(f?.orderFields?.taskTags),
      discountReason: normStrs(f?.orderFields?.discountReason),
    },
    executorFields: {
      role: normStrs(f?.executorFields?.role),
    },
    clientFields: {
      source: normStrs(f?.clientFields?.source),
      category: normStrs(f?.clientFields?.category),
      country: normStrs(f?.clientFields?.country),
      tags: normTags(f?.clientFields?.tags ?? f?.clientFields?.tag), 
    },
    companyFields: { 
      tags: normTags(f?.companyFields?.tags),
    },
    employeeFields: {
      country: normStrs(f?.employeeFields?.country),
      tags: normTags(f?.employeeFields?.tags),
    },
    assetsFields: {
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
    }
  };
}

export const serByName = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter(item => !item.isDeleted);
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

export const serByCode = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter(item => !item.isDeleted);
  for (const item of source) {
    const v = tidy(item?.value ?? item?.code);
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
    .filter(item => !item.isDeleted)
    .map((it) => ({ id: it?.id || rid(), value: tidy(it?.intervalValue ?? it?.value) }))
    .filter((x) => x.value !== "");

export const serCategories = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter(item => !item.isDeleted)
    .map((it) => ({
      id: it?.id || rid(),
      intervalValue: tidy(it?.categoryInterval),
      value: tidy(it?.categoryValue)
    }))
    .filter((x) => x.intervalValue && x.value);

export const serArticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter(item => !item.isDeleted)
    .map((it) => ({
      id: it?.id || rid(),
      name: tidy(it?.articleValue) 
    }))
    .filter((x) => x.name !== "");

export const serSubarticles = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter(item => !item.isDeleted)
    .map((it) => ({
      id: it?.id || rid(),
      parentArticleName: tidy(it?.subarticleInterval),
      name: tidy(it?.subarticleValue)
    }))
    .filter((x) => (x.parentArticleName && x.name));

export const serDesigns = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .filter(item => !item.isDeleted)
    .map((d) => ({ id: d?.id || rid(), name: tidy(d?.name), url: tidy(d?.url), size: d?.size ?? null }))
    .filter((d) => d.name); 

export const serTags = (arr) => {
  const seen = new Set();
  const out = [];
  const source = (Array.isArray(arr) ? arr : []).filter(item => !item.isDeleted);
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
    orderFields: {
      currency: currencyList,
      intervals: serIntervals(values?.orderFields?.intervals),
      categories: serCategories(values?.orderFields?.categories),
      tags: serTags(values?.orderFields?.tags),
      techTags: serTags(values?.orderFields?.techTags),
      taskTags: serTags(values?.orderFields?.taskTags),
    },
    executorFields: {
      currency: currencyList,
      role: serByName(values?.executorFields?.role),
    },
    clientFields: {
      currency: currencyList,
      source: serByName(values?.clientFields?.source),
      category: serByName(values?.clientFields?.category),
      country: serByName(values?.clientFields?.country),
      tags: serTags(values?.clientFields?.tags),
    },
    companyFields: {
      tags: serTags(values?.companyFields?.tags),
    },
    employeeFields: {
      tags: serTags(values?.employeeFields?.tags),
    },
    assetsFields: {
      currency: currencyList,
      type: serByName(values?.assetsFields?.type),
      paymentSystem: serByName(values?.assetsFields?.paymentSystem),
      cardDesigns: serDesigns(values?.assetsFields?.cardDesigns),
    },
    financeFields: {
      articles: serArticles(values?.financeFields?.articles),
      subarticles: serSubarticles(values?.financeFields?.subarticles),
      subcategory: serByName(values?.financeFields?.subcategory),
    },
  };
}

/**
 * Работа с одной группой (вкладкой)
 */
export async function getGroup(groupKey) {
  const all = withDefaults(await fetchFields());
  return all[groupKey] || {};
}

export async function setGroup(groupKey, groupData) {
  const all = withDefaults(await fetchFields());
  const next = { ...all, [groupKey]: groupData || {} };
  return saveFields(next);
}

/**
 * Адресные методы (все через PUT /fields)
 */
export const FieldsAPI = {
  async getGeneral() {
    return getGroup("generalFields");
  },
  async setGeneralCurrency(list) {
    const all = withDefaults(await fetchFields());
    all.generalFields.currency = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== ORDER =====
  async getOrder() {
    return getGroup("orderFields");
  },
  // async setOrderCurrency(list) { ... }, // <-- Удалено
  async setOrderIntervals(list) {
    const all = withDefaults(await fetchFields());
    // ожидаем [{ intervalValue: '...' }, ...]
    all.orderFields.intervals = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setOrderCategories(list) {
    const all = withDefaults(await fetchFields());
    // ожидаем [{ categoryInterval: '...', categoryValue:'...' }, ...]
    all.orderFields.categories = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== EXECUTOR =====
  async getExecutor() {
    return getGroup("executorFields");
  },
  // async setExecutorCurrency(list) { ... }, // <-- Удалено
  async setExecutorRoles(list) {
    const all = withDefaults(await fetchFields());
    all.executorFields.role = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== CLIENT =====
  async getClient() {
    return getGroup("clientFields");
  },
  async setClientSources(list) {
    const all = withDefaults(await fetchFields());
    all.clientFields.source = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setClientCategories(list) {
    const all = withDefaults(await fetchFields());
    all.clientFields.category = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setClientCountries(list) {
    const all = withDefaults(await fetchFields());
    all.clientFields.country = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setClientTags(list) {
    const all = withDefaults(await fetchFields());
    all.clientFields.tag = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== EMPLOYEE =====
  async getEmployee() {
    return getGroup("employeeFields");
  },
  async setEmployeeCountries(list) {
    const all = withDefaults(await fetchFields());
    all.employeeFields.country = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== ASSETS =====
  async getAssets() {
    return getGroup("assetsFields");
  },
  async setAssetsTypes(list) {
    const all = withDefaults(await fetchFields());
    all.assetsFields.type = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setAssetsPaymentSystems(list) {
    const all = withDefaults(await fetchFields());
    all.assetsFields.paymentSystem = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setAssetsCardDesigns(list) {
    const all = withDefaults(await fetchFields());
    all.assetsFields.cardDesigns = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== FINANCE =====
  async getFinance() {
    return getGroup("financeFields");
  },
  async setFinanceArticles(list) {
    const all = withDefaults(await fetchFields());
    all.financeFields.articles = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setFinanceSubarticles(list) {
    const all = withDefaults(await fetchFields());
    all.financeFields.subarticles = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setFinanceSubcategory(list) {
    const all = withDefaults(await fetchFields());
    all.financeFields.subcategory = Array.isArray(list) ? list : [];
    return saveFields(all);
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
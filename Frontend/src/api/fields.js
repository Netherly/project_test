// src/api/fields.js
import { httpGet, httpPut, fileUrl } from "./http";

/**
 * Ходим в единый эндпоинт:
 *   GET  /api/fields  -> весь объект полей
 *   PUT  /api/fields  -> сохранить весь объект полей (полная синхронизация)
 *
 * httpGet/httpPut уже используют базовый префикс из http.js
 */

// Универсальная распаковка { ok, data } или “голого” объекта
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

/**
 * Нормализация структуры на фронте,
 * чтобы не падать, если чего-то нет в ответе.
 */
export function withDefaults(fields) {
  const safeArr = (x) => (Array.isArray(x) ? x : []);
  const safeObj = (x) => (x && typeof x === "object" ? x : {});

  const f = safeObj(fields);

  return {
    orderFields: {
      intervals: safeArr(f?.orderFields?.intervals),
      categories: safeArr(f?.orderFields?.categories),
      currency: safeArr(f?.orderFields?.currency),
    },
    executorFields: {
      currency: safeArr(f?.executorFields?.currency),
      role: safeArr(f?.executorFields?.role),
    },
    clientFields: {
      source: safeArr(f?.clientFields?.source),
      category: safeArr(f?.clientFields?.category),
      country: safeArr(f?.clientFields?.country),
      currency: safeArr(f?.clientFields?.currency),
      tag: safeArr(f?.clientFields?.tag),
    },
    employeeFields: {
      country: safeArr(f?.employeeFields?.country),
    },
    assetsFields: {
      currency: safeArr(f?.assetsFields?.currency),
      type: safeArr(f?.assetsFields?.type),
      paymentSystem: safeArr(f?.assetsFields?.paymentSystem),
      // [{ id, name, url, size? }, ...]
      // Дополняем viewUrl — абсолютный адрес для <img src=...>
      cardDesigns: safeArr(f?.assetsFields?.cardDesigns).map((d) => ({
        ...d,
        viewUrl: fileUrl(d?.url || ""),
      })),
    },
    financeFields: {
      // [{ articleValue }...]
      articles: safeArr(f?.financeFields?.articles),
      // [{ subarticleInterval, subarticleValue }...]
      subarticles: safeArr(f?.financeFields?.subarticles),
      // [ 'Подкатегория', ...]
      subcategory: safeArr(f?.financeFields?.subcategory),
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
  // ===== ORDER =====
  async getOrder() {
    return getGroup("orderFields");
  },
  async setOrderCurrency(list) {
    const all = withDefaults(await fetchFields());
    all.orderFields.currency = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
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
  async setExecutorCurrency(list) {
    const all = withDefaults(await fetchFields());
    all.executorFields.currency = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
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
  async setClientCurrencies(list) {
    const all = withDefaults(await fetchFields());
    all.clientFields.currency = Array.isArray(list) ? list : [];
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
  async setAssetsCurrency(list) {
    const all = withDefaults(await fetchFields());
    all.assetsFields.currency = Array.isArray(list) ? list : [];
    return saveFields(all);
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
    // ожидаем [{ id, name, url('/uploads/..' | 'http..'), size? }, ...]
    // Сохраняем как пришло; viewUrl пересчитается при чтении в withDefaults
    all.assetsFields.cardDesigns = Array.isArray(list) ? list : [];
    return saveFields(all);
  },

  // ===== FINANCE =====
  async getFinance() {
    return getGroup("financeFields");
  },
  async setFinanceArticles(list) {
    const all = withDefaults(await fetchFields());
    // ожидаем [{ articleValue: '...' }, ...]
    all.financeFields.articles = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setFinanceSubarticles(list) {
    const all = withDefaults(await fetchFields());
    // ожидаем [{ subarticleInterval:'...', subarticleValue:'...' }, ...]
    all.financeFields.subarticles = Array.isArray(list) ? list : [];
    return saveFields(all);
  },
  async setFinanceSubcategory(list) {
    const all = withDefaults(await fetchFields());
    // простой список строк
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

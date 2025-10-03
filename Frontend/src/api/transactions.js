// src/api/transactions.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http";

/**
 * Листинг
 * Бэкенд: либо { page, pageSize, total, items }, либо просто массив.
 * Вернём унифицированно: { items, page, pageSize, total }.
 */
export async function listTransactions(params = {}) {
  const {
    page = 1,
    pageSize = 200,
    search,
    accountId,
    clientId,
    companyId,
    dateFrom,
    dateTo,
  } = params;

  const data = await httpGet("/transactions", {
    page,
    pageSize,
    search,
    accountId,
    clientId,
    companyId,
    dateFrom,
    dateTo,
  });

  // массив без меты
  if (Array.isArray(data)) {
    return { items: data, page, pageSize, total: data.length };
  }

  // объект с метой
  return {
    items: data.items || [],
    page: data.page ?? page,
    pageSize: data.pageSize ?? pageSize,
    total: data.total ?? (data.items ? data.items.length : 0),
  };
}

/** Создать одну или массив (бэкенд принимает оба варианта) */
export async function createTransactions(payload /* obj | obj[] */) {
  return httpPost("/transactions", payload);
}

/** Обновить по id */
export async function updateTransaction(id, data) {
  return httpPut(`/transactions/${id}`, data);
}

/** Удалить по id */
export async function deleteTransaction(id) {
  return httpDelete(`/transactions/${id}`);
}

/**
 * Дублировать по id.
 * Предпочтительно иметь роут на бэке: POST /transactions/:id/duplicate
 * Если роута нет — можно раскомментить fallback ниже.
 */
export async function duplicateTransaction(id) {
  return httpPost(`/transactions/${id}/duplicate`, {});
  
  // --- Fallback (если нет эндпоинта на бэке) ---
  // const original = await httpGet(`/transactions/${id}`);
  // const { id: _omit, date: _date, ...rest } = original || {};
  // const now = new Date();
  // const pad = (n) => String(n).padStart(2, "0");
  // const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // const payload = {
  //   ...rest,
  //   description: `(Копия) ${rest?.description || ""}`.trim(),
  //   date: dateStr,
  // };
  // return createTransactions(payload);
}

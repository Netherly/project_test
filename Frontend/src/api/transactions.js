// Frontend/src/api/transactions.js
import { httpGet, httpPost, httpPut, httpDelete } from './http';

const unwrap = (resp) => {
  // Если сервер вернул объект с полем error — выкидываем ошибку
  if (resp.error) throw new Error(resp.error);
  
  // Если есть обертка { ok: true, data: ... } — разворачиваем
  if (resp.ok && resp.data) return resp.data;

  // Во всех остальных случаях считаем, что resp — это и есть наши данные
  return resp;
};

const qs = (obj = {}) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.append(k, v);
  });
  return params.toString();
};

export async function fetchTransactions(params = {}) {
  const query = qs(params);
  const resp = await httpGet(`/transactions?${query}`);
  return unwrap(resp);
}

export async function fetchTransactionById(id) {
  const resp = await httpGet(`/transactions/${id}`);
  return unwrap(resp);
}

export async function createTransaction(payload) {
  const resp = await httpPost('/transactions', payload);
  return unwrap(resp);
}

export async function updateTransaction(id, payload) {
  const resp = await httpPut(`/transactions/${id}`, payload);
  return unwrap(resp);
}

export async function deleteTransaction(id) {
  const resp = await httpDelete(`/transactions/${id}`);
  return unwrap(resp);
}

export async function duplicateTransaction(id) {
  const resp = await httpPost(`/transactions/${id}/duplicate`);
  return unwrap(resp);
}

// Frontend/src/api/transactions.js
import { httpGet, httpPost, httpPut, httpDelete } from './http';

const unwrap = (resp) => {
  if (resp.ok) return resp.data;
  throw new Error(resp.error || 'API error');
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
  const resp = await httpGet(`/api/transactions?${query}`);
  return unwrap(resp);
}

export async function fetchTransactionById(id) {
  const resp = await httpGet(`/api/transactions/${id}`);
  return unwrap(resp);
}

export async function createTransaction(payload) {
  const resp = await httpPost('/api/transactions', payload);
  return unwrap(resp);
}

export async function updateTransaction(id, payload) {
  const resp = await httpPut(`/api/transactions/${id}`, payload);
  return unwrap(resp);
}

export async function deleteTransaction(id) {
  const resp = await httpDelete(`/api/transactions/${id}`);
  return unwrap(resp);
}

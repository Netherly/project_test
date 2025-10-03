// src/api/clients.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http";

/**
 * Эндпоинты по умолчанию:
 *   GET    /api/clients            -> список клиентов
 *   POST   /api/clients            -> создать клиента
 *   PUT    /api/clients/:id        -> обновить клиента
 *   DELETE /api/clients/:id        -> удалить клиента
 *
 * Если у вас другой путь — поправьте строки ниже.
 */

const BASE = "/clients";

// Универсальная распаковка { ok, data } или «голого» объекта
const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

// Нормализация тегов (строки -> {name, color})
const normTags = (arr) =>
  (Array.isArray(arr) ? arr : []).map((t) =>
    typeof t === "string" ? { name: t, color: null } : { name: t?.name, color: t?.color || null, textColor: t?.textColor || null }
  );

// Нормализация клиента (чтобы таблица не падала от неожиданных типов)
const normalizeClient = (c = {}) => ({
  id: c.id,
  group: c.group ?? 2,
  name: c.name ?? "",
  tags: normTags(c.tags),
  intro_description: c.intro_description ?? "",
  source: c.source ?? "",
  full_name: c.full_name ?? "",
  country: c.country ?? "",
  currency: c.currency ?? "",
  hourly_rate: c.hourly_rate ?? null,
  percent: c.percent ?? null,
  referrer_id: c.referrer_id ?? null,
  referrer_name: c.referrer_name ?? "",
  referrer_first_id: c.referrer_first_id ?? null,
  referrer_first_name: c.referrer_first_name ?? "",
  status: c.status ?? "",
  last_order_date: c.last_order_date ?? "—",
  credentials: Array.isArray(c.credentials) ? c.credentials : [],
  note: c.note ?? "",
});

export async function fetchClients(params = {}) {
  const r = await httpGet(BASE, params);
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeClient);
}

export async function createClient(payload) {
  const r = await httpPost(BASE, payload);
  return normalizeClient(unwrap(r));
}

export async function updateClient(id, payload) {
  const r = await httpPut(`${BASE}/${id}`, payload);
  return normalizeClient(unwrap(r));
}

export async function saveClient(payload) {
  return payload?.id ? updateClient(payload.id, payload) : createClient(payload);
}

export async function deleteClient(id) {
  const r = await httpDelete(`${BASE}/${id}`);
  return unwrap(r) ?? true;
}

// На всякий — объект-обёртка
export const ClientsAPI = {
  fetch: fetchClients,
  create: createClient,
  update: updateClient,
  save: saveClient,
  remove: deleteClient,
};

export default ClientsAPI;

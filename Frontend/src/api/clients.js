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

const isUuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeNullableId = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return isUuid(value) ? value : null;
};

// Нормализация тегов (строки/relations -> {id,name,color})
const normTags = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((t) => {
      if (typeof t === "string") return { name: t, color: null };
      const raw = t?.tag || t;
      return {
        id: raw?.id ?? t?.tagId ?? t?.id,
        name: raw?.name,
        color: raw?.color || t?.color || null,
        textColor: raw?.textColor || t?.textColor || null,
      };
    })
    .filter((t) => t?.name);

const normalizeGroup = (value) => {
  if (value === undefined || value === null || value === "") return 2;
  if (typeof value === "object") {
    const order = value.order ?? value.value ?? value.code;
    return order ?? 2;
  }
  return value;
};

const normalizeNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return String(value);
};

const normalizeShareInfo = (value) => {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const normalizeAccesses = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => ({
    name: item?.name ?? item?.label ?? "",
    login: item?.login ?? "",
    password: item?.password ?? "",
    description: item?.description ?? "",
  }));
};

// Нормализация клиента (чтобы таблица не падала от неожиданных типов)
const normalizeClient = (c = {}) => {
  const shareInfoRaw = c.share_info ?? c.shareInfo;
  const credentials = Array.isArray(c.credentials) ? c.credentials : [];
  const accesses = Array.isArray(c.accesses)
    ? normalizeAccesses(c.accesses)
    : normalizeAccesses(credentials);

  return {
    id: c.id ?? null,
    group: normalizeGroup(c.group ?? c.group_order ?? c.groupOrder),
    group_id: c.group_id ?? c.groupId ?? c.group?.id ?? null,
    group_name: c.group_name ?? c.group?.name ?? "",
    name: c.name ?? "",
    messenger_name: c.messenger_name ?? c.messengerName ?? "",
    intro_description: c.intro_description ?? c.introDescription ?? "",
    note: c.note ?? "",
    category: c.category ?? "",
    source: c.source ?? "",
    full_name: c.full_name ?? c.fullName ?? "",
    country: c.country ?? "",
    currency: c.currency ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    city: c.city ?? "",
    payment_details: c.payment_details ?? c.paymentDetails ?? "",
    hourly_rate: c.hourly_rate ?? null,
    percent: c.percent ?? null,
    share_info: normalizeShareInfo(shareInfoRaw),
    status: c.status ?? "",
    referrer_id: c.referrer_id ?? c.referrerId ?? null,
    referrer_name: c.referrer_name ?? "",
    referrer_first_id: c.referrer_first_id ?? c.referrerFirstId ?? null,
    referrer_first_name: c.referrer_first_name ?? "",
    manager_id: c.manager_id ?? c.managerId ?? null,
    manager_name: c.manager_name ?? "",
    company_id: c.company_id ?? c.companyId ?? null,
    company_name: c.company_name ?? "",
    chat_link: c.chat_link ?? c.chatLink ?? "",
    photo_link: c.photo_link ?? c.photoLink ?? "",
    folder_link: c.folder_link ?? c.folderLink ?? "",
    tags: normTags(c.tags),
    accesses,
    credentials,
    last_order_date: c.last_order_date ?? "—",
  };
};

const serializeClient = (payload = {}) => {
  const data = { ...payload };
  const companyId = normalizeNullableId(payload.company_id ?? payload.companyId);
  const managerId = normalizeNullableId(payload.manager_id ?? payload.managerId);
  const referrerId = normalizeNullableString(payload.referrer_id ?? payload.referrerId);
  const referrerFirstId = normalizeNullableString(payload.referrer_first_id ?? payload.referrerFirstId);
  const referrerName = normalizeNullableString(payload.referrer_name ?? payload.referrerName);
  const referrerFirstName = normalizeNullableString(payload.referrer_first_name ?? payload.referrerFirstName);
  const shareInfo = normalizeShareInfo(payload.share_info ?? payload.shareInfo);

  if (companyId !== undefined) data.company_id = companyId;
  if (managerId !== undefined) data.manager_id = managerId;
  if (referrerId !== undefined) data.referrer_id = referrerId;
  if (referrerFirstId !== undefined) data.referrer_first_id = referrerFirstId;
  if (referrerName !== undefined) data.referrer_name = referrerName;
  if (referrerFirstName !== undefined) data.referrer_first_name = referrerFirstName;
  data.share_info = shareInfo;

  delete data.companyId;
  delete data.managerId;
  delete data.referrerId;
  delete data.referrerFirstId;
  delete data.referrerName;
  delete data.referrerFirstName;
  delete data.shareInfo;
  return data;
};

export async function fetchClients(params = {}) {
  const r = await httpGet(BASE, params);
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeClient);
}

export async function createClient(payload) {
  const r = await httpPost(BASE, serializeClient(payload));
  return normalizeClient(unwrap(r));
}

export async function updateClient(id, payload) {
  const r = await httpPut(`${BASE}/${id}`, serializeClient(payload));
  return normalizeClient(unwrap(r));
}

export async function saveClient(payload) {
  return payload?.id ? updateClient(payload.id, payload) : createClient(payload);
}

export async function deleteClient(id) {
  const r = await httpDelete(`${BASE}/${id}`);
  return unwrap(r) ?? true;
}


export const ClientsAPI = {
  fetch: fetchClients,
  create: createClient,
  update: updateClient,
  save: saveClient,
  remove: deleteClient,
};

export default ClientsAPI;

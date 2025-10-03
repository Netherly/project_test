// src/api/employees.js
import { httpGet, httpPost, httpPut, httpDelete, fileUrl } from "./http";

// распаковка { ok, data } или «голого» ответа
const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const tidy = (v) => String(v ?? "").trim();
const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

function normalizeTags(tags) {
  if (!tags) return [];
  const raw = Array.isArray(tags) ? tags : [tags];
  const seen = new Set();
  const out = [];
  for (const t of raw) {
    const name = tidy(typeof t === "string" ? t : t?.name ?? t?.value);
    if (!name) continue;
    const color = isHex(t?.color) ? t.color : "#777777";
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ id: t?.id || rid(), name, color });
    }
  }
  return out;
}

export function normalizeEmployee(e) {
  const obj = e || {};
  return {
    id: obj.id,
    fullName: tidy(obj.fullName),
    login: tidy(obj.login),
    source: tidy(obj.source),
    birthDate: obj.birthDate || "", // ISO YYYY-MM-DD или ISO-строка
    phone: tidy(obj.phone),
    balance: obj.balance ?? "0",
    cashOnHand: obj.cashOnHand ?? "0",
    status: obj.status === "inactive" ? "inactive" : "active",
    avatarUrl: obj.avatarUrl ? fileUrl(obj.avatarUrl) : "",
    tags: normalizeTags(obj.tags),
    requisites: obj.requisites && typeof obj.requisites === "object" ? obj.requisites : {},
  };
}

// формы -> сервер: не трогаем url (сервер может хранить относительный путь)
export function serializeEmployee(e) {
  const tags = normalizeTags(e?.tags);
  return {
    id: e?.id,
    fullName: tidy(e?.fullName),
    login: tidy(e?.login),
    source: tidy(e?.source),
    birthDate: e?.birthDate || "",
    phone: tidy(e?.phone),
    balance: e?.balance ?? "0",
    cashOnHand: e?.cashOnHand ?? "0",
    status: e?.status === "inactive" ? "inactive" : "active",
    avatarUrl: tidy(e?.avatarUrl),
    tags,
    requisites: e?.requisites && typeof e.requisites === "object" ? e.requisites : {},
  };
}

export async function fetchEmployees() {
  const r = await httpGet("/employees");
  const data = unwrap(r);
  return Array.isArray(data) ? data.map(normalizeEmployee) : [];
}

export async function createEmployee(payload) {
  const r = await httpPost("/employees", serializeEmployee(payload));
  return normalizeEmployee(unwrap(r));
}

export async function updateEmployee(id, payload) {
  const r = await httpPut(`/employees/${id}`, serializeEmployee(payload));
  return normalizeEmployee(unwrap(r));
}

export async function deleteEmployee(id) {
  const r = await httpDelete(`/employees/${id}`);
  return unwrap(r) ?? true;
}

export default {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  normalizeEmployee,
  serializeEmployee,
};

// Frontend/src/api/employees.js
import { httpGet, httpPost, httpPut, httpDelete, fileUrl } from "./http";

/* -------------------------- utils -------------------------- */

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.status = resp?.status ?? 400;
    err.payload = resp;
    throw err;
  }
  return resp;
};

const rid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
const tidy = (v) => String(v ?? "").trim();
const isHex = (c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(c || ""));

const toNumberSafe = (v, fallback = 0) => {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/* ----------------------- normalizers ----------------------- */

function normalizeTags(raw) {
  if (!raw) return [];
  const input = Array.isArray(raw) ? raw : raw.tags || raw.EmployeeTag || [];

  const flat = input
    .map((t) => {
      if (typeof t === "string") {
        return { id: rid(), name: tidy(t), color: "#777777" };
      }

      const base = t?.tag || t;
      const name = tidy(base?.name ?? base?.value);
      if (!name) return null;

      const id = base?.id ?? t?.tagId ?? t?.id ?? rid();
      const color = isHex(base?.color) ? base.color : "#777777";

      return { id, name, color };
    })
    .filter(Boolean);

  const seen = new Set();
  const result = [];
  for (const t of flat) {
    const key = t.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
  }
  return result;
}

function normalizeRequisites(raw) {
  const recs =
    raw?.requisites ||
    raw?.EmployeeRequisite ||
    raw?.employeeRequisites ||
    [];

  if (!Array.isArray(recs)) return [];
  
  
  return recs.map((r) => ({
    id: r.id ?? rid(),
    label: tidy(r.label),
    value: tidy(r.value),
    bank: r.bank || "", 
    currency: r.currency || "UAH",
    card: r.card || "",
    owner: r.owner || ""
  }));
}

export function normalizeEmployee(e = {}) {
  const fullName =
    tidy(e.fullName) ||
    tidy(e.full_name) ||
    tidy([e.firstName, e.lastName].filter(Boolean).join(" "));

  const rawAvatar =
    e.avatarUrl || e.photoLink || e.photo_link || e.settings?.avatarUrl || "";

  return {
    id: e.id ?? null,
    fullName,
    full_name: fullName, 
    login: tidy(e.login),
    source: tidy(e.source),
    birthDate: e.birthDate || e.birth_date || "",
    phone: tidy(e.phone),
    email: tidy(e.email),
    
    
    passport: tidy(e.passport),
    address: tidy(e.address),
    chatLink: tidy(e.chatLink),
    rates: e.rates || {},
    mainCurrency: tidy(e.mainCurrency),
    
    
    telegramDateTime: e.telegramDateTime || "",
    telegramId: e.telegramId ? String(e.telegramId) : "",
    telegramName: tidy(e.telegramName),
    telegramNickname: tidy(e.telegramNickname),
    telegramBindingLink: tidy(e.telegramBindingLink),
    

    balance: toNumberSafe(e.balance, 0),
    cashOnHand: toNumberSafe(e.cashOnHand ?? e.cash_on_hand, 0),

    status:
      e.status === "inactive" || e.status === "pending"
        ? e.status
        : "active",

    avatarUrl: rawAvatar ? fileUrl(rawAvatar) : "",

    managerId: e.managerId ?? e.manager_id ?? null,
    companyId: e.companyId ?? null,
    countryId: e.countryId ?? null,
    currencyId: e.currencyId ?? null,
    roleId: e.roleId ?? null,

    tags: normalizeTags(e.tags || e.EmployeeTag || e.employeeTags || []),
    requisites: normalizeRequisites(e),

    settings: e.settings ?? null,
  };
}


export function serializeEmployee(e = {}) {
  const tags = normalizeTags(e.tags);

  const obj = {
    id: e.id,
    full_name: tidy(e.fullName ?? e.full_name),
    login: tidy(e.login),
    source: tidy(e.source),
    birthDate: e.birthDate || null, 
    phone: tidy(e.phone),
    email: tidy(e.email),
    
    
    passport: tidy(e.passport),
    address: tidy(e.address),
    chatLink: tidy(e.chatLink),
    rates: e.rates, 
    mainCurrency: tidy(e.mainCurrency),
    
   
    telegramDateTime: e.telegramDateTime || null,
    telegramId: e.telegramId || null,
    telegramName: tidy(e.telegramName),
    telegramNickname: tidy(e.telegramNickname),
    telegramBindingLink: tidy(e.telegramBindingLink),
    

    balance: toNumberSafe(e.balance, undefined),
    cashOnHand: toNumberSafe(e.cashOnHand, undefined),

    status:
      e.status === "inactive" || e.status === "pending"
        ? e.status
        : "active",

    photoLink: tidy(e.photoLink ?? e.avatarStorageKey ?? e.avatarUrl),

    managerId: e.managerId ?? undefined,
    companyId: e.companyId ?? undefined,
    countryId: e.countryId ?? undefined,
    currencyId: e.currencyId ?? undefined,
    roleId: e.roleId ?? undefined,

    tagIds: tags.map((t) => t.id).filter(Boolean),

    
    requisites: Array.isArray(e.requisites)
      ? e.requisites.map((r) => ({
          id: r.id,
          bank: tidy(r.bank),
          currency: tidy(r.currency),
          card: tidy(r.card),
          owner: tidy(r.owner),
          
          
          label: tidy(r.label) || `${tidy(r.bank)} ${tidy(r.currency)}`.trim(),
          value: tidy(r.value) || `${tidy(r.card)} ${tidy(r.owner)}`.trim(),
        }))
      : [],
  };

  
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

/* -------------------------- API ---------------------------- */

export async function fetchEmployees() {
  const r = await httpGet("/employees");
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : data?.employees ?? [];
  return list.map(normalizeEmployee);
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
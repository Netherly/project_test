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

/**
 * Универсальная нормализация тегов.
 * Поддерживает:
 * - [{ id, name, color }]
 * - [{ tag: { id, name, color }, tagId? }]
 * - ["Name", { name: "Name", color: "#..." }]
 * - e.EmployeeTag и т.п.
 */
function normalizeTags(raw) {
  if (!raw) return [];
  const input = Array.isArray(raw) ? raw : raw.tags || raw.EmployeeTag || [];

  const flat = input
    .map((t) => {
      // Возможные формы:
      // t = { id, name, color }
      // t = { tag: { id, name, color }, tagId? }
      // t = "Sales"
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

  // де-дуп по имени (кейс-инсенситив)
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

/**
 * Реквизиты: приводим EmployeeRequisite[] (или другой формат)
 * к простому массиву { id, label, value }.
 */
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
  }));
}

/**
 * Основная нормализация сотрудника. Приводит БД-формат к удобному для UI.
 */
export function normalizeEmployee(e = {}) {
  // имя — поддерживаем и fullName и full_name
  const fullName =
    tidy(e.fullName) ||
    tidy(e.full_name) ||
    tidy([e.firstName, e.lastName].filter(Boolean).join(" "));

  // аватар — поддерживаем несколько источников
  const rawAvatar =
    e.avatarUrl || e.photoLink || e.photo_link || e.settings?.avatarUrl || "";

  return {
    id: e.id ?? null,
    fullName,
    login: tidy(e.login),
    source: tidy(e.source),
    birthDate: e.birthDate || e.birth_date || "",
    phone: tidy(e.phone),
    email: tidy(e.email),

    balance: toNumberSafe(e.balance, 0),
    cashOnHand: toNumberSafe(e.cashOnHand ?? e.cash_on_hand, 0),

    status:
      e.status === "inactive" || e.status === "pending"
        ? e.status
        : "active",

    avatarUrl: rawAvatar ? fileUrl(rawAvatar) : "",

    // связь/внешние ключи (если нужны в формах/фильтрах)
    managerId: e.managerId ?? e.manager_id ?? null,
    companyId: e.companyId ?? null,
    countryId: e.countryId ?? null,
    currencyId: e.currencyId ?? null,
    roleId: e.roleId ?? null,

    // справочники/составные
    tags: normalizeTags(e.tags || e.EmployeeTag || e.employeeTags || []),
    requisites: normalizeRequisites(e),

    // оригинальные вложения — на всякий случай
    settings: e.settings ?? null,
  };
}

/**
 * Сериализация формы/модели обратно в формат бэка/БД.
 * Важно: кладём full_name / photoLink, а не только fullName / avatarUrl.
 */
export function serializeEmployee(e = {}) {
  const tags = normalizeTags(e.tags);

  const obj = {
    // Поля БД / API:
    id: e.id,
    full_name: tidy(e.fullName ?? e.full_name),
    login: tidy(e.login),
    source: tidy(e.source),
    birthDate: e.birthDate || "",
    phone: tidy(e.phone),
    email: tidy(e.email),

    balance: toNumberSafe(e.balance, undefined),
    cashOnHand: toNumberSafe(e.cashOnHand, undefined),

    status:
      e.status === "inactive" || e.status === "pending"
        ? e.status
        : "active",

    // Если на фронте хранится ссылка/ключ на файл — передадим как photoLink.
    // (Если avatarUrl — уже абсолютный URL, бэк может проигнорировать или принять как есть)
    photoLink: tidy(e.photoLink ?? e.avatarStorageKey ?? e.avatarUrl),

    // FK — если редактируются
    managerId: e.managerId ?? undefined,
    companyId: e.companyId ?? undefined,
    countryId: e.countryId ?? undefined,
    currencyId: e.currencyId ?? undefined,
    roleId: e.roleId ?? undefined,

    // Для тегов обычно нужны id-шники (бэк сам создаст стыковки):
    tagIds: tags.map((t) => t.id).filter(Boolean),

    // Реквизиты — плоский массив { id, label, value }:
    requisites: Array.isArray(e.requisites)
      ? e.requisites.map((r) => ({
          id: r.id,
          label: tidy(r.label),
          value: tidy(r.value),
        }))
      : [],
  };

  // Удалим ключи с undefined, чтобы не затирать
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

/* -------------------------- API ---------------------------- */

export async function fetchEmployees() {
  const r = await httpGet("/employees");
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : data?.employees ?? [];
  // Нормализуем каждый
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

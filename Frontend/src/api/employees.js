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
const toText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
};
const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );

const toOptional = (v) => {
  const text = toText(v);
  return text ? text : undefined;
};

const isCurrencyCode = (value) => /^[A-Z]{3,5}$/i.test(String(value || "").trim());
const normalizeCurrencyCode = (value) => toText(value).toUpperCase();

const normalizeDateOnly = (value) => {
  const text = toText(value);
  if (!text) return "";
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeRates = (raw) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  Object.entries(raw).forEach(([key, value]) => {
    const k = toText(key).toLowerCase();
    if (!k) return;
    if (value === "" || value === null || value === undefined) {
      out[k] = "";
      return;
    }
    const num = Number(value);
    out[k] = Number.isFinite(num) ? num : value ?? "";
  });
  return out;
};

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

/**
 * Реквизиты:
 * нормализуем любые форматы к:
 * - list: [{ id, currency, bank, card, owner }]
 * - map:  { [currency]: [{ bank, card, holder }] }
 */
function parseRequisiteLabel(label) {
  const text = toText(label);
  if (!text) return { currency: "", bank: "" };
  const parts = text.split(":");
  if (parts.length > 1) {
    const currency = normalizeCurrencyCode(parts.shift());
    const bank = parts.join(":").trim();
    return { currency, bank };
  }
  if (isCurrencyCode(text)) return { currency: normalizeCurrencyCode(text), bank: "" };
  return { currency: "", bank: text };
}

function parseRequisiteValue(value) {
  const text = toText(value);
  if (!text) return { bank: "", card: "", owner: "", currency: "", structured: false };

  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return {
          bank: toText(parsed.bank),
          card: toText(parsed.card ?? parsed.number ?? parsed.account),
          owner: toText(parsed.owner ?? parsed.holder ?? parsed.name),
          currency: toText(parsed.currency),
          structured: true,
        };
      }
    } catch (_) {}
  }

  if (text.includes("|")) {
    const [bank, card, owner] = text.split("|").map((p) => toText(p));
    return { bank, card, owner, currency: "", structured: true };
  }

  if (text.includes(";") && text.includes(":")) {
    const out = {};
    text
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        const idx = part.indexOf(":");
        if (idx === -1) return;
        const key = part.slice(0, idx).trim().toLowerCase();
        const val = part.slice(idx + 1).trim();
        if (key) out[key] = val;
      });

    if (Object.keys(out).length) {
      return {
        bank: toText(out.bank),
        card: toText(out.card ?? out.account ?? out.number),
        owner: toText(out.owner ?? out.holder),
        currency: toText(out.currency),
        structured: true,
      };
    }
  }

  return { bank: "", card: text, owner: "", currency: "", structured: false };
}

function normalizeRequisites(raw) {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.requisites)
    ? raw.requisites
    : Array.isArray(raw?.EmployeeRequisite)
    ? raw.EmployeeRequisite
    : Array.isArray(raw?.employeeRequisites)
    ? raw.employeeRequisites
    : raw;

  const list = [];
  const map = {};

  const pushItem = (item) => {
    const currency = normalizeCurrencyCode(item.currency);
    const bank = toText(item.bank);
    const card = toText(item.card);
    const owner = toText(item.owner ?? item.holder ?? item.name);
    if (!currency && !bank && !card && !owner) return;
    list.push({
      id: item.id ?? rid(),
      currency,
      bank,
      card,
      owner,
    });
  };

  if (Array.isArray(source)) {
    source.forEach((item) => {
      if (!item) return;
      if (typeof item === "object" && ("label" in item || "value" in item)) {
        const labelInfo = parseRequisiteLabel(item.label);
        const valueInfo = parseRequisiteValue(item.value);
        pushItem({
          id: item.id,
          currency: valueInfo.currency || labelInfo.currency,
          bank: valueInfo.bank || labelInfo.bank,
          card: valueInfo.card,
          owner: valueInfo.owner,
        });
        return;
      }
      if (typeof item === "object") pushItem(item);
    });
  } else if (source && typeof source === "object") {
    Object.entries(source).forEach(([currency, entries]) => {
      if (!Array.isArray(entries)) return;
      entries.forEach((entry) => {
        if (!entry) return;
        pushItem({
          id: entry.id,
          currency,
          bank: entry.bank ?? entry.label ?? "",
          card: entry.card ?? entry.number ?? entry.account ?? entry.value ?? "",
          owner: entry.owner ?? entry.holder ?? "",
        });
      });
    });
  }

  list.forEach((item) => {
    const currency = normalizeCurrencyCode(item.currency);
    if (!currency) return;
    if (!map[currency]) map[currency] = [];
    map[currency].push({
      bank: item.bank || "",
      card: item.card || "",
      holder: item.owner || "",
    });
  });

  return { list, map };
}

function serializeRequisites(list) {
  const items = Array.isArray(list) ? list : [];
  return items
    .map((item) => {
      const currency = normalizeCurrencyCode(item.currency);
      const bank = toText(item.bank);
      const card = toText(item.card);
      const owner = toText(item.owner ?? item.holder);
      if (!currency && !bank && !card && !owner) return null;

      const label = bank ? (currency ? `${currency}:${bank}` : bank) : currency || "CARD";

      const payload = {};
      if (currency) payload.currency = currency;
      if (bank) payload.bank = bank;
      if (card) payload.card = card;
      if (owner) payload.owner = owner;

      return {
        id: item.id,
        label,
        value: JSON.stringify(payload),
      };
    })
    .filter(Boolean);
}

export function normalizeEmployee(e = {}) {
  const fullName =
    tidy(e.fullName) ||
    tidy(e.full_name) ||
    tidy([e.firstName, e.lastName].filter(Boolean).join(" "));

  const rawAvatar =
    e.avatarUrl || e.photoLink || e.photo_link || e.settings?.avatarUrl || "";

  const { list: requisitesList, map: requisites } = normalizeRequisites(
    e.requisitesList ?? e.requisites ?? e.EmployeeRequisite ?? e.employeeRequisites ?? []
  );

  const normalizedRates = normalizeRates(e.rates ?? e.hourlyRates ?? {});
  const mainCurrency = normalizeCurrencyCode(e.mainCurrency ?? e.main_currency ?? "");
  const countryId = e.countryId ?? e.country?.id ?? null;
  const countryValue = (countryId ?? toText(e.country?.name ?? e.country ?? "")) || "";

  const telegram = {
    dateTime: toText(
      e.telegram?.dateTime ??
        e.telegramDateTime ??
        e.telegram_date_time ??
        e.telegramLinkedAt ??
        e.telegram_linked_at
    ),
    id: toText(e.telegram?.id ?? e.telegramId ?? e.telegram_id ?? e.telegramChatId ?? e.telegram_chat_id),
    name: toText(e.telegram?.name ?? e.telegramName ?? e.telegram_name),
    nickname: toText(
      e.telegram?.nickname ??
        e.telegramNickname ??
        e.telegram_username ??
        e.telegramUsername ??
        e.telegramNick
    ),
    bindingLink: toText(e.telegram?.bindingLink ?? e.telegramBindingLink ?? e.telegram_binding_link),
  };

  return {
    id: e.id ?? null,
    fullName,
    full_name: fullName,
    login: tidy(e.login),
    password: "",
    source: tidy(e.source),
    birthDate: normalizeDateOnly(e.birthDate ?? e.birth_date ?? ""),
    phone: tidy(e.phone),
    email: tidy(e.email),
    passport: tidy(e.passport),
    address: tidy(e.address),
    chatLink: tidy(e.chatLink ?? e.chat_link),
    balance: toNumberSafe(e.balance, 0),
    cashOnHand: toNumberSafe(e.cashOnHand ?? e.cash_on_hand, 0),
    status: e.status === "inactive" || e.status === "pending" ? e.status : "active",
    avatarUrl: rawAvatar ? fileUrl(rawAvatar) : "",
    photoLink: toText(e.photoLink ?? e.photo_link ?? rawAvatar),
    mainCurrency: mainCurrency ? mainCurrency.toLowerCase() : "",
    rates: normalizedRates,
    hourlyRates: normalizedRates,
    startDate: e.startDate ?? e.createdAt ?? e.created_at ?? "",
    telegram,
    telegramDateTime: telegram.dateTime,
    telegramId: telegram.id,
    telegramName: telegram.name,
    telegramNickname: telegram.nickname,
    telegramBindingLink: telegram.bindingLink,
    telegramNick:
      telegram.nickname || tidy(e.telegramNickname ?? e.telegramUsername ?? e.telegramNick),
    managerId: e.managerId ?? e.manager_id ?? null,
    companyId: e.companyId ?? null,
    countryId,
    country: countryValue,
    countryName: toText(e.country?.name),
    currencyId: e.currencyId ?? null,
    roleId: e.roleId ?? null,
    publicId: e.publicId ?? null,
    userid: e.userid ?? null,
    tags: normalizeTags(e.tags || e.EmployeeTag || e.employeeTags || []),
    requisites,
    requisitesList,
    settings: e.settings ?? null,
  };
}

export function serializeEmployee(e = {}) {
  const tags = normalizeTags(e.tags);
  const { list: requisitesList } = normalizeRequisites(e.requisitesList ?? e.requisites ?? []);
  const normalizedRates = normalizeRates(e.rates ?? e.hourlyRates ?? {});
  const mainCurrency = normalizeCurrencyCode(e.mainCurrency ?? e.main_currency ?? "");
  const telegram = e.telegram || {};
  const password = toText(e.password);
  const countryCandidate = toText(e.countryId ?? e.country);
  const countryId = countryCandidate && isUuid(countryCandidate) ? countryCandidate : undefined;
  const countryName =
    !countryId && countryCandidate ? countryCandidate : toText(e.country);

  /**
   * ✅ FIX MERGE CONFLICT (обе версии логики)
   * Поддерживаем два формата ввода реквизитов:
   * 1) Уже "готовые" элементы для API: [{id,label,value}]  -> отправляем как есть
   * 2) UI-список: [{id,currency,bank,card,owner}] -> сериализуем через serializeRequisites
   */
  const serializeRequisitesCompat = (input) => {
    const arr = Array.isArray(input) ? input : [];
    if (!arr.length) return [];
    const first = arr[0];
    const looksLikeApiShape =
      first &&
      typeof first === "object" &&
      ("label" in first || "value" in first) &&
      !("currency" in first || "bank" in first || "card" in first || "owner" in first);

    if (looksLikeApiShape) return arr;
    return serializeRequisites(arr);
  };

  const obj = {
    id: e.id,
    full_name: tidy(e.fullName ?? e.full_name),
    login: tidy(e.login),
    source: tidy(e.source),
    birthDate: normalizeDateOnly(e.birthDate ?? ""),
    phone: tidy(e.phone),
    email: tidy(e.email),
    passport: tidy(e.passport),
    address: tidy(e.address),
    chatLink: tidy(e.chatLink),
    balance: toNumberSafe(e.balance, undefined),
    cashOnHand: toNumberSafe(e.cashOnHand, undefined),
    status: e.status === "inactive" || e.status === "pending" ? e.status : "active",
    photoLink: tidy(e.photoLink ?? e.avatarStorageKey ?? e.avatarUrl),
    managerId: toOptional(e.managerId),
    companyId: toOptional(e.companyId),
    countryId,
    country: countryName,
    currencyId: toOptional(e.currencyId),
    roleId: toOptional(e.roleId),
    publicId: toOptional(e.publicId),
    userid: toOptional(e.userid),
    mainCurrency: mainCurrency ? mainCurrency.toLowerCase() : undefined,
    rates: Object.keys(normalizedRates).length ? normalizedRates : undefined,
    telegram:
      toText(telegram.dateTime ?? e.telegramDateTime) ||
      toText(telegram.id ?? e.telegramId) ||
      toText(telegram.name ?? e.telegramName) ||
      toText(telegram.nickname ?? e.telegramNickname ?? e.telegramNick) ||
      toText(telegram.bindingLink ?? e.telegramBindingLink)
        ? {
            dateTime: toText(telegram.dateTime ?? e.telegramDateTime),
            id: toText(telegram.id ?? e.telegramId),
            name: toText(telegram.name ?? e.telegramName),
            nickname: toText(telegram.nickname ?? e.telegramNickname ?? e.telegramNick),
            bindingLink: toText(telegram.bindingLink ?? e.telegramBindingLink),
          }
        : undefined,
    tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),

    // ✅ итог: совместимо с обеими версиями
    requisites: serializeRequisitesCompat(requisitesList),
  };

  if (password) obj.password = password;

  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/* -------------------------- API ---------------------------- */

export async function fetchEmployees() {
  const r = await httpGet("/employees");
  const data = unwrap(r);
  const list = Array.isArray(data) ? data : data?.employees ?? [];
  return list.map(normalizeEmployee);
}

export async function fetchEmployeeById(id) {
  const r = await httpGet(`/employees/${id}`);
  return normalizeEmployee(unwrap(r));
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
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  normalizeEmployee,
  serializeEmployee,
};

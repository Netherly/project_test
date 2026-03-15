// src/api/profile.js
import { httpGet, httpPost, httpPut, fileUrl, apiBase } from "./http";

const unwrap = (resp) => {
  if (resp && typeof resp === "object" && "ok" in resp) {
    if (resp.ok) return resp.data;
    const err = new Error(resp?.error || "Request failed");
    err.payload = resp;
    throw err;
  }
  return resp;
};

export async function fetchProfile() {
  const r = await httpGet("/profile");
  return withDefaults(unwrap(r));
}

const normalizeOptionalText = (value) => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || null;
};

const normalizeCurrencyCode = (value) => {
  const text = value === null || value === undefined ? "" : String(value).trim().toUpperCase();
  return text || null;
};

const sanitizeRequisites = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      currency: normalizeCurrencyCode(item?.currency) || "",
      bank: normalizeOptionalText(item?.bank) || "",
      account: normalizeOptionalText(item?.account) || "",
    }))
    .filter((item) => item.currency || item.bank || item.account);
};

function normalizeProfilePayload(payload = {}) {
  const next = { ...payload };
  if ("nickname" in next) next.nickname = normalizeOptionalText(next.nickname) || "";
  if ("fullName" in next) next.fullName = normalizeOptionalText(next.fullName) || "";
  if ("email" in next) next.email = normalizeOptionalText(next.email);
  if ("photoLink" in next) next.photoLink = normalizeOptionalText(next.photoLink);
  if ("currency" in next) next.currency = normalizeCurrencyCode(next.currency);
  if ("crmLanguage" in next) next.crmLanguage = normalizeOptionalText(next.crmLanguage) || "ru";
  if ("crmTheme" in next) next.crmTheme = next.crmTheme === "light" ? "light" : "dark";
  if ("crmBackground" in next) next.crmBackground = normalizeOptionalText(next.crmBackground);
  if ("requisites" in next) next.requisites = sanitizeRequisites(next.requisites);
  if ("notifySound" in next) next.notifySound = !!next.notifySound;
  if ("notifyCounter" in next) next.notifyCounter = !!next.notifyCounter;
  if ("notifyTelegram" in next) next.notifyTelegram = !!next.notifyTelegram;
  if (Array.isArray(next.botReminders)) next.botReminders = next.botReminders.map(Boolean);
  return next;
}

export async function saveProfile(payload) {
  const r = await httpPut("/profile", normalizeProfilePayload(payload));
  return withDefaults(unwrap(r));
}

export async function uploadProfileBackground(fileOrFormData) {
  const url = `${apiBase()}/profile/background`;
  const formData =
    fileOrFormData instanceof FormData ? fileOrFormData : new FormData();
  if (!(fileOrFormData instanceof FormData)) formData.append("file", fileOrFormData);

  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const data = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.error || "Upload failed";
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${msg}`);
  }
  const out = unwrap(data);
  return out && typeof out === "object" ? out : { url: out };
}

export function withDefaults(p) {
  const x = p && typeof p === "object" ? p : {};
  const safeArr = (v, n = 0, fill = null) =>
    Array.isArray(v) ? v : Array(n).fill(fill);
  return {
    nickname: x.nickname || "",
    password: x.password || "",               // оставляем как у тебя
    email: x.email || "",
    userId: x.userId || "",
    fullName: x.fullName || "",
    // +++ тг-поля тоже прилетят в профиль
    telegramUsername: x.telegramUsername || null,
    photoLink: x.photoLink || null,

    requisites: Array.isArray(x.requisites) && x.requisites.length
      ? x.requisites.map((r) => ({
          currency: r?.currency || "",
          bank: r?.bank || "",
          account: r?.account || "",
        }))
      : [{ currency: "", bank: "", account: "" }],
    currency: x.currency || "UAH",
    workSchedule: Array.isArray(x.workSchedule) && x.workSchedule.length === 7
      ? x.workSchedule.map((d) => [
          (d && d[0]) || "09:00",
          (d && d[1]) || "18:00",
        ])
      : Array(7).fill(["09:00", "18:00"]),
    botReminders: safeArr(x.botReminders, 7, false),
    crmLanguage: x.crmLanguage || "ru",
    crmTheme: x.crmTheme || "dark",
    crmBackground: x.crmBackground || null,
    crmBackgroundView: x.crmBackground ? fileUrl(x.crmBackground) : null,
    notifySound: x.notifySound !== undefined ? !!x.notifySound : true,
    notifyCounter: x.notifyCounter !== undefined ? !!x.notifyCounter : true,
    notifyTelegram: x.notifyTelegram !== undefined ? !!x.notifyTelegram : true,
  };
}

export const ProfileAPI = {
  async get() {
    return fetchProfile();
  },
  async save(next) {
    return saveProfile(next);
  },
  async setTheme(theme) {
    const cur = await fetchProfile();
    return saveProfile({ ...cur, crmTheme: theme === "dark" ? "dark" : "light" });
  },
  async setLanguage(lang) {
    const cur = await fetchProfile();
    return saveProfile({ ...cur, crmLanguage: lang || "ru" });
  },
  async setBackgroundUrl(url) {
    const cur = await fetchProfile();
    return saveProfile({ ...cur, crmBackground: url || null });
  },
  async setWorkSchedule(schedule) {
    const cur = await fetchProfile();
    return saveProfile({ ...cur, workSchedule: Array.isArray(schedule) ? schedule : cur.workSchedule });
  },
  async setBotReminders(list) {
    const cur = await fetchProfile();
    return saveProfile({ ...cur, botReminders: Array.isArray(list) ? list : cur.botReminders });
  },
};

export async function changePassword({ currentPassword, newPassword }) {
  const r = await httpPut("/profile/password", { currentPassword, newPassword });
  return unwrap(r);
}

export async function unlinkTelegram() {
  const r = await httpPost("/profile/telegram/unlink", {});
  return unwrap(r);
}

/**
 * Утилита: построить deep-link к боту из botName и code
 * Возвращает оба варианта: tg:// и https://
 */
export function buildTelegramDeepLinks({ botName, code, httpsLink }) {
  const domain = botName?.replace(/^@/, '') || (typeof window !== 'undefined' && window.__PUBLIC_BOT_NAME) || 'gsse_assistant_bot';
  const startCode = code || '';
  const https = httpsLink || `https://t.me/${domain}?start=${encodeURIComponent(startCode)}`;
  const tg = `tg://resolve?domain=${encodeURIComponent(domain)}&start=${encodeURIComponent(startCode)}`;
  return { tg, https };
}

/**
 * Попробовать открыть Telegram-клиент; если не получилось — открыть https
 * и на всякий случай скопировать code в буфер обмена.
 */
export async function openTelegramDeepLink({ tg, https, code }) {
  try {
    // Сначала пробуем нативный протокол (мобильные/десктоп клиенты)
    window.location.href = tg;
    // небольшой fallback через таймаут
    setTimeout(() => {
      try { window.open(https, "_blank", "noopener,noreferrer"); } catch {}
    }, 600);
    if (code && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(code); } catch {}
    }
  } catch {
    try { window.open(https, "_blank", "noopener,noreferrer"); } catch {}
    if (code && navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(code); } catch {}
    }
  }
}

/**
 * Запрос на создание link-токена.
 * Бэкенд возвращает { link, code, ttlMinutes }.
 * Мы дополняем ответ вычисленными tg/https ссылками.
 */
export async function createTelegramLink() {
  const r = await httpPost("/telegram/link/create", {});
  const data = unwrap(r); // { link, code, ttlMinutes }
  const { tg, https } = buildTelegramDeepLinks({
    httpsLink: data?.link,
    botName: undefined, // можно прокинуть, если хочешь переопределить
    code: data?.code,
  });
  return { ...data, tgLink: tg, httpsLink: https };
}

export default {
  fetchProfile,
  saveProfile,
  uploadProfileBackground,
  withDefaults,
  ProfileAPI,
  unlinkTelegram,
};

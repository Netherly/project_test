// src/api/profile.js
import { httpGet, httpPut, fileUrl, apiBase } from "./http";

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

export async function saveProfile(payload) {
  const r = await httpPut("/profile", payload);
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
    crmLanguage: x.crmLanguage || "ua",
    crmTheme: x.crmTheme || "light",
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
    return saveProfile({ ...cur, crmLanguage: lang || "ua" });
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
  const r = await httpGet("/telegram/link/create");
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
};

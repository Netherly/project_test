// src/api/http.js

// Универсально определяем базовый URL для API
let _API_BASE = (() => {
  // Vite: VITE_API_URL
  const vite =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL;

  // CRA/Node: REACT_APP_API_URL (мягко, без падения, если process отсутствует)
  const cra =
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL;

  // Глобалка (можно переопределить в index.html): window.__API_BASE__ = 'http://.../api'
  const win =
    typeof window !== "undefined" && window.__API_BASE__ ? window.__API_BASE__ : null;

  // дефолт — обращаемся к /api на том же хосте (с прокси в Vite или nginx)
  return vite || cra || win || "/api";
})();

// На всякий случай уберём лишний слэш в конце
function normalizeBase(u) {
  if (!u) return "";
  return u.endsWith("/") ? u.slice(0, -1) : u;
}
_API_BASE = normalizeBase(_API_BASE);

// Позволяет динамически переопределять базу (например, после логина/конфига)
export function setApiBase(base) {
  _API_BASE = normalizeBase(base);
}

// Если вы используете cookie (сессии) — выставьте true
const USE_CREDENTIALS = true;

function getAuthHeader() {
  // Если токен храните в localStorage
  try {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** Возвращает origin сервера (например, http://localhost:3000) на основе _API_BASE.
 * Если _API_BASE абсолютный -> берём его origin.
 * Если _API_BASE относительный ('/api') -> берём window.location.origin.
 */
function serverOriginFromApiBase() {
  try {
    if (/^https?:\/\//i.test(_API_BASE)) {
      const u = new URL(_API_BASE);
      return `${u.protocol}//${u.host}`; // например, http://localhost:3000
    }
  } catch (_) {}
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Склейка конечного URL для API-методов */
function buildUrl(path, params) {
  const base = _API_BASE; // уже нормализован
  const joined = base + (path.startsWith("/") ? path : `/${path}`);

  // Если base абсолютный — new URL(joined) валиден.
  // Если base относительный — используем window.location.origin как второй аргумент.
  const url = new URL(joined, typeof window !== "undefined" ? window.location.origin : "http://localhost");

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function handle(res) {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function httpGet(path, params = {}, extraHeaders = {}) {
  const res = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
      ...extraHeaders,
    },
    credentials: USE_CREDENTIALS ? "include" : "same-origin",
  });
  return handle(res);
}

export async function httpPost(path, body, extraHeaders = {}) {
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
      ...extraHeaders,
    },
    credentials: USE_CREDENTIALS ? "include" : "same-origin",
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

export async function httpPut(path, body, extraHeaders = {}) {
  const res = await fetch(buildUrl(path), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
      ...extraHeaders,
    },
    credentials: USE_CREDENTIALS ? "include" : "same-origin",
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

export async function httpPatch(path, body, extraHeaders = {}) {
  const res = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
      ...extraHeaders,
    },
    credentials: USE_CREDENTIALS ? "include" : "same-origin",
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

// DELETE иногда нужен с body (пакетные операции) — поддержим оба варианта
export async function httpDelete(path, body = undefined, extraHeaders = {}) {
  const res = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
      ...getAuthHeader(),
      ...extraHeaders,
    },
    credentials: USE_CREDENTIALS ? "include" : "same-origin",
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

/** Абсолютный URL для публичных файлов/изображений.
 *  - data: и абсолютные http(s) — возвращаем как есть
 *  - относительные пути (в т.ч. '/uploads/...') — префиксуем origin сервера (из _API_BASE)
 */
export function fileUrl(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (s.startsWith("data:")) return s;          // data-URL оставляем как есть
  if (/^https?:\/\//i.test(s)) return s;        // абсолютный URL оставляем как есть
  const origin = serverOriginFromApiBase();     // http://localhost:3000 из VITE_API_URL
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${origin}${path}`;
}

// На всякий случай экспортируем базу и origin
export function apiBase() {
  return _API_BASE;
}
export function apiOrigin() {
  return serverOriginFromApiBase();
}

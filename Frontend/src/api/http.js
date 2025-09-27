// src/api/http.js

/** -------- БАЗА АДРЕСА API (универсально) -------- */
let _API_BASE = (() => {
  // Vite
  const vite =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL;

  // CRA / Node
  const cra =
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL;

  // Глобалка из window (можно прописать в index.html)
  const win =
    typeof window !== "undefined" && window.__API_BASE__ ? window.__API_BASE__ : null;

  // Дефолт — относительный префикс /api
  return vite || cra || win || "/api";
})();

function normalizeBase(u) {
  if (!u) return "";
  // уберём завершающий слэш, но оставим протокол+хост как есть
  return u.endsWith("/") ? u.slice(0, -1) : u;
}
_API_BASE = normalizeBase(_API_BASE);

/** Позволяет динамически поменять базу API */
export function setApiBase(base) {
  _API_BASE = normalizeBase(base);
}

/** -------- АВТОРИЗАЦИЯ / КРЕДЕНШЛЫ -------- */
let _USE_CREDENTIALS = true; // если cookie-сессии, оставь true
let _AUTH_TOKEN = null;      // если авторизация по Bearer-токену

export function setUseCredentials(v) {
  _USE_CREDENTIALS = Boolean(v);
}
export function setAuthToken(token) {
  _AUTH_TOKEN = token || null;
  try {
    if (typeof localStorage !== "undefined") {
      if (token) localStorage.setItem("token", token);
      else localStorage.removeItem("token");
    }
  } catch (_) {}
}

function getAuthHeader() {
  // приоритет — явный setAuthToken; запасной — localStorage
  let token = _AUTH_TOKEN;
  if (!token) {
    try {
      token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null;
    } catch (_) {}
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** -------- ВСПОМОГАТЕЛЬНОЕ -------- */

/** Возвращает origin сервера для fileUrl */
function serverOriginFromApiBase() {
  try {
    if (/^https?:\/\//i.test(_API_BASE)) {
      const u = new URL(_API_BASE);
      return `${u.protocol}//${u.host}`;
    }
  } catch (_) {}
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Склейка конечного URL для API-методов */
function buildUrl(path, params) {
  const base = _API_BASE; // нормализован
  const joined = base + (String(path).startsWith("/") ? path : `/${path}`);
  const url = new URL(
    joined,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

/** Универсальная обёртка fetch с таймаутом */
async function doFetch(url, options = {}, { timeoutMs } = {}) {
  let controller;
  let timer;
  if (timeoutMs && typeof AbortController !== "undefined") {
    controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeoutMs);
    options.signal = controller.signal;
  }

  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    // Приведём к понятной ошибке сети
    if (err && err.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs} ms`);
    }
    throw new Error(`Network error: ${err && err.message ? err.message : err}`);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Единый обработчик ответа */
async function handle(res) {
  const status = res.status;
  if (!res.ok) {
    // попытаемся прочитать тело, чтобы показать причину
    let body = "";
    try {
      body = await res.text();
    } catch (_) {}
    const snippet = body ? `: ${body.slice(0, 1000)}` : "";
    throw new Error(`HTTP ${status} ${res.statusText}${snippet}`);
  }

  // 204/205 — пусто
  if (status === 204 || status === 205) return null;

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      // бывает пустой body при неправильных заголовках — вернём текст
      const txt = await res.text().catch(() => "");
      return txt || null;
    }
  }
  // по умолчанию — текст
  return res.text();
}

/** Общая функция запроса */
async function request(method, path, { params, body, headers, timeoutMs } = {}) {
  const url = buildUrl(path, params);
  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...getAuthHeader(),
      ...(body != null && method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    credentials: _USE_CREDENTIALS ? "include" : "same-origin",
    body: body != null && method !== "GET" ? JSON.stringify(body) : undefined,
  };

  const res = await doFetch(url, init, { timeoutMs });
  return handle(res);
}

/** -------- ПУБЛИЧНЫЕ API-ФУНКЦИИ -------- */

export function httpGet(path, params = {}, extraHeaders = {}, opts = {}) {
  return request("GET", path, { params, headers: extraHeaders, timeoutMs: opts.timeoutMs });
}
export function httpPost(path, body, extraHeaders = {}, opts = {}) {
  return request("POST", path, { body, headers: extraHeaders, timeoutMs: opts.timeoutMs });
}
export function httpPut(path, body, extraHeaders = {}, opts = {}) {
  return request("PUT", path, { body, headers: extraHeaders, timeoutMs: opts.timeoutMs });
}
export function httpPatch(path, body, extraHeaders = {}, opts = {}) {
  return request("PATCH", path, { body, headers: extraHeaders, timeoutMs: opts.timeoutMs });
}

/** DELETE: поддерживаем и без body, и с body (batch) */
export function httpDelete(path, body = undefined, extraHeaders = {}, opts = {}) {
  return request("DELETE", path, { body, headers: extraHeaders, timeoutMs: opts.timeoutMs });
}

/** Абсолютный URL для публичных файлов/изображений */
export function fileUrl(p) {
  if (!p) return "";
  const s = String(p).trim();
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  const origin = serverOriginFromApiBase();
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${origin}${path}`;
}

/** На всякий случай экспортируем базу и origin */
export function apiBase() {
  return _API_BASE;
}
export function apiOrigin() {
  return serverOriginFromApiBase();
}

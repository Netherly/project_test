// src/api.js
// --- безопасно вычисляем базовый URL ---
function normalizeBase(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  const bad = !s || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null';
  // dev -> localhost, prod -> относительный /api (тот же домен через nginx)
  const base = bad ? (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api') : s;
  return base.replace(/\/+$/, ''); // убрать хвостовой /
}

export const API_BASE = normalizeBase(import.meta.env?.VITE_API_URL);

// удобный билдер путей: не допустит `//` и `/undefined/...`
function url(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

// (опционально) подсказка в консоли при разработке
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info('API_BASE =', API_BASE);
}

// ===== auth helpers =====
function getToken() {
  return localStorage.getItem('token') || '';
}
function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
  }
}
function clearAuth() {
  localStorage.removeItem('token');
}
function authHeaders(extra = {}) {
  const t = getToken();
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

function activityPath(entityType, entityId) {
  const id = String(entityId || '').trim();
  if (!id) throw new Error('entityId is required');
  if (entityType === 'client') return `/clients/${id}/logs`;
  if (entityType === 'employee') return `/employees/${id}/logs`;
  throw new Error(`Unsupported entityType: ${entityType}`);
}

export const api = {
  // === AUTH ===
  async login({ login, password }) {
    const res = await fetch(url('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.message || data?.error || 'Ошибка авторизации');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    if (data?.token) setToken(data.token);
    return data;
  },

  async register({ login, password, full_name, birthDate, phone, email }) {
    const res = await fetch(url('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, full_name, birthDate, phone, email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.message || data?.error || 'Ошибка регистрации');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data;
  },

  async logout() {
    try {
      await fetch(url('/auth/logout'), { method: 'POST', credentials: 'include' });
    } finally {
      clearAuth();
    }
  },

  async me() {
    const res = await fetch(url('/auth/me'), {
      headers: authHeaders(),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Ошибка получения профиля');
    return data;
  },

  async refresh() {
    const res = await fetch(url('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Ошибка обновления токена');
    if (data?.token) setToken(data.token);
    return data;
  },

  // === TELEGRAM LINK ===
  async createTelegramLink() {
    const res = await fetch(url('/telegram/link/create'), {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Не удалось создать ссылку для Telegram');
    return data;
  },

  async consumeTelegramLink(token) {
    const res = await fetch(url('/telegram/link/consume'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || data?.error || 'Не удалось подтвердить Telegram-привязку');
    return data;
  },

  // === ACTIVITY LOGS (clients/employees) ===
  async getActivityLogs({ entityType, entityId, limit, order }) {
    const qs = new URLSearchParams();
    if (limit) qs.set('limit', String(limit));
    if (order) qs.set('order', String(order));
    const res = await fetch(url(`${activityPath(entityType, entityId)}${qs.toString() ? `?${qs}` : ''}`), {
      headers: authHeaders(),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.message || data?.error || 'Ошибка загрузки логов');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data?.data ?? [];
  },

  async addActivityNote({ entityType, entityId, message }) {
    const res = await fetch(url(activityPath(entityType, entityId)), {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify({ message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.message || data?.error || 'Ошибка добавления заметки');
      err.status = res.status;
      err.payload = data;
      throw err;
    }
    return data?.data ?? null;
  },
};

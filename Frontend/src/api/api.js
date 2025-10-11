// src/api.js
const API_BASE = import.meta?.env?.VITE_API_URL ?? 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('isAuthenticated', 'true');
  }
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
}

function authHeaders(extra = {}) {
  const t = getToken();
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

export const api = {
  // === AUTH ===
  async login({ login, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Ошибка авторизации');
    }
    if (data?.token) setToken(data.token);
    return data;
  },

  async register({ login, password, full_name, phone, email }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password, full_name, phone, email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Ошибка регистрации');
    }
    return data;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearAuth();
    }
  },

  async me() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders(),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Ошибка получения профиля');
    }
    return data;
  },

  async refresh() {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Ошибка обновления токена');
    }
    if (data?.token) setToken(data.token);
    return data;
  },

  // === TELEGRAM LINK ===
  // backend: /api/telegram/link/create  (POST)
  async createTelegramLink() {
    const res = await fetch(`${API_BASE}/telegram/link/create`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Не удалось создать ссылку для Telegram');
    }
    return data;
  },

  // backend: /api/telegram/link/consume  (POST)
  async consumeTelegramLink(token) {
    const res = await fetch(`${API_BASE}/telegram/link/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Не удалось подтвердить Telegram-привязку');
    }
    return data;
  },
};

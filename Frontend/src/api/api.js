const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  async login({ login, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || 'Ошибка авторизации';
      throw new Error(msg);
    }
    return data; // { token, user, ... }
  },

  async register({ login, password }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || 'Ошибка регистрации';
      throw new Error(msg);
    }
    return data; // { id, login, ... }
  },

  // --- новые методы ---

  async logout() {
    // если на бэке есть endpoint для логаута
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
    }
  },

  async me() {
    // получить текущего пользователя по токену
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Ошибка получения профиля');
    }
    return data; // { id, login, email, ... }
  },

  async refresh() {
    // обновление access токена через refresh
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Ошибка обновления токена');
    }
    if (data?.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
};

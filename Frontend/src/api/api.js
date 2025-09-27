const API_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  async login({ login, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });

    // читаем тело даже при 4xx, чтобы показать ошибку от бэка
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || 'Ошибка авторизации';
      throw new Error(msg);
    }
    return data; // ожидаем { token, employee, ... } или аналогично
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
    return data; // например { id, login, ... }
  },
};

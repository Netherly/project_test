const authService = require('../services/auth.service');

const isSecureRequest = (req) =>
  Boolean(
    req?.secure ||
      String(req?.headers?.['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim()
        .toLowerCase() === 'https'
  );

const refreshCookieOptions = (req) => {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/api',
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };
};

const accessCookieOptions = (req) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isSecureRequest(req),
  path: '/api',
});

const clearCookieOptions = (req) => ({
  sameSite: 'lax',
  secure: isSecureRequest(req),
  path: '/api',
});

const applyAuthCookies = (req, res, data) => {
  if (data?.token) {
    res.cookie('token', data.token, accessCookieOptions(req));
  }
  if (data?.refreshToken) {
    res.cookie('refreshToken', data.refreshToken, refreshCookieOptions(req));
  }
};

const clearAuthCookies = (req, res) => {
  res.clearCookie('token', clearCookieOptions(req));
  res.clearCookie('refreshToken', clearCookieOptions(req));
};

const register = async (req, res, next) => {
  try {
    const { full_name, birthDate, phone, email, login: loginName, password } = req.body;
    if (!loginName || !password) {
      return res.status(400).json({ error: 'login и password обязательны' });
    }

    const { employee, telegramLink } = await authService.register({
      full_name,
      birthDate,
      phone,
      email,
      login: loginName,
      password,
    });

    res.status(201).json({ id: employee.id, telegramLink });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { login: loginName, email, password } = req.body;
    if ((!loginName && !email) || !password) {
      return res
        .status(400)
        .json({ error: 'Нужен login или email и обязательный password' });
    }

    // передаємо обидва варіанти до сервісу
    const data = await authService.login(loginName || email, password);
    applyAuthCookies(req, res, data);
    res.json({ token: data.token });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token provided' });

    const data = await authService.refreshTokens(token);
    applyAuthCookies(req, res, data);
    res.json({ token: data.token });
  } catch (err) {
    clearAuthCookies(req, res);
    next(err);
  }
};

const logout = async (req, res) => {
  clearAuthCookies(req, res);
  res.json({ ok: true });
};

module.exports = { register, login, refresh, logout };

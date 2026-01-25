const authService = require('../services/auth.service');

const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/api',
    maxAge: 3 * 24 * 60 * 60 * 1000,
  };
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
    if (data?.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, cookieOptions());
    }
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
    if (data?.refreshToken) {
      res.cookie('refreshToken', data.refreshToken, cookieOptions());
    }
    res.json({ token: data.token });
  } catch (err) {
    res.clearCookie('refreshToken', { path: '/api' });
    next(err);
  }
};

const logout = async (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api' });
  res.json({ ok: true });
};

module.exports = { register, login, refresh, logout };

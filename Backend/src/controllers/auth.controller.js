const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const {
      full_name,
      birthDate,
      phone,
      email,
      login: loginName,
      password,
      tgCode,
    } = req.body;

    if (!loginName || !password) {
      return res.status(400).json({ error: 'login и password обязательны' });
    }

    const employee = await authService.register({
      full_name,
      birthDate,
      phone,
      email,
      login: loginName,
      password,
      tgCode, // может быть undefined
    });

    return res.status(201).json({ id: employee.id });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { login: loginName, password } = req.body;
    if (!loginName || !password) {
      return res.status(400).json({ error: 'login и password обязательны' });
    }
    const data = await authService.login(loginName, password);
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };

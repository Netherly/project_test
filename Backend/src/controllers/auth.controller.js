const authService = require('../services/auth.service');

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
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };

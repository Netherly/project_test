const authService = require('../services/auth.service');

const register = async (req, res, next) => {
    try {
        const { login, password } = req.body;
        const employee = await authService.register(login, password);
        res.json(employee);
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { login, password } = req.body;
        const data = await authService.login(login, password);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login };

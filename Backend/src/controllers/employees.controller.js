const EmployeesService = require('../services/employees.service');

const serializeEmployee = (e) => {
  if (!e) return e;
  const { password: _password, ...rest } = e;
  return {
    ...rest,
    telegramUserId: rest.telegramUserId?.toString(),
    telegramChatId: rest.telegramChatId?.toString(),
    telegramId: rest.telegramId?.toString(),
  };
};

const EmployeesController = {
  async list(req, res) {
    try {
      const params = req.query;
      const result = await EmployeesService.list(params);
      res.json({ ok: true, data: { ...result, employees: result.employees.map(serializeEmployee) } });
    } catch (err) {
      console.error('Employees list error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async byId(req, res) {
    try {
      const { id } = req.params;
      const employee = await EmployeesService.byId(id);
      res.json({ ok: true, data: serializeEmployee(employee) });
    } catch (err) {
      console.error('Employee byId error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async create(req, res) {
    try {
      const payload = req.body;
      const employee = await EmployeesService.create(payload);
      res.status(201).json({ ok: true, data: serializeEmployee(employee) });
    } catch (err) {
      console.error('Employee create error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const employee = await EmployeesService.update(id, payload);
      res.json({ ok: true, data: serializeEmployee(employee) });
    } catch (err) {
      console.error('Employee update error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await EmployeesService.delete(id);
      res.json({ ok: true });
    } catch (err) {
      console.error('Employee delete error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },
};

module.exports = EmployeesController;

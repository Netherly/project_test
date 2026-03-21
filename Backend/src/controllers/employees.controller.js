const EmployeesService = require('../services/employees.service');
const activityLogService = require('../services/activity-log.service');
const { createLinkTokenForEmployee } = require('../services/link-token.service');
const { buildTelegramStartLink } = require('../services/telegram-bot.service');
const prisma = require('../../prisma/client');
const { resolveEntityId } = require('../utils/entity-ref');

const buildActorMeta = (req) => ({
  actorId: req.user?.employeeId,
  source: 'manual',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

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
      const employee = await EmployeesService.create(payload, buildActorMeta(req));
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
      const employee = await EmployeesService.update(id, payload, buildActorMeta(req));
      res.json({ ok: true, data: serializeEmployee(employee) });
    } catch (err) {
      console.error('Employee update error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await EmployeesService.delete(id, buildActorMeta(req));
      res.json({ ok: true });
    } catch (err) {
      console.error('Employee delete error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async getLogs(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const { limit, order } = req.query;
      const logs = await activityLogService.listLogs({
        entityType: 'employee',
        entityId: id,
        limit,
        order,
      });
      res.json({ ok: true, data: logs });
    } catch (err) {
      console.error('Employee logs error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async addNote(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const message = req.body?.message;
      if (!message || !String(message).trim()) {
        return res.status(400).json({ ok: false, error: 'message is required' });
      }
      const created = await activityLogService.createNote({
        entityType: 'employee',
        entityId: id,
        message,
        ...buildActorMeta(req),
      });
      res.status(201).json({ ok: true, data: created });
    } catch (err) {
      console.error('Employee add note error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async updateLog(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const { logId } = req.params;
      const message = req.body?.message;
      const updated = await activityLogService.updateNote({
        entityType: 'employee',
        entityId: id,
        logId,
        message,
      });
      res.json({ ok: true, data: updated });
    } catch (err) {
      console.error('Employee update log error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async deleteLog(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const { logId } = req.params;
      await activityLogService.deleteNote({
        entityType: 'employee',
        entityId: id,
        logId,
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('Employee delete log error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async pinLog(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const { logId } = req.params;
      const pinned = Boolean(req.body?.pinned);
      const updated = await activityLogService.setPinned({
        entityType: 'employee',
        entityId: id,
        logId,
        pinned,
      });
      res.json({ ok: true, data: updated });
    } catch (err) {
      console.error('Employee pin log error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async createTelegramLink(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const ttlMinutes = Number(req.body?.ttlMinutes) || 60;

      const employee = await prisma.employee.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!employee) {
        return res.status(404).json({ ok: false, error: 'Employee not found' });
      }

      const token = await createLinkTokenForEmployee(id, ttlMinutes);
      const link = await buildTelegramStartLink(token.code);

      await prisma.employee.update({
        where: { id },
        data: { telegramBindingLink: link },
      });

      res.json({ ok: true, data: { link, code: token.code, ttlMinutes } });
    } catch (err) {
      console.error('Employee telegram link error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async createTemporaryPassword(req, res) {
    try {
      const id = await resolveEntityId(prisma.employee, req.params.id, { notFoundMessage: 'Employee not found' });
      const data = await EmployeesService.createTemporaryPassword(id, buildActorMeta(req));
      res.status(201).json({ ok: true, data });
    } catch (err) {
      console.error('Employee temporary password error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },
};

module.exports = EmployeesController;

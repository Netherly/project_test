const clientService = require('../services/client.service');
const activityLogService = require('../services/activity-log.service');

const buildActorMeta = (req) => ({
  actorId: req.user?.employeeId,
  source: 'manual',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

const createClient = async (req, res, next) => {
  try {
    const client = await clientService.createClient(req.body, buildActorMeta(req));
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
};

const getAllClients = async (req, res, next) => {
  try {
    const clients = await clientService.getAllClients();
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

const getClientById = async (req, res, next) => {
  try {
    const client = await clientService.getClientById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    next(err);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await clientService.updateClient(req.params.id, req.body, buildActorMeta(req));
    res.json(client);
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    await clientService.deleteClient(req.params.id, buildActorMeta(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const getClientLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, order } = req.query;
    const logs = await activityLogService.listLogs({
      entityType: 'client',
      entityId: id,
      limit,
      order,
    });
    res.json({ ok: true, data: logs });
  } catch (err) {
    next(err);
  }
};

const addClientNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = req.body?.message;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ ok: false, error: 'message is required' });
    }
    const created = await activityLogService.createNote({
      entityType: 'client',
      entityId: id,
      message,
      ...buildActorMeta(req),
    });
    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientLogs,
  addClientNote,
};

const regularPaymentsService = require('../services/regular-payments.service');

const list = async (_req, res, next) => {
  try {
    const items = await regularPaymentsService.list();
    res.json(items);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await regularPaymentsService.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Regular payment not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const created = await regularPaymentsService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const updated = await regularPaymentsService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.status === 404 || err.code === 'P2025') {
      return res.status(404).json({ message: 'Regular payment not found' });
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await regularPaymentsService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Regular payment not found' });
    next(err);
  }
};

const duplicate = async (req, res, next) => {
  try {
    const created = await regularPaymentsService.duplicate(req.params.id);
    res.status(201).json(created);
  } catch (err) {
    if (err.status === 404 || err.code === 'P2025') {
      return res.status(404).json({ message: 'Regular payment not found' });
    }
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  duplicate,
};

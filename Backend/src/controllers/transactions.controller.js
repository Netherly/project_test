// Backend/src/controllers/transactions.controller.js
const TransactionsService = require('../services/transactions.service');

const TransactionsController = {
  async list(req, res) {
    try {
      const params = req.query;
      const result = await TransactionsService.list(params);
      res.json({ ok: true, data: result });
    } catch (err) {
      console.error('Transactions list error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async byId(req, res) {
    try {
      const { id } = req.params;
      const transaction = await TransactionsService.byId(id);
      res.json({ ok: true, data: transaction });
    } catch (err) {
      console.error('Transaction byId error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async create(req, res) {
    try {
      const payload = req.body;
      const transaction = await TransactionsService.create(payload);
      res.status(201).json({ ok: true, data: transaction });
    } catch (err) {
      console.error('Transaction create error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const transaction = await TransactionsService.update(id, payload);
      res.json({ ok: true, data: transaction });
    } catch (err) {
      console.error('Transaction update error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await TransactionsService.delete(id);
      res.json({ ok: true });
    } catch (err) {
      console.error('Transaction delete error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },
};

module.exports = TransactionsController;
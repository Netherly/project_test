const OrdersService = require('../services/orders.service');

const buildActorMeta = (req) => ({
  actorId: req.user?.employeeId || null,
  source: 'manual',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

const OrdersController = {
  async list(req, res) {
    try {
      const params = req.query;
      const result = await OrdersService.list(params);
      res.json({ ok: true, data: result });
    } catch (err) {
      console.error('Orders list error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async byId(req, res) {
    try {
      const { id } = req.params;
      const order = await OrdersService.byId(id);
      res.json({ ok: true, data: order });
    } catch (err) {
      console.error('Order byId error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async create(req, res) {
    try {
      const payload = req.body;
      const order = await OrdersService.create(payload, buildActorMeta(req));
      res.status(201).json({ ok: true, data: order });
    } catch (err) {
      console.error('Order create error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const order = await OrdersService.update(id, payload, buildActorMeta(req));
      res.json({ ok: true, data: order });
    } catch (err) {
      console.error('Order update error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async changeStage(req, res) {
    try {
      const { id } = req.params;
      const { stage, stageIndex } = req.body;
      const order = await OrdersService.changeStage(id, { stage, stageIndex }, buildActorMeta(req));
      res.json({ ok: true, data: order });
    } catch (err) {
      console.error('Order changeStage error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const order = await OrdersService.delete(id, buildActorMeta(req));
      res.json({ ok: true, data: order });
    } catch (err) {
      console.error('Order delete error:', err);
      res.status(err.status || 500).json({ ok: false, error: err.message });
    }
  },
};

module.exports = OrdersController;
